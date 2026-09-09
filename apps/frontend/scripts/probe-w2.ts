import assert from "node:assert/strict";
import { encodeFunctionData, parseEventLogs } from "viem";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { verifiableFactoryAbi } from "../src/lib/ens/abis/VerifiableFactory";
import { ENS_DEPLOYMENT } from "../src/lib/ens/deployments";
import { toNode } from "../src/lib/ens/name";
import {
  isMethodologyLocked,
  METHODOLOGY_LOCK_BITMAP,
  RESOLVER_ROLE,
} from "../src/lib/ens/roles";
import { getWallet, logTx, publicClient, requireFunds } from "./lib/wallet";

const PROBE_NAME = "methodology-probe.eth";
const ROOT_RESOURCE = 0n;
const FIRST_CONTENTHASH = "0xe30101701220" + "11".repeat(32);
const SECOND_CONTENTHASH = "0xe30101701220" + "22".repeat(32);

const ALL_RESOLVER_ROLES = Object.values(RESOLVER_ROLE).reduce(
  (bitmap, role) => bitmap | role | (role << 128n),
  0n,
);

const readRoleCounts = () =>
  publicClient.readContract({
    address: resolverAddress,
    abi: permissionedResolverAbi,
    functionName: "roleCount",
    args: [ROOT_RESOURCE],
  });

let resolverAddress: `0x${string}`;

const run = async () => {
  const { account, client } = getWallet();
  console.log(`deployer ${account.address}`);
  await requireFunds(account.address);

  console.log(
    "\nW2 runs on a throwaway resolver because the revoke is irreversible.",
  );

  console.log("\n1. deploy a throwaway resolver");
  const initData = encodeFunctionData({
    abi: permissionedResolverAbi,
    functionName: "initialize",
    args: [account.address, ALL_RESOLVER_ROLES, []],
  });
  const deployReceipt = await logTx(
    "deployProxy",
    await client.writeContract({
      address: ENS_DEPLOYMENT.verifiableFactory,
      abi: verifiableFactoryAbi,
      functionName: "deployProxy",
      args: [
        ENS_DEPLOYMENT.permissionedResolverImpl,
        BigInt(Date.now()),
        initData,
      ],
    }),
  );
  const [event] = parseEventLogs({
    abi: verifiableFactoryAbi,
    eventName: "ProxyDeployed",
    logs: deployReceipt.logs,
  });
  assert.ok(event, "ProxyDeployed must be emitted");
  resolverAddress = event.args.proxyAddress as `0x${string}`;
  console.log(`  resolver ${resolverAddress}`);

  const node = toNode(PROBE_NAME);

  console.log("\n2. write the methodology once");
  await logTx(
    "setContenthash",
    await client.writeContract({
      address: resolverAddress,
      abi: permissionedResolverAbi,
      functionName: "setContenthash",
      args: [node, FIRST_CONTENTHASH as `0x${string}`],
    }),
  );

  const before = await publicClient.readContract({
    address: resolverAddress,
    abi: permissionedResolverAbi,
    functionName: "contenthash",
    args: [node],
  });
  assert.equal(before, FIRST_CONTENTHASH, "the first write must land");
  console.log(`  contenthash = ${before}`);
  console.log(
    `  locked before revoke = ${isMethodologyLocked(await readRoleCounts())}`,
  );

  console.log(
    "\n3. revoke SET_CONTENTHASH, CLEAR and UPGRADE with their admin roles",
  );
  await logTx(
    "revokeRootRoles",
    await client.writeContract({
      address: resolverAddress,
      abi: permissionedResolverAbi,
      functionName: "revokeRootRoles",
      args: [METHODOLOGY_LOCK_BITMAP, account.address],
    }),
  );

  const after = await readRoleCounts();
  const locked = isMethodologyLocked(after);
  console.log(`  roleCount(ROOT) = ${after}`);
  console.log(`  locked after revoke = ${locked}`);
  assert.ok(
    locked,
    "roleCount must report zero assignees for all three role pairs",
  );

  console.log("\n4. try to rewrite it and require failure");
  let rewriteFailed = false;
  let revertMessage = "";
  try {
    await publicClient.simulateContract({
      account: account.address,
      address: resolverAddress,
      abi: permissionedResolverAbi,
      functionName: "setContenthash",
      args: [node, SECOND_CONTENTHASH as `0x${string}`],
    });
  } catch (error) {
    rewriteFailed = true;
    revertMessage =
      error instanceof Error ? error.message.split("\n")[0] : String(error);
  }
  console.log(`  rewrite reverted = ${rewriteFailed}`);
  console.log(`  revert: ${revertMessage}`);
  assert.ok(
    rewriteFailed,
    "setContenthash must revert once the role and its admin are gone",
  );

  console.log("\n5. confirm the stored value is unchanged");
  const stored = await publicClient.readContract({
    address: resolverAddress,
    abi: permissionedResolverAbi,
    functionName: "contenthash",
    args: [node],
  });
  assert.equal(
    stored,
    FIRST_CONTENTHASH,
    "the original methodology must survive",
  );

  console.log("\nW2: PASS");
  console.log(`  resolver ${resolverAddress}`);
  console.log(
    "  The methodology cannot be rewritten, cleared, or upgraded around.",
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
