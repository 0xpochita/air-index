import assert from "node:assert/strict";
import { ensClient } from "../src/lib/ens/client";
import { ENS_DEPLOYMENT } from "../src/lib/ens/deployments";
import { toDnsEncoded, toEnsName, toNode } from "../src/lib/ens/name";
import {
  getAssigneeCount,
  isMethodologyLocked,
  METHODOLOGY_LOCK_BITMAP,
  REGISTRY_ROLE,
  RESOLVER_ROLE,
} from "../src/lib/ens/roles";

const ETH_REGISTRY_ROOT_ROLE_COUNTS =
  452312848583266388373324183574235730989896496894242753832103786389059010849n;

const checkRoleConstants = () => {
  assert.equal(RESOLVER_ROLE.SET_ADDR, 1n);
  assert.equal(RESOLVER_ROLE.SET_TEXT, 16n);
  assert.equal(RESOLVER_ROLE.SET_CONTENTHASH, 256n);
  assert.equal(RESOLVER_ROLE.SET_ALIAS, 268435456n);
  assert.equal(REGISTRY_ROLE.REGISTRAR, 1n);
  assert.equal(REGISTRY_ROLE.SET_RESOLVER, 16777216n);
  assert.notEqual(RESOLVER_ROLE.SET_TEXT, REGISTRY_ROLE.SET_RESOLVER);
};

const checkNybbleDecoding = () => {
  const counts = ETH_REGISTRY_ROOT_ROLE_COUNTS;
  assert.equal(getAssigneeCount(counts, REGISTRY_ROLE.REGISTRAR), 1);
  assert.equal(getAssigneeCount(counts, REGISTRY_ROLE.RENEW), 2);
  assert.equal(getAssigneeCount(counts, REGISTRY_ROLE.SET_RESOLVER), 0);
  assert.equal(getAssigneeCount(counts, REGISTRY_ROLE.UPGRADE), 0);
};

const checkMethodologyLock = () => {
  assert.equal(isMethodologyLocked(0n), true);
  assert.equal(isMethodologyLocked(RESOLVER_ROLE.SET_CONTENTHASH), false);
  assert.equal(isMethodologyLocked(RESOLVER_ROLE.UPGRADE), false);
  assert.equal(isMethodologyLocked(RESOLVER_ROLE.CLEAR), false);
  assert.equal(isMethodologyLocked(RESOLVER_ROLE.SET_TEXT), true);
  assert.equal(
    isMethodologyLocked(RESOLVER_ROLE.SET_CONTENTHASH << 128n),
    false,
    "an admin holder can regrant, so the lock is not final",
  );
  for (const role of [
    RESOLVER_ROLE.SET_CONTENTHASH,
    RESOLVER_ROLE.CLEAR,
    RESOLVER_ROLE.UPGRADE,
  ]) {
    assert.equal((METHODOLOGY_LOCK_BITMAP & role) === role, true);
    assert.equal(
      (METHODOLOGY_LOCK_BITMAP & (role << 128n)) === role << 128n,
      true,
    );
  }
};

const checkNameEncoding = () => {
  assert.equal(toEnsName("Defi-Blue"), "defi-blue.airindex.eth");
  assert.equal(
    toNode("allow.eth"),
    "0xb93430f485b36cf4db208a5dca1b6ed2d89008563e872c22ee72123a9a5b2a2c",
  );
  assert.equal(toDnsEncoded("allow.eth"), "0x05616c6c6f770365746800");
};

const checkWildcardResolution = async () => {
  const registered = await ensClient.readContract({
    address: ENS_DEPLOYMENT.universalResolver,
    abi: [
      {
        type: "function",
        name: "findResolver",
        stateMutability: "view",
        inputs: [{ name: "name", type: "bytes" }],
        outputs: [
          { name: "resolver", type: "address" },
          { name: "node", type: "bytes32" },
          { name: "offset", type: "uint256" },
        ],
      },
    ] as const,
    functionName: "findResolver",
    args: [toDnsEncoded("weth.allow.eth")],
  });

  const [resolver, node, offset] = registered;
  assert.notEqual(resolver, "0x0000000000000000000000000000000000000000");
  assert.equal(
    node,
    toNode("weth.allow.eth"),
    "resolver must receive the full namehash",
  );
  assert.ok(offset > 0n, "a wildcard hit reports a non-zero offset");
  return { resolver, offset };
};

const run = async () => {
  checkRoleConstants();
  checkNybbleDecoding();
  checkMethodologyLock();
  checkNameEncoding();
  console.log("offline checks passed");

  const wildcard = await checkWildcardResolution();
  console.log(
    `wildcard resolution passed: resolver ${wildcard.resolver}, offset ${wildcard.offset}`,
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
