"use client";

import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";

export default function StaffDashboardPage() {
  return (
    <>
      <Sidebar active="Dashboard" />
      <DashboardView />
    </>
  );
}
