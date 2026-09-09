import assert from "node:assert/strict";
import { parseEther } from "viem";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { toDnsEncoded, toNode } from "../src/lib/ens/name";
import { loadEnv } from "./lib/env";
import {
  getAgentWallet,
  getWallet,
  logTx,
  publicClient,
  requireFunds,
} from "./lib/wallet";

loadEnv();

const INDEX_NAME = process.env.PROBE_INDEX ?? "defi-blue.airindex.eth";
const SCOPED_SYMBOL = "uni";
const SCOPED_KEY = "weight";
const FORBIDDEN_KEY = "strategy";
const NEW_WEIGHT = "3200";
const AGENT_GAS = parseEther("0.005");
const PROBE_ADDRESS = "0xdeaDDeADDEaDdeaDdEAddEADDEAdDeadDEADDEaD";

const expectRevert = async (label: string, call: () => Promise<unknown>) => {
  try {
    await call();
    console.log(`  ${label}: SUCCEEDED (scoping is broken)`);
    return false;
  } catch (error) {
    const message =
      error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(`  ${label}: reverted`);
    console.log(`    ${message}`);
    return true;
  }
};

const run = async () => {
  const owner = getWallet();
  const agent = getAgentWallet();
  const constituentName = `${SCOPED_SYMBOL}.${INDEX_NAME}`;
  const node = toNode(constituentName);

  console.log(`owner ${owner.account.address}`);
  console.log(`agent ${agent.account.address}`);
  await requireFunds(owner.account.address);

  const agentBalance = await publicClient.getBalance({
    address: agent.account.address,
  });
  if (agentBalance < AGENT_GAS / 2n) {
    console.log("\n0. fund the agent for gas");
    await logTx(
      "transfer",
      await owner.client.sendTransaction({
        to: agent.account.address,
        value: AGENT_GAS,
      }),
    );
  }

  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  assert.ok(
    registry,
    "NEXT_PUBLIC_AIR_INDEX_REGISTRY is missing. Run pnpm bootstrap first.",
  );

  const slug = INDEX_NAME.split(".")[0];
  const indexResolver = await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "getResolver",
    args: [slug],
  });
  console.log(`\nindex resolver ${indexResolver}`);

  console.log(
    `\n1. grant the agent only "${SCOPED_KEY}" on ${constituentName}`,
  );

  await logTx(
    "authorizeTextRoles",
    await owner.client.writeContract({
      address: indexResolver,
      abi: permissionedResolverAbi,
      functionName: "authorizeTextRoles",
      args: [
        toDnsEncoded(constituentName),
        SCOPED_KEY,
        agent.account.address,
        true,
      ],
    }),
  );

  console.log(`\n2. agent writes "${SCOPED_KEY}" (must succeed)`);
  await logTx(
    `setText ${SCOPED_KEY}`,
    await agent.client.writeContract({
      address: indexResolver,
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [node, SCOPED_KEY, NEW_WEIGHT],
    }),
  );

  const stored = await publicClient.readContract({
    address: indexResolver,
    abi: permissionedResolverAbi,
    functionName: "text",
    args: [node, SCOPED_KEY],
  });
  assert.equal(
    stored,
    NEW_WEIGHT,
    "the delegated key must be writable by the agent",
  );
  console.log(`  ${SCOPED_KEY} = ${stored}`);

  console.log(`\n3. agent writes "${FORBIDDEN_KEY}" (must revert)`);
  const otherKeyBlocked = await expectRevert(`setText ${FORBIDDEN_KEY}`, () =>
    publicClient.simulateContract({
      account: agent.account.address,
      address: indexResolver,
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [node, FORBIDDEN_KEY, "anything"],
    }),
  );

  console.log("\n4. agent rewrites the token address (must revert)");
  const addrBlocked = await expectRevert("setAddr", () =>
    publicClient.simulateContract({
      account: agent.account.address,
      address: indexResolver,
      abi: permissionedResolverAbi,
      functionName: "setAddr",
      args: [node, PROBE_ADDRESS],
    }),
  );

  assert.ok(otherKeyBlocked, "a different text key must be refused");
  assert.ok(addrBlocked, "the address record must be refused");

  console.log("\nW3: PASS");
  console.log(
    `  ${agent.account.address} can set only "${SCOPED_KEY}" on ${constituentName}`,
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
