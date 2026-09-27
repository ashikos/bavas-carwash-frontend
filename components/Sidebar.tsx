"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CarIcon,
  ReceiptIcon,
  WalletIcon,
  ShieldIcon,
  UserIcon,
  UploadIcon,
  ChartIcon,
  LogOutIcon,
  XIcon,
} from "./icons";
import { clearAuth, getUsername } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useMobileNav } from "@/lib/mobile-nav";

type NavItem = { href: string; label: string; Icon: (p: { size?: number }) => React.ReactElement };

const NAV_ITEMS: NavItem[] = [
  { href: "/staff/dashboard", label: "Dashboard", Icon: ChartIcon },
  { href: "/staff/car-entries", label: "Wash Entries", Icon: CarIcon },
  { href: "/staff/invoices", label: "Invoices", Icon: ReceiptIcon },
  { href: "/staff/expenses", label: "Expenses", Icon: WalletIcon },
  { href: "/staff/puc", label: "PUC", Icon: ShieldIcon },
  { href: "/staff/customers", label: "Customers", Icon: UserIcon },
  { href: "/staff/import", label: "Import Excel", Icon: UploadIcon },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: ChartIcon },
];

export function Sidebar({
  active,
  items = NAV_ITEMS,
  roleLabel = "Staff",
}: {
  active: string;
  items?: NavItem[];
  roleLabel?: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const { isOpen, close } = useMobileNav();

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
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 flex-shrink-0 bg-surface border-r border-border flex flex-col p-4 transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-2 pb-7">
          <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center text-accent-contrast font-heading font-extrabold text-base flex-shrink-0">
            B
          </div>
          <div className="flex-grow min-w-0">
            <div className="font-heading font-bold text-[15px] leading-tight text-text">Bavas Group</div>
            <div className="text-[11px] text-text-muted">Car Wash &amp; PUC</div>
          </div>
          <button onClick={close} className="text-text-muted flex-shrink-0 md:hidden" aria-label="Close menu">
            <XIcon size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-grow">
          {items.map(({ href, label, Icon }) => {
            const isActive = active === label;
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
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
          <div className="w-8 h-8 rounded-full bg-surface-alt border border-border flex items-center justify-center font-heading font-bold text-xs text-text flex-shrink-0">
            {initials || "ST"}
          </div>
          <div className="flex-grow min-w-0">
            <div className="font-heading font-semibold text-[13px] text-text truncate">{username}</div>
            <div className="text-[11px] text-text-muted">{roleLabel}</div>
          </div>
          <button onClick={handleLogout} className="text-text-muted flex-shrink-0" aria-label="Log out">
            <LogOutIcon size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
