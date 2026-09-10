"use client";

import {
  IdentificationCardIcon,
  LockSimpleIcon,
  StackSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { formatWeight } from "@/lib/format";
import { TOKENS } from "@/lib/mock/tokens";
import { TOKEN_SYMBOLS, type TokenSymbol } from "@/types/index-fund";
import { ConstituentRow } from "./ConstituentRow";
import { type SectionStatus, SetupSection } from "./SetupSection";
import { TokenPickerDialog } from "./TokenPickerDialog";

const TOTAL_WEIGHT_BPS = 10_000;
const DEFAULT_SYMBOLS: TokenSymbol[] = ["weth", "wbtc", "uni"];
const SLUG_PATTERN = /[^a-z0-9-]/g;
const PLACEHOLDER_SLUG = "your-index";

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus-visible:ring-2 focus-visible:ring-accent/40";

type SectionId = "identity" | "constituents" | "publish";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSymbols, setSelectedSymbols] =
    useState<TokenSymbol[]>(DEFAULT_SYMBOLS);
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    buildEvenWeights(DEFAULT_SYMBOLS),
  );
  const [shouldLockMethodology, setShouldLockMethodology] = useState(true);
  const [openSection, setOpenSection] = useState<SectionId | null>("identity");

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

  const availableSymbols = TOKEN_SYMBOLS.filter(
    (symbol) => !selectedSymbols.includes(symbol),
  );
  const isBalanced = totalWeightBps === TOTAL_WEIGHT_BPS;
  const hasIdentity = slug.length > 0;
  const hasConstituents = selectedSymbols.length > 0 && isBalanced;
  const canSubmit = hasIdentity && hasConstituents;

  const replaceSymbols = (nextSymbols: TokenSymbol[]) => {
    setSelectedSymbols(nextSymbols);
    setWeights(buildEvenWeights(nextSymbols));
  };

  const toggle = (id: SectionId) =>
    setOpenSection((current) => (current === id ? null : id));

  /** Open beats done: a section you are filling in should not read as finished. */
  const statusOf = (id: SectionId, isDone: boolean): SectionStatus => {
    if (openSection === id) {
      return "in-progress";
    }
    return isDone ? "complete" : "incomplete";
  };

  return (
    <form
      className="soft-shell rounded-[1.75rem] bg-surface p-6 sm:p-7"
      onSubmit={(event) => event.preventDefault()}
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

      <div className="mt-5 space-y-5">
        <SetupSection
          icon={IdentificationCardIcon}
          title="Identity"
          description={
            hasIdentity ? ensName : "Name it, and it becomes an ENS name."
          }
          status={statusOf("identity", hasIdentity)}
          isOpen={openSection === "identity"}
          onToggle={() => toggle("identity")}
        >
          <div className="space-y-4 rounded-2xl border border-line p-4">
            <div>
              <label
                htmlFor="index-name"
                className="mb-1.5 block text-xs font-medium text-ink-subtle"
              >
                Index name
              </label>
              <input
                id="index-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="DeFi Blue Chips"
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label
                htmlFor="index-description"
                className="mb-1.5 block text-xs font-medium text-ink-subtle"
              >
                Description
              </label>
              <textarea
                id="index-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="What does this index track, and why?"
                className={FIELD_CLASS}
              />
            </div>
            <p className="font-mono text-xs text-ink-subtle">{ensName}</p>
          </div>
        </SetupSection>

        <SetupSection
          icon={StackSimpleIcon}
          title="Constituents"
          description={`${selectedSymbols.length} token${selectedSymbols.length === 1 ? "" : "s"} · ${formatWeight(totalWeightBps)} allocated`}
          status={statusOf("constituents", hasConstituents)}
          isOpen={openSection === "constituents"}
          onToggle={() => toggle("constituents")}
        >
          <div className="space-y-2.5 rounded-2xl border border-line p-4">
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
                    onRemove={() =>
                      replaceSymbols(
                        selectedSymbols.filter((entry) => entry !== symbol),
                      )
                    }
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No constituents"
                description="Add at least one token. Each becomes a subname under your index."
              />
            )}

            <TokenPickerDialog
              availableSymbols={availableSymbols}
              onSelect={(symbol) =>
                replaceSymbols([...selectedSymbols, symbol])
              }
            />

            {!isBalanced ? (
              <p className="text-xs text-negative">
                Weights must total 100.00% to publish.
              </p>
            ) : null}
          </div>
        </SetupSection>

        <SetupSection
          icon={LockSimpleIcon}
          title="Methodology"
          description={
            shouldLockMethodology
              ? "Locked at publication, permanently."
              : "Editable after publication."
          }
          status={statusOf("publish", true)}
          isOpen={openSection === "publish"}
          onToggle={() => toggle("publish")}
        >
          <label className="flex items-start gap-3 rounded-2xl border border-line p-4">
            <input
              type="checkbox"
              checked={shouldLockMethodology}
              onChange={(event) =>
                setShouldLockMethodology(event.target.checked)
              }
              className="mt-0.5 size-4 shrink-0 accent-accent"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">
                Lock methodology
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                Revokes the contenthash, clear and upgrade roles. Nobody can
                rewrite it afterwards, including you.
              </span>
            </span>
          </label>
        </SetupSection>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setName("");
            setDescription("");
            replaceSymbols(DEFAULT_SYMBOLS);
            setOpenSection("identity");
          }}
          className="rounded-xl border border-line py-3 text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-surface-hover"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "rounded-xl py-3 text-sm font-semibold transition-colors duration-150 ease-out",
            canSubmit
              ? "bg-ink text-ink-inverse hover:opacity-90"
              : "bg-surface-subtle text-ink-subtle",
          )}
        >
          Publish index
        </button>
      </div>
    </form>
  );
};
