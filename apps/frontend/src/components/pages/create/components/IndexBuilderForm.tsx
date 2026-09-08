"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SITE } from "@/config/site";
import { formatWeight } from "@/lib/format";
import { TOKENS } from "@/lib/mock/tokens";
import { TOKEN_SYMBOLS, type TokenSymbol } from "@/types/index-fund";
import { ConstituentRow } from "./ConstituentRow";

const TOTAL_WEIGHT_BPS = 10_000;
const DEFAULT_SYMBOLS: TokenSymbol[] = ["weth", "wbtc", "uni"];
const SLUG_PATTERN = /[^a-z0-9-]/g;

const FIELD_CLASS =
  "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle";
const LABEL_CLASS = "mb-1.5 block text-xs font-medium text-ink-subtle";

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

  const slug = toSlug(name);
  const ensName = slug
    ? `${slug}.${SITE.protocolRoot}`
    : `your-index.${SITE.protocolRoot}`;

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
  const canSubmit = slug.length > 0 && selectedSymbols.length > 0 && isBalanced;

  const addSymbol = (symbol: TokenSymbol) => {
    const nextSymbols = [...selectedSymbols, symbol];
    setSelectedSymbols(nextSymbols);
    setWeights(buildEvenWeights(nextSymbols));
  };

  const removeSymbol = (symbol: TokenSymbol) => {
    const nextSymbols = selectedSymbols.filter((entry) => entry !== symbol);
    setSelectedSymbols(nextSymbols);
    setWeights(buildEvenWeights(nextSymbols));
  };

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <Card>
        <CardHeader title="Identity" />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
          <div>
            <label htmlFor="index-name" className={LABEL_CLASS}>
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
            <span className={LABEL_CLASS}>ENS name</span>
            <p className="truncate rounded-md bg-surface-subtle px-3 py-2.5 font-mono text-sm text-ink-muted">
              {ensName}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="index-description" className={LABEL_CLASS}>
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
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="Constituents"
          action={
            <span
              className={
                isBalanced
                  ? "text-xs font-medium text-positive"
                  : "text-xs font-medium text-negative"
              }
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
                onWeightChange={(weightBps) =>
                  setWeights((current) => ({ ...current, [symbol]: weightBps }))
                }
                onRemove={() => removeSymbol(symbol)}
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
          <label htmlFor="add-token" className={LABEL_CLASS}>
            Add token
          </label>
          <div className="flex items-center gap-2">
            <select
              id="add-token"
              value=""
              onChange={(event) => addSymbol(event.target.value as TokenSymbol)}
              disabled={availableSymbols.length === 0}
              className={FIELD_CLASS}
            >
              <option value="" disabled>
                Select a token
              </option>
              {availableSymbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {TOKENS[symbol].name}
                </option>
              ))}
            </select>
            <PlusIcon
              size={18}
              aria-hidden
              className="shrink-0 text-ink-subtle"
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Methodology" />
        <div className="px-5 pb-5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={shouldLockMethodology}
              onChange={(event) =>
                setShouldLockMethodology(event.target.checked)
              }
              className="mt-0.5 size-4 accent-accent"
            />
            <span>
              <span className="block text-sm font-medium text-ink">
                Lock the methodology permanently
              </span>
              <span className="mt-1 block text-sm text-ink-muted">
                Revokes the contenthash, clear and upgrade roles on this index
                resolver. Nobody can rewrite the methodology afterwards,
                including you.
              </span>
            </span>
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {!isBalanced ? (
          <p className="text-sm text-negative">
            Weights must total 100.00% before publishing.
          </p>
        ) : null}
        <Button type="submit" disabled={!canSubmit}>
          Publish index
        </Button>
      </div>
    </form>
  );
};
