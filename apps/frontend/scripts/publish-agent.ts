import assert from "node:assert/strict";
import { encodeFunctionData } from "viem";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { ensClient } from "../src/lib/ens/client";
import { PROTOCOL_ROOT } from "../src/lib/ens/deployments";
import { toDnsEncoded, toNode } from "../src/lib/ens/name";
import { readConstituentLabels } from "../src/lib/ens/read";
import { getIndexBySlug } from "../src/lib/mock/indexes";
import { loadEnv } from "./lib/env";
import {
  getAgentWallet,
  getWallet,
  logTx,
  publicClient,
  requireFunds,
} from "./lib/wallet";

loadEnv();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const AGENT_LABEL = "rebalancer";
const WEIGHT_KEY = "weight";
const MANDATE_KEY = "mandate";
const SLUG = process.argv[2];
/** EAC grants are revocable. The same call with `false` takes the key back. */
const IS_REVOKE = process.argv.includes("--revoke");

const DEFAULT_MANDATE =
  "Reset every constituent to its target allocation on a fixed schedule.";

/**
 * Gives an index's rebalancing agent a name of its own.
 *
 * The agent already had permissions but no identity: it existed as a raw
 * address inside a role bitmap and nowhere else. Here it becomes
 * `rebalancer.<index>.airindex.eth` — an address anyone can resolve, a mandate
 * anyone can read, and a key only it can write.
 *
 * The address comes from REBALANCER_PRIVATE_KEY rather than the local
 * catalogue. Delegating to a hardcoded address grants the role to a keypair
 * nobody holds, which reads as working right up until the agent tries to sign.
 */
const run = async () => {
  assert.ok(SLUG, "usage: pnpm publish-agent <slug>");

  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  assert.ok(registry, "NEXT_PUBLIC_AIR_INDEX_REGISTRY is missing");

  const ensName = `${SLUG}.${PROTOCOL_ROOT}`;
  const agentName = `${AGENT_LABEL}.${ensName}`;

  const { account, client } = getWallet();
  const agent = getAgentWallet();
  await requireFunds(account.address);

  const resolver = (await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "getResolver",
    args: [SLUG],
  })) as `0x${string}`;
  assert.notEqual(resolver, ZERO_ADDRESS, `${ensName} is not registered`);

  const labels = await readConstituentLabels(ensName);
  assert.ok(labels.length > 0, `${ensName} publishes no constituent list`);

  const mandate = getIndexBySlug(SLUG)?.rebalancer?.mandate ?? DEFAULT_MANDATE;

  console.log(`index    ${ensName}`);
  console.log(`agent    ${agent.account.address}`);
  console.log(`resolver ${resolver}`);

  if (IS_REVOKE) {
    console.log(`\n1. take the ${WEIGHT_KEY} key back from the agent`);
    for (const symbol of labels) {
      await logTx(
        `revoke ${symbol}`,
        await client.writeContract({
          address: resolver,
          abi: permissionedResolverAbi,
          functionName: "authorizeTextRoles",
          args: [
            toDnsEncoded(`${symbol}.${ensName}`),
            WEIGHT_KEY,
            agent.account.address,
            false,
          ],
        }),
      );
    }

    console.log("\n2. the agent must now be refused");
    await assert.rejects(
      publicClient.simulateContract({
        account: agent.account,
        address: resolver,
        abi: permissionedResolverAbi,
        functionName: "setText",
        args: [toNode(`${labels[0]}.${ensName}`), WEIGHT_KEY, "2000"],
      }),
      "a revoked agent must not be able to move weights",
    );
    console.log(`  ${WEIGHT_KEY} on ${labels[0]}.${ensName}: refused`);
    console.log(
      `\n${agentName} keeps its name and its mandate, and has lost its key`,
    );
    return;
  }

  console.log(`\n1. publish ${agentName}`);
  await logTx(
    "multicall",
    await client.writeContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "multicall",
      args: [
        [
          encodeFunctionData({
            abi: permissionedResolverAbi,
            functionName: "setAddr",
            args: [toNode(agentName), agent.account.address],
          }),
          encodeFunctionData({
            abi: permissionedResolverAbi,
            functionName: "setText",
            args: [toNode(agentName), MANDATE_KEY, mandate],
          }),
          encodeFunctionData({
            abi: permissionedResolverAbi,
            functionName: "setText",
            args: [toNode(agentName), "delegated-key", WEIGHT_KEY],
          }),
        ],
      ],
    }),
  );

  console.log(`\n2. scope the ${WEIGHT_KEY} key to the agent, per constituent`);
  for (const symbol of labels) {
    await logTx(
      `authorize ${symbol}`,
      await client.writeContract({
        address: resolver,
        abi: permissionedResolverAbi,
        functionName: "authorizeTextRoles",
        args: [
          toDnsEncoded(`${symbol}.${ensName}`),
          WEIGHT_KEY,
          agent.account.address,
          true,
        ],
      }),
    );
  }

  console.log("\n3. let the agent maintain its own mandate");
  await logTx(
    "authorize mandate",
    await client.writeContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "authorizeTextRoles",
      args: [toDnsEncoded(agentName), MANDATE_KEY, agent.account.address, true],
    }),
  );

  console.log("\n4. read the agent back through the universal resolver");
  const [published, publishedMandate] = await Promise.all([
    ensClient.getEnsAddress({ name: agentName }),
    ensClient.getEnsText({ name: agentName, key: MANDATE_KEY }),
  ]);
  console.log(`  ${agentName.padEnd(38)} ${published}`);
  console.log(`  mandate: ${publishedMandate}`);
  assert.equal(
    published?.toLowerCase(),
    agent.account.address.toLowerCase(),
    "the agent name must resolve to the agent",
  );
  assert.equal(publishedMandate, mandate, "the mandate must resolve");

  console.log("\n5. prove the scope is a scope, not a blanket grant");
  const [symbol] = labels;
  const constituentName = `${symbol}.${ensName}`;

  await publicClient.simulateContract({
    account: agent.account,
    address: resolver,
    abi: permissionedResolverAbi,
    functionName: "setText",
    args: [toNode(constituentName), WEIGHT_KEY, "2000"],
  });
  console.log(`  ${WEIGHT_KEY} on ${constituentName}: allowed`);

  await assert.rejects(
    publicClient.simulateContract({
      account: agent.account,
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "setAddr",
      args: [toNode(constituentName), agent.account.address],
    }),
    "the agent must not be able to repoint a constituent",
  );
  console.log(`  addr  on ${constituentName}: refused`);

  await assert.rejects(
    publicClient.simulateContract({
      account: agent.account,
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [toNode(constituentName), "description", "hijacked"],
    }),
    "the agent must not be able to write another key",
  );
  console.log(`  description on ${constituentName}: refused`);

  console.log(`\n${agentName} is live and can only move weights`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
