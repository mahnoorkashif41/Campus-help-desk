import { StatusBadge } from "@/components/ui/badge";
import type { StatusValue } from "@/lib/constants";
import type { TrackingData } from "@/types/tracking";
import { StatusTimeline } from "./status-timeline";

const STATUS_MESSAGES: Record<StatusValue, string> = {
  PENDING: "We have received your complaint. It is waiting to be reviewed.",
  IN_PROGRESS: "Your complaint is being worked on.",
  RESOLVED: "Your complaint has been marked as resolved.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

export function TrackingResult({ data }: { data: TrackingData }) {
  const { complaint, timeline, photos, photoCount } = data;
  const missingPhotos = photoCount - photos.length;

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="result-title"
        className="space-y-3 rounded-xl border border-line bg-white p-5 sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="result-title" className="text-xl font-bold tracking-tight">
            {complaint.title}
          </h2>
          <StatusBadge status={complaint.status} />
        </div>
        <p className="font-mono text-sm text-muted">{complaint.ticketId}</p>
        <p className="text-sm">{STATUS_MESSAGES[complaint.status]}</p>

        {complaint.resolutionNote && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm">
            <p className="font-semibold text-emerald-900">Resolution note</p>
            <p className="mt-1 whitespace-pre-wrap text-emerald-950">
              {complaint.resolutionNote}
            </p>
          </div>
        )}

        <dl className="divide-y divide-line">
          <Row label="Category">{complaint.category}</Row>
          <Row label="Building">{complaint.building}</Row>
          <Row label="Room">{complaint.roomNumber || "Not given"}</Row>
          <Row label="Submitted">{formatDate(complaint.createdAt)}</Row>
          <Row label="Last updated">{formatDate(complaint.updatedAt)}</Row>
          <Row label="Description">
            <p className="whitespace-pre-wrap">{complaint.description}</p>
          </Row>
        </dl>
      </section>

      {photoCount > 0 && (
        <section aria-labelledby="result-photos" className="space-y-3">
          <h2 id="result-photos" className="font-semibold">
            Your photos
          </h2>
          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <li
                  key={p.url}
                  className="overflow-hidden rounded-lg border border-line bg-white"
                >
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open photo ${i + 1} in a new tab`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={`Your photo ${i + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {missingPhotos > 0 && (
            <p className="text-sm text-red-700">
              {missingPhotos} photo{missingPhotos === 1 ? "" : "s"} could not be
              loaded right now. Please try again later.
            </p>
          )}
          <p className="text-xs text-muted">
            Photo links are private and expire after 5 minutes. Press
            &quot;Track complaint&quot; again to get new ones.
          </p>
        </section>
      )}

      <section aria-labelledby="result-history" className="space-y-3">
        <h2 id="result-history" className="font-semibold">
          History
        </h2>
        <StatusTimeline entries={timeline} />
      </section>
    </div>
  );
}