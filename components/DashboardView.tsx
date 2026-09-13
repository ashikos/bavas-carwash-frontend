"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/Topbar";
import { AreaChart, BarChart, ChartCard, MonthlyChart, RankList } from "@/components/charts";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

function dayLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function Kpi({
  label,
  value,
  meta,
  tone,
}: {
  label: string;
  value: string | number;
  meta?: string;
  tone?: "warn";
}) {
  return (
    <div className="relative overflow-hidden bg-surface border border-border rounded-[14px] px-4 py-[15px]">
      <div className={`absolute inset-y-0 left-0 w-[3px] ${tone === "warn" ? "bg-warning" : "bg-accent"}`} />
      <div className="font-heading font-bold text-[10.5px] tracking-[0.07em] uppercase text-text-muted">
        {label}
      </div>
      <div className="font-heading font-extrabold text-[25px] tracking-tight mt-1.5 tabular-nums">{value}</div>
      {meta && <div className="text-xs text-text-muted mt-0.5 tabular-nums">{meta}</div>}
    </div>
  );
}

/**
 * The dashboard itself, without the sidebar.
 *
 * Rendered by both `/admin` and `/staff/dashboard` so the two stay identical —
 * the only difference between them is which sidebar sits alongside.
 */
export function DashboardView() {
  const [period, setPeriod] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", period],
    queryFn: () => {
      const qs = period ? `?year=${period.split("-")[0]}&month=${Number(period.split("-")[1])}` : "";
      return api.get<DashboardSummary>(`/api/dashboard/summary${qs}`);
    },
  });

  const current = data ? `${data.year}-${String(data.month).padStart(2, "0")}` : null;
  // Every card except the year chart shows one month; the Topbar names it once,
  // but that scrolls away, so each card repeats it.
  const periodLabel = data ? `${MONTHS[data.month - 1]} ${data.year}` : "";

  return (
      <div className="flex-grow flex flex-col min-w-0">
        <Topbar
          title="Dashboard"
          subtitle={data ? `${MONTHS[data.month - 1]} ${data.year} · work volume` : "Work volume"}
        />

        <div className="px-4 md:px-8 py-6 flex-grow overflow-auto flex flex-col gap-3">
          {isLoading && <div className="text-sm text-text-muted py-6">Loading…</div>}
          {isError && (
            <div className="text-sm text-danger py-6">Could not load the dashboard. Please try again.</div>
          )}

          {data && (
            <>
              {data.available_months.length > 1 && (
                <div className="flex gap-1.5 flex-wrap">
                  {data.available_months.map((key) => (
                    <button
                      key={key}
                      onClick={() => setPeriod(key)}
                      aria-pressed={key === current}
                      className={`font-heading font-semibold text-[13px] px-3.5 h-9 rounded-[9px] border ${
                        key === current
                          ? "bg-accent-soft text-accent border-transparent"
                          : "bg-surface text-text-muted border-border"
                      }`}
                    >
                      {monthLabel(key)}
                    </button>
                  ))}
                </div>
              )}

              {data.jobs === 0 ? (
                <div className="bg-surface border border-border rounded-[14px] px-5 py-8 text-sm text-text-muted">
                  No car entries recorded for {MONTHS[data.month - 1]} {data.year}. Import that month&rsquo;s
                  sheet, or pick another period above.
                </div>
              ) : (
                <>
                  {/* ---- Headline figures ---- */}
                  {/* The tiles are a single row, so one heading names the period
                      for all six rather than repeating it on each. */}
                  <div className="flex items-center gap-3 px-1 pt-1">
                    <span className="font-heading font-bold text-xs tracking-wide uppercase text-text-muted whitespace-nowrap">
                      {periodLabel}
                    </span>
                    <span className="h-px flex-grow bg-border" />
                    <span className="text-[12.5px] text-text-muted tabular-nums whitespace-nowrap">
                      {data.days_recorded} {data.days_recorded === 1 ? "day" : "days"} recorded
                    </span>
                  </div>

                  <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                    <Kpi
                      label="Cars washed"
                      value={data.jobs}
                      meta={`Across ${data.days_recorded} days`}
                    />
                    <Kpi label="Per day" value={data.jobs_per_day} meta="Average vehicles a day" />
                    <Kpi label="Vehicles seen" value={data.vehicles} meta="Distinct registrations" />
                    <Kpi
                      label="Busiest day"
                      value={data.busiest?.count ?? "—"}
                      meta={data.busiest ? dayLabel(data.busiest.date) : undefined}
                    />
                    <Kpi
                      label="Quietest day"
                      value={data.quietest?.count ?? "—"}
                      meta={data.quietest ? dayLabel(data.quietest.date) : undefined}
                      tone="warn"
                    />
                    <Kpi
                      label="Service not recorded"
                      value={data.unspecified_services}
                      meta={`${((100 * data.unspecified_services) / data.jobs).toFixed(1)}% of jobs`}
                      tone={data.unspecified_services > 0 ? "warn" : undefined}
                    />
                  </div>

                  {/* ---- Year ---- */}
                  <ChartCard
                    title="Jobs by month"
                    note={`Vehicles washed each month of ${data.year} · ${periodLabel} selected`}
                    right={
                      data.monthly.filter((m) => m.count != null).length < 12 ? (
                        <span className="font-heading font-bold text-[11px] px-2.5 py-1 rounded-full bg-warning-soft text-warning whitespace-nowrap">
                          {12 - data.monthly.filter((m) => m.count != null).length} months not imported
                        </span>
                      ) : undefined
                    }
                  >
                    <MonthlyChart
                      months={data.monthly}
                      year={data.year}
                      hint="Import the other months' sheets to fill this in"
                    />
                  </ChartCard>

                  {/* ---- Services + repeat ---- */}
                  <div className="grid gap-3 grid-cols-1 lg:grid-cols-12">
                    <ChartCard
                      title="Services done"
                      note={`Jobs done in ${periodLabel}, by type`}
                      className="lg:col-span-7"
                    >
                      <RankList rows={data.services} unit="jobs" dimLabel="Not specified" />
                    </ChartCard>

                    <ChartCard
                      title="How often vehicles came back"
                      note={`Visits per registration within ${periodLabel}`}
                      className="lg:col-span-5"
                    >
                      <RankList rows={data.repeat_visits} unit="vehicles" />
                      <div className="text-[12.5px] text-text-muted mt-3">
                        A vehicle washed once a month still shows as a single visit here, so read this
                        across several months before treating it as repeat custom.
                      </div>
                    </ChartCard>
                  </div>

                  {/* ---- Daily + weekday ---- */}
                  <div className="grid gap-3 grid-cols-1 lg:grid-cols-12">
                    <ChartCard
                      title="Vehicles per day"
                      note={`Daily workload through ${periodLabel}`}
                      className="lg:col-span-7"
                    >
                      <AreaChart
                        points={data.daily.map((d) => ({
                          label: d.date,
                          value: d.count,
                          full: dayLabel(d.date),
                        }))}
                        xLabel={(i) =>
                          i === 0 || i === data.daily.length - 1 || i % 7 === 0
                            ? new Date(data.daily[i].date + "T00:00:00").getDate().toString()
                            : null
                        }
                        tooltipUnit="vehicles"
                      />
                    </ChartCard>

                    <ChartCard
                      title="Busiest days"
                      note={`Average vehicles by weekday in ${periodLabel}`}
                      className="lg:col-span-5"
                    >
                      <BarChart
                        bars={data.weekday.map((w) => ({ label: w.label, value: w.count }))}
                        tooltipUnit="vehicles on an average day"
                        lowestIsWarning
                      />
                    </ChartCard>
                  </div>

                  {/* ---- Vehicles + accounts ---- */}
                  <div className="grid gap-3 grid-cols-1 lg:grid-cols-12">
                    <ChartCard
                      title="Vehicles seen most"
                      note={`Most visits in ${periodLabel}`}
                      className="lg:col-span-6"
                    >
                      <RankList rows={data.top_vehicles} unit="visits" />
                    </ChartCard>

                    <ChartCard
                      title="Regular accounts"
                      note={`Names in the mobile column, ${periodLabel}`}
                      className="lg:col-span-6"
                    >
                      {data.accounts.length ? (
                        <>
                          <RankList rows={data.accounts} unit="visits" />
                          <div className="text-[12.5px] text-text-muted mt-3">
                            Staff type an account name here instead of a number for regulars such as
                            dealerships.
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-text-muted py-4">
                          No named accounts this month.
                        </div>
                      )}
                    </ChartCard>
                  </div>

                  <div className="text-[12.5px] text-text-muted px-1">
                    Service names are grouped on read — <code>FULL WASH</code>, <code>FULLWASH</code> and{" "}
                    <code>FULL</code> count as one service.
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
  );
}
