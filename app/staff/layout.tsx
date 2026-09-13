"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole, getToken } from "@/lib/auth";
import { MobileNavProvider } from "@/lib/mobile-nav";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken() || getRole() !== "staff") {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <MobileNavProvider>
      <div className="flex w-full h-screen overflow-hidden bg-bg text-text">{children}</div>
    </MobileNavProvider>
  );
}
