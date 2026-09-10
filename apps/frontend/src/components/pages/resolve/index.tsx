"use client";

import {
  ArrowSquareOutIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoftCard } from "@/components/ui/SoftCard";
import { PROTOCOL_ROOT } from "@/lib/ens/deployments";
import { type ResolvedName, resolveName } from "@/lib/ens/resolve";
import { truncateAddress } from "@/lib/format";

const EXPLORER_ADDRESS = "https://sepolia.etherscan.io/address/";

const SUGGESTIONS = [
  `big-five.${PROTOCOL_ROOT}`,
  `btc.big-five.${PROTOCOL_ROOT}`,
  `rebalancer.big-five.${PROTOCOL_ROOT}`,
  `bg5.${PROTOCOL_ROOT}`,
];

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 border-t border-line py-3 first:border-t-0">
    <dt className="shrink-0 font-mono text-xs text-ink-subtle">{label}</dt>
    <dd className="min-w-0 text-right">{children}</dd>
  </div>
);

const AddressLink = ({ address }: { address: `0x${string}` }) => (
  <a
    href={`${EXPLORER_ADDRESS}${address}`}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1.5 font-mono text-xs text-ink transition-colors duration-150 ease-out hover:text-accent"
  >
    {truncateAddress(address)}
    <ArrowSquareOutIcon size={11} aria-hidden />
  </a>
);

export const ResolvePage = () => {
  const [input, setInput] = useState(`btc.big-five.${PROTOCOL_ROOT}`);
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
          className="space-y-3"
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
              placeholder={`btc.big-five.${PROTOCOL_ROOT}`}
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

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setInput(suggestion);
                  lookup(suggestion);
                }}
                className="rounded-full bg-surface-subtle px-2.5 py-1 font-mono text-[11px] text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </form>
      </SoftCard>

      {error ? (
        <SoftCard>
          <p className="px-1 py-2 text-sm text-negative">{error}</p>
        </SoftCard>
      ) : null}

      {result ? (
        <>
          <SoftCard title="Records">
            <div className="px-1">
              {result.address || result.records.length > 0 ? (
                <dl>
                  {result.address ? (
                    <Row label="addr(60)">
                      <AddressLink address={result.address} />
                    </Row>
                  ) : null}
                  {result.records.map((record) => (
                    <Row key={record.key} label={`text("${record.key}")`}>
                      <span className="text-sm break-words text-ink">
                        {record.value}
                      </span>
                    </Row>
                  ))}
                </dl>
              ) : (
                <p className="py-6 text-center text-sm text-ink-muted">
                  Nothing resolves at this name.
                </p>
              )}
            </div>
          </SoftCard>

          <SoftCard title="How it resolved">
            <div className="px-1">
              <dl>
                <Row label="resolver">
                  {result.resolver ? (
                    <AddressLink address={result.resolver} />
                  ) : (
                    <span className="text-xs text-ink-muted">none found</span>
                  )}
                </Row>

                {result.registration?.kind === "entry" ? (
                  <Row label={`findOwner("${result.registration.label}")`}>
                    <AddressLink address={result.registration.owner} />
                  </Row>
                ) : null}

                {result.registration?.kind === "wildcard" ? (
                  <Row label="registry entry">
                    <span className="text-xs font-medium text-accent">
                      none — {result.registration.parent} lends no subregistry,
                      so &quot;{result.registration.label}&quot; cannot be
                      registered anywhere
                    </span>
                  </Row>
                ) : null}

                {result.registration?.kind === "unregistered" ? (
                  <Row label={`findOwner("${result.registration.label}")`}>
                    <span className="text-xs text-ink-muted">
                      0x0 — not registered
                    </span>
                  </Row>
                ) : null}

                <Row label="namehash">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-mono text-[11px] break-all text-ink-muted">
                      {result.namehash}
                    </span>
                    <CopyButton value={result.namehash} label="Copy namehash" />
                  </span>
                </Row>

                <Row label="dns-encoded">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-mono text-[11px] break-all text-ink-muted">
                      {result.dnsEncoded}
                    </span>
                    <CopyButton
                      value={result.dnsEncoded}
                      label="Copy DNS encoding"
                    />
                  </span>
                </Row>
              </dl>

              <p className="border-t border-line py-3 text-xs leading-relaxed text-ink-muted">
                Every value above came from{" "}
                <code className="font-mono">getEnsAddress</code> and{" "}
                <code className="font-mono">getEnsText</code> on a stock viem
                client — no ABI, no contract address, no configuration. The two
                encodings are here so the same call can be replayed against the
                Universal Resolver directly.
              </p>
            </div>
          </SoftCard>
        </>
      ) : null}
    </div>
  );
};
