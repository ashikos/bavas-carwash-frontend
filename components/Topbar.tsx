"use client";

import { ThemeToggle } from "./ThemeToggle";
import { MenuIcon } from "./icons";
import { useMobileNav } from "@/lib/mobile-nav";

export function Topbar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { toggle } = useMobileNav();

  return (
    <header className="h-[72px] flex-shrink-0 border-b border-border flex items-center justify-between px-4 md:px-8 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="md:hidden text-text-muted flex-shrink-0 w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center"
          aria-label="Open menu"
        >
          <MenuIcon size={20} />
        </button>
        <div className="min-w-0">
          <div className="font-heading font-extrabold text-lg md:text-xl text-text truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-text-muted mt-0.5 truncate hidden sm:block">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 md:gap-5 flex-shrink-0">
        {right}
        <div className="w-px h-6 bg-border hidden sm:block" />
        <ThemeToggle />
        <div className="w-[34px] h-[34px] rounded-full bg-accent-soft text-accent flex items-center justify-center font-heading font-bold text-[13px] flex-shrink-0">
          RS
        </div>
      </div>
    </header>
  );
}
