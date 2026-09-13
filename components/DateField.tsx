"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarIcon, XIcon } from "./icons";

/**
 * A date field with our own calendar.
 *
 * The native `<input type="date">` picker is drawn by the browser: its size,
 * spacing and colours cannot be styled, and it only opens from its own small
 * icon. This replaces it so the calendar matches the app, is comfortably sized,
 * and drops down wherever you click in the field.
 *
 * The popup is rendered through a portal with fixed positioning because these
 * fields sit inside `Modal` and `Drawer`, both of which scroll their own body —
 * an absolutely positioned popup would be clipped by that scroll container.
 *
 * Values are "YYYY-MM-DD" strings, the same as the inputs it replaces.
 */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const POPUP_WIDTH = 320;
const POPUP_HEIGHT = 372;

type Parts = { year: number; month: number; day: number };

function parse(value: string): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  // Build the date locally rather than via Date.parse, which reads a bare
  // "YYYY-MM-DD" as UTC and can land on the previous day east of Greenwich.
  const probe = new Date(year, month - 1, day);
  if (probe.getMonth() !== month - 1) return null;
  return { year, month, day };
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function pretty(value: string) {
  const p = parse(value);
  if (!p) return "";
  return new Date(p.year, p.month - 1, p.day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DateField({
  value,
  onChange,
  min,
  max,
  id,
  placeholder = "Pick a date",
  clearable = false,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  id?: string;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const selected = parse(value);
  const today = new Date();
  const [view, setView] = useState(() => ({
    year: selected?.year ?? today.getFullYear(),
    month: selected?.month ?? today.getMonth() + 1,
  }));

  // Reopening on a different value should land on that value's month.
  useEffect(() => {
    if (open && selected) setView({ year: selected.year, month: selected.month });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    // Flip above when there isn't room underneath.
    const top = spaceBelow < POPUP_HEIGHT + 12 && r.top > POPUP_HEIGHT + 12
      ? r.top - POPUP_HEIGHT - 8
      : r.bottom + 8;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - POPUP_WIDTH - 8);
    setRect({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popupRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shiftMonth = (by: number) => {
    setView((v) => {
      const next = new Date(v.year, v.month - 1 + by, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });
  };

  const outOfRange = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

  const pick = (day: number) => {
    const iso = toISO(view.year, view.month, day);
    if (outOfRange(iso)) return;
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const firstWeekday = new Date(view.year, view.month - 1, 1).getDay();
  const daysInMonth = new Date(view.year, view.month, 0).getDate();
  const todayISO = toISO(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative w-full h-11 rounded-[10px] border bg-surface pl-3.5 pr-10 text-sm text-left ${
          open ? "border-accent" : "border-border"
        } ${value ? "text-text" : "text-text-muted"} ${className}`}
      >
        {value ? pretty(value) : placeholder}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <CalendarIcon size={18} />
        </span>
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-label="Choose a date"
            className="fixed z-[100] rounded-[14px] border border-border bg-surface p-3.5"
            style={{
              top: rect.top,
              left: rect.left,
              width: POPUP_WIDTH,
              boxShadow: "0 16px 44px var(--shadow)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="w-9 h-9 rounded-[9px] border border-border bg-surface text-text-muted flex items-center justify-center text-lg leading-none"
              >
                &#8249;
              </button>
              <div className="font-heading font-bold text-[14.5px] text-text">
                {MONTHS[view.month - 1]} {view.year}
              </div>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="w-9 h-9 rounded-[9px] border border-border bg-surface text-text-muted flex items-center justify-center text-lg leading-none"
              >
                &#8250;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="h-7 flex items-center justify-center font-heading font-bold text-[10.5px] uppercase tracking-wide text-text-muted"
                >
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={i} className="h-10" />;
                const iso = toISO(view.year, view.month, day);
                const isSelected = iso === value;
                const isToday = iso === todayISO;
                const disabled = outOfRange(iso);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(day)}
                    aria-current={isToday ? "date" : undefined}
                    className={`h-10 rounded-[9px] text-[13.5px] tabular-nums font-heading ${
                      isSelected
                        ? "bg-accent text-accent-contrast font-bold"
                        : disabled
                          ? "text-text-muted opacity-35 cursor-not-allowed"
                          : isToday
                            ? "text-accent font-bold bg-accent-soft"
                            : "text-text font-semibold hover:bg-surface-alt"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mt-3.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  if (!outOfRange(todayISO)) {
                    onChange(todayISO);
                    setOpen(false);
                  }
                }}
                disabled={outOfRange(todayISO)}
                className="flex-1 h-9 rounded-[9px] border border-border bg-surface text-text font-heading font-semibold text-[13px] disabled:opacity-40"
              >
                Today
              </button>
              {clearable && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="h-9 px-3 rounded-[9px] border border-border bg-surface text-text-muted font-heading font-semibold text-[13px] flex items-center gap-1.5"
                >
                  <XIcon size={14} />
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
