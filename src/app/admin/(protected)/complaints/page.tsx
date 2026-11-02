import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ComplaintFilters } from "@/components/admin/complaint-filters";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/auth";
import { BUILDINGS, CATEGORIES, STATUSES } from "@/lib/constants";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Complaints" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;
type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function ComplaintsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdminPage();
  const sp = await searchParams;

  // Every filter is checked against the known lists, so unknown values in the URL are simply ignored.
  const q = first(sp.q).trim().slice(0, 100);
  const status = STATUSES.find((s) => s.value === first(sp.status))?.value;
  const category = CATEGORIES.find((c) => c.value === first(sp.category))?.value;
  const building = BUILDINGS.find((b) => b === first(sp.building));
  const sort = first(sp.sort) === "oldest" ? "oldest" : "newest";
  const requestedPage = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);

  const like = { contains: q, mode: "insensitive" as const };
  const where = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(building ? { building } : {}),
    ...(q ? { OR: [{ ticketId: like }, { title: like }, { studentName: like }, { studentEmail: like }] } : {}),
  };

  const db = getDb();
  const total = await db.complaint.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const complaints = await db.complaint.findMany({
    where,
    orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, ticketId: true, title: true, category: true, building: true, status: true, createdAt: true },
  });

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (building) params.set("building", building);
    if (sort !== "newest") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/admin/complaints?${query}` : "/admin/complaints";
  }

  const hasFilters = Boolean(q || status || category || building);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const pagerClass = "inline-flex min-h-10 items-center gap-1 rounded-lg border border-line bg-white px-3 text-sm font-medium";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
      <ComplaintFilters key={JSON.stringify([q, status, category, building, sort])} defaults={{ q, status: status ?? "", category: category ?? "", building: building ?? "", sort }} />

      {complaints.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No complaints match these filters" : "No complaints yet"}
          text={hasFilters ? "Try different search words or clear the filters." : "New complaints will appear here as soon as students submit them."}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>{["Ticket", "Title", "Category", "Building", "Status", "Submitted"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-paper">
                  <td className="whitespace-nowrap px-4 py-3 font-mono"><Link href={`/admin/complaints/${c.id}`} className="font-semibold text-brand-dark hover:underline">{c.ticketId}</Link></td>
                  <td className="max-w-64 truncate px-4 py-3" title={c.title}>{c.title}</td>
                  <td className="whitespace-nowrap px-4 py-3">{CATEGORIES.find((x) => x.value === c.category)?.label ?? c.category}</td>
                  <td className="whitespace-nowrap px-4 py-3">{c.building}</td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{c.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted">Showing {from} to {to} of {total}</p>
          <div className="flex items-center gap-2">
            {page > 1 ? <Link href={pageHref(page - 1)} className={pagerClass}><ChevronLeft className="size-4" aria-hidden /> Previous</Link> : <span aria-disabled className={`${pagerClass} opacity-50`}><ChevronLeft className="size-4" aria-hidden /> Previous</span>}
            <span className="px-2 text-muted">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(page + 1)} className={pagerClass}>Next <ChevronRight className="size-4" aria-hidden /></Link> : <span aria-disabled className={`${pagerClass} opacity-50`}>Next <ChevronRight className="size-4" aria-hidden /></span>}
          </div>
        </nav>
      )}
    </div>
  );
}