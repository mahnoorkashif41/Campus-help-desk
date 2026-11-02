import Link from "next/link";
import { Search } from "lucide-react";
import { BUILDINGS, CATEGORIES, STATUSES } from "@/lib/constants";
import { linkButtonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";

type Props = { defaults: { q: string; status: string; category: string; building: string; sort: string } };

// A plain GET form: filters live in the URL (?status=...&q=...), so they survive a refresh and can be bookmarked.
export function ComplaintFilters({ defaults }: Props) {
  return (
    <form method="get" role="search" className="grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input name="q" type="search" defaultValue={defaults.q} aria-label="Search complaints" placeholder="Ticket ID, title, name, or email" className={`${inputClass} pl-9`} />
      </div>
      <select name="status" aria-label="Filter by status" defaultValue={defaults.status} className={inputClass}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select name="category" aria-label="Filter by category" defaultValue={defaults.category} className={inputClass}>
        <option value="">All categories</option>
        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <select name="building" aria-label="Filter by building" defaultValue={defaults.building} className={inputClass}>
        <option value="">All buildings</option>
        {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <select name="sort" aria-label="Sort by date" defaultValue={defaults.sort} className={inputClass}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
      <div className="flex gap-2">
        <button type="submit" className="min-h-11 rounded-lg bg-ink px-5 text-sm font-semibold text-white hover:bg-brand-dark">Apply</button>
        <Link href="/admin/complaints" className={linkButtonClass("secondary")}>Clear</Link>
      </div>
    </form>
  );
}