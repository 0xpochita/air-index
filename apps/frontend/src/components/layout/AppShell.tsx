"use client";

import type { ReactNode } from "react";
import { usePortfolio } from "@/lib/onchain/PortfolioProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const { positions, totalValueUsd } = usePortfolio();

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[16rem_1fr]">
      <div className="hidden lg:block">
        <Sidebar positions={positions} />
      </div>
      <div className="flex min-w-0 flex-col">
        <Topbar totalValueUsd={totalValueUsd} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
