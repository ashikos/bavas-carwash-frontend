"use client";

import { ThemeToggle } from "./ThemeToggle";

export function Topbar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="h-[72px] flex-shrink-0 border-b border-border flex items-center justify-between px-8">
      <div>
        <div className="font-heading font-extrabold text-xl text-text">{title}</div>
        {subtitle && <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-5">
        {right}
        <div className="w-px h-6 bg-border" />
        <ThemeToggle />
        <div className="w-[34px] h-[34px] rounded-full bg-accent-soft text-accent flex items-center justify-center font-heading font-bold text-[13px]">
          RS
        </div>
      </div>
    </header>
  );
}
