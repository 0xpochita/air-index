"use client";

import type { ReactNode } from "react";
import { formatAmount, formatUsd } from "@/lib/format";
import type { SwapSide } from "../hooks/useSwapForm";

interface AmountPanelProps {
  label: string;
  side: SwapSide;
  assetControl: ReactNode;
  inputId?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onMax?: () => void;
}

export const AmountPanel = ({
  label,
  side,
  assetControl,
  inputId,
  value,
  onValueChange,
  onMax,
}: AmountPanelProps) => {
  const isEditable = onValueChange !== undefined && inputId !== undefined;

  return (
    <div className="rounded-lg bg-surface-subtle px-4 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {isEditable ? (
          <label htmlFor={inputId} className="text-xs text-ink-subtle">
            {label}
          </label>
        ) : (
          <span className="text-xs text-ink-subtle">{label}</span>
        )}

        <span className="flex items-center gap-2 text-xs text-ink-subtle">
          <span className="tabular-nums">
            {`${formatAmount(side.balance)} ${side.symbol}`}
          </span>
          {onMax ? (
            <button
              type="button"
              onClick={onMax}
              className="font-semibold text-accent transition-colors duration-150 ease-out hover:text-accent-hover"
            >
              Max
            </button>
          ) : null}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-4">
        {isEditable ? (
          <input
            id={inputId}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            className="w-full min-w-0 bg-transparent text-2xl font-medium tabular-nums text-ink outline-none placeholder:text-ink-subtle"
          />
        ) : (
          <output
            htmlFor={inputId}
            className="w-full min-w-0 truncate text-2xl font-medium tabular-nums text-ink"
          >
            {side.amount > 0 ? formatAmount(side.amount) : "0"}
          </output>
        )}
        {assetControl}
      </div>

      <p className="mt-0.5 text-xs tabular-nums text-ink-subtle">
        {formatUsd(side.valueUsd)}
      </p>
    </div>
  );
};
