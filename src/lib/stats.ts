import {
  CATEGORIES,
  STATUSES,
  type CategoryValue,
  type StatusValue,
} from "./constants";
import { getDb } from "./db";

export type StatusCount = { value: StatusValue; label: string; count: number };
export type CategoryCount = { value: CategoryValue; label: string; count: number };
export type DashboardStats = {
  total: number;
  byStatus: StatusCount[];
  byCategory: CategoryCount[];
};

/** Real counts from the database. Statuses and categories with no complaints show 0. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb();

  const [statusRows, categoryRows] = await Promise.all([
    db.complaint.groupBy({ by: ["status"], _count: { _all: true } }),
    db.complaint.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);

  const byStatus = STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
    count: statusRows.find((r) => r.status === s.value)?._count._all ?? 0,
  }));

  const byCategory = CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
    count: categoryRows.find((r) => r.category === c.value)?._count._all ?? 0,
  }));

  const total = byStatus.reduce((sum, s) => sum + s.count, 0);
  return { total, byStatus, byCategory };
}