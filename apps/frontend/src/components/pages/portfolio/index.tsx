import { AllocationCard } from "@/components/portfolio/AllocationCard";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPortfolioPositions } from "@/lib/mock/indexes";
import {
  getPortfolioAllocation,
  getPortfolioValueUsd,
  getWeightedDayChangePct,
} from "@/lib/portfolio";
import { HoldingsTable } from "./components/HoldingsTable";
import { PortfolioCover } from "./components/PortfolioCover";

export const PortfolioPage = () => {
  const positions = getPortfolioPositions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Every index you hold, its unit balance and what it adds up to."
        action={
          <ButtonLink href="/explore" variant="secondary">
            Explore indexes
          </ButtonLink>
        }
      />

      <PortfolioCover
        totalValueUsd={getPortfolioValueUsd(positions)}
        dayChangePct={getWeightedDayChangePct(positions)}
        holdingCount={positions.length}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <HoldingsTable positions={positions} />
        </div>
        <div className="lg:col-span-2">
          <AllocationCard allocation={getPortfolioAllocation(positions)} />
        </div>
      </div>
    </div>
  );
};
