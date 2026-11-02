"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryCount } from "@/lib/stats";

export function CategoryChart({ data }: { data: CategoryCount[] }) {
  const summary = data.map((d) => `${d.label}: ${d.count}`).join(", ");

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="h-72" role="img" aria-label={`Complaints by category. ${summary}.`}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 320, height: 288 }}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="#d9e0ea" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="label" width={88} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: "#e3f3f2" }} />
            <Bar dataKey="count" name="Complaints" fill="#0e7c7b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* The same numbers as text, for screen readers. */}
      <table className="sr-only">
        <caption>Complaints by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Complaints</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.value}>
              <th scope="row">{d.label}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}