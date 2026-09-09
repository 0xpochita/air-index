import assert from "node:assert/strict";
import { encodeFunctionData, erc20Abi, parseAbi, parseEventLogs } from "viem";
import { ethRegistrarAbi } from "../src/lib/ens/abis/ETHRegistrar";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { verifiableFactoryAbi } from "../src/lib/ens/abis/VerifiableFactory";
import { ensClient } from "../src/lib/ens/client";
import { ENS_DEPLOYMENT } from "../src/lib/ens/deployments";
import { toNode } from "../src/lib/ens/name";
import { RESOLVER_ROLE } from "../src/lib/ens/roles";
import { getWallet, logTx, publicClient, requireFunds } from "./lib/wallet";

const PROBE_LABEL = process.env.PROBE_LABEL ?? "airindexprobe";
const WILDCARD_LABEL = "weth";
const WEIGHT_KEY = "weight";
const WEIGHT_VALUE = "3500";
const PROBE_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const ONE_YEAR_SECONDS = 31_536_000n;
const MINT_AMOUNT = 1_000_000_000n;
const ZERO_BYTES32 = `0x${"0".repeat(64)}` as const;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/** `mint(address,uint256)` is public on the testnet mock, confirmed by a successful gas estimate from an unrelated address. */
const mockUsdcAbi = parseAbi(["function mint(address to, uint256 amount)"]);

const ALL_RESOLVER_ROLES = Object.values(RESOLVER_ROLE).reduce(
  (bitmap, role) => bitmap | role | (role << 128n),
  0n,
);

const wait = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const deployResolver = async (
  client: ReturnType<typeof getWallet>["client"],
  admin: `0x${string}`,
) => {
  const initData = encodeFunctionData({
    abi: permissionedResolverAbi,
    functionName: "initialize",
    args: [admin, ALL_RESOLVER_ROLES, []],
  });

  const hash = await client.writeContract({
    address: ENS_DEPLOYMENT.verifiableFactory,
    abi: verifiableFactoryAbi,
    functionName: "deployProxy",
    args: [
      ENS_DEPLOYMENT.permissionedResolverImpl,
      BigInt(Date.now()),
      initData,
    ],
  });
  const receipt = await logTx("deployProxy", hash);

  const [event] = parseEventLogs({
    abi: verifiableFactoryAbi,
    eventName: "ProxyDeployed",
    logs: receipt.logs,
  });
  assert.ok(event, "ProxyDeployed must be emitted");
  return event.args.proxyAddress as `0x${string}`;
};

const registerProbeName = async (
  client: ReturnType<typeof getWallet>["client"],
  owner: `0x${string}`,
  resolver: `0x${string}`,
) => {
  const available = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistrar,
    abi: ethRegistrarAbi,
    functionName: "isAvailable",
    args: [PROBE_LABEL],
  });
  assert.ok(
    available,
    `${PROBE_LABEL}.eth is taken. Set PROBE_LABEL to something else.`,
  );

  const [base, premium] = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistrar,
    abi: ethRegistrarAbi,
    functionName: "getRegisterPrice",
    args: [PROBE_LABEL, ONE_YEAR_SECONDS, ENS_DEPLOYMENT.mockUsdc],
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

  const secret = ZERO_BYTES32;
  const commitment = await publicClient.readContract({
    address: ENS_DEPLOYMENT.ethRegistrar,
    abi: ethRegistrarAbi,
    functionName: "makeCommitment",
    args: [
      PROBE_LABEL,
      owner,
      secret,
      ZERO_ADDRESS,
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
  await wait(70);

  await logTx(
    "register",
    await client.writeContract({
      address: ENS_DEPLOYMENT.ethRegistrar,
      abi: ethRegistrarAbi,
      functionName: "register",
      args: [
        PROBE_LABEL,
        owner,
        secret,
        ZERO_ADDRESS,
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
  const parentName = `${PROBE_LABEL}.eth`;
  const wildcardName = `${WILDCARD_LABEL}.${parentName}`;

  console.log(`deployer ${account.address}`);
  await requireFunds(account.address);
  console.log(`\nW1 target ${wildcardName} (never registered anywhere)`);

  console.log("\n1. deploy a resolver we control");
  const resolver = await deployResolver(client, account.address);
  console.log(`  resolver ${resolver}`);

  console.log(`\n2. register ${parentName} pointing at it`);
  await registerProbeName(client, account.address, resolver);

  console.log("\n3. write records to the unregistered subname");
  const node = toNode(wildcardName);
  console.log(`  node ${node}`);
  await logTx(
    "setAddr",
    await client.writeContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "setAddr",
      args: [node, PROBE_ADDRESS],
    }),
  );
  await logTx(
    "setText",
    await client.writeContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [node, WEIGHT_KEY, WEIGHT_VALUE],
    }),
  );

  console.log("\n4. read back through stock viem, no configuration");
  const resolvedAddr = await ensClient.getEnsAddress({ name: wildcardName });
  const resolvedWeight = await ensClient.getEnsText({
    name: wildcardName,
    key: WEIGHT_KEY,
  });
  console.log(`  getEnsAddress = ${resolvedAddr}`);
  console.log(`  getEnsText    = ${resolvedWeight}`);

  assert.equal(
    resolvedAddr?.toLowerCase(),
    PROBE_ADDRESS.toLowerCase(),
    "wildcard addr must resolve through the Universal Resolver",
  );
  assert.equal(resolvedWeight, WEIGHT_VALUE, "wildcard text must resolve");

  console.log(`\nW1: PASS`);
  console.log(`  parent   ${parentName}`);
  console.log(`  resolver ${resolver}`);
  console.log(
    "  A subname registered in no registry holds records and reads back with stock viem.",
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
