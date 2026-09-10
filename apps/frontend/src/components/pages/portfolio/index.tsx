"use client";

import { AllocationCard } from "@/components/portfolio/AllocationCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePortfolio } from "@/lib/onchain/PortfolioProvider";
import {
  getPortfolioAllocation,
  getWeightedDayChangePct,
} from "@/lib/portfolio";
import { PortfolioSplit } from "./components/PortfolioSplit";

export const PortfolioPage = () => {
  const { positions, totalValueUsd } = usePortfolio();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Every index you hold, its unit balance and what it adds up to."
      />

      <PortfolioSplit
        positions={positions}
        totalValueUsd={totalValueUsd}
        dayChangePct={getWeightedDayChangePct(positions)}
      />

      <AllocationCard allocation={getPortfolioAllocation(positions)} />
    </div>
  );
};
