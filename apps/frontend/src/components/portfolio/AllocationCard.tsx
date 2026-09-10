import { EmptyState } from "@/components/ui/EmptyState";
import { SoftCard } from "@/components/ui/SoftCard";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { formatWeight } from "@/lib/format";
import type { AllocationSlice } from "@/lib/portfolio";

const MAX_VISIBLE_SLICES = 5;

interface AllocationCardProps {
  allocation: AllocationSlice[];
}

/** Nothing here is clickable, so it is one inset panel rather than a stack of pills. */
export const AllocationCard = ({ allocation }: AllocationCardProps) => {
  const visible = allocation.slice(0, MAX_VISIBLE_SLICES);
  const hiddenCount = allocation.length - visible.length;

  return (
    <SoftCard
      title="Look through exposure"
      action={
        hiddenCount > 0 ? (
          <span className="text-xs text-ink-subtle">{`+${hiddenCount} more`}</span>
        ) : null
      }
      className="flex flex-col"
    >
      {visible.length > 0 ? (
        <ul className="soft-inset flex-1 space-y-4 rounded-[1.35rem] bg-surface-subtle px-4 py-4">
          {visible.map((slice) => (
            <li key={slice.token.symbol} className="flex items-center gap-3">
              <TokenIcon token={slice.token} size="sm" />
              <span className="w-20 shrink-0 truncate text-sm font-medium text-ink">
                {slice.token.name}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${slice.shareBps / 100}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
                {formatWeight(slice.shareBps)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="soft-inset flex-1 rounded-[1.35rem] bg-surface-subtle">
          <EmptyState
            title="Nothing to break down"
            description="Deposit into an index to see which tokens you hold through it."
          />
        </div>
      )}
    </SoftCard>
  );
};
