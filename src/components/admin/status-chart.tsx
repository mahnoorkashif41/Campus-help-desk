"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { StatusValue } from "@/lib/constants";
import type { StatusCount } from "@/lib/stats";

const COLORS: Record<StatusValue, string> = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#0ea5e9",
  RESOLVED: "#10b981",
};

export function StatusChart({ data, total }: { data: StatusCount[]; total: number }) {
  const summary = data.map((d) => `${d.label}: ${d.count}`).join(", ");

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="relative h-64" role="img" aria-label={`Complaints by status. ${summary}.`}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 320, height: 256 }}
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.value} fill={COLORS[d.value]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{total.toLocaleString()}</span>
          <span className="text-xs text-muted">total</span>
        </div>
      </div>

      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        {data.map((d) => {
          const percent = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <li key={d.value} className="flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[d.value] }}
                aria-hidden
              />
              <span>
                {d.label}: <strong>{d.count}</strong>{" "}
                <span className="text-muted">({percent}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}