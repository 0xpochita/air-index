import { AllocationCard } from "@/components/portfolio/AllocationCard";
import { getPortfolioPositions } from "@/lib/mock/indexes";
import {
  getPortfolioAllocation,
  getPortfolioValueUsd,
  getWeightedDayChangePct,
} from "@/lib/portfolio";
import { PortfolioHero } from "./components/PortfolioHero";
import { PositionList } from "./components/PositionList";

export const DashboardPage = () => {
  const positions = getPortfolioPositions();

  return (
    <div className="space-y-6">
      <PortfolioHero
        totalValueUsd={getPortfolioValueUsd(positions)}
        dayChangePct={getWeightedDayChangePct(positions)}
        indexCount={positions.length}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PositionList positions={positions} />
        </div>
        <div className="lg:col-span-2">
          <AllocationCard allocation={getPortfolioAllocation(positions)} />
        </div>
      </div>
    </div>
  );
};
