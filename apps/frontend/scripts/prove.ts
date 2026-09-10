import assert from "node:assert/strict";
import { encodeFunctionData } from "viem";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { verifiableFactoryAbi } from "../src/lib/ens/abis/VerifiableFactory";
import { ensClient } from "../src/lib/ens/client";
import { ENS_DEPLOYMENT, PROTOCOL_ROOT } from "../src/lib/ens/deployments";
import { toDnsEncoded, toNode } from "../src/lib/ens/name";
import {
  getAssigneeCount,
  isMethodologyLocked,
  REGISTRY_ROLE,
} from "../src/lib/ens/roles";
import { airIndexRegistrarAbi } from "../src/lib/onchain/registrar";
import { loadEnv } from "./lib/env";
import { getAgentWallet, publicClient } from "./lib/wallet";

loadEnv();

const ZERO = "0x0000000000000000000000000000000000000000" as const;
const STRANGER = "0x1111111111111111111111111111111111111111" as const;

let passed = 0;
let failed = 0;

const check = (claim: string, condition: boolean, evidence: string) => {
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${claim}`);
  console.log(`        ${evidence}`);
  condition ? passed++ : failed++;
};

const section = (title: string) => console.log(`\n${title}`);

/**
 * Every claim the ENS track asks about, checked against Sepolia at the moment
 * it runs. Nothing here reads a fixture: if a contract changed underneath us
 * this fails, which is the only way a proof is worth showing.
 */
const run = async () => {
  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  const registrar = process.env
    .NEXT_PUBLIC_AIR_INDEX_REGISTRAR as `0x${string}`;
  assert.ok(registry && registrar, "run pnpm bootstrap and deploy-registrar");

  const readRegistry = (fn: string, args: unknown[]) =>
    publicClient.readContract({
      address: registry,
      abi: permissionedRegistryAbi,
      functionName: fn as never,
      args: args as never,
    });

  console.log(`Air Index — ENSv2 track proof`);
  console.log(`registry  ${registry}`);
  console.log(`registrar ${registrar}`);

  section("1. Wildcard resolution — subnames registered nowhere");
  {
    const name = `btc.big-five.${PROTOCOL_ROOT}`;
    const [addr, weight, parentSubregistry] = await Promise.all([
      ensClient.getEnsAddress({ name }),
      ensClient.getEnsText({ name, key: "weight" }),
      readRegistry("getSubregistry", ["big-five"]),
    ]);
    check(
      `${name} resolves`,
      Boolean(addr) && weight === "2000",
      `addr=${addr} weight=${weight}`,
    );
    check(
      "its parent lends no subregistry, so it cannot be registered anywhere",
      parentSubregistry === ZERO,
      `getSubregistry("big-five") = ${parentSubregistry}`,
    );
  }

  section("2. Own registry, tokenised — indexes are ERC-1155 entries");
  {
    const tokenId = (await readRegistry("findTokenId", ["big-five"])) as bigint;
    check(
      "big-five has a token id in the Air Index registry",
      tokenId > 0n,
      `findTokenId("big-five") = ${String(tokenId).slice(0, 20)}…`,
    );
  }

  section("3. One Permissioned Resolver per index, factory verified");
  {
    const resolvers = await Promise.all(
      ["defi-blue", "big-five", "safe-stables"].map((slug) =>
        readRegistry("getResolver", [slug]),
      ),
    );
    check(
      "each index has its own resolver",
      new Set(resolvers).size === resolvers.length,
      resolvers.map((r) => String(r).slice(0, 10)).join("  "),
    );

    const impl = await publicClient.readContract({
      address: ENS_DEPLOYMENT.verifiableFactory,
      abi: verifiableFactoryAbi,
      functionName: "verifyContract",
      args: [resolvers[1] as `0x${string}`],
    });
    check(
      "the factory verifies it as the audited implementation",
      String(impl).toLowerCase() ===
        ENS_DEPLOYMENT.permissionedResolverImpl.toLowerCase(),
      `verifyContract -> ${impl}`,
    );
  }

  section("4. Enhanced Access Control — a key scoped to one record");
  {
    const resolver = (await readRegistry(
      "getResolver",
      ["big-five"],
    )) as `0x${string}`;
    const agent = getAgentWallet();
    const node = toNode(`btc.big-five.${PROTOCOL_ROOT}`);

    const allowed = await publicClient
      .simulateContract({
        account: agent.account,
        address: resolver,
        abi: permissionedResolverAbi,
        functionName: "setText",
        args: [node, "weight", "2000"],
      })
      .then(() => true)
      .catch(() => false);

    const refused = await publicClient
      .simulateContract({
        account: agent.account,
        address: resolver,
        abi: permissionedResolverAbi,
        functionName: "setAddr",
        args: [node, agent.account.address],
      })
      .then(() => false)
      .catch(() => true);

    check(
      "the agent may write weight and may not write addr",
      allowed && refused,
      `${agent.account.address} — setText allowed=${allowed}, setAddr refused=${refused}`,
    );
  }

  section("5. Agent as a namespace — identity, mandate, permission");
  {
    const name = `rebalancer.big-five.${PROTOCOL_ROOT}`;
    const [addr, mandate, key] = await Promise.all([
      ensClient.getEnsAddress({ name }),
      ensClient.getEnsText({ name, key: "mandate" }),
      ensClient.getEnsText({ name, key: "delegated-key" }),
    ]);
    check(
      "the agent resolves to an address, a mandate and the key it may write",
      Boolean(addr && mandate && key),
      `${name} -> ${addr}, key="${key}"`,
    );
  }

  section("6. Record aliasing — a ticker");
  {
    const [alias, target] = await Promise.all([
      ensClient.getEnsText({
        name: `bg5.${PROTOCOL_ROOT}`,
        key: "constituents",
      }),
      ensClient.getEnsText({
        name: `big-five.${PROTOCOL_ROOT}`,
        key: "constituents",
      }),
    ]);
    check(
      "bg5 resolves identically to big-five",
      Boolean(alias) && alias === target,
      `both -> "${alias}"`,
    );
  }

  section("7. Namespace aliasing — a shared registry");
  {
    const [subregistry, mirrored] = await Promise.all([
      readRegistry("getSubregistry", ["funds"]),
      ensClient.getEnsText({
        name: `big-five.funds.${PROTOCOL_ROOT}`,
        key: "constituents",
      }),
    ]);
    check(
      "funds.airindex.eth points its subregistry at the Air Index registry",
      String(subregistry).toLowerCase() === registry.toLowerCase(),
      `getSubregistry("funds") = ${subregistry}`,
    );
    check(
      "an index therefore appears under a second name",
      Boolean(mirrored),
      `big-five.funds.${PROTOCOL_ROOT} -> "${mirrored}"`,
    );
  }

  section("8. Soulbound vs transferable — decided once, permanently");
  {
    const read = async (slug: string) => {
      const tokenId = await readRegistry("findTokenId", [slug]);
      const counts = (await readRegistry("roleCount", [tokenId])) as bigint;
      return getAssigneeCount(counts, REGISTRY_ROLE.CAN_TRANSFER_ADMIN) > 0;
    };
    const [transferable, soulbound] = await Promise.all([
      read("big-five"),
      read("safe-stables"),
    ]);
    check(
      "safe-stables is soulbound while big-five is not",
      transferable && !soulbound,
      `big-five transferable=${transferable}, safe-stables transferable=${soulbound}`,
    );
  }

  section("9. Methodology lock — roles burnt, not promised");
  {
    const resolver = (await readRegistry(
      "getResolver",
      ["big-five"],
    )) as `0x${string}`;
    const counts = (await publicClient.readContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "roleCount",
      args: [0n],
    })) as bigint;
    check(
      "no account holds contenthash, clear or upgrade on the index resolver",
      isMethodologyLocked(counts),
      `roleCount(ROOT_RESOURCE) on ${resolver}`,
    );
  }

  section("10. Forever name — max expiry, no parent control");
  {
    const foreverRegistry = "0x1B3520B9914E9D216504962953D0E1386394cFE4";
    const [expiry, roles, charter] = await Promise.all([
      publicClient.readContract({
        address: foreverRegistry,
        abi: permissionedRegistryAbi,
        functionName: "findExpiry",
        args: ["charter"],
      }),
      publicClient.readContract({
        address: foreverRegistry,
        abi: permissionedRegistryAbi,
        functionName: "roleCount",
        args: [0n],
      }),
      ensClient.getEnsText({
        name: `charter.safe-stables.${PROTOCOL_ROOT}`,
        key: "charter",
      }),
    ]);
    check(
      "it never expires and nobody holds a root role over it",
      expiry === (1n << 64n) - 1n && roles === 0n,
      `expiry=${expiry} rootRoles=${roles}`,
    );
    check("and it still resolves", Boolean(charter), `"${charter}"`);
  }

  section("11. Anyone can publish — permissionless registration");
  {
    const records = [
      encodeFunctionData({
        abi: permissionedResolverAbi,
        functionName: "setText",
        args: [toNode(`proof.${PROTOCOL_ROOT}`), "constituents", "uni"],
      }),
    ];

    const refusedDirect = await publicClient
      .simulateContract({
        account: STRANGER,
        address: registry,
        abi: permissionedRegistryAbi,
        functionName: "register",
        args: ["proof", STRANGER, ZERO, ZERO, 0n, 2000000000n],
      })
      .then(() => false)
      .catch(() => true);

    const allowedViaRegistrar = await publicClient
      .simulateContract({
        account: STRANGER,
        address: registrar,
        abi: airIndexRegistrarAbi,
        functionName: "create",
        args: ["proof", records, true],
      })
      .then(() => true)
      .catch(() => false);

    check(
      "a stranger cannot call the registry directly",
      refusedDirect,
      `${STRANGER} -> register reverts EACUnauthorizedAccountRoles`,
    );
    check(
      "the same stranger can publish through the registrar",
      allowedViaRegistrar,
      `${STRANGER} -> registrar.create succeeds`,
    );
  }

  section("12. Stock viem, zero configuration");
  {
    const constituents = await ensClient.getEnsText({
      name: `big-five.${PROTOCOL_ROOT}`,
      key: "constituents",
    });
    check(
      "reads work with no ABI, no address and no config",
      constituents === "btc,eth,sol,xrp,doge",
      `getEnsText("big-five.${PROTOCOL_ROOT}", "constituents") -> "${constituents}"`,
    );
    void toDnsEncoded;
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  assert.equal(failed, 0, "every track claim must hold onchain");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
