"use client";

import type { EmployeeMetricChartKind } from "@/lib/chart-intent";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

/** Demo: stress band → headcount (illustrative). */
const STRESS_EMPLOYEE_DATA = [
  { level: "Very low", bandIndex: 1, employees: 58 },
  { level: "Low", bandIndex: 2, employees: 44 },
  { level: "Moderate", bandIndex: 3, employees: 31 },
  { level: "High", bandIndex: 4, employees: 17 },
  { level: "Very high", bandIndex: 5, employees: 8 }
];

/** Demo: salary band → headcount (illustrative). */
const SALARY_EMPLOYEE_DATA = [
  { level: "< $40k", bandIndex: 1, employees: 22 },
  { level: "$40k–60k", bandIndex: 2, employees: 48 },
  { level: "$60k–80k", bandIndex: 3, employees: 56 },
  { level: "$80k–100k", bandIndex: 4, employees: 31 },
  { level: "$100k+", bandIndex: 5, employees: 14 }
];

const COPY: Record<
  EmployeeMetricChartKind,
  { title: string; blurb: string; xLabel: string; barColor: string }
> = {
  stress: {
    title: "Relationship: employee stress vs. number of employees",
    blurb: "Each bar is how many employees fall in that stress band (sample survey). Export includes this same chart component.",
    xLabel: "Stress level (self-reported)",
    barColor: "#2563eb"
  },
  salary: {
    title: "Relationship: employee salary vs. number of employees",
    blurb: "Each bar is how many employees fall in that salary band (sample payroll ranges). Export includes this same chart component.",
    xLabel: "Salary band",
    barColor: "#059669"
  }
};

export function EmployeeMetricChartPreview({ kind }: { kind: EmployeeMetricChartKind }) {
  const data = kind === "salary" ? SALARY_EMPLOYEE_DATA : STRESS_EMPLOYEE_DATA;
  const c = COPY[kind];

  return (
    <div className="flex h-full min-h-[380px] flex-col rounded-2xl border border-white/60 bg-white/90 p-4 shadow-inner ring-1 ring-slate-200/50">
      <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{c.blurb}</p>
      <div className="mt-3 min-h-[300px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="level"
              tick={{ fontSize: 11, fill: "#64748b" }}
              label={{
                value: c.xLabel,
                position: "bottom",
                offset: 0,
                style: { fontSize: 11, fill: "#64748b" }
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              label={{
                value: "Number of employees",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "#64748b" }
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px"
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar
              dataKey="employees"
              name="Employees"
              fill={c.barColor}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** @deprecated Use EmployeeMetricChartPreview with kind="stress" */
export function StressEmployeesChartPreview() {
  return <EmployeeMetricChartPreview kind="stress" />;
}
