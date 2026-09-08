"use client";

import { useMemo, useState } from "react";
import { SITE } from "@/config/site";
import { TOKEN_SYMBOLS, type TokenSymbol } from "@/types/index-fund";
import { ConstituentsCard } from "./ConstituentsCard";
import { CreateHero } from "./CreateHero";
import { IdentityCard } from "./IdentityCard";
import { PublishPanel } from "./PublishPanel";

const TOTAL_WEIGHT_BPS = 10_000;
const DEFAULT_SYMBOLS: TokenSymbol[] = ["weth", "wbtc", "uni"];
const SLUG_PATTERN = /[^a-z0-9-]/g;
const PLACEHOLDER_SLUG = "your-index";

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
  const canSubmit = slug.length > 0 && selectedSymbols.length > 0 && isBalanced;

  const replaceSymbols = (nextSymbols: TokenSymbol[]) => {
    setSelectedSymbols(nextSymbols);
    setWeights(buildEvenWeights(nextSymbols));
  };

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <CreateHero />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          <IdentityCard
            name={name}
            description={description}
            onNameChange={setName}
            onDescriptionChange={setDescription}
          />
          <ConstituentsCard
            selectedSymbols={selectedSymbols}
            weights={weights}
            ensName={ensName}
            totalWeightBps={totalWeightBps}
            isBalanced={isBalanced}
            availableSymbols={availableSymbols}
            onWeightChange={(symbol, weightBps) =>
              setWeights((current) => ({ ...current, [symbol]: weightBps }))
            }
            onRemove={(symbol) =>
              replaceSymbols(
                selectedSymbols.filter((entry) => entry !== symbol),
              )
            }
            onAdd={(symbol) => replaceSymbols([...selectedSymbols, symbol])}
          />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <PublishPanel
            ensName={ensName}
            constituentCount={selectedSymbols.length}
            totalWeightBps={totalWeightBps}
            isBalanced={isBalanced}
            canSubmit={canSubmit}
            shouldLockMethodology={shouldLockMethodology}
            onLockChange={setShouldLockMethodology}
          />
        </div>
      </div>
    </form>
  );
};
