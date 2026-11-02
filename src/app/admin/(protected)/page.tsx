import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChart } from "@/components/admin/category-chart";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusChart } from "@/components/admin/status-chart";
import { requireAdminPage } from "@/lib/auth";
import { getDashboardStats, type DashboardStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const DOTS = {
  PENDING: "bg-amber-500",
  IN_PROGRESS: "bg-sky-500",
  RESOLVED: "bg-emerald-500",
} as const;

function StatCard(props: { label: string; count: number; href: string; dot?: string }) {
  return (
    <Link
      href={props.href}
      className="block rounded-xl border border-line bg-white p-5 hover:border-brand"
    >
      <p className="flex items-center gap-2 text-sm text-muted">
        {props.dot && <span className={`size-2.5 rounded-full ${props.dot}`} aria-hidden />}
        {props.label}
      </p>
      <p className="mt-1 text-3xl font-bold">{props.count.toLocaleString()}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  await requireAdminPage();

  let stats: DashboardStats | null = null;
  try {
    stats = await getDashboardStats();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.error("Dashboard statistics failed:", reason);
  }

  if (!stats) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <EmptyState
          title="Statistics could not be loaded"
          text="The database did not respond. Check your connection settings and refresh the page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total complaints" count={stats.total} href="/admin/complaints" />
        {stats.byStatus.map((s) => (
          <StatCard
            key={s.value}
            label={s.label}
            count={s.count}
            href={`/admin/complaints?status=${s.value}`}
            dot={DOTS[s.value]}
          />
        ))}
      </section>

      {stats.total === 0 ? (
        <EmptyState
          title="No complaints yet"
          text="Charts will appear here as soon as students submit complaints."
        />
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-semibold">Complaints by status</h2>
            <StatusChart data={stats.byStatus} total={stats.total} />
          </div>
          <div className="space-y-3">
            <h2 className="font-semibold">Complaints by category</h2>
            <CategoryChart data={stats.byCategory} />
          </div>
        </section>
      )}
    </div>
  );
}