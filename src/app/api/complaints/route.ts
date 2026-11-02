import { NextResponse } from "next/server";
import { MAX_REQUEST_BYTES } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { storeComplaintImages, validateImageFiles } from "@/lib/images";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { generateTicketId, generateTrackingToken, hashToken } from "@/lib/tokens";
import { complaintSchema, type ComplaintInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBMIT_LIMIT = 20; // per hour per IP (generous, because many students share campus Wi-Fi addresses)
const SUBMIT_WINDOW_MS = 60 * 60 * 1000;

function reply(body: object, status: number, extraHeaders: Record<string, string> = {}) {
  // no-store: responses contain secrets (the tracking token) and must never be cached.
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
}

/** Saves the complaint and its first history entry. A ticket-ID collision is extremely unlikely; if it happens we retry. */
async function createComplaint(d: ComplaintInput) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const ticketId = generateTicketId();
    const token = generateTrackingToken();
    try {
      const complaint = await getDb().complaint.create({
        data: {
          ticketId,
          trackingTokenHash: hashToken(token), // the raw token is NOT stored
          studentName: d.studentName,
          studentEmail: d.studentEmail,
          category: d.category,
          title: d.title,
          description: d.description,
          building: d.building,
          roomNumber: d.roomNumber || null,
          history: { create: { fromStatus: null, toStatus: "PENDING" } },
        },
        select: { id: true },
      });
      return { id: complaint.id, ticketId, token };
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") continue; // ticketId already exists: try a new one
      throw error;
    }
  }
  throw new Error("Could not generate a unique ticket ID");
}

export async function POST(request: Request) {
  try {
    // Reject oversized requests early, before reading the body (Vercel's own limit is about 4.5 MB).
    const declaredSize = Number(request.headers.get("content-length"));
    if (declaredSize > MAX_REQUEST_BYTES) {
      return reply({ error: "Your photos are too large to upload together. Please remove one or choose smaller photos." }, 413);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return reply({ error: "We could not read your submission. Please try again." }, 400);
    }

    // Honeypot: real people never see or fill this hidden field.
    if (form.get("website")) return reply({ error: "Your submission could not be accepted." }, 400);

    // Photos must arrive in the "images" field. Any other file field is refused.
    const files: File[] = [];
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") continue;
      if (key !== "images") return reply({ error: "Your submission could not be accepted." }, 400);
      files.push(value);
    }

    const limit = await checkRateLimit(clientKey(request, "submit"), SUBMIT_LIMIT, SUBMIT_WINDOW_MS);
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSec / 60);
      return reply({ error: `Too many submissions from your network. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` }, 429, { "Retry-After": String(limit.retryAfterSec) });
    }

    // Server-side validation: the real check. Browser validation is only a convenience.
    const parsed = complaintSchema.safeParse(Object.fromEntries(Array.from(form.entries()).filter(([, v]) => typeof v === "string")));
    if (!parsed.success) {
      return reply({ error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, 400);
    }

    // Validate photos BEFORE anything is saved, so a bad photo never leaves a half-created complaint.
    const photos = await validateImageFiles(files);
    if (!photos.ok) return reply({ error: photos.error }, photos.status);

    const complaint = await createComplaint(parsed.data);

    if (photos.images.length > 0) {
      try {
        await storeComplaintImages(complaint.id, photos.images);
      } catch (error) {
        // Upload failed: storeComplaintImages already removed uploaded files. Now remove the complaint itself
        // (its history entry and any image rows are deleted with it).
        console.error("Photo upload failed:", error instanceof Error ? error.message : "unknown error");
        await getDb().complaint.delete({ where: { id: complaint.id } }).catch((e) => console.error("Complaint cleanup failed:", e instanceof Error ? e.message : "unknown error"));
        return reply({ error: "We could not save your photos, so your complaint was not submitted. Please try again." }, 502);
      }
    }

    return reply({ ticketId: complaint.ticketId, token: complaint.token }, 201);
  } catch (error) {
    // Log the reason on the server only. Never log request bodies, tokens, or passwords.
    console.error("Complaint submission failed:", error instanceof Error ? error.message : "unknown error");
    return reply({ error: "Something went wrong on our side. Please try again in a moment." }, 500);
  }
}