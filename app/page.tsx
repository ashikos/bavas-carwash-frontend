"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole, getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    router.replace(getRole() === "admin" ? "/admin" : "/staff/car-entries");
  }, [router]);

  return null;
}
