import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { formatUsd, formatWeight } from "@/lib/format";
import type { AllocationSlice } from "@/lib/portfolio";

const MAX_VISIBLE_SLICES = 6;

interface AllocationCardProps {
  allocation: AllocationSlice[];
}

export const AllocationCard = ({ allocation }: AllocationCardProps) => {
  const visible = allocation.slice(0, MAX_VISIBLE_SLICES);
  const hiddenCount = allocation.length - visible.length;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Look through exposure"
        action={
          hiddenCount > 0 ? (
            <span className="text-xs text-ink-subtle">{`+${hiddenCount} more`}</span>
          ) : null
        }
      />
      {visible.length > 0 ? (
        <ul className="space-y-4 px-5 pb-5">
          {visible.map((slice) => (
            <li key={slice.token.symbol} className="space-y-1.5">
              <div className="flex items-center gap-3">
                <TokenIcon token={slice.token} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {slice.token.name}
                </span>
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {formatWeight(slice.shareBps)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-hover">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${slice.shareBps / 100}%` }}
                  />
                </span>
                <span className="text-xs tabular-nums text-ink-subtle">
                  {formatUsd(slice.valueUsd)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nothing to break down"
          description="Deposit into an index to see which tokens you hold through it."
        />
      )}
    </Card>
  );
};
