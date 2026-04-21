"use client";

import { extractOverviewOneLiner, extractProductName } from "@/lib/prd-metadata";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const SIDEBAR = "bg-[#3b7dd8]";
const ACCENT = "#3b82f6";

const LINE_DATA = [
  { name: "W1", completed: 118, pending: 42, overdue: 12 },
  { name: "W2", completed: 132, pending: 38, overdue: 9 },
  { name: "W3", completed: 141, pending: 35, overdue: 11 },
  { name: "W4", completed: 156, pending: 31, overdue: 8 },
  { name: "W5", completed: 168, pending: 28, overdue: 7 },
  { name: "W6", completed: 175, pending: 26, overdue: 6 }
];

const BAR_CATEGORY = [
  { name: "Product", value: 42 },
  { name: "Sales", value: 28 },
  { name: "Support", value: 18 },
  { name: "Ops", value: 12 }
];

const PIE_DATA = [
  { name: "North", value: 35 },
  { name: "South", value: 32 },
  { name: "East", value: 21 },
  { name: "West", value: 12 }
];

const PIE_COLORS = ["#2563eb", "#38bdf8", "#94a3b8", "#f43f5e"];

const DONUT_DATA = [
  { name: "On track", value: 62 },
  { name: "At risk", value: 24 },
  { name: "Blocked", value: 14 }
];

const ACTIVITY_ROWS = [
  { title: "Q2 revenue rollup exported", time: "Just now", done: true },
  { title: "User cohort funnel refreshed", time: "12m ago", done: true },
  { title: "Drill-down: APAC region", time: "1h ago", done: false },
  { title: "Scheduled report — Weekly KPIs", time: "3h ago", done: false }
];

const PROGRESS_ROWS = [
  { label: "Design", pct: 78 },
  { label: "Distribution", pct: 64 },
  { label: "Marketing", pct: 52 }
];

type Period = "all" | "week" | "month" | "custom";

type KpiItem = {
  label: string;
  value: string;
  sub: string;
  tone: string;
};

const KPI_ITEMS: KpiItem[] = [
  { label: "Revenue", value: "$1.24M", sub: "vs last month", tone: "text-blue-600" },
  { label: "Active users", value: "12.4k", sub: "+12% growth", tone: "text-emerald-600" },
  { label: "Growth", value: "+18%", sub: "Net new MRR", tone: "text-slate-900" },
  { label: "Reports run", value: "3.8k", sub: "Last 30 days", tone: "text-slate-900" }
];

function rowMatchesQuery(q: string, ...parts: string[]): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  return parts.some((p) => p.toLowerCase().includes(n));
}

type Props = {
  requirements: string;
};

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 opacity-90 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

export function InsightBoardPreview({ requirements }: Props) {
  const brand = useMemo(() => extractProductName(requirements) || "InsightBoard", [requirements]);
  const tagline = useMemo(() => {
    const line = extractOverviewOneLiner(requirements);
    if (line) return line.length > 72 ? `${line.slice(0, 72)}…` : line;
    return "Analytics & reports";
  }, [requirements]);

  const [period, setPeriod] = useState<Period>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const q = searchQuery.trim();

  const filteredKpis = useMemo(
    () =>
      KPI_ITEMS.filter((k) =>
        rowMatchesQuery(q, k.label, k.value, k.sub)
      ),
    [q]
  );

  const filteredActivity = useMemo(
    () =>
      ACTIVITY_ROWS.filter((r) => rowMatchesQuery(q, r.title, r.time)),
    [q]
  );

  const filteredBarCategory = useMemo(
    () => BAR_CATEGORY.filter((b) => rowMatchesQuery(q, b.name, String(b.value))),
    [q]
  );

  const filteredPieRegions = useMemo(
    () => PIE_DATA.filter((p) => rowMatchesQuery(q, p.name, String(p.value))),
    [q]
  );

  const filteredDonut = useMemo(
    () => DONUT_DATA.filter((d) => rowMatchesQuery(q, d.name, String(d.value))),
    [q]
  );

  const filteredProgress = useMemo(
    () => PROGRESS_ROWS.filter((p) => rowMatchesQuery(q, p.label, String(p.pct))),
    [q]
  );

  const filteredLineData = useMemo(
    () =>
      LINE_DATA.filter((row) =>
        rowMatchesQuery(
          q,
          row.name,
          String(row.completed),
          String(row.pending),
          String(row.overdue)
        )
      ),
    [q]
  );

  const lineChartData = q ? filteredLineData : LINE_DATA;

  return (
    <div className="flex h-full min-h-[320px] max-h-[min(720px,82vh)] overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 text-[13px] shadow-md ring-1 ring-slate-200/40 sm:rounded-2xl sm:shadow-lg">
      {/* Icon-only sidebar — keeps ~75%+ width for the dashboard (avoids ⅓ rail) */}
      <aside
        className={`flex w-12 shrink-0 flex-col items-center text-white ${SIDEBAR} py-2 shadow-inner`}
        aria-label={`${brand} navigation`}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-[11px] font-bold shadow-sm"
          title={`${brand} — SaaS`}
        >
          {brand.slice(0, 1).toUpperCase()}
        </div>

        <nav className="mt-3 flex w-full flex-1 flex-col items-center gap-1 px-0.5" aria-label="Main">
          <button
            type="button"
            title="Dashboard"
            className="flex w-full items-center justify-center rounded-md bg-white/15 py-1.5 shadow-sm ring-1 ring-white/10"
          >
            <NavIcon d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </button>
          <button
            type="button"
            title="Reports"
            className="flex w-full items-center justify-center rounded-md py-1.5 text-white/85 hover:bg-white/10"
          >
            <NavIcon d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </button>
          <button
            type="button"
            title="Users (22)"
            className="relative flex w-full items-center justify-center rounded-md py-1.5 text-white/85 hover:bg-white/10"
          >
            <NavIcon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white/25 px-0.5 text-[7px] font-bold leading-none">
              22
            </span>
          </button>
          <button
            type="button"
            title="Settings"
            className="flex w-full items-center justify-center rounded-md py-1.5 text-white/85 hover:bg-white/10"
          >
            <NavIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </button>
        </nav>

        <button
          type="button"
          title="Logout"
          className="mt-auto flex w-full items-center justify-center rounded-md py-1.5 text-white/80 hover:bg-white/10"
        >
          <NavIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-10 flex shrink-0 min-w-0 items-center gap-1.5 border-b border-slate-200/80 bg-white px-2 py-1.5 shadow-sm sm:gap-2 sm:px-3 sm:py-2">
          <div className="relative min-w-0 max-w-md flex-1">
            <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            {/* type="text": avoids Chrome/WebKit search-cancel UI on focus that reflows and overlaps content below */}
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              placeholder="Search KPIs, activity, regions…"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search dashboard"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-1 pl-7 pr-7 text-[10px] text-slate-800 shadow-none [appearance:textfield] placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-200/80 sm:py-1.5 sm:pl-8 sm:pr-8 sm:text-[11px] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
            {searchQuery ? (
              <button
                type="button"
                className="absolute right-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[12px] leading-none text-slate-500 hover:bg-slate-200/80 hover:text-slate-800"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 sm:h-8 sm:w-8"
            aria-label="Notifications"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <div
            className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 ring-1 ring-white shadow sm:h-8 sm:w-8"
            title="Profile"
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-2 sm:p-3">
          <p
            className="mb-3 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] leading-normal text-slate-500"
            title={tagline}
          >
            {tagline}
          </p>

          {/* KPI — filtered by search */}
          <div className="mb-4 grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
            {filteredKpis.length === 0 ? (
              <p className="col-span-full rounded-lg border border-dashed border-slate-200 bg-white/60 px-3 py-4 text-center text-[10px] text-slate-500">
                No KPIs match &quot;{q}&quot;. Clear search to see all.
              </p>
            ) : (
              filteredKpis.map((k) => (
                <div
                  key={k.label}
                  className="min-w-0 rounded-lg border border-slate-100 bg-white px-2.5 py-2 shadow-sm shadow-slate-200/30"
                >
                  <div className="text-[8px] font-medium uppercase tracking-wide text-slate-500">
                    {k.label}
                  </div>
                  <div
                    className={`mt-0.5 text-sm font-semibold tabular-nums leading-none tracking-tight sm:text-base ${k.tone} whitespace-nowrap`}
                  >
                    {k.value}
                  </div>
                  <div className="mt-1 text-[8px] leading-tight text-slate-400">{k.sub}</div>
                </div>
              ))
            )}
          </div>

          {/* Period filters */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "All"],
                  ["week", "Week"],
                  ["month", "Month"],
                  ["custom", "Custom"]
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPeriod(id)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition sm:py-1 ${
                    period === id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="w-full shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-center text-[10px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 sm:w-auto"
            >
              Apr 1 – Apr 21, 2026 ▾
            </button>
          </div>

          {/* Charts: full-width stacks until xl — avoids squeezed side-by-side */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-4">
            <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm xl:col-span-7">
              <div className="text-[11px] font-semibold text-slate-800">Trend overview</div>
              <div className="text-[9px] text-slate-500">Weekly (tooltip)</div>
              <div className="mt-2 h-[130px] w-full min-w-0 sm:h-[145px] xl:h-[155px]">
                {lineChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                    No trend rows match this search.
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 2, right: 8, left: 4, bottom: 2 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} />
                    <YAxis width={32} tick={{ fontSize: 9, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 10,
                        borderRadius: 10,
                        border: "1px solid #e2e8f0"
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 9 }} iconSize={7} />
                    <Line type="monotone" dataKey="completed" name="Done" stroke={ACCENT} strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="pending" name="Pending" stroke="#7dd3fc" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="overdue" name="Overdue" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="relative rounded-lg border border-slate-100 bg-white p-2 shadow-sm xl:col-span-5">
              <div className="text-[11px] font-semibold text-slate-800">Health snapshot</div>
              <div className="text-[9px] text-slate-500">Donut</div>
              <div className="relative mx-auto mt-1 h-[130px] w-full max-w-[180px] min-w-0 sm:h-[140px] sm:max-w-[190px] xl:max-w-[200px]">
                {filteredDonut.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-[10px] text-slate-400">
                    No segments match.
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="72%"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {filteredDonut.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                )}
                {filteredDonut.length > 0 ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800 sm:text-xl">80%</div>
                    <div className="text-[8px] font-medium text-slate-500">on track</div>
                  </div>
                </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm xl:col-span-7">
              <div className="mb-2">
                <div className="text-[11px] font-semibold text-slate-800">Recent activity</div>
                <div className="text-[9px] text-slate-500">Demo</div>
              </div>
              <ul className="space-y-1.5">
                {filteredActivity.length === 0 ? (
                  <li className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 px-2 py-3 text-center text-[10px] text-slate-500">
                    No activity matches &quot;{q}&quot;.
                  </li>
                ) : (
                filteredActivity.map((row) => (
                  <li
                    key={row.title}
                    className="flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1 text-[10px] hover:border-blue-200 hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={row.done}
                      readOnly
                      className="mt-0.5 rounded border-slate-300 text-blue-600"
                      aria-label={row.title}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800">{row.title}</div>
                      <div className="text-[10px] text-slate-500">{row.time}</div>
                    </div>
                    {row.done && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-800">
                        Done
                      </span>
                    )}
                  </li>
                ))
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-3 xl:col-span-5">
              <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                <div className="mb-0.5 text-[11px] font-semibold text-slate-800">By category</div>
                <div className="h-[100px] w-full min-w-0 sm:h-[110px]">
                  {filteredBarCategory.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                      No categories match.
                    </div>
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredBarCategory} layout="vertical" margin={{ left: 0, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={48}
                        tick={{ fontSize: 9, fill: "#64748b" }}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill={ACCENT} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                <div className="mb-0.5 text-[11px] font-semibold text-slate-800">Region split</div>
                <div className="h-[100px] w-full min-w-0 sm:h-[108px]">
                  {filteredPieRegions.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                      No regions match.
                    </div>
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredPieRegions}
                        cx="50%"
                        cy="50%"
                        outerRadius="78%"
                        dataKey="value"
                        label={false}
                      >
                        {filteredPieRegions.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: 9, paddingTop: 4 }}
                        iconSize={6}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                <div className="mb-1.5 text-[11px] font-semibold text-slate-800">Team progress</div>
                <div className="space-y-1.5">
                  {filteredProgress.length === 0 ? (
                    <p className="py-2 text-center text-[10px] text-slate-400">No teams match.</p>
                  ) : (
                  filteredProgress.map((p) => (
                    <div key={p.label}>
                      <div className="mb-0.5 flex justify-between text-[9px] font-medium text-slate-600 sm:text-[10px]">
                        <span>{p.label}</span>
                        <span>{p.pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 sm:h-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
