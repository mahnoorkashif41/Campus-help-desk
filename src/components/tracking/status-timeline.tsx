import { STATUSES, type StatusValue } from "@/lib/constants";

export type TimelineEntry = { id: string; fromStatus: StatusValue | null; toStatus: StatusValue; note?: string | null; createdAt: string };

const label = (s: StatusValue) => STATUSES.find((x) => x.value === s)!.label;

export function StatusTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">No status changes to show yet.</p>;
  }
  return (
    <ol className="space-y-5 border-l-2 border-line pl-5">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-brand ring-4 ring-paper" aria-hidden />
          <p className="text-sm font-semibold">{e.fromStatus ? `${label(e.fromStatus)} to ${label(e.toStatus)}` : `Submitted as ${label(e.toStatus)}`}</p>
          <time className="text-xs text-muted" dateTime={e.createdAt}>{new Date(e.createdAt).toLocaleString()}</time>
          {e.note && <p className="mt-1 text-sm">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
