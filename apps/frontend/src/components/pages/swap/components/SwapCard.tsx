"use client";

import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { TokenStack } from "@/components/ui/TokenStack";
import { TxSuccessDialog } from "@/components/ui/TxSuccessDialog";
import { SITE } from "@/config/site";
import { formatAmount, formatUsd } from "@/lib/format";
import { usePortfolio } from "@/lib/onchain/PortfolioProvider";
import { useVaultActions } from "@/lib/onchain/useVaultActions";
import type { LiveIndex } from "@/lib/onchain/vaults";
import { useWallet } from "@/lib/onchain/WalletProvider";
import type { SwapMode } from "@/types/index-fund";
import { useSwapForm } from "../hooks/useSwapForm";
import { AmountPanel } from "./AmountPanel";
import { AssetChip, AssetSelect } from "./AssetSelect";
import { ModeTabs } from "./ModeTabs";
import { SwapSummary } from "./SwapSummary";

const PAY_INPUT_ID = "swap-pay-amount";
const RECEIVE_OUTPUT_ID = "swap-receive-amount";

const SUCCESS_TITLE: Record<string, string> = {
  deposit: "Deposit confirmed",
  redeem: "Redemption confirmed",
  swap: "Swap confirmed",
  faucet: "Test tokens minted",
};

const ensLabel = (name: string) => (
  <span className="font-mono text-[13px] tracking-tight">{name}</span>
);

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

interface SwapCardProps {
  live: LiveIndex;
  liveIndexes: LiveIndex[];
}

export const SwapCard = ({ live, liveIndexes }: SwapCardProps) => {
  const { address, hasProvider, isSepolia, connect, switchNetwork } =
    useWallet();
  const { isLoading } = usePortfolio();
  const actions = useVaultActions();

  const others = liveIndexes.filter((entry) => entry.slug !== live.slug);
  const [alternateSlug, setAlternateSlug] = useState(others[0]?.slug ?? "");
  const [receiptSummary, setReceiptSummary] = useState<string | null>(null);
  const alternate =
    others.find((entry) => entry.slug === alternateSlug) ?? others[0];

  const form = useSwapForm({ live, alternate });
  const indexIcon = (
    <TokenStack
      constituents={live.fund.constituents}
      size="sm"
      maxVisible={2}
    />
  );

  const quoteChip = (
    <AssetChip
      icon={<TokenIcon token={form.quote} size="sm" />}
      label={form.quoteSymbol}
    />
  );
  /**
   * The name is the product, so the chip carries it rather than the ticker.
   * Tickers stay in the rate line and the balance row, where a long name would
   * push the numbers off screen.
   */
  const indexChip = (
    <AssetChip icon={indexIcon} label={ensLabel(live.ensName)} />
  );

  const alternateControl = alternate ? (
    <AssetSelect
      icon={
        <TokenStack
          constituents={alternate.fund.constituents}
          size="sm"
          maxVisible={2}
        />
      }
      label={ensLabel(alternate.ensName)}
      fieldLabel="Index to receive"
      value={alternate.slug}
      options={others.map((entry) => ({
        value: entry.slug,
        label: entry.fund.name,
      }))}
      onChange={setAlternateSlug}
    />
  ) : (
    <AssetChip icon={indexIcon} label="—" />
  );

  const payControlByMode: Record<SwapMode, ReactNode> = {
    deposit: quoteChip,
    swap: indexChip,
    redeem: indexChip,
  };

  const receiveControlByMode: Record<SwapMode, ReactNode> = {
    deposit: indexChip,
    swap: alternateControl,
    redeem: quoteChip,
  };

  const submit = () => {
    if (!live.vault) {
      return;
    }

    /**
     * Captured on click rather than read when the dialog renders, so editing
     * the field while a transaction is in flight cannot rewrite the receipt.
     */
    setReceiptSummary(
      `${formatAmount(form.payment.amount)} ${form.payment.symbol} → ${formatAmount(form.receipt.amount)} ${form.receipt.symbol}`,
    );

    if (form.mode === "deposit") {
      actions.deposit(live.vault, form.payAmountWei);
      return;
    }

    if (form.mode === "redeem") {
      actions.redeem(live.vault, form.payAmountWei);
      return;
    }

    if (alternate?.vault) {
      actions.swap(live.vault, alternate.vault, form.payAmountWei);
    }
  };

  const isBusy = actions.pending !== null;

  const primary = (() => {
    if (!hasProvider || !address) {
      return { label: "Connect wallet", onClick: connect, disabled: false };
    }
    if (!isSepolia) {
      return {
        label: `Switch to ${SITE.network}`,
        onClick: switchNetwork,
        disabled: false,
      };
    }
    if (isBusy) {
      return { label: `${actions.pending}…`, onClick: submit, disabled: true };
    }
    if (!form.hasAmount) {
      return { label: "Enter amount", onClick: submit, disabled: true };
    }
    if (form.isOverBalance) {
      return { label: "Insufficient balance", onClick: submit, disabled: true };
    }
    if (form.mode === "swap" && !alternate?.vault) {
      return { label: "No other index live", onClick: submit, disabled: true };
    }
    return { label: MODE_ACTION[form.mode], onClick: submit, disabled: false };
  })();

  return (
    <div className="space-y-6">
      <ModeTabs mode={form.mode} onModeChange={form.changeMode} />

      <header className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-ink">
            {live.fund.name}
          </h1>
          <p className="truncate font-mono text-xs text-ink-subtle">
            {live.ensName}
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-3">
          <span className="text-base font-semibold tabular-nums text-ink">
            {formatUsd(form.unitPriceUsd)}
          </span>
          <ReturnValue value={live.fund.allTimeReturnPct} className="text-xs" />
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
        paySymbol={form.payment.symbol}
        receiveSymbol={form.receipt.symbol}
        rate={form.previewRate}
        unitPriceUsd={form.unitPriceUsd}
        vault={live.vault}
      />

      <div className="space-y-3">
        <Button
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="w-full py-3"
        >
          {primary.label}
        </Button>

        {address && isSepolia ? (
          <div className="flex items-center justify-between gap-4 text-xs">
            <button
              type="button"
              onClick={() => {
                setReceiptSummary(`1,000 ${form.quoteSymbol}`);
                actions.faucet(form.quote.address);
              }}
              disabled={isBusy}
              className="font-medium text-accent transition-colors duration-150 ease-out hover:text-accent-hover disabled:opacity-60"
            >
              {`Get 1,000 test ${form.quoteSymbol}`}
            </button>
            {isLoading ? (
              <span className="text-ink-subtle">Reading balances…</span>
            ) : null}
          </div>
        ) : null}

        {actions.error ? (
          <p className="text-xs text-negative">{actions.error}</p>
        ) : null}
      </div>

      <TxSuccessDialog
        hash={actions.last?.hash ?? null}
        title={
          SUCCESS_TITLE[actions.last?.label ?? ""] ?? "Transaction confirmed"
        }
        detail={receiptSummary}
        onDismiss={actions.dismiss}
      />
    </div>
  );
};
