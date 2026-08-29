"use client";

import { XIcon } from "./icons";

export function Drawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "oklch(20% 0.02 240 / 0.32)" }}
      onClick={onClose}
    >
      <div
        className="absolute top-0 right-0 bottom-0 w-full max-w-[440px] bg-surface flex flex-col"
        style={{ boxShadow: "-16px 0 40px var(--shadow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 py-6 border-b border-border flex-shrink-0">
          <div>
            <div className="font-heading font-extrabold text-lg text-text">{title}</div>
            {subtitle && <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center flex-shrink-0"
          >
            <XIcon size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
