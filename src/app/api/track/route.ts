import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { signComplaintImages } from "@/lib/images";
import { clientKey, isRateLimited, recordFailure } from "@/lib/rate-limit";
import { tokenMatchesHash } from "@/lib/tokens";
import { trackSchema } from "@/lib/validation";
import type { TrackingData } from "@/types/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FAILURE_LIMIT = 10; // failed lookups per 15 minutes per IP address
const WINDOW_MS = 15 * 60 * 1000;
const WRONG_DETAILS = "Ticket ID or token is incorrect.";
const GENERIC_ERROR = "Something went wrong on our side. Please try again in a moment.";
// Compared against when the ticket does not exist, so both cases take the same time.
const DUMMY_HASH = "0".repeat(64);

function reply(body: object, status: number, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

export async function POST(request: Request) {
  try {
    const key = clientKey(request, "track");

    const blocked = await isRateLimited(key, FAILURE_LIMIT, WINDOW_MS);
    if (blocked.limited) {
      const minutes = Math.ceil(blocked.retryAfterSec / 60);
      const unit = minutes === 1 ? "minute" : "minutes";
      return reply(
        { error: `Too many incorrect attempts. Please try again in about ${minutes} ${unit}.` },
        429,
        { "Retry-After": String(blocked.retryAfterSec) },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return reply({ error: "We could not read your request." }, 400);
    }

    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return reply(
        {
          error: "Please check the Ticket ID and token you entered.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }
    const { ticketId, token } = parsed.data;

    // We select only what a student may see. Name and email are never loaded.
    const complaint = await getDb().complaint.findUnique({
      where: { ticketId },
      select: {
        trackingTokenHash: true,
        title: true,
        description: true,
        category: true,
        building: true,
        roomNumber: true,
        status: true,
        resolutionNote: true,
        createdAt: true,
        updatedAt: true,
        images: {
          select: { id: true, storagePath: true },
          orderBy: { createdAt: "asc" },
        },
        history: {
          select: { fromStatus: true, toStatus: true, note: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Both must be right. The same message and status are used for "no such
    // ticket" and "wrong token", so nobody can tell which one failed.
    const tokenOk = tokenMatchesHash(token, complaint?.trackingTokenHash ?? DUMMY_HASH);
    if (!complaint || !tokenOk) {
      await recordFailure(key, WINDOW_MS);
      return reply({ error: WRONG_DETAILS }, 401);
    }

    // Short-lived links to the private photos. A storage problem must not hide the status.
    let photos: { url: string }[] = [];
    if (complaint.images.length > 0) {
      try {
        const signed = await signComplaintImages(complaint.images);
        photos = signed.map((p) => ({ url: p.url }));
      } catch (error) {
        const reason = error instanceof Error ? error.message : "unknown error";
        console.error("Tracking: could not create photo links:", reason);
      }
    }

    const data: TrackingData = {
      complaint: {
        ticketId,
        title: complaint.title,
        description: complaint.description,
        category: CATEGORIES.find((c) => c.value === complaint.category)?.label ?? "Other",
        building: complaint.building,
        roomNumber: complaint.roomNumber,
        status: complaint.status,
        // The resolution note is shown only while the complaint is Resolved.
        resolutionNote: complaint.status === "RESOLVED" ? complaint.resolutionNote : null,
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
      },
      timeline: complaint.history.map((h, i) => ({
        id: String(i),
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        // Only resolution notes are shown to students. To show every note,
        // change this line to:  note: h.note,
        note: h.toStatus === "RESOLVED" ? h.note : null,
        createdAt: h.createdAt.toISOString(),
      })),
      photos,
      photoCount: complaint.images.length,
    };
    return reply(data, 200);
  } catch (error) {
    // Never log the token or the ticket ID together with request details.
    const reason = error instanceof Error ? error.message : "unknown error";
    console.error("Tracking lookup failed:", reason);
    return reply({ error: GENERIC_ERROR }, 500);
  }
}