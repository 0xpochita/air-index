"use client";

import { useCallback, useState } from "react";
import { encodeFunctionData, sha256, toHex } from "viem";
import { permissionedRegistryAbi } from "@/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "@/lib/ens/abis/PermissionedResolver";
import { ensClient } from "@/lib/ens/client";
import { getAirIndexRegistry, PROTOCOL_ROOT } from "@/lib/ens/deployments";
import { toNode } from "@/lib/ens/name";
import { isDeployed, TOKENS } from "@/lib/tokens/registry";
import type { TokenSymbol } from "@/types/index-fund";
import { airIndexRegistrarAbi, getAirIndexRegistrar } from "./registrar";
import { useWallet } from "./WalletProvider";

const IPFS_DAG_PB_SHA256_PREFIX = "e30101701220";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface CreateIndexInput {
  slug: string;
  name: string;
  description: string;
  symbols: TokenSymbol[];
  weights: Record<string, number>;
  transferable: boolean;
}

export interface CreatedIndex {
  hash: `0x${string}`;
  slug: string;
  ensName: string;
}

/** Structurally valid ipfs contenthash over the published methodology document. */
const toContenthash = (document: string): `0x${string}` =>
  `0x${IPFS_DAG_PB_SHA256_PREFIX}${sha256(toHex(document)).slice(2)}`;

/**
 * Every record the index will hold, encoded for the resolver's `initialize`.
 * They run there with access control bypassed, which is why the whole index can
 * be published in one call by a contract that holds no role on it.
 */
export const buildRecords = ({
  slug,
  name,
  description,
  symbols,
  weights,
}: CreateIndexInput): `0x${string}`[] => {
  const ensName = `${slug}.${PROTOCOL_ROOT}`;

  const constituents = symbols.flatMap((symbol) => {
    const node = toNode(`${symbol}.${ensName}`);
    const token = TOKENS[symbol];

    const weight = encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [node, "weight", String(weights[symbol] ?? 0)],
    });

    /** A native asset has no ERC20. Writing the zero address costs gas and reads back absent. */
    if (!isDeployed(token)) {
      return [weight];
    }

    return [
      encodeFunctionData({
        abi: permissionedResolverAbi,
        functionName: "setAddr",
        args: [node, token.address],
      }),
      weight,
    ];
  });

  const methodology = JSON.stringify({
    name,
    description,
    constituents: symbols.map((symbol) => ({
      symbol,
      weightBps: weights[symbol] ?? 0,
    })),
  });

  return [
    ...constituents,
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [toNode(ensName), "constituents", symbols.join(",")],
    }),
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [toNode(ensName), "name", name],
    }),
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [toNode(ensName), "description", description],
    }),
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setContenthash",
      args: [toNode(ensName), toContenthash(methodology)],
    }),
  ];
};

const toMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.split("\n")[0];
  }
  return "Publishing failed";
};

export const useCreateIndex = () => {
  const { address, isSepolia, getWalletClient, refresh, switchNetwork } =
    useWallet();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedIndex | null>(null);

  const publish = useCallback(
    async (input: CreateIndexInput) => {
      const registrar = getAirIndexRegistrar();
      const registry = getAirIndexRegistry();

      if (!registrar || !registry) {
        setError("The registrar is not configured for this deployment.");
        return;
      }

      if (!address) {
        setError("Connect a wallet first.");
        return;
      }

      if (!isSepolia) {
        await switchNetwork();
        return;
      }

      setIsPending(true);
      setError(null);

      try {
        /** Cheaper than letting `register` revert, and it can say which name is taken. */
        const owner = await ensClient.readContract({
          address: registry,
          abi: permissionedRegistryAbi,
          functionName: "findOwner",
          args: [input.slug],
        });

        if (owner !== ZERO_ADDRESS) {
          setError(
            `${input.slug}.${PROTOCOL_ROOT} is already registered. Pick another name.`,
          );
          return;
        }

        const hash = await getWalletClient().writeContract({
          address: registrar,
          abi: airIndexRegistrarAbi,
          functionName: "create",
          args: [input.slug, buildRecords(input), input.transferable],
        });

        await ensClient.waitForTransactionReceipt({ hash });
        setCreated({
          hash,
          slug: input.slug,
          ensName: `${input.slug}.${PROTOCOL_ROOT}`,
        });
        refresh();
      } catch (cause) {
        setError(toMessage(cause));
      } finally {
        setIsPending(false);
      }
    },
    [address, getWalletClient, isSepolia, refresh, switchNetwork],
  );

  return {
    publish,
    isPending,
    error,
    created,
    dismiss: useCallback(() => setCreated(null), []),
  };
};
