import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { statusUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Something went wrong on our side. Please try again in a moment.";

function reply(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  // Every admin API route verifies the session itself, independent of middleware.
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    if (!id || id.length > 64) {
      return reply({ error: "Complaint not found." }, 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return reply({ error: "We could not read your request." }, 400);
    }

    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return reply(
        {
          error: "Please correct the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }
    const { status } = parsed.data;
    const note = parsed.data.note ? parsed.data.note : null;

    // One transaction: the complaint update and the history entry
    // both happen, or neither does.
    const result = await getDb().$transaction(async (tx) => {
      const current = await tx.complaint.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) return { kind: "not_found" } as const;
      if (current.status === status) return { kind: "same" } as const;

      const now = new Date();
      const updated = await tx.complaint.updateMany({
        // "status: current.status" makes sure nobody changed the complaint
        // between our read and this write.
        where: { id, status: current.status },
        data: {
          status,
          // Cleared when a complaint is reopened.
          resolvedAt: status === "RESOLVED" ? now : null,
          // The old note stays in the history entry.
          resolutionNote: status === "RESOLVED" ? note : null,
          updatedAt: now,
        },
      });
      if (updated.count !== 1) return { kind: "conflict" } as const;

      await tx.statusHistory.create({
        data: {
          complaintId: id,
          fromStatus: current.status,
          toStatus: status,
          note,
        },
      });
      return { kind: "ok" } as const;
    });

    if (result.kind === "not_found") {
      return reply({ error: "Complaint not found." }, 404);
    }
    if (result.kind === "same") {
      return reply(
        { error: "The complaint already has that status. Please refresh the page." },
        409,
      );
    }
    if (result.kind === "conflict") {
      return reply(
        { error: "The complaint was changed by someone else. Please refresh the page." },
        409,
      );
    }
    return reply({ ok: true, status }, 200);
  } catch (error) {
    // Never log request bodies. Only the reason is logged on the server.
    const reason = error instanceof Error ? error.message : "unknown error";
    console.error("Status update failed:", reason);
    return reply({ error: GENERIC_ERROR }, 500);
  }
}