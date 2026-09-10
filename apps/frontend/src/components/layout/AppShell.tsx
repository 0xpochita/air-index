"use client";

import type { ReactNode } from "react";
import { usePortfolio } from "@/lib/onchain/PortfolioProvider";
import { Navbar } from "./Navbar";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const { totalValueUsd } = usePortfolio();

  return (
    <div className="min-h-dvh">
      <Navbar totalValueUsd={totalValueUsd} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};
