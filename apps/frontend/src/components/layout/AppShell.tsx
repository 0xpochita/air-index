import type { ReactNode } from "react";
import { getPortfolioPositions } from "@/lib/mock/indexes";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const positions = getPortfolioPositions();
  const totalValueUsd = positions.reduce(
    (total, position) => total + position.valueUsd,
    0,
  );

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
