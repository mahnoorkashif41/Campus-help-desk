import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StatusForm } from "@/components/admin/status-form";
import { StatusBadge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/tracking/status-timeline";
import { requireAdminPage } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { signComplaintImages } from "@/lib/images";

export const metadata: Metadata = { title: "Complaint details" };
export const dynamic = "force-dynamic";

const formatDate = (d: Date) => d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const complaint = await getDb().complaint.findUnique({
    where: { id },
    include: { images: { orderBy: { createdAt: "asc" } }, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!complaint) notFound();

  // Short-lived links to the private photos (only generated here, after the admin session was verified).
  let photos: { id: string; url: string }[] = [];
  if (complaint.images.length > 0) {
    try {
      photos = await signComplaintImages(complaint.images);
    } catch (error) {
      console.error("Could not create photo links:", error instanceof Error ? error.message : "unknown error");
    }
  }
  const missingPhotos = complaint.images.length - photos.length;

  const timeline = complaint.history.map((h) => ({
    id: h.id,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    note: h.note,
    createdAt: h.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <Link href="/admin/complaints" className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"><ArrowLeft className="size-4" aria-hidden /> Back to complaints</Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{complaint.title}</h1>
          <StatusBadge status={complaint.status} />
        </div>
        <p className="font-mono text-sm text-muted">{complaint.ticketId}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="details" className="rounded-xl border border-line bg-white p-5">
            <h2 id="details" className="mb-1 font-semibold">Details</h2>
            <dl className="divide-y divide-line">
              <Row label="Category">{CATEGORIES.find((c) => c.value === complaint.category)?.label ?? complaint.category}</Row>
              <Row label="Building">{complaint.building}</Row>
              <Row label="Room">{complaint.roomNumber || "Not given"}</Row>
              <Row label="Student">{complaint.studentName}</Row>
              <Row label="Email"><a href={`mailto:${complaint.studentEmail}`} className="text-brand-dark hover:underline">{complaint.studentEmail}</a></Row>
              <Row label="Submitted">{formatDate(complaint.createdAt)}</Row>
              <Row label="Last updated">{formatDate(complaint.updatedAt)}</Row>
              <Row label="Description"><p className="whitespace-pre-wrap">{complaint.description}</p></Row>
              {complaint.status === "RESOLVED" && complaint.resolutionNote && (
                <Row label="Resolution note"><p className="whitespace-pre-wrap">{complaint.resolutionNote}</p></Row>
              )}
            </dl>
          </section>

          <section aria-labelledby="photos" className="space-y-3">
            <h2 id="photos" className="font-semibold">Photos</h2>
            {complaint.images.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-white p-4 text-sm text-muted">No photos were attached.</p>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((p, i) => (
                    <li key={p.id} className="overflow-hidden rounded-lg border border-line bg-white">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 1} in a new tab`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={`Complaint photo ${i + 1}`} className="aspect-square w-full object-cover" />
                      </a>
                    </li>
                  ))}
                </ul>
                {missingPhotos > 0 && <p className="text-sm text-red-700">{missingPhotos} photo{missingPhotos === 1 ? "" : "s"} could not be loaded. Check the Supabase Storage settings in your .env file.</p>}
                <p className="text-xs text-muted">Photo links are private and expire after 5 minutes. Refresh the page to get new ones.</p>
              </>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="update" className="space-y-3">
            <h2 id="update" className="font-semibold">Update status</h2>
            <StatusForm complaintId={complaint.id} currentStatus={complaint.status} />
          </section>
          <section aria-labelledby="history" className="space-y-3">
            <h2 id="history" className="font-semibold">History</h2>
            <StatusTimeline entries={timeline} />
          </section>
        </div>
      </div>
    </div>
  );
}