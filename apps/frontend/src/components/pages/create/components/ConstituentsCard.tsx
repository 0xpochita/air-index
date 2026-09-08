"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { formatWeight } from "@/lib/format";
import { TOKENS } from "@/lib/mock/tokens";
import type { TokenSymbol } from "@/types/index-fund";
import { ConstituentRow } from "./ConstituentRow";
import { TokenPickerDialog } from "./TokenPickerDialog";

interface ConstituentsCardProps {
  selectedSymbols: TokenSymbol[];
  weights: Record<string, number>;
  ensName: string;
  totalWeightBps: number;
  isBalanced: boolean;
  availableSymbols: readonly TokenSymbol[];
  onWeightChange: (symbol: TokenSymbol, weightBps: number) => void;
  onRemove: (symbol: TokenSymbol) => void;
  onAdd: (symbol: TokenSymbol) => void;
}

export const ConstituentsCard = ({
  selectedSymbols,
  weights,
  ensName,
  totalWeightBps,
  isBalanced,
  availableSymbols,
  onWeightChange,
  onRemove,
  onAdd,
}: ConstituentsCardProps) => (
  <Card className="overflow-hidden">
    <CardHeader
      title="Constituents"
      action={
        <span
          className={cn(
            "text-xs font-medium tabular-nums",
            isBalanced ? "text-positive" : "text-negative",
          )}
        >
          {`${formatWeight(totalWeightBps)} allocated`}
        </span>
      }
    />
    {selectedSymbols.length > 0 ? (
      <ul>
        {selectedSymbols.map((symbol) => (
          <ConstituentRow
            key={symbol}
            token={TOKENS[symbol]}
            weightBps={weights[symbol] ?? 0}
            protocolSubname={`${symbol}.${ensName}`}
            onWeightChange={(weightBps) => onWeightChange(symbol, weightBps)}
            onRemove={() => onRemove(symbol)}
          />
        ))}
      </ul>
    ) : (
      <EmptyState
        title="No constituents"
        description="Add at least one token. Each becomes a subname under your index."
      />
    )}

    <div className="border-t border-line px-5 py-4">
      <TokenPickerDialog availableSymbols={availableSymbols} onSelect={onAdd} />
    </div>
  </Card>
);
