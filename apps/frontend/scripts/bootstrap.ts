import assert from "node:assert/strict";
import { encodeFunctionData, erc20Abi, parseAbi, parseEventLogs } from "viem";
import { ethRegistrarAbi } from "../src/lib/ens/abis/ETHRegistrar";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { userRegistryAbi } from "../src/lib/ens/abis/UserRegistry";
import { verifiableFactoryAbi } from "../src/lib/ens/abis/VerifiableFactory";
import { ENS_DEPLOYMENT, PROTOCOL_ROOT } from "../src/lib/ens/deployments";
import { REGISTRY_ROLE, RESOLVER_ROLE } from "../src/lib/ens/roles";
import { writeEnv } from "./lib/env";
import { getWallet, logTx, publicClient, requireFunds } from "./lib/wallet";

const ROOT_LABEL = PROTOCOL_ROOT.replace(/\.eth$/, "");
const ONE_YEAR_SECONDS = 31_536_000n;
const MINT_AMOUNT = 1_000_000_000n;
const ZERO_BYTES32 = `0x${"0".repeat(64)}` as const;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const mockUsdcAbi = parseAbi(["function mint(address to, uint256 amount)"]);

const withAdmin = (role: bigint) => role | (role << 128n);

/** Alias and upgrade live here because both are root-only on the resolver. */
const PROTOCOL_RESOLVER_ROLES =
  withAdmin(RESOLVER_ROLE.SET_ADDR) |
  withAdmin(RESOLVER_ROLE.SET_TEXT) |
  withAdmin(RESOLVER_ROLE.SET_CONTENTHASH) |
  withAdmin(RESOLVER_ROLE.SET_DATA) |
  withAdmin(RESOLVER_ROLE.SET_ALIAS) |
  withAdmin(RESOLVER_ROLE.CLEAR) |
  withAdmin(RESOLVER_ROLE.UPGRADE);

/**
 * SET_PARENT is included so the registry can be pinned under airindex.eth, then
 * revoked in the same run. CAN_TRANSFER_ADMIN has no regular variant.
 */
const AIR_INDEX_REGISTRY_ROLES =
  withAdmin(REGISTRY_ROLE.REGISTRAR) |
  withAdmin(REGISTRY_ROLE.RENEW) |
  withAdmin(REGISTRY_ROLE.SET_SUBREGISTRY) |
  withAdmin(REGISTRY_ROLE.SET_RESOLVER) |
  withAdmin(REGISTRY_ROLE.SET_PARENT) |
  withAdmin(REGISTRY_ROLE.UPGRADE) |
  REGISTRY_ROLE.CAN_TRANSFER_ADMIN;

const deployProxy = async (
  client: ReturnType<typeof getWallet>["client"],
  label: string,
  implementation: `0x${string}`,
  initData: `0x${string}`,
) => {
  const receipt = await logTx(
    label,
    await client.writeContract({
      address: ENS_DEPLOYMENT.verifiableFactory,
      abi: verifiableFactoryAbi,
      functionName: "deployProxy",
      args: [implementation, BigInt(Date.now()), initData],
    }),
  );
  const [event] = parseEventLogs({
    abi: verifiableFactoryAbi,
    eventName: "ProxyDeployed",
    logs: receipt.logs,
  });
  assert.ok(event, "ProxyDeployed must be emitted");
  return event.args.proxyAddress as `0x${string}`;
};

const registerRoot = async (
  client: ReturnType<typeof getWallet>["client"],
  owner: `0x${string}`,
  registry: `0x${string}`,
  resolver: `0x${string}`,
) => {
  const [base, premium] = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistrar,
    abi: ethRegistrarAbi,
    functionName: "getRegisterPrice",
    args: [ROOT_LABEL, ONE_YEAR_SECONDS, ENS_DEPLOYMENT.mockUsdc],
  });
  const price = base + premium;
  console.log(`  price ${price} MockUSDC units`);

  await logTx(
    "mint MockUSDC",
    await client.writeContract({
      address: ENS_DEPLOYMENT.mockUsdc,
      abi: mockUsdcAbi,
      functionName: "mint",
      args: [owner, MINT_AMOUNT],
    }),
  );
  await logTx(
    "approve",
    await client.writeContract({
      address: ENS_DEPLOYMENT.mockUsdc,
      abi: erc20Abi,
      functionName: "approve",
      args: [ENS_DEPLOYMENT.ethRegistrar, price],
    }),
  );

  const commitment = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistrar,
    abi: ethRegistrarAbi,
    functionName: "makeCommitment",
    args: [
      ROOT_LABEL,
      owner,
      ZERO_BYTES32,
      registry,
      resolver,
      ONE_YEAR_SECONDS,
      ZERO_BYTES32,
    ],
  });
  await logTx(
    "commit",
    await client.writeContract({
      address: ENS_DEPLOYMENT.ethRegistrar,
      abi: ethRegistrarAbi,
      functionName: "commit",
      args: [commitment],
    }),
  );

  console.log("  waiting 70s for MIN_COMMITMENT_AGE");
  await new Promise((resolve) => setTimeout(resolve, 70_000));

  await logTx(
    "register",
    await client.writeContract({
      address: ENS_DEPLOYMENT.ethRegistrar,
      abi: ethRegistrarAbi,
      functionName: "register",
      args: [
        ROOT_LABEL,
        owner,
        ZERO_BYTES32,
        registry,
        resolver,
        ONE_YEAR_SECONDS,
        ENS_DEPLOYMENT.mockUsdc,
        ZERO_BYTES32,
      ],
    }),
  );
};

const run = async () => {
  const { account, client } = getWallet();
  console.log(`deployer ${account.address}`);
  await requireFunds(account.address);

  const existing = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistry,
    abi: permissionedRegistryAbi,
    functionName: "findOwner",
    args: [ROOT_LABEL],
  });

  if (existing !== ZERO_ADDRESS) {
    console.log(
      `\n${PROTOCOL_ROOT} already registered to ${existing}. Nothing to do.`,
    );
    const registry = await publicClient.readContract({
      address: ENS_DEPLOYMENT.ethRegistry,
      abi: permissionedRegistryAbi,
      functionName: "getSubregistry",
      args: [ROOT_LABEL],
    });
    const resolver = await publicClient.readContract({
      address: ENS_DEPLOYMENT.ethRegistry,
      abi: permissionedRegistryAbi,
      functionName: "getResolver",
      args: [ROOT_LABEL],
    });
    console.log(`  registry ${registry}`);
    console.log(`  resolver ${resolver}`);
    return;
  }

  console.log("\n1. deploy the protocol resolver");
  const protocolResolver = await deployProxy(
    client,
    "deployProxy resolver",
    ENS_DEPLOYMENT.permissionedResolverImpl,
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "initialize",
      args: [account.address, PROTOCOL_RESOLVER_ROLES, []],
    }),
  );
  console.log(`  resolver ${protocolResolver}`);

  console.log("\n2. deploy the air index registry");
  const airIndexRegistry = await deployProxy(
    client,
    "deployProxy registry",
    ENS_DEPLOYMENT.userRegistryImpl,
    encodeFunctionData({
      abi: userRegistryAbi,
      functionName: "initialize",
      args: [account.address, AIR_INDEX_REGISTRY_ROLES],
    }),
  );
  console.log(`  registry ${airIndexRegistry}`);

  console.log(`\n3. register ${PROTOCOL_ROOT} wired to both`);
  await registerRoot(
    client,
    account.address,
    airIndexRegistry,
    protocolResolver,
  );

  console.log(
    "\n4. pin the registry under the protocol root, then lock the pointer",
  );
  await logTx(
    "setParent",
    await client.writeContract({
      address: airIndexRegistry,
      abi: permissionedRegistryAbi,
      functionName: "setParent",
      args: [ENS_DEPLOYMENT.ethRegistry, ROOT_LABEL],
    }),
  );
  await logTx(
    "revokeRootRoles SET_PARENT",
    await client.writeContract({
      address: airIndexRegistry,
      abi: permissionedRegistryAbi,
      functionName: "revokeRootRoles",
      args: [withAdmin(REGISTRY_ROLE.SET_PARENT), account.address],
    }),
  );

  console.log("\n5. verify onchain");
  const onchainRegistry = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistry,
    abi: permissionedRegistryAbi,
    functionName: "getSubregistry",
    args: [ROOT_LABEL],
  });
  const onchainResolver = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistry,
    abi: permissionedRegistryAbi,
    functionName: "getResolver",
    args: [ROOT_LABEL],
  });
  const owner = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistry,
    abi: permissionedRegistryAbi,
    functionName: "findOwner",
    args: [ROOT_LABEL],
  });

  assert.equal(onchainRegistry.toLowerCase(), airIndexRegistry.toLowerCase());
  assert.equal(onchainResolver.toLowerCase(), protocolResolver.toLowerCase());
  assert.equal(owner.toLowerCase(), account.address.toLowerCase());
  console.log(`  owner    ${owner}`);
  console.log(`  registry ${onchainRegistry}`);
  console.log(`  resolver ${onchainResolver}`);

  console.log("\n6. persist addresses");
  writeEnv("NEXT_PUBLIC_AIR_INDEX_REGISTRY", airIndexRegistry);
  writeEnv("NEXT_PUBLIC_AIR_INDEX_RESOLVER", protocolResolver);

  console.log(`\nBootstrap complete for ${PROTOCOL_ROOT}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
