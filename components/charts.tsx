"use client";

import { useCallback, useState } from "react";

/**
 * Small hand-rolled SVG charts.
 *
 * The project carries no chart library, the same way it carries no icon library —
 * these few shapes are cheaper to draw than a dependency is to ship. Every colour
 * comes from the theme tokens, so both themes follow the rest of the app.
 */

type Tip = { x: number; y: number; title: string; lines: string[] } | null;

function useTooltip() {
  const [tip, setTip] = useState<Tip>(null);

  const show = useCallback(
    (e: React.PointerEvent, title: string, lines: string[]) =>
      setTip({ x: e.clientX, y: e.clientY, title, lines }),
    []
  );
  const hide = useCallback(() => setTip(null), []);

  const node = tip ? (
    <div
      role="status"
      className="fixed z-50 pointer-events-none rounded-[9px] border border-border bg-surface px-3 py-2 text-xs tabular-nums"
      style={{
        left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 0) - 210),
        top: tip.y + 16,
        boxShadow: "0 6px 22px var(--shadow)",
      }}
    >
      <div className="font-heading font-bold text-[12.5px] mb-0.5">{tip.title}</div>
      {tip.lines.map((l) => (
        <div key={l} className="text-text-muted">
          {l}
        </div>
      ))}
    </div>
  ) : null;

  return { show, hide, node };
}

function niceMax(value: number) {
  if (value <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / (pow / 2)) * (pow / 2);
}

/* ---------------- Card shell ---------------- */

export function ChartCard({
  title,
  note,
  right,
  children,
  className = "",
}: {
  title: string;
  note?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-surface border border-border rounded-[14px] p-[17px] min-w-0 ${className}`}>
      <div className="flex justify-between items-start gap-3 mb-3.5">
        <div>
          <h2 className="font-heading font-bold text-[14.5px] text-text">{title}</h2>
          {note && <div className="text-[12.5px] text-text-muted mt-0.5">{note}</div>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ---------------- Ranked rows ---------------- */

export function RankList({
  rows,
  unit,
  dimLabel,
}: {
  rows: { label: string; count: number }[];
  unit: string;
  dimLabel?: string;
}) {
  const { show, hide, node } = useTooltip();
  const max = Math.max(1, ...rows.map((r) => r.count));

  if (rows.length === 0) {
    return <div className="text-sm text-text-muted py-4">Nothing recorded for this month.</div>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid grid-cols-[92px_1fr_58px] sm:grid-cols-[106px_1fr_62px] gap-2.5 items-center"
          onPointerEnter={(e) => show(e, r.label, [`${r.count} ${unit}`])}
          onPointerMove={(e) => show(e, r.label, [`${r.count} ${unit}`])}
          onPointerLeave={hide}
        >
          <div className="text-[12.5px] text-text truncate" title={r.label}>
            {r.label}
          </div>
          <div className="bg-surface-alt rounded h-[15px] overflow-hidden">
            <div
              className={`h-full rounded ${r.label === dimLabel ? "bg-text-muted opacity-45" : "bg-accent"}`}
              style={{ width: `${Math.max(2, (100 * r.count) / max)}%` }}
            />
          </div>
          <div className="text-right font-heading font-bold text-[12.5px] tabular-nums">
            {r.count}
            <small className="block font-medium text-[11px] text-text-muted">{unit}</small>
          </div>
        </div>
      ))}
      {node}
    </div>
  );
}

/* ---------------- Area + line, one series ---------------- */

export function AreaChart({
  points,
  xLabel,
  tooltipUnit,
}: {
  points: { label: string; value: number; full: string }[];
  xLabel: (i: number) => string | null;
  tooltipUnit: string;
}) {
  const { show, hide, node } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);

  const W = 760, H = 250, L = 38, R = 12, T = 14, B = 28;
  const max = niceMax(Math.max(1, ...points.map((p) => p.value)));
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, points.length - 1);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);

  if (points.length === 0) {
    return <div className="text-sm text-text-muted py-8">No entries for this month.</div>;
  }

  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.value)}`).join(" ");
  const peak = points.reduce((a, p, i) => (p.value > points[a].value ? i : a), 0);
  const trough = points.reduce((a, p, i) => (p.value < points[a].value ? i : a), 0);

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto overflow-visible">
        {[0, 1, 2, 3, 4].map((g) => {
          const v = Math.round((max * g) / 4);
          return (
            <g key={g}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
              <text x={L - 8} y={y(v) + 3.5} textAnchor="end" className="fill-text-muted" fontSize={10.5}>
                {v}
              </text>
            </g>
          );
        })}

        <path d={`${path} L${x(points.length - 1)} ${y(0)} L${L} ${y(0)} Z`} fill="var(--accent)" opacity={0.13} />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {[peak, trough].map((i, n) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(points[i].value)} r={4.5}
              fill={n ? "var(--warning)" : "var(--accent)"} stroke="var(--surface)" strokeWidth={2} />
            <text x={x(i)} y={y(points[i].value) + (n ? 18 : -12)} textAnchor="middle"
              className="font-heading" fontWeight={700} fontSize={11}
              fill={n ? "var(--warning)" : "var(--text)"}>
              {points[i].value}
            </text>
          </g>
        ))}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B}
            stroke="var(--text-muted)" strokeWidth={1} opacity={0.5} strokeDasharray="3 3" />
        )}

        {points.map((p, i) => {
          const label = xLabel(i);
          return label ? (
            <text key={`t${i}`} x={x(i)} y={H - 9} textAnchor="middle" className="fill-text-muted" fontSize={10.5}>
              {label}
            </text>
          ) : null;
        })}

        {points.map((p, i) => (
          <rect
            key={`h${i}`}
            x={x(i) - (W - L - R) / Math.max(1, points.length - 1) / 2}
            y={T}
            width={(W - L - R) / Math.max(1, points.length - 1)}
            height={H - T - B}
            fill="transparent"
            onPointerEnter={(e) => { setHover(i); show(e, p.full, [`${p.value} ${tooltipUnit}`]); }}
            onPointerMove={(e) => show(e, p.full, [`${p.value} ${tooltipUnit}`])}
            onPointerLeave={() => { setHover(null); hide(); }}
          />
        ))}

        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth={1} />
      </svg>
      {node}
    </figure>
  );
}

/* ---------------- Bars, one series ---------------- */

export function BarChart({
  bars,
  tooltipUnit,
  lowestIsWarning = false,
}: {
  bars: { label: string; value: number }[];
  tooltipUnit: string;
  lowestIsWarning?: boolean;
}) {
  const { show, hide, node } = useTooltip();

  const W = 520, H = 240, L = 34, R = 10, T = 26, B = 26;
  const max = niceMax(Math.max(1, ...bars.map((b) => b.value)));
  const bw = (W - L - R) / Math.max(1, bars.length);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);

  const peak = Math.max(...bars.map((b) => b.value));
  const low = Math.min(...bars.filter((b) => b.value > 0).map((b) => b.value));

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto overflow-visible">
        {[0, 1, 2, 3].map((g) => {
          const v = Math.round((max * g) / 3);
          return (
            <g key={g}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
              <text x={L - 8} y={y(v) + 3.5} textAnchor="end" className="fill-text-muted" fontSize={10.5}>
                {v}
              </text>
            </g>
          );
        })}

        {bars.map((b, i) => {
          const warn = lowestIsWarning && b.value === low && b.value > 0;
          const x0 = L + i * bw + 6;
          const w = bw - 12;
          const top = y(b.value);
          // 4px rounded data-end, anchored to the baseline
          const d = `M${x0} ${y(0)} L${x0} ${top + 4} Q${x0} ${top} ${x0 + 4} ${top}
                     L${x0 + w - 4} ${top} Q${x0 + w} ${top} ${x0 + w} ${top + 4} L${x0 + w} ${y(0)} Z`;
          return (
            <g key={b.label}>
              <path
                d={d}
                fill={warn ? "var(--warning)" : "var(--accent)"}
                onPointerEnter={(e) => show(e, b.label, [`${b.value} ${tooltipUnit}`])}
                onPointerMove={(e) => show(e, b.label, [`${b.value} ${tooltipUnit}`])}
                onPointerLeave={hide}
              />
              <text x={x0 + w / 2} y={H - 9} textAnchor="middle" className="fill-text-muted" fontSize={10.5}>
                {b.label}
              </text>
              {(warn || b.value === peak) && (
                <text x={x0 + w / 2} y={top - 8} textAnchor="middle" className="font-heading"
                  fontWeight={700} fontSize={11} fill={warn ? "var(--warning)" : "var(--text)"}>
                  {b.value}
                </text>
              )}
            </g>
          );
        })}
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth={1} />
      </svg>
      {node}
    </figure>
  );
}

/* ---------------- Twelve months, gaps shown as absent ---------------- */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyChart({
  months,
  year,
  missingLabel = "Not imported yet",
  hint,
}: {
  months: { month: number; count: number | null }[];
  year: number;
  /** What a month with no value means for this viewer. */
  missingLabel?: string;
  hint?: string;
}) {
  const { show, hide, node } = useTooltip();

  const W = 1140, H = 250, L = 52, R = 16, T = 14, B = 30;
  const present = months.filter((m) => m.count != null);
  const max = niceMax(Math.max(10, ...present.map((m) => m.count ?? 0)));
  const x = (i: number) => L + (i * (W - L - R)) / 11;
  const y = (v: number) => T + (1 - v / max) * (H - T - B);

  // Only join months that sit next to each other; a gap must not be bridged
  // by a line, which would invent data for a month nobody imported.
  const runs: { i: number; count: number }[][] = [];
  months.forEach((m, i) => {
    if (m.count == null) return;
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1].i === i - 1) last.push({ i, count: m.count });
    else runs.push([{ i, count: m.count }]);
  });

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto overflow-visible">
        {[0, 1, 2, 3, 4].map((g) => {
          const v = Math.round((max * g) / 4);
          return (
            <g key={g}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
              <text x={L - 9} y={y(v) + 3.5} textAnchor="end" className="fill-text-muted" fontSize={10.5}>
                {v}
              </text>
            </g>
          );
        })}

        {runs.map((run, r) => (
          <g key={r}>
            {run.length > 1 && (
              <path
                d={run.map((p, k) => `${k ? "L" : "M"}${x(p.i)} ${y(p.count)}`).join(" ")}
                fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
              />
            )}
            {run.map((p) => (
              <circle key={p.i} cx={x(p.i)} cy={y(p.count)} r={5.5}
                fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
            ))}
          </g>
        ))}

        {months.map((m, i) => (
          <g key={m.month}>
            <text x={x(i)} y={H - 10} textAnchor="middle" className="fill-text-muted"
              fontSize={10.5} opacity={m.count == null ? 0.45 : 1}>
              {MONTH_NAMES[i]}
            </text>
            {m.count == null && (
              <line x1={x(i)} x2={x(i)} y1={y(0) - 5} y2={y(0)}
                stroke="var(--text-muted)" strokeWidth={2} opacity={0.3} strokeLinecap="round" />
            )}
            <rect x={x(i) - 26} y={T} width={52} height={H - T - B} fill="transparent"
              onPointerEnter={(e) =>
                show(e, `${MONTH_NAMES[i]} ${year}`,
                  m.count == null ? [missingLabel] : [`${m.count} jobs`])}
              onPointerMove={(e) =>
                show(e, `${MONTH_NAMES[i]} ${year}`,
                  m.count == null ? [missingLabel] : [`${m.count} jobs`])}
              onPointerLeave={hide}
            />
          </g>
        ))}

        {hint && present.length <= 1 && (
          <text x={(L + W - R) / 2} y={y(0) - 26} textAnchor="middle"
            className="fill-text-muted" fontSize={10.5} opacity={0.75}>
            {hint}
          </text>
        )}

        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth={1} />
      </svg>
      {node}
    </figure>
  );
}
