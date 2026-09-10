import assert from "node:assert/strict";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { ENS_DEPLOYMENT } from "../src/lib/ens/deployments";
import { getAssigneeCount, REGISTRY_ROLE } from "../src/lib/ens/roles";
import { readArtifact } from "./lib/artifacts";
import { loadEnv, writeEnv } from "./lib/env";
import { getWallet, logTx, publicClient, requireFunds } from "./lib/wallet";

loadEnv();

const withAdmin = (role: bigint) => role | (role << 128n);
const REGISTRAR_ROLES = withAdmin(REGISTRY_ROLE.REGISTRAR);

/**
 * Puts index creation in anyone's hands.
 *
 * `REGISTRAR` is an EAC role and a role caps at fifteen holders, so opening
 * registration cannot mean handing the role out. It means handing it to one
 * contract that registers on behalf of whoever calls it and keeps nothing.
 *
 * Two writes from the deployer, once. After this the deployer is not involved
 * in anybody's index.
 */
const run = async () => {
  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  assert.ok(registry, "NEXT_PUBLIC_AIR_INDEX_REGISTRY is missing");

  const { account, client } = getWallet();
  await requireFunds(account.address);

  console.log(`deployer ${account.address}`);
  console.log(`registry ${registry}`);

  console.log("\n1. deploy the registrar");
  const { abi, bytecode } = readArtifact("AirIndexRegistrar");
  const hash = await client.deployContract({
    abi,
    bytecode,
    args: [
      ENS_DEPLOYMENT.verifiableFactory,
      registry,
      ENS_DEPLOYMENT.permissionedResolverImpl,
    ],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, "success", "registrar deploy reverted");
  assert.ok(receipt.contractAddress, "registrar produced no address");

  const registrar = receipt.contractAddress;
  console.log(`  ${registrar} (gas ${receipt.gasUsed})`);

  console.log("\n2. grant it REGISTRAR on the air index registry");
  await logTx(
    "grantRootRoles",
    await client.writeContract({
      address: registry,
      abi: permissionedRegistryAbi,
      functionName: "grantRootRoles",
      args: [REGISTRAR_ROLES, registrar],
    }),
  );

  console.log("\n3. read the grant back");
  const counts = await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "roleCount",
    args: [0n],
  });
  const holders = getAssigneeCount(counts as bigint, REGISTRY_ROLE.REGISTRAR);
  console.log(`  REGISTRAR holders: ${holders}`);
  assert.ok(
    holders >= 2,
    "the registrar must hold REGISTRAR alongside the deployer",
  );

  writeEnv("NEXT_PUBLIC_AIR_INDEX_REGISTRAR", registrar);
  console.log("\nanyone can now publish an index under airindex.eth");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
