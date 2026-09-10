"use client";

import { ArrowsDownUpIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { TokenStack } from "@/components/ui/TokenStack";
import { TxSuccessDialog } from "@/components/ui/TxSuccessDialog";
import { SITE } from "@/config/site";
import { formatAmount, formatUsd } from "@/lib/format";
import { usePortfolio } from "@/lib/onchain/PortfolioProvider";
import { useVaultActions } from "@/lib/onchain/useVaultActions";
import type { LiveIndex } from "@/lib/onchain/vaults";
import { useWallet } from "@/lib/onchain/WalletProvider";
import type { SwapMode, Token } from "@/types/index-fund";
import { useSwapForm } from "../hooks/useSwapForm";
import { AmountPanel } from "./AmountPanel";
import { AssetChip, AssetSelect } from "./AssetSelect";
import { ModeTabs } from "./ModeTabs";
import { SwapConfirmDialog } from "./SwapConfirmDialog";
import { SwapSummary } from "./SwapSummary";

const PAY_INPUT_ID = "swap-pay-amount";
const RECEIVE_OUTPUT_ID = "swap-receive-amount";

const MODE_PAY_LABEL: Record<SwapMode, string> = {
  deposit: "Pay",
  swap: "Swap",
  redeem: "Redeem",
};

const MODE_ACTION: Record<SwapMode, string> = {
  deposit: "Deposit",
  swap: "Swap",
  redeem: "Redeem",
};

const CONFIRM_TITLE: Record<SwapMode, string> = {
  deposit: "Confirm deposit",
  swap: "Confirm swap",
  redeem: "Confirm redemption",
};

const SUCCESS_TITLE: Record<string, string> = {
  deposit: "Deposit confirmed",
  redeem: "Redemption confirmed",
  swap: "Swap confirmed",
  faucet: "Test tokens minted",
};

const ensLabel = (name: string) => (
  <span className="font-mono text-[13px] font-medium">{name}</span>
);

interface Leg {
  amount: number;
  symbol: string;
  valueUsd: number;
}

/**
 * A snapshot of the trade, taken when the confirm dialog opens. The form behind
 * the dialog stays mounted, so reading it at confirm time would let a late edit
 * change what the user agreed to.
 */
interface Pending {
  mode: SwapMode;
  amountWei: bigint;
  pay: Leg;
  receive: Leg;
  target: LiveIndex;
  vault: `0x${string}`;
  targetVault: `0x${string}`;
  unitPriceUsd: number;
}

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
  const alternate =
    others.find((entry) => entry.slug === alternateSlug) ?? others[0];

  const [pending, setPending] = useState<Pending | null>(null);
  const [faucetToken, setFaucetToken] = useState<Token | null>(null);

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

  const openConfirm = () => {
    if (!live.vault) {
      return;
    }

    const target = form.mode === "swap" && alternate ? alternate : live;

    setPending({
      mode: form.mode,
      amountWei: form.payAmountWei,
      pay: {
        amount: form.payment.amount,
        symbol: form.payment.symbol,
        valueUsd: form.payment.valueUsd,
      },
      receive: {
        amount: form.receipt.amount,
        symbol: form.receipt.symbol,
        valueUsd: form.receipt.valueUsd,
      },
      target,
      vault: live.vault,
      targetVault: target.vault ?? live.vault,
      unitPriceUsd: form.unitPriceUsd,
    });
  };

  const runPending = () => {
    if (!pending) {
      return;
    }

    if (pending.mode === "deposit") {
      actions.deposit(pending.vault, pending.amountWei);
      return;
    }

    if (pending.mode === "redeem") {
      actions.redeem(pending.vault, pending.amountWei);
      return;
    }

    actions.swap(pending.vault, pending.targetVault, pending.amountWei);
  };

  const isBusy = actions.pending !== null;
  /** Deposit and redeem are the same trade in opposite directions; swap is not. */
  const canFlip = form.mode !== "swap";

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
      return {
        label: `${actions.pending}…`,
        onClick: openConfirm,
        disabled: true,
      };
    }
    if (!form.hasAmount) {
      return { label: "Enter amount", onClick: openConfirm, disabled: true };
    }
    if (form.isOverBalance) {
      return {
        label: "Insufficient balance",
        onClick: openConfirm,
        disabled: true,
      };
    }
    if (form.mode === "swap" && !alternate?.vault) {
      return {
        label: "No other index live",
        onClick: openConfirm,
        disabled: true,
      };
    }
    return {
      label: MODE_ACTION[form.mode],
      onClick: openConfirm,
      disabled: false,
    };
  })();

  const isFaucetReceipt = actions.last?.label === "faucet";

  return (
    <div className="space-y-5">
      <ModeTabs mode={form.mode} onModeChange={form.changeMode} />

      <header className="flex items-center justify-between gap-4 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <TokenStack
            constituents={live.fund.constituents}
            size="md"
            maxVisible={3}
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-ink">
              {live.fund.name}
            </h1>
            <p className="truncate font-mono text-xs text-ink-subtle">
              {live.ensName}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-base font-semibold tabular-nums text-ink">
          {formatUsd(form.unitPriceUsd)}
        </span>
      </header>

      <div className="relative space-y-2">
        <AmountPanel
          label={MODE_PAY_LABEL[form.mode]}
          side={form.payment}
          assetControl={payControlByMode[form.mode]}
          inputId={PAY_INPUT_ID}
          value={form.amountInput}
          onValueChange={form.changeAmount}
          onMax={form.setMaxAmount}
        />

        <span className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          {canFlip ? (
            <button
              type="button"
              onClick={() =>
                form.changeMode(form.mode === "deposit" ? "redeem" : "deposit")
              }
              title="Reverse direction"
              className="flex size-10 items-center justify-center rounded-full border-4 border-surface-subtle bg-surface text-ink-muted shadow-raised transition-colors duration-150 ease-out hover:text-ink"
            >
              <ArrowsDownUpIcon size={15} weight="bold" aria-hidden />
              <span className="sr-only">Reverse direction</span>
            </button>
          ) : (
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-full border-4 border-surface-subtle bg-surface text-ink-subtle shadow-raised"
            >
              <ArrowsDownUpIcon size={15} weight="bold" />
            </span>
          )}
        </span>

        <AmountPanel
          label="Receive"
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
        <button
          type="button"
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="cta-gradient w-full rounded-full py-3.5 text-sm font-semibold text-ink-inverse disabled:opacity-45"
        >
          {primary.label}
        </button>

        {address && isSepolia ? (
          <div className="flex items-center justify-between gap-4 px-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setFaucetToken(form.quote);
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

        {actions.error && pending === null ? (
          <p className="px-1 text-xs text-negative">{actions.error}</p>
        ) : null}
      </div>

      {pending ? (
        <SwapConfirmDialog
          isOpen={actions.last === null}
          title={CONFIRM_TITLE[pending.mode]}
          confirmLabel={MODE_ACTION[pending.mode]}
          pay={{
            ...pending.pay,
            icon:
              pending.mode === "deposit" ? (
                <TokenIcon token={form.quote} size="lg" />
              ) : (
                <TokenStack
                  constituents={live.fund.constituents}
                  size="md"
                  maxVisible={3}
                />
              ),
          }}
          receive={{
            ...pending.receive,
            icon:
              pending.mode === "redeem" ? (
                <TokenIcon token={form.quote} size="lg" />
              ) : (
                <TokenStack
                  constituents={pending.target.fund.constituents}
                  size="md"
                  maxVisible={3}
                />
              ),
          }}
          index={{
            name: pending.target.fund.name,
            ensName: pending.target.ensName,
            icon: (
              <TokenStack
                constituents={pending.target.fund.constituents}
                size="md"
                maxVisible={3}
              />
            ),
          }}
          unitPriceUsd={pending.unitPriceUsd}
          vault={pending.targetVault}
          isPending={isBusy}
          error={actions.error}
          onConfirm={runPending}
          onClose={() => setPending(null)}
        />
      ) : null}

      <TxSuccessDialog
        hash={actions.last?.hash ?? null}
        title={
          SUCCESS_TITLE[actions.last?.label ?? ""] ?? "Transaction confirmed"
        }
        icon={
          isFaucetReceipt && faucetToken ? (
            <TokenIcon token={faucetToken} size="lg" />
          ) : (
            <TokenStack
              constituents={pending?.target.fund.constituents ?? []}
              size="lg"
              maxVisible={4}
            />
          )
        }
        ensName={isFaucetReceipt ? null : (pending?.target.ensName ?? null)}
        detail={
          isFaucetReceipt && faucetToken
            ? `1,000 m${faucetToken.symbol.toUpperCase()}`
            : pending
              ? `${formatAmount(pending.pay.amount)} ${pending.pay.symbol} → ${formatAmount(pending.receive.amount)} ${pending.receive.symbol}`
              : null
        }
        onDismiss={() => {
          actions.dismiss();
          setPending(null);
        }}
      />
    </div>
  );
};
