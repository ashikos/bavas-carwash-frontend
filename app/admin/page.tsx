"use client";

import { Sidebar, ADMIN_NAV_ITEMS } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";

export default function AdminDashboardPage() {
  return (
    <>
      <Sidebar active="Dashboard" items={ADMIN_NAV_ITEMS} roleLabel="Admin" />
      <DashboardView />
    </>
  );
}
