"use client";

import { cn } from "@/lib/cn";
import { formatAmount, formatBps } from "@/lib/format";
import { getRouteFeeBps, getRoutePriceImpactBps } from "@/lib/index-math";
import { SWAP_ROUTES, type SwapRoute } from "@/types/index-fund";

const ROUTE_LABEL: Record<SwapRoute, string> = {
  direct: "Direct mint",
  aggregator: "Aggregator",
};

const ROW_CLASS = "flex items-center justify-between gap-4";

interface SwapSummaryProps {
  route: SwapRoute;
  onRouteChange: (route: SwapRoute) => void;
  paySymbol: string;
  receiveSymbol: string;
  rate: number;
}

export const SwapSummary = ({
  route,
  onRouteChange,
  paySymbol,
  receiveSymbol,
  rate,
}: SwapSummaryProps) => {
  const feeBps = getRouteFeeBps(route);
  const impactBps = getRoutePriceImpactBps(route);

  return (
    <dl className="space-y-2.5 text-sm">
      <div className={ROW_CLASS}>
        <dt className="text-ink-subtle">Route</dt>
        <dd className="flex gap-1">
          {SWAP_ROUTES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={route === value}
              onClick={() => onRouteChange(value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out",
                route === value
                  ? "bg-ink text-ink-inverse"
                  : "text-ink-subtle hover:text-ink",
              )}
            >
              {ROUTE_LABEL[value]}
            </button>
          ))}
        </dd>
      </div>

      <div className={ROW_CLASS}>
        <dt className="text-ink-subtle">Rate</dt>
        <dd className="tabular-nums text-ink">
          {`1 ${paySymbol} = ${formatAmount(rate)} ${receiveSymbol}`}
        </dd>
      </div>

      <div className={ROW_CLASS}>
        <dt className="text-ink-subtle">Fee</dt>
        <dd
          className={cn(
            "tabular-nums",
            feeBps === 0 ? "text-positive" : "text-ink",
          )}
        >
          {formatBps(feeBps)}
        </dd>
      </div>

      <div className={ROW_CLASS}>
        <dt className="text-ink-subtle">Price impact</dt>
        <dd
          className={cn(
            "tabular-nums",
            impactBps === 0 ? "text-positive" : "text-ink",
          )}
        >
          {formatBps(impactBps)}
        </dd>
      </div>
    </dl>
  );
};
