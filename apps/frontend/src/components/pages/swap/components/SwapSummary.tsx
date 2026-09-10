"use client";

import { formatAmount, formatUsd, truncateAddress } from "@/lib/format";

const ROW_CLASS = "flex items-center justify-between gap-4";

interface SwapSummaryProps {
  paySymbol: string;
  receiveSymbol: string;
  rate: number;
  unitPriceUsd: number;
  vault: `0x${string}` | null;
}

export const SwapSummary = ({
  paySymbol,
  receiveSymbol,
  rate,
  unitPriceUsd,
  vault,
}: SwapSummaryProps) => (
  <dl className="space-y-2.5 text-sm">
    <div className={ROW_CLASS}>
      <dt className="text-ink-subtle">Rate</dt>
      <dd className="tabular-nums text-ink">
        {`1 ${paySymbol} = ${formatAmount(rate)} ${receiveSymbol}`}
      </dd>
    </div>

    <div className={ROW_CLASS}>
      <dt className="text-ink-subtle">Share price</dt>
      <dd className="tabular-nums text-ink">{formatUsd(unitPriceUsd)}</dd>
    </div>

    <div className={ROW_CLASS}>
      <dt className="text-ink-subtle">Fee</dt>
      <dd className="tabular-nums text-positive">0.00%</dd>
    </div>

    <div className={ROW_CLASS}>
      <dt className="text-ink-subtle">Settles in</dt>
      <dd className="font-mono text-xs text-ink">
        {vault ? truncateAddress(vault) : "—"}
      </dd>
    </div>
  </dl>
);
