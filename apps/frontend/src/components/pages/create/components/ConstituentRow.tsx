"use client";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { formatWeight } from "@/lib/format";
import type { Token } from "@/types/index-fund";

const MIN_WEIGHT_BPS = 0;
const MAX_WEIGHT_BPS = 10_000;
const WEIGHT_STEP_BPS = 100;

interface ConstituentRowProps {
  token: Token;
  weightBps: number;
  protocolSubname: string;
  onWeightChange: (weightBps: number) => void;
  onRemove: () => void;
}

export const ConstituentRow = ({
  token,
  weightBps,
  protocolSubname,
  onWeightChange,
  onRemove,
}: ConstituentRowProps) => {
  const inputId = `weight-${token.symbol}`;

  return (
    <li className="flex items-center gap-4 border-t border-line px-5 py-4">
      <TokenIcon token={token} size="md" />

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{token.name}</span>
        <span className="block truncate font-mono text-xs text-ink-muted">
          {protocolSubname}
        </span>
      </span>

      <label htmlFor={inputId} className="sr-only">
        {`${token.name} weight`}
      </label>
      <input
        id={inputId}
        type="range"
        min={MIN_WEIGHT_BPS}
        max={MAX_WEIGHT_BPS}
        step={WEIGHT_STEP_BPS}
        value={weightBps}
        onChange={(event) => onWeightChange(Number(event.target.value))}
        className="hidden w-40 accent-accent sm:block"
      />

      <span className="w-16 text-right text-sm font-semibold tabular-nums text-ink">
        {formatWeight(weightBps)}
      </span>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-2 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-negative"
      >
        <TrashIcon size={16} aria-hidden />
        <span className="sr-only">{`Remove ${token.name}`}</span>
      </button>
    </li>
  );
};
