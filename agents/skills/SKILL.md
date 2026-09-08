---
name: ensv2
description: >
  ENSv2 (Sepolia beta) reference for building on the Permissioned Registry, Permissioned
  Resolver, Enhanced Access Control (EAC), Universal Resolver V2, and the Verifiable Factory.
  Covers role bitmaps and their exact values, resource computation, wildcard/subname
  resolution, record aliasing, per-account resolver proxies, subregistry deployment, and the
  registrar flow. Use whenever the task touches ENSv2, ENS subnames, ENS records, namehash,
  DNS-encoded names, EAC roles, `grantRoles`/`authorize*`, `setSubregistry`, `setAlias`,
  the ENSv2 Sepolia deployment, or a name of the form `*.airindex.eth`. Do NOT use for
  ENSv1 concepts (Name Wrapper, fuses, the flat ENS Registry) unless migrating.
---

# ENSv2

ENSv2 replaces the flat ENSv1 registry + BaseRegistrar + Name Wrapper with a **hierarchy of
registries**, **per-account resolver proxies**, and **role-based permissions (EAC)** instead of
one-way fuses.

> ⚠️ Beta. ENS docs state the contracts and interfaces are **not final**. Everything below was
> verified against the deployed Sepolia revision on 2026-09-08 — see
> `apps/agents/research/research.md` for the evidence behind each claim.

**Sources:** [permissioned-registry](https://docs.ens.domains/ensv2/permissioned-registry) ·
[permissioned-resolver](https://docs.ens.domains/ensv2/permissioned-resolver/) ·
[enhanced-access-control](https://docs.ens.domains/ensv2/enhanced-access-control/) ·
[tutorial-contract-developers](https://docs.ens.domains/ensv2/tutorial-contract-developers/)

---

## Read this first — the five things that cause real bugs

1. **Roles are nybbles (4 bits), not bits.** 32 regular + 32 admin slots. Max **15** holders per
   role per resource (a 4-bit counter). `ALL_ROLES = 0x1111…1111`.
2. **`ROOT_RESOURCE` (0) is a master key.** A role held on ROOT applies to *every* resource.
   Name-level revocation is meaningless while a ROOT holder exists.
3. **`authorize*` take DNS-encoded names; record setters take namehashes.** Mixing them
   authorizes the wrong resource — silently.
4. **Never call a resolver directly for user-facing reads.** Aliases apply only inside
   `resolve()`, and direct calls bypass wildcard resolution. Both return empty with **no revert**.
   Always go through the Universal Resolver.
5. **Never cache token IDs.** They regenerate on every role grant/revoke. Key on labelhash.

---

## Sepolia deployment (verified 2026-09-08)

Load from config, never hardcode. Full list: `apps/agents/research/deployments.json`.

| Contract | Address |
|---|---|
| RootRegistry | `0x8115186e8f2e0b0281e86ab91f0f48ba90364354` |
| ETHRegistry | `0xbdc85dd5b15d7ecb354cd7cb6f2c50b4f2c4f0e2` |
| ETHRegistrar | `0xa88553f454b77203b0d036a05c894d555eaaa2cc` |
| UniversalResolverV2 | `0x4a1817d13e9cf196f471725176355c1234b63c70` |
| **UR proxy — call this one** | `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe` |
| VerifiableFactory | `0x10dc6333cdfe1fcef624c6e0a8221b91804cd7ef` |
| PermissionedResolverImpl | `0x9eae5c2730a7dd16bdd1dee6421a1b91e3b0365e` |
| UserRegistryImpl | `0x624a25d67b59d587752ebec8dded8827dae52050` |
| MockUSDC (6 dp) | `0x768f42455a2d082e23ceef7d51e5787c82d67a39` |

**Source of truth for contracts:** `ensdomains/contracts-v2`, tag
**`sepolia-deployment-2026-07-31`**. ⚠️ `main` is pinned to the *June* deployment and is **not**
what is live. Always check out the tag.

**viem needs no configuration on Sepolia.** `viem`'s built-in `sepolia` chain already points
`ensUniversalResolver` at `0xeEeE…EeEe`, and that proxy serves UniversalResolverV2. So
`getEnsAddress` / `getEnsText` resolve ENSv2 names out of the box.

---

## Enhanced Access Control (EAC)

Permission system used by every ENSv2 contract. Up to 2^256 resources, 64 roles per resource
(32 regular + 32 admin), ≤15 holders per role.

- **Resource** — the thing being controlled. Each contract computes its own (see below).
  `ROOT_RESOURCE = 0` means "the whole contract".
- **Role** — one permission, occupying nybble *N* at bits `4N … 4N+3`.
- **Admin role** — same nybble in the upper half: `ROLE_X_ADMIN = ROLE_X << 128`. Holding it
  lets you grant/revoke `ROLE_X` **and** the admin role itself.
- **Check semantics** — `hasRoles(resource, bitmap, account)` returns true if the role is on
  **either** the resource **or** ROOT_RESOURCE.

```
 255         128 127            0
 ┌──────────────┬───────────────┐
 │ Admin Roles  │ Regular Roles │
 └──────────────┴───────────────┘
 63           32 31             0  ← nybble index
```

### Grant / revoke

| Function | Scope |
|---|---|
| `grantRoles(resource, bitmap, account)` / `revokeRoles(…)` | a specific resource — **reverts on ROOT_RESOURCE** |
| `grantRootRoles(bitmap, account)` / `revokeRootRoles(…)` | ROOT_RESOURCE (contract-wide) |

Caller must hold the **admin** role for every role in the bitmap. All four return `true` if
roles actually changed.

### Views and errors

`roles(resource, account)` · `roleCount(resource)` (packed nybble counts) ·
`hasRoles(resource, bitmap, account)` · `hasRootRoles(bitmap, account)` ·
`hasAssignees(resource, bitmap)` · `getAssigneeCount(resource, bitmap)`
Event: `EACRolesChanged(resource, account, oldBitmap, newBitmap)`

```
EACUnauthorizedAccountRoles(uint256,uint256,address)  → 0x4b27a133
EACCannotGrantRoles(uint256,uint256,address)          → 0xd1a3b355
EACCannotRevokeRoles(uint256,uint256,address)         → 0xa604e318
EACRootResourceNotAllowed / EACMaxAssignees / EACMinAssignees / EACInvalidRoleBitmap / EACInvalidAccount
```

### Permanent lock

Revoke a role **and its admin** together — nothing can restore it.

```ts
await wallet.writeContract({ address: resolver, abi, functionName: 'revokeRootRoles',
  args: [ROLE_SET_CONTENTHASH | ROLE_SET_CONTENTHASH_ADMIN, owner] })
```

> **The docs' lock example is incomplete.** Two roles defeat it: **`ROLE_UPGRADE`** (swap the
> UUPS implementation for one ignoring EAC) and **`ROLE_CLEAR`** (`clearRecords` bumps the
> version, making the locked record unreadable). An honest lock revokes all three pairs:
> `SET_CONTENTHASH | CLEAR | UPGRADE` + their admins.

> **A lock is only as strong as ROOT.** On a shared multi-tenant resolver the operator's ROOT
> roles override every name-level revocation. Per-tenant immutability requires **one resolver
> proxy per tenant** (~181k gas).

---

## Permissioned Registry

One ERC1155Singleton token per name, single owner, hierarchical (each name may point at its own
subregistry).

### Roles (`RegistryRolesLib`) — a different namespace from resolver roles

| Role | Value | Scope |
|---|---|---|
| `ROLE_REGISTRAR` | `1 << 0` | root |
| `ROLE_REGISTER_RESERVED` | `1 << 4` | root |
| `ROLE_SET_PARENT` | `1 << 8` | root |
| `ROLE_UNREGISTER` | `1 << 12` | root or name |
| `ROLE_RENEW` | `1 << 16` | root or name |
| `ROLE_SET_SUBREGISTRY` | `1 << 20` | root or name |
| `ROLE_SET_RESOLVER` | `1 << 24` | root or name |
| `ROLE_CAN_TRANSFER_ADMIN` | `(1 << 28) << 128` | root or name — **admin-only, no regular variant** |
| `ROLE_WAS_RESERVED` | `1 << 32` | name only, not revokable |
| `ROLE_SET_URI` | `1 << 36` | root |
| `ROLE_CAN_NAME` | `1 << 120` | root |
| `ROLE_UPGRADE` | `1 << 124` | root |

Resource = `labelhash` with the low 32 bits replaced by `eacVersionId`.

### Lifecycle

`AVAILABLE` → `REGISTERED` (`ROLE_REGISTRAR`, root) · `AVAILABLE` → `RESERVED`
(`ROLE_REGISTRAR`) · `RESERVED` → `REGISTERED` (`ROLE_REGISTER_RESERVED`) ·
→ `AVAILABLE` (`ROLE_UNREGISTER`, root or name) · expired revival (`ROLE_RENEW`, **root**).

### Key functions

```solidity
register(string label, address owner, IRegistry registry, address resolver,
         uint256 roleBitmap, uint64 expires) returns (uint256 tokenId)  // expires = ABSOLUTE timestamp
renew(anyId, uint64 newExpiry)          // cannot reduce → CannotReduceExpiry
unregister(anyId)
setSubregistry(anyId, IRegistry)        // two names → same registry = namespace alias
setResolver(anyId, address)
setParent(IRegistry parent, string label)
getState(anyId) → (status, expiry, latestOwner, tokenId, resource)
getStatus/getExpiry/getTokenId/getResource(anyId)
findOwner/findExpiry/findTokenId(string label)
getSubregistry/getResolver(string label)   // both return address(0) if EXPIRED
roleCount(anyId)
```

**`anyId` polymorphism:** labelhash, tokenId and resource are interchangeable — the registry
zeroes the version bits to find the canonical entry.

Events: `LabelRegistered(tokenId, labelHash, label, owner, expiry, sender)` (label is
**non-indexed** → readable string) · `LabelReserved` · `LabelUnregistered` · `ExpiryUpdated` ·
`SubregistryUpdated` · `ResolverUpdated` · `TokenRegenerated(oldId, newId)` · `TokenResource` ·
`ParentUpdated` · `URIUpdated` · `RegistryCreated`.

### Behaviours that surprise people

- **Token IDs mutate** on every role change (burn + mint) to kill stale marketplace approvals,
  and on re-registration after expiry. Follow `TokenRegenerated`; key your DB on labelhash.
- **Admin roles on a name can only be set at registration time** (`_getSettableRoles` override).
  They can still be revoked afterwards. So `ROLE_CAN_TRANSFER_ADMIN` omitted at registration =
  **permanently non-transferable**, and it cannot be added later.
- **`setApprovalForAll` is all-or-nothing** — the operator inherits *all* the owner's roles on
  *every* name they hold. Not scopable. Prefer explicit grants.
- **Expiry cascades**: an expired name and its whole subtree stop resolving.
- **Emancipation** = a verified implementation with **zero** ROOT assignees for
  `SET_RESOLVER`, `SET_SUBREGISTRY`, `UNREGISTER`, `UPGRADE` (+ admins) and
  `CAN_TRANSFER_ADMIN`. `REGISTRAR`/`RENEW` on ROOT are expected and safe. Verify with
  `roleCount(ROOT_RESOURCE)`. *(Sepolia's `.eth` registry is emancipated — verified.)*

---

## Permissioned Resolver

One UUPS proxy **per account**; all names owned by that account share it. Implements
`IExtendedResolver`, so it can answer for **any descendant name** (wildcard).

### Roles (`PermissionedResolverLib`)

| Role | Value | Scope |
|---|---|---|
| `ROLE_SET_ADDR` | `1 << 0` | root, name, or record |
| `ROLE_SET_TEXT` | `1 << 4` | root, name, or record |
| `ROLE_SET_CONTENTHASH` | `1 << 8` | root or name |
| `ROLE_SET_PUBKEY` | `1 << 12` | root or name |
| `ROLE_SET_ABI` | `1 << 16` | root or name |
| `ROLE_SET_INTERFACE` | `1 << 20` | root or name |
| `ROLE_SET_NAME` | `1 << 24` | root or name |
| `ROLE_SET_ALIAS` | `1 << 28` | **root only** |
| `ROLE_CLEAR` | `1 << 32` | root or name |
| `ROLE_SET_DATA` | `1 << 36` | root, name, or record |
| `ROLE_CAN_NAME` | `1 << 120` | root only |
| `ROLE_UPGRADE` | `1 << 124` | root only |

Admin = `role << 128`. In TypeScript use bigints: `1n << 4n`, `(1n << 4n) << 128n`.

### Resource scheme

```
resource = keccak256(node, part)
part: name-level → bytes32(0) │ text/data key → keccak256(bytes(key)) │ coinType → keccak256(abi.encode(coinType))
```

Permission passes if **any** of four cells grants the role:

| | any record | specific record |
|---|---|---|
| **any name** | `ROOT_RESOURCE` | `resource(0, part)` |
| **specific name** | `resource(namehash, 0)` | `resource(namehash, part)` |

Resolver resources are opaque hashes — **no version structure, no `anyId` polymorphism**
(unlike the registry).

### Granting — `grantRoles`/`revokeRoles` are DISABLED here

They revert `EACCannotGrantRoles` / `EACCannotRevokeRoles`. Use:

| Function | Grants |
|---|---|
| `authorizeNameRoles(dnsName, roleBitmap, account, grant)` | any role(s) on a whole name |
| `authorizeTextRoles(dnsName, key, account, grant)` | `ROLE_SET_TEXT` for one key |
| `authorizeDataRoles(dnsName, key, account, grant)` | `ROLE_SET_DATA` for one key |
| `authorizeAddrRoles(dnsName, coinType, account, grant)` | `ROLE_SET_ADDR` for one coin type |

`grantRootRoles` / `revokeRootRoles` (inherited) still work for ROOT scope.
A name-level grant is a **superset** of any record-level grant.

### Records

`setAddr(node, addr)` · `setAddr(node, coinType, bytes)` · `setText(node, key, value)` ·
`setContenthash(node, bytes)` · `setData(node, key, bytes)` · `setName` · `setPubkey` ·
`setABI` · `setInterface` · `clearRecords(node)` (bumps `recordVersions(node)`) ·
`multicall(bytes[])` · `resolve(dnsName, data)` (IExtendedResolver) · `getAlias(dnsName)`

`initialize(admin, roleBitmap, bytes[] setters)` — grants `roleBitmap` to `admin` on ROOT, then
runs `setters` via multicall **with permission checks bypassed**. Deploy + seed records in one tx.

### Wildcard / subname resolution — verified on-chain

**A subname that was never registered anywhere still resolves off an ancestor's resolver, and
the resolver receives the namehash of the FULL name.**

`LibRegistry.findResolver` walks down from the root remembering the deepest resolver found,
while always extending the namehash. `resolve()` then rewrites the node from the full name — it
never asks a registry whether the name exists. Works at any depth (verified 1, 2 and 3 labels
deep), including when a subregistry exists but the label is unregistered.

```ts
// weth.defi-blue.airindex.eth registered NOWHERE — this still works
await client.getEnsAddress({ name: 'weth.defi-blue.airindex.eth' })
await client.getEnsText({ name: 'weth.defi-blue.airindex.eth', key: 'weight' })
```

To write to such a name you need `ROLE_SET_ADDR`/`ROLE_SET_TEXT` on ROOT of that resolver
(the check is a pure hash of the namehash — no existence check).

### Aliasing

```ts
setAlias(dnsEncode('wallet.eth'), dnsEncode('alice.eth'))   // both DNS-encoded
setAlias(dnsEncode('wallet.eth'), '0x')                     // remove — NOT '0x00' (that is root!)
```

- Requires `ROLE_SET_ALIAS` on **ROOT_RESOURCE** only.
- **Works only through `resolve()`.** Direct `addr()`/`text()` on an aliased node return empty.
- Both names must sit on the **same resolver instance**, and the contract does **not** check —
  a mismatch is a **silent no-op**. Assert `UR.findResolver(from) == UR.findResolver(to)` first.
- Self-reference is detected; longer cycles (A→B→A) are **not** and cause out-of-gas. Never chain.

Resolver aliasing shares **records**; registry aliasing (`setSubregistry` to the same registry)
shares **namespaces** — and since a registry holds one ERC-1155 entry per label, both parents
share the *same token*. That is a **live mirror, not a fork**.

---

## Verifiable Factory — deploying proxies

```solidity
deployProxy(address implementation, uint256 salt, bytes data) returns (address proxy)
// outerSalt = keccak256(abi.encode(msg.sender, salt));  CREATE2 from the factory
// then: IUUPSProxy(proxy).initialize(implementation, data)
// emits ProxyDeployed(msg.sender, proxy, salt, implementation)
```

Address derives from **(factory, deployer, salt)** — deploy from the intended deployer.
`verifyContract(proxy)` returns the implementation, or reverts — free on-chain proof that a
proxy is a genuine instance of the audited implementation.

**The two initializers differ** (passing the wrong one reverts with no useful message):

```ts
// PermissionedResolver — 3 args
encodeFunctionData({ abi, functionName: 'initialize', args: [admin, roleBitmap, setters] })
// UserRegistry — 2 args
encodeFunctionData({ abi, functionName: 'initialize', args: [rootAccount, roleBitmap] })
```

**Measured gas (Sepolia):** resolver proxy **181,246** · registry proxy **181,053**. Cheap
enough that per-tenant resolvers are the right default.

---

## Subregistry setup

```ts
// 1. deploy
const registry = await factory.deployProxy(UserRegistryImpl, salt,
  encodeFunctionData({ abi, functionName: 'initialize', args: [owner, REGISTRY_ROLES] }))

// 2. attach — REQUIRED, or names mint tokens but never resolve
await ethRegistry.setSubregistry(BigInt(keccak256(toHex('nick'))), registry)

// 3. pin position, then lock it
await registry.setParent(ethRegistryAddress, 'nick')
await registry.revokeRootRoles(ROLE_SET_PARENT | ROLE_SET_PARENT_ADMIN, owner)

// 4. authorize a registrar contract, if you have one
await registry.grantRootRoles(ROLE_REGISTRAR | ROLE_RENEW, registrarAddress)
```

> **The #1 setup failure:** step 4 reverts `EACCannotGrantRoles` because the `roleBitmap` passed
> to `initialize` omitted `ROLE_REGISTRAR_ADMIN` / `ROLE_RENEW_ADMIN`. Granting a role requires
> holding its **admin** variant. Include every admin you might ever need — you cannot add them later.

### Registrar pattern

A registrar is a plain contract in front of a registry: it validates, prices, collects payment,
then calls `registry.register(...)`. It needs `ROLE_REGISTRAR | ROLE_RENEW` on the registry's
ROOT_RESOURCE. The registration `roleBitmap` defines the trust model — the ETH Registrar uses:

```solidity
ROLE_SET_SUBREGISTRY | ROLE_SET_SUBREGISTRY_ADMIN
| ROLE_SET_RESOLVER | ROLE_SET_RESOLVER_ADMIN
| ROLE_CAN_TRANSFER_ADMIN
```

Foundry setup:

```
forge install ensdomains/contracts-v2
# foundry.toml
remappings = [
  "@ensdomains/contracts-v2/=lib/contracts-v2/contracts/src/",
  "@openzeppelin/contracts/=lib/contracts-v2/contracts/lib/openzeppelin-contracts/contracts/",
]
```

---

## `.eth` registration on the Sepolia beta

**Paid in MockUSDC/MockDAI, not ETH** — `register` is non-payable and takes an `IERC20`.
`MockUSDC.mint(address,uint256)` is **public and unpermissioned**, so registration is effectively
free; you only need Sepolia ETH for gas. ~8.00 USDC/year for a 8-character name.

```
mint → approve(ETHRegistrar, price) → makeCommitment(...) → commit(...)
     → wait > MIN_COMMITMENT_AGE (60s, max 86400s) → register(...)
```

```solidity
register(string label, address owner, bytes32 secret, IRegistry subregistry, address resolver,
         uint64 duration, IERC20 paymentToken, bytes32 referrer) returns (uint256)
getRegisterPrice(string label, uint64 duration, IERC20 token) returns (uint256 base, uint256 premium)
isAvailable(string label) returns (bool)
```

`register` takes `subregistry` and `resolver` inline — deploy both first and wire everything in
one transaction.

---

## Client libraries

| Task | Use |
|---|---|
| Reads | **stock viem** — `getEnsAddress` / `getEnsText`, zero config on Sepolia |
| Writes | **raw viem `writeContract`** with real ABIs |
| ENSjs | **don't** — `5.0.0-alpha.1` has *no* ENSv2 write support; its wallet surface is still ENSv1 (`setFuses`, `wrapName`) and `public/v2` exposes only two read helpers |

**Text vs data records:** neither viem nor ENSjs supports ENSIP-24 `data`/`setData`. Prefer
**text records** for portability unless you control every reader. Always `normalize()`
(`viem/ens`) user input before computing a namehash.

**Indexing:** there is **no ENSv2 subgraph**. For your own registry, read `LabelRegistered`
directly (the `label` field is non-indexed, so you get the string). For general indexing, watch
RootRegistry + ETHRegistry, discover contracts via `SubregistryUpdated` / `ResolverUpdated`, and
watch `VerifiableFactory.ProxyDeployed`.

⚠️ **Wildcard subnames emit no registry events** — they are invisible to enumeration. If you use
them, store the label list yourself (e.g. `text("constituents") = "weth,wbtc"` on the parent).

---

## Migrating from ENSv1

| ENSv1 | ENSv2 |
|---|---|
| Registry + BaseRegistrar + NameWrapper | one Permissioned Registry per name |
| ERC721 / ERC1155 wrapper | ERC1155Singleton, single owner |
| One-way fuse burn | reversible roles (irreversible once the admin role is gone) |
| `CANNOT_TRANSFER` | omit / revoke `ROLE_CAN_TRANSFER_ADMIN` |
| `CANNOT_SET_RESOLVER` | revoke `ROLE_SET_RESOLVER` |
| `CANNOT_CREATE_SUBDOMAIN` | revoke `ROLE_REGISTRAR` |
| Single shared PublicResolver | per-account resolver proxy |
| `clearRecords()` | record versioning (`clearRecords` bumps the version) |
| Fixed token IDs | **mutable** token IDs |

---

## Checklist before shipping

- [ ] Addresses loaded from config, pinned to `sepolia-deployment-2026-07-31` — not `main`
- [ ] All reads go through the Universal Resolver, never a resolver contract directly
- [ ] `authorize*` calls pass **DNS-encoded** names; setters pass **namehashes**
- [ ] `initialize` roleBitmap includes the `_ADMIN` variant of everything you may delegate
- [ ] Nothing caches a token ID
- [ ] Locks revoke `SET_CONTENTHASH | CLEAR | UPGRADE` + admins, not just the first
- [ ] `roleCount(ROOT_RESOURCE)` checked if you claim immutability or emancipation
- [ ] Wildcard subname labels recorded somewhere enumerable
- [ ] `setAlias` clears with `'0x'`, both names verified on the same resolver, no alias chains
- [ ] User-supplied labels passed through `normalize()` before namehash
