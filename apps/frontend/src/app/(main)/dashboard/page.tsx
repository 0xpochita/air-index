import type { Metadata } from "next";
import { DashboardPage } from "@/components/pages/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your positions across every Air Index fund.",
};

export default function DashboardRoute() {
  return <DashboardPage />;
}
