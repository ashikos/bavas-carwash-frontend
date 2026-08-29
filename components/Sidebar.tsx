"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CarIcon, ReceiptIcon, WalletIcon, ShieldIcon, UserIcon, LogOutIcon } from "./icons";
import { clearAuth, getUsername } from "@/lib/auth";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/staff/car-entries", label: "Car Entries", Icon: CarIcon },
  { href: "/staff/invoices", label: "Invoices", Icon: ReceiptIcon },
  { href: "/staff/expenses", label: "Expenses", Icon: WalletIcon },
  { href: "/staff/puc", label: "PUC", Icon: ShieldIcon },
  { href: "/staff/customers", label: "Customers", Icon: UserIcon },
];

export function Sidebar({ active }: { active: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    setUsername(getUsername() ?? "Staff");
  }, []);

  const initials = username
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-r border-border flex flex-col p-4">
      <div className="flex items-center gap-2.5 px-2 pb-7">
        <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center text-accent-contrast font-heading font-extrabold text-base">
          B
        </div>
        <div>
          <div className="font-heading font-bold text-[15px] leading-tight text-text">Bavas Group</div>
          <div className="text-[11px] text-text-muted">Car Wash &amp; PUC</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-grow">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = active === label;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-heading font-semibold text-sm ${
                isActive ? "bg-accent-soft text-accent" : "text-text-muted"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-surface-alt border border-border flex items-center justify-center font-heading font-bold text-xs text-text">
          {initials || "ST"}
        </div>
        <div className="flex-grow min-w-0">
          <div className="font-heading font-semibold text-[13px] text-text truncate">{username}</div>
          <div className="text-[11px] text-text-muted">Staff</div>
        </div>
        <button onClick={handleLogout} className="text-text-muted flex-shrink-0" aria-label="Log out">
          <LogOutIcon size={16} />
        </button>
      </div>
    </aside>
  );
}
