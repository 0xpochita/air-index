"use client";

import { LockSimpleIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { permissionedResolverAbi } from "@/lib/ens/abis/PermissionedResolver";
import { ensClient } from "@/lib/ens/client";
import { METHODOLOGY_LOCK_BITMAP } from "@/lib/ens/roles";
import { useWallet } from "@/lib/onchain/WalletProvider";

interface LockMethodologyButtonProps {
  resolver: `0x${string}`;
  owner: `0x${string}`;
}

/**
 * Burns the roles that would let the methodology be rewritten. There is no
 * matching grant: once these are gone the resolver cannot get them back, and
 * neither can we.
 */
export const LockMethodologyButton = ({
  resolver,
  owner,
}: LockMethodologyButtonProps) => {
  const { address, isSepolia, getWalletClient, refresh, switchNetwork } =
    useWallet();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = address?.toLowerCase() === owner.toLowerCase();

  if (!isOwner) {
    return <span className="text-xs text-ink-muted">Editable</span>;
  }

  const lock = async () => {
    if (!isSepolia) {
      await switchNetwork();
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const hash = await getWalletClient().writeContract({
        address: resolver,
        abi: permissionedResolverAbi,
        functionName: "revokeRootRoles",
        args: [METHODOLOGY_LOCK_BITMAP, address as `0x${string}`],
      });
      await ensClient.waitForTransactionReceipt({ hash });
      setIsConfirming(false);
      refresh();
      /** The panel reads its lock state on the server, so the page has to refetch. */
      globalThis.location.reload();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message.split("\n")[0] : "Lock failed",
      );
    } finally {
      setIsPending(false);
    }
  };

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90"
      >
        <LockSimpleIcon size={12} weight="fill" aria-hidden />
        Lock it
      </button>
    );
  }

  return (
    <span className="flex flex-col items-end gap-1.5">
      <span className="flex items-center gap-1.5 text-xs text-negative">
        <WarningIcon size={12} weight="fill" aria-hidden />
        Cannot be undone
      </span>
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
          className="rounded-full px-2 py-1 text-xs text-ink-muted transition-colors duration-150 ease-out hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={lock}
          disabled={isPending}
          className="rounded-full bg-negative px-2.5 py-1 text-xs font-semibold text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Locking…" : "Lock forever"}
        </button>
      </span>
      {error ? (
        <span className="text-[11px] text-negative">{error}</span>
      ) : null}
    </span>
  );
};
