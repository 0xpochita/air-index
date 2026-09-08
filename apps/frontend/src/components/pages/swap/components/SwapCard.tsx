"use client";

import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { TokenStack } from "@/components/ui/TokenStack";
import { formatUsd } from "@/lib/format";
import { getQuoteAssets } from "@/lib/mock/quotes";
import type { IndexFund, SwapMode, TokenSymbol } from "@/types/index-fund";
import { useSwapForm } from "../hooks/useSwapForm";
import { AmountPanel } from "./AmountPanel";
import { AssetChip, AssetSelect } from "./AssetSelect";
import { ModeTabs } from "./ModeTabs";
import { SwapSummary } from "./SwapSummary";

const PAY_INPUT_ID = "swap-pay-amount";
const RECEIVE_OUTPUT_ID = "swap-receive-amount";

const MODE_PAY_LABEL: Record<SwapMode, string> = {
  deposit: "You pay",
  swap: "You swap",
  redeem: "You redeem",
};

const MODE_ACTION: Record<SwapMode, string> = {
  deposit: "Deposit",
  swap: "Swap",
  redeem: "Redeem",
};

interface ActionLabelOptions {
  mode: SwapMode;
  hasAmount: boolean;
  isOverBalance: boolean;
}

const resolveActionLabel = ({
  mode,
  hasAmount,
  isOverBalance,
}: ActionLabelOptions): string => {
  if (!hasAmount) {
    return "Enter amount";
  }
  if (isOverBalance) {
    return "Insufficient balance";
  }
  return MODE_ACTION[mode];
};

interface SwapCardProps {
  index: IndexFund;
  indexes: IndexFund[];
}

export const SwapCard = ({ index, indexes }: SwapCardProps) => {
  const quoteAssets = getQuoteAssets();
  const otherIndexes = indexes.filter((entry) => entry.slug !== index.slug);
  const [alternateSlug, setAlternateSlug] = useState(otherIndexes[0].slug);
  const alternateIndex =
    otherIndexes.find((entry) => entry.slug === alternateSlug) ??
    otherIndexes[0];

  const form = useSwapForm({ index, alternateIndex });
  const indexIcon = (
    <TokenStack constituents={index.constituents} size="sm" maxVisible={2} />
  );

  const quoteControl = (
    <AssetSelect
      icon={<TokenIcon token={form.quoteAsset.token} size="sm" />}
      label={form.quoteAsset.token.symbol.toUpperCase()}
      fieldLabel={
        form.mode === "redeem" ? "Asset to receive" : "Asset to pay with"
      }
      value={form.quoteAsset.token.symbol}
      options={quoteAssets.map((asset) => ({
        value: asset.token.symbol,
        label: asset.token.symbol.toUpperCase(),
      }))}
      onChange={(symbol: TokenSymbol) => {
        const nextAsset = quoteAssets.find(
          (asset) => asset.token.symbol === symbol,
        );
        if (nextAsset) {
          form.setQuoteAsset(nextAsset);
        }
      }}
    />
  );

  const indexChip = <AssetChip icon={indexIcon} label={form.indexSymbol} />;

  const alternateControl = (
    <AssetSelect
      icon={
        <TokenStack
          constituents={alternateIndex.constituents}
          size="sm"
          maxVisible={2}
        />
      }
      label={form.alternateSymbol}
      fieldLabel="Index to receive"
      value={alternateIndex.slug}
      options={otherIndexes.map((entry) => ({
        value: entry.slug,
        label: entry.name,
      }))}
      onChange={setAlternateSlug}
    />
  );

  const payControlByMode: Record<SwapMode, ReactNode> = {
    deposit: quoteControl,
    swap: indexChip,
    redeem: indexChip,
  };

  const receiveControlByMode: Record<SwapMode, ReactNode> = {
    deposit: indexChip,
    swap: alternateControl,
    redeem: quoteControl,
  };

  return (
    <div className="space-y-6">
      <ModeTabs mode={form.mode} onModeChange={form.changeMode} />

      <header className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-ink">
            {index.name}
          </h1>
          <p className="truncate font-mono text-xs text-ink-subtle">
            {index.ensName}
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-3">
          <span className="text-base font-semibold tabular-nums text-ink">
            {formatUsd(form.unitPriceUsd)}
          </span>
          <ReturnValue value={index.allTimeReturnPct} className="text-xs" />
        </div>
      </header>

      <div className="relative space-y-1">
        <AmountPanel
          label={MODE_PAY_LABEL[form.mode]}
          side={form.payment}
          assetControl={payControlByMode[form.mode]}
          inputId={PAY_INPUT_ID}
          value={form.amountInput}
          onValueChange={form.changeAmount}
          onMax={form.setMaxAmount}
        />
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-canvas/70 bg-surface/90 backdrop-blur-sm"
        >
          <ArrowDownIcon size={13} weight="bold" className="text-ink-muted" />
        </span>
        <AmountPanel
          label="You receive"
          side={form.receipt}
          assetControl={receiveControlByMode[form.mode]}
          inputId={RECEIVE_OUTPUT_ID}
        />
      </div>

      <SwapSummary
        route={form.route}
        onRouteChange={form.setRoute}
        paySymbol={form.payment.symbol}
        receiveSymbol={form.receipt.symbol}
        rate={form.previewRate}
      />

      <Button
        disabled={!form.hasAmount || form.isOverBalance}
        className="w-full py-3"
      >
        {resolveActionLabel({
          mode: form.mode,
          hasAmount: form.hasAmount,
          isOverBalance: form.isOverBalance,
        })}
      </Button>
    </div>
  );
};
