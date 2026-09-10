"use client";

import { useCallback, useState } from "react";
import { erc20Abi, maxUint256 } from "viem";
import { ensClient } from "@/lib/ens/client";
import { SETTLEMENT_SYMBOL } from "@/lib/mock/quotes";
import { TOKENS } from "@/lib/mock/tokens";
import { indexVaultAbi, mockErc20Abi } from "./abis";
import { useWallet } from "./WalletProvider";

const toMessage = (error: unknown): string => {
  if (error instanceof Error) {
    /** Wallet rejections arrive with a whole stack appended. Keep the first line. */
    return error.message.split("\n")[0];
  }
  return "Transaction failed";
};

export const useVaultActions = () => {
  const { address, isSepolia, getWalletClient, refresh, switchNetwork } =
    useWallet();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<`0x${string}` | null>(null);

  const send = useCallback(
    async (label: string, action: () => Promise<`0x${string}`>) => {
      if (!address) {
        setError("Connect a wallet first.");
        return null;
      }

      if (!isSepolia) {
        await switchNetwork();
        return null;
      }

      setPending(label);
      setError(null);

      try {
        const hash = await action();
        await ensClient.waitForTransactionReceipt({ hash });
        setLastHash(hash);
        refresh();
        return hash;
      } catch (cause) {
        setError(toMessage(cause));
        return null;
      } finally {
        setPending(null);
      }
    },
    [address, isSepolia, refresh, switchNetwork],
  );

  /** Approves only when the existing allowance is short, so repeat deposits are one transaction. */
  const ensureAllowance = useCallback(
    async (spender: `0x${string}`, amount: bigint) => {
      const token = TOKENS[SETTLEMENT_SYMBOL];
      const owner = address as `0x${string}`;

      const allowance = await ensClient.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, spender],
      });

      if (allowance >= amount) {
        return;
      }

      const client = getWalletClient();
      const hash = await client.writeContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, maxUint256],
      });
      await ensClient.waitForTransactionReceipt({ hash });
    },
    [address, getWalletClient],
  );

  const deposit = useCallback(
    (vault: `0x${string}`, quoteAmount: bigint) =>
      send("deposit", async () => {
        await ensureAllowance(vault, quoteAmount);
        return getWalletClient().writeContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "deposit",
          args: [quoteAmount],
        });
      }),
    [ensureAllowance, getWalletClient, send],
  );

  const redeem = useCallback(
    (vault: `0x${string}`, shares: bigint) =>
      send("redeem", () =>
        getWalletClient().writeContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "redeem",
          args: [shares],
        }),
      ),
    [getWalletClient, send],
  );

  /**
   * There is no index to index route onchain, and inventing one would mean a
   * router holding both vaults' quote. Redeeming and redepositing is the same
   * trade with the same result, just visibly two signatures.
   */
  const swap = useCallback(
    (from: `0x${string}`, to: `0x${string}`, shares: bigint) =>
      send("swap", async () => {
        const quoteAmount = await ensClient.readContract({
          address: from,
          abi: indexVaultAbi,
          functionName: "previewRedeem",
          args: [shares],
        });

        const client = getWalletClient();
        const redeemHash = await client.writeContract({
          address: from,
          abi: indexVaultAbi,
          functionName: "redeem",
          args: [shares],
        });
        await ensClient.waitForTransactionReceipt({ hash: redeemHash });

        await ensureAllowance(to, quoteAmount);

        return client.writeContract({
          address: to,
          abi: indexVaultAbi,
          functionName: "deposit",
          args: [quoteAmount],
        });
      }),
    [ensureAllowance, getWalletClient, send],
  );

  const faucet = useCallback(
    (token: `0x${string}`) =>
      send("faucet", () =>
        getWalletClient().writeContract({
          address: token,
          abi: mockErc20Abi,
          functionName: "faucet",
        }),
      ),
    [getWalletClient, send],
  );

  return { pending, error, lastHash, deposit, redeem, swap, faucet };
};
