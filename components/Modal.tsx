"use client";

import { XIcon } from "./icons";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = 400,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(20% 0.02 240 / 0.32)" }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-[18px] shadow-xl overflow-hidden max-h-[85vh] flex flex-col mx-4 w-full"
        style={{ maxWidth: width, boxShadow: "0 24px 60px var(--shadow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <div className="font-heading font-extrabold text-[17px] text-text">{title}</div>
            {subtitle && <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-lg border border-border bg-surface text-text-muted flex items-center justify-center flex-shrink-0"
          >
            <XIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex flex-col flex-shrink min-h-0">{children}</div>
      </div>
    </div>
  );
}
