"use client";

import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatWeight } from "@/lib/format";

interface PublishPanelProps {
  ensName: string;
  constituentCount: number;
  totalWeightBps: number;
  isBalanced: boolean;
  canSubmit: boolean;
  shouldLockMethodology: boolean;
  onLockChange: (shouldLock: boolean) => void;
}

export const PublishPanel = ({
  ensName,
  constituentCount,
  totalWeightBps,
  isBalanced,
  canSubmit,
  shouldLockMethodology,
  onLockChange,
}: PublishPanelProps) => (
  <Card className="flex flex-col gap-4 p-5">
    <div className="space-y-1">
      <p className="text-xs font-medium text-ink-subtle">Publishing as</p>
      <p className="truncate font-mono text-sm font-medium text-ink">
        {ensName}
      </p>
    </div>

    <dl className="space-y-2 border-t border-line pt-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Constituents</dt>
        <dd className="tabular-nums text-ink">{constituentCount}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Allocated</dt>
        <dd
          className={cn(
            "tabular-nums",
            isBalanced ? "text-positive" : "text-negative",
          )}
        >
          {formatWeight(totalWeightBps)}
        </dd>
      </div>
    </dl>

    <label className="flex items-start gap-2.5 border-t border-line pt-3">
      <input
        type="checkbox"
        checked={shouldLockMethodology}
        onChange={(event) => onLockChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-accent"
      />
      <span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <LockSimpleIcon size={13} weight="fill" aria-hidden />
          Lock methodology
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
          Revokes the contenthash, clear and upgrade roles. Nobody can rewrite
          it afterwards, including you.
        </span>
      </span>
    </label>

    <Button type="submit" disabled={!canSubmit} className="w-full">
      Publish index
    </Button>

    {!isBalanced ? (
      <p className="text-xs text-negative">
        Weights must total 100.00% to publish.
      </p>
    ) : null}
  </Card>
);
