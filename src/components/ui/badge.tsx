import { STATUSES, type StatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: StatusValue }) {
  const s = STATUSES.find((x) => x.value === status)!;
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", s.classes)}>{s.label}</span>;
}
