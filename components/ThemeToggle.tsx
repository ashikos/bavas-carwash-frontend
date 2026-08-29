"use client";

import { useTheme } from "@/lib/theme";
import { SunIcon, MoonIcon } from "./icons";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex items-center bg-surface-alt border border-border rounded-full p-[3px]"
    >
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center ${
          theme === "light" ? "bg-surface shadow-sm text-accent" : "text-text-muted"
        }`}
      >
        <SunIcon size={15} />
      </span>
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center ${
          theme === "dark" ? "bg-surface shadow-sm text-accent" : "text-text-muted"
        }`}
      >
        <MoonIcon size={15} />
      </span>
    </button>
  );
}
