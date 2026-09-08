"use client";

import { cn } from "@/lib/cn";
import { SWAP_MODES, type SwapMode } from "@/types/index-fund";

const MODE_LABEL: Record<SwapMode, string> = {
  deposit: "Deposit",
  swap: "Swap",
  redeem: "Redeem",
};

interface ModeTabsProps {
  mode: SwapMode;
  onModeChange: (mode: SwapMode) => void;
}

export const ModeTabs = ({ mode, onModeChange }: ModeTabsProps) => (
  <div
    role="tablist"
    aria-label="Swap mode"
    className="flex gap-6 border-b border-line"
  >
    {SWAP_MODES.map((value) => (
      <button
        key={value}
        type="button"
        role="tab"
        aria-selected={mode === value}
        onClick={() => onModeChange(value)}
        className={cn(
          "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors duration-150 ease-out",
          mode === value
            ? "border-ink text-ink"
            : "border-transparent text-ink-subtle hover:text-ink",
        )}
      >
        {MODE_LABEL[value]}
      </button>
    ))}
  </div>
);
