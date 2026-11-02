import { COMPRESSION_MAX_DIMENSION, COMPRESSION_TARGET_MB, MAX_UPLOAD_IMAGE_BYTES } from "./constants";

export class ImageCompressionError extends Error {}

/**
 * BROWSER ONLY. Shrinks each photo to about 1 MB before upload so the request fits Vercel's size limit.
 * Re-drawing the picture on a canvas also removes hidden metadata such as GPS location.
 * Output is always JPEG (transparent areas become white).
 */
export async function compressImages(files: File[]): Promise<File[]> {
  const { default: imageCompression } = await import("browser-image-compression");
  const output: File[] = [];

  for (const [i, file] of files.entries()) {
    let compressed: File;
    try {
      compressed = await imageCompression(file, {
        maxSizeMB: COMPRESSION_TARGET_MB,
        maxWidthOrHeight: COMPRESSION_MAX_DIMENSION,
        fileType: "image/jpeg",
        useWebWorker: false, // the worker would download a script from a public CDN; stay fully self-contained
      });
    } catch {
      throw new ImageCompressionError(`Photo ${i + 1} could not be processed. Please try a different photo.`);
    }
    if (compressed.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new ImageCompressionError(`Photo ${i + 1} is still too large after compression. Please choose a smaller or simpler photo.`);
    }
    // A generic filename: the original name (which can contain personal details) is never uploaded.
    output.push(new File([compressed], `photo-${i + 1}.jpg`, { type: "image/jpeg" }));
  }
  return output;
}