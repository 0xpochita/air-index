"use client";

import { ShuffleIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TokenStack } from "@/components/ui/TokenStack";
import { TxSuccessDialog } from "@/components/ui/TxSuccessDialog";
import { indexHref } from "@/config/navigation";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { formatWeight, truncateAddress } from "@/lib/format";
import { useCreateIndex } from "@/lib/onchain/useCreateIndex";
import { useWallet } from "@/lib/onchain/WalletProvider";
import { isDeployed, TOKENS } from "@/lib/tokens/registry";
import { TOKEN_SYMBOLS, type TokenSymbol } from "@/types/index-fund";
import { isSameSelection, matchTheme } from "../themes";
import { ConstituentRow } from "./ConstituentRow";
import { type StepDefinition, Stepper } from "./Stepper";
import { TokenPickerDialog } from "./TokenPickerDialog";

const TOTAL_WEIGHT_BPS = 10_000;
const SLUG_PATTERN = /[^a-z0-9-]/g;
const PLACEHOLDER_SLUG = "your-index";

interface Preset {
  name: string;
  description: string;
}

/**
 * Starting points, so the form opens with something to react to rather than
 * empty fields. No symbols here on purpose — the constituents come from these
 * words, the same way they would for a name you typed yourself.
 *
 * None of these names collide with an index that already exists, because a
 * slug that is taken cannot be registered.
 */
const PRESETS: Preset[] = [
  {
    name: "Blue Chip Majors",
    description:
      "The three largest assets by settlement volume, weighted evenly.",
  },
  {
    name: "Dollar Reserve",
    description:
      "Fully collateralised dollar stablecoins held for treasury parking.",
  },
  {
    name: "Lending Governance",
    description:
      "Governance tokens of the money markets that survived every cycle.",
  },
  {
    name: "Staked Ether Basket",
    description:
      "Protocols that tokenise staked ether and capture consensus yield.",
  },
  {
    name: "Rollup Natives",
    description: "Native tokens of the rollups that settle back to Ethereum.",
  },
  {
    name: "Compute Networks",
    description:
      "Decentralised inference, rendering and agent networks priced by usage.",
  },
  {
    name: "Data and Oracles",
    description:
      "Price feeds and interoperability networks that secure onchain settlement.",
  },
];

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus-visible:ring-2 focus-visible:ring-accent/40";
const LABEL_CLASS = "mb-1.5 block text-xs font-medium text-ink-subtle";

const STEPS: StepDefinition[] = [
  { id: "identity", label: "Identity" },
  { id: "constituents", label: "Constituents" },
  { id: "publish", label: "Publish" },
];

const toSlug = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, "-").replace(SLUG_PATTERN, "");

const buildEvenWeights = (symbols: TokenSymbol[]): Record<string, number> => {
  if (symbols.length === 0) {
    return {};
  }
  const share = Math.floor(TOTAL_WEIGHT_BPS / symbols.length / 100) * 100;
  const remainder = TOTAL_WEIGHT_BPS - share * symbols.length;
  return Object.fromEntries(
    symbols.map((symbol, position) => [
      symbol,
      position === 0 ? share + remainder : share,
    ]),
  );
};

export const IndexBuilderForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(PRESETS[0].name);
  const [description, setDescription] = useState(PRESETS[0].description);
  const [selectedSymbols, setSelectedSymbols] = useState<TokenSymbol[]>(
    () => matchTheme(PRESETS[0].description) ?? [],
  );
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    buildEvenWeights(matchTheme(PRESETS[0].description) ?? []),
  );
  /** Touch the token list once and the words stop overruling you. */
  const [isSelectionManual, setIsSelectionManual] = useState(false);
  const [isTransferable, setIsTransferable] = useState(true);
  const { address, hasProvider, isSepolia, connect, switchNetwork } =
    useWallet();
  const { publish, isPending, error, created, dismiss } = useCreateIndex();

  const slug = toSlug(name);
  const ensName = `${slug || PLACEHOLDER_SLUG}.${SITE.protocolRoot}`;

  const totalWeightBps = useMemo(
    () =>
      selectedSymbols.reduce(
        (total, symbol) => total + (weights[symbol] ?? 0),
        0,
      ),
    [selectedSymbols, weights],
  );

  /** A token with no Sepolia deployment would publish a weight and no address. */
  const availableSymbols = TOKEN_SYMBOLS.filter(
    (symbol) => !selectedSymbols.includes(symbol) && isDeployed(TOKENS[symbol]),
  );
  const isBalanced = totalWeightBps === TOTAL_WEIGHT_BPS;
  const hasIdentity = slug.length > 0;
  const hasConstituents = selectedSymbols.length > 0 && isBalanced;

  /** Each step gates the next, so the rail can never run ahead of the form. */
  const isStepValid = [hasIdentity, hasConstituents, true];
  const isReachable = (index: number) =>
    isStepValid.slice(0, index).every(Boolean);
  const isLast = step === STEPS.length - 1;
  const canAdvance = isStepValid[step];

  const publishLabel = (() => {
    if (!isLast) {
      return "Continue";
    }
    if (isPending) {
      return "Publishing…";
    }
    if (!hasProvider || !address) {
      return "Connect wallet";
    }
    if (!isSepolia) {
      return `Switch to ${SITE.network}`;
    }
    return "Publish index";
  })();

  const replaceSymbols = (nextSymbols: TokenSymbol[]) => {
    setSelectedSymbols(nextSymbols);
    setWeights(buildEvenWeights(nextSymbols));
  };

  const applyPreset = (preset: Preset) => {
    setName(preset.name);
    setDescription(preset.description);
    setIsSelectionManual(false);
  };

  const shuffle = () => {
    const others = PRESETS.filter((preset) => preset.name !== name);
    applyPreset(others[Math.floor(Math.random() * others.length)]);
  };

  /**
   * Randomised after mount, never during render: the server and the client
   * would pick different presets and React would discard the markup.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, on mount
  useEffect(() => {
    applyPreset(PRESETS[Math.floor(Math.random() * PRESETS.length)]);
  }, []);

  /** Derive the holdings from the words, until the words stop being the source. */
  // biome-ignore lint/correctness/useExhaustiveDependencies: selection is the output here, not an input
  useEffect(() => {
    if (isSelectionManual) {
      return;
    }

    const matched = matchTheme(`${name} ${description}`);

    if (matched && !isSameSelection(matched, selectedSymbols)) {
      replaceSymbols(matched);
    }
  }, [name, description, isSelectionManual]);

  const reset = () => {
    applyPreset(PRESETS[0]);
    setIsTransferable(true);
    setStep(0);
  };

  return (
    <form
      className="soft-shell rounded-[1.75rem] bg-surface p-6 sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        publish({
          slug,
          name,
          description,
          symbols: selectedSymbols,
          weights,
          transferable: isTransferable,
        });
      }}
    >
      <header className="flex items-center gap-3.5 border-b border-line pb-5">
        <Image
          src="/assets/logo-airindex.png"
          alt=""
          width={44}
          height={44}
          priority
          className="size-11 rounded-xl"
        />
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            Create an index
          </h1>
          <p className="text-sm text-ink-muted">
            Composition lives in the namespace, not a database.
          </p>
        </div>
      </header>

      <div className="py-6">
        <Stepper
          steps={STEPS}
          current={step}
          isReachable={isReachable}
          onSelect={setStep}
        />
      </div>

      {step === 0 ? (
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <label
                htmlFor="index-name"
                className="text-xs font-medium text-ink-subtle"
              >
                Index name
              </label>
              <button
                type="button"
                onClick={shuffle}
                className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors duration-150 ease-out hover:text-accent-hover"
              >
                <ShuffleIcon size={13} weight="bold" aria-hidden />
                Shuffle
              </button>
            </div>
            <input
              id="index-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="DeFi Blue Chips"
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label htmlFor="index-description" className={LABEL_CLASS}>
              Description
            </label>
            <textarea
              id="index-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What does this index track, and why?"
              className={FIELD_CLASS}
            />
          </div>
          <p className="rounded-xl bg-surface-subtle px-3.5 py-3 font-mono text-xs text-ink-muted">
            {ensName}
          </p>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-4 px-1">
            <p className="text-xs text-ink-subtle">
              {`${selectedSymbols.length} token${selectedSymbols.length === 1 ? "" : "s"}, each published as a subname`}
            </p>
            <p
              className={cn(
                "text-xs font-medium tabular-nums",
                isBalanced ? "text-positive" : "text-negative",
              )}
            >
              {`${formatWeight(totalWeightBps)} allocated`}
            </p>
          </div>

          {selectedSymbols.length > 0 ? (
            <ul className="space-y-2.5">
              {selectedSymbols.map((symbol) => (
                <ConstituentRow
                  key={symbol}
                  token={TOKENS[symbol]}
                  weightBps={weights[symbol] ?? 0}
                  protocolSubname={`${symbol}.${ensName}`}
                  onWeightChange={(weightBps) =>
                    setWeights((current) => ({
                      ...current,
                      [symbol]: weightBps,
                    }))
                  }
                  onRemove={() => {
                    setIsSelectionManual(true);
                    replaceSymbols(
                      selectedSymbols.filter((entry) => entry !== symbol),
                    );
                  }}
                />
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-line">
              <EmptyState
                title="No constituents"
                description="Add at least one token. Each becomes a subname under your index."
              />
            </div>
          )}

          <TokenPickerDialog
            availableSymbols={availableSymbols}
            onSelect={(symbol) => {
              setIsSelectionManual(true);
              replaceSymbols([...selectedSymbols, symbol]);
            }}
          />

          {!isBalanced ? (
            <p className="px-1 text-xs text-negative">
              Weights must total 100.00% to continue.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <label className="flex items-start gap-3 rounded-2xl border border-line p-4">
            <input
              type="checkbox"
              checked={isTransferable}
              onChange={(event) => setIsTransferable(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-accent"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">
                Transferable
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                Grants CAN_TRANSFER_ADMIN, which has no regular variant and
                cannot be added later. Leave it off and the index is soulbound
                for good.
              </span>
            </span>
          </label>

          <dl className="space-y-2.5 rounded-2xl bg-surface-subtle p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-subtle">Publishing as</dt>
              <dd className="truncate font-mono text-xs text-ink">{ensName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-subtle">Constituents</dt>
              <dd className="tabular-nums text-ink">
                {selectedSymbols.length}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-subtle">Allocated</dt>
              <dd className="tabular-nums text-positive">
                {formatWeight(totalWeightBps)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-subtle">Owner</dt>
              <dd className="font-mono text-xs text-ink">
                {address ? truncateAddress(address) : "Not connected"}
              </dd>
            </div>
          </dl>

          <p className="px-1 text-xs leading-relaxed text-ink-muted">
            One transaction: it deploys a resolver for this index alone,
            registers the name to you, and writes every record. Locking the
            methodology is a separate, irreversible step on the index page
            afterwards.
          </p>

          {error ? <p className="px-1 text-xs text-negative">{error}</p> : null}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-6">
        <button
          type="button"
          onClick={() => (step === 0 ? reset() : setStep(step - 1))}
          className="rounded-xl border border-line py-3 text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-surface-hover"
        >
          {step === 0 ? "Reset" : "Back"}
        </button>

        <button
          type={isLast && address && isSepolia ? "submit" : "button"}
          onClick={() => {
            if (!isLast) {
              setStep(step + 1);
              return;
            }
            if (!hasProvider || !address) {
              connect();
              return;
            }
            if (!isSepolia) {
              switchNetwork();
            }
          }}
          disabled={!canAdvance || isPending}
          className={cn(
            "rounded-xl py-3 text-sm font-semibold transition-colors duration-150 ease-out",
            canAdvance && !isPending
              ? "bg-ink text-ink-inverse hover:opacity-90"
              : "bg-surface-subtle text-ink-subtle",
          )}
        >
          {publishLabel}
        </button>
      </div>

      <TxSuccessDialog
        hash={created?.hash ?? null}
        title="Index published"
        icon={
          <TokenStack
            constituents={selectedSymbols.map((symbol) => ({
              token: TOKENS[symbol],
              weightBps: weights[symbol] ?? 0,
            }))}
            size="lg"
            maxVisible={4}
          />
        }
        ensName={created?.ensName ?? null}
        detail={`${selectedSymbols.length} constituents · ${formatWeight(totalWeightBps)} allocated`}
        onDismiss={() => {
          const slugToOpen = created?.slug;
          dismiss();
          if (slugToOpen) {
            router.push(indexHref(slugToOpen));
          }
        }}
      />
    </form>
  );
};
