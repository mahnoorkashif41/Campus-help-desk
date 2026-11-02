import { randomBytes } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGES, MAX_REQUEST_BYTES, MAX_UPLOAD_IMAGE_BYTES, SIGNED_URL_SECONDS } from "./constants";
import { getDb } from "./db";
import { createSignedUrls, removeImages, uploadImage } from "./supabase";

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export type ValidatedImage = { bytes: Buffer; mime: string; ext: string; size: number };
export type ImageValidation = { ok: true; images: ValidatedImage[] } | { ok: false; error: string; status: 400 | 413 };

/**
 * Server-side image checks. We never trust the browser: the filename and the claimed content type
 * are ignored, and the real type is read from the file's first bytes ("magic bytes").
 */
export async function validateImageFiles(files: File[]): Promise<ImageValidation> {
  if (files.length > MAX_IMAGES) return { ok: false, status: 400, error: `You can attach at most ${MAX_IMAGES} photos.` };

  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_REQUEST_BYTES) return { ok: false, status: 413, error: "Your photos are too large to upload together. Please remove one or choose smaller photos." };

  const images: ValidatedImage[] = [];
  for (const [i, file] of files.entries()) {
    const label = `Photo ${i + 1}`;
    if (file.size === 0) return { ok: false, status: 400, error: `${label} is empty.` };
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) return { ok: false, status: 400, error: `${label} is too large (limit is 1.2 MB after compression). Please choose a smaller or simpler photo.` };

    const bytes = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(bytes);
    if (!detected || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(detected.mime)) {
      return { ok: false, status: 400, error: `${label} is not a valid JPEG, PNG, or WebP image.` };
    }
    images.push({ bytes, mime: detected.mime, ext: EXTENSIONS[detected.mime], size: bytes.length });
  }
  return { ok: true, images };
}

/**
 * Uploads each image to the private bucket and saves its metadata.
 * Files get random names: complaints/{complaintId}/{random}.{ext}
 * If anything fails, files uploaded so far are removed and the error is rethrown
 * (the caller then deletes the half-created complaint).
 */
export async function storeComplaintImages(complaintId: string, images: ValidatedImage[]): Promise<void> {
  const paths: string[] = [];
  try {
    const records = [];
    for (const image of images) {
      const storagePath = `complaints/${complaintId}/${randomBytes(16).toString("hex")}.${image.ext}`;
      paths.push(storagePath); // recorded before uploading, so a half-finished upload is also cleaned up
      await uploadImage(storagePath, image.bytes, image.mime);
      records.push({ complaintId, storagePath, mimeType: image.mime, sizeBytes: image.size });
    }
    await getDb().complaintImage.createMany({ data: records });
  } catch (error) {
    await removeImages(paths).catch((e) => console.error("Cleanup of uploaded images failed:", e instanceof Error ? e.message : "unknown error"));
    throw error;
  }
}

/**
 * Signed, expiring links for stored images. Used in Stage D (admin) and Stage E (tracking),
 * and ONLY after the viewer has been verified. Images without a link are simply left out.
 */
export async function signComplaintImages(images: { id: string; storagePath: string }[]): Promise<{ id: string; url: string }[]> {
  const urls = await createSignedUrls(images.map((i) => i.storagePath), SIGNED_URL_SECONDS);
  return images.flatMap((i) => (urls.has(i.storagePath) ? [{ id: i.id, url: urls.get(i.storagePath)! }] : []));
}