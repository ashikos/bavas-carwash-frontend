"use client";

import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShieldIcon, LogOutIcon } from "@/components/icons";

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <div className="absolute top-7 right-9">
        <ThemeToggle />
      </div>
      <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
        <ShieldIcon size={26} />
      </div>
      <div className="font-heading font-extrabold text-2xl text-text">Admin module coming soon</div>
      <div className="text-sm text-text-muted max-w-sm">
        Reports, staff accounts, and pricing management will live here. For now, staff can log entries
        from the Staff module.
      </div>
      <button
        onClick={() => {
          clearAuth();
          router.push("/login");
        }}
        className="flex items-center gap-2 mt-2 px-4 h-10 rounded-[10px] border border-border bg-surface text-text font-heading font-semibold text-sm"
      >
        <LogOutIcon size={16} />
        Log out
      </button>
    </div>
  );
}
