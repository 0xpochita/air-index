"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { ResolveResult } from "@/components/ens/ResolveResult";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { PROTOCOL_ROOT } from "@/lib/ens/deployments";
import { type ResolvedName, resolveName } from "@/lib/ens/resolve";

export const ResolvePage = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ResolvedName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const lookup = async (value: string) => {
    setIsPending(true);
    setError(null);

    try {
      setResult(await resolveName(value));
    } catch (cause) {
      setResult(null);
      setError(
        cause instanceof Error ? cause.message : "Could not resolve that name.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Resolve a name"
        description="Anything under airindex.eth, read through the Universal Resolver with no configuration."
      />

      <SoftCard>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            lookup(input);
          }}
        >
          <div className="flex gap-2">
            <label htmlFor="ens-name" className="sr-only">
              ENS name
            </label>
            <input
              id="ens-name"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              placeholder={`name.${PROTOCOL_ROOT}`}
              className="soft-inset w-full min-w-0 rounded-xl bg-surface-subtle px-3.5 py-3 font-mono text-sm text-ink outline-none placeholder:text-ink-subtle focus-visible:ring-2 focus-visible:ring-accent/40"
            />
            <button
              type="submit"
              disabled={isPending}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-50"
            >
              <MagnifyingGlassIcon size={15} weight="bold" aria-hidden />
              {isPending ? "Reading…" : "Resolve"}
            </button>
          </div>
        </form>
      </SoftCard>

      {error ? (
        <SoftCard>
          <p className="px-1 py-2 text-sm text-negative">{error}</p>
        </SoftCard>
      ) : null}

      {result ? (
        <SoftCard>
          <div className="px-1 pb-1">
            <ResolveResult result={result} />
          </div>
        </SoftCard>
      ) : null}
    </div>
  );
};
