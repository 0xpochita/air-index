const ADMIN_SHIFT = 128n;

const withAdmin = (role: bigint): bigint => role | (role << ADMIN_SHIFT);

/**
 * Permissioned Resolver roles, verified against
 * `contracts/src/resolver/libraries/PermissionedResolverLib.sol` at the deployed
 * tag. Each role occupies a nybble, not a bit, so values step by four.
 */
export const RESOLVER_ROLE = {
  SET_ADDR: 1n << 0n,
  SET_TEXT: 1n << 4n,
  SET_CONTENTHASH: 1n << 8n,
  SET_PUBKEY: 1n << 12n,
  SET_ABI: 1n << 16n,
  SET_INTERFACE: 1n << 20n,
  SET_NAME: 1n << 24n,
  SET_ALIAS: 1n << 28n,
  CLEAR: 1n << 32n,
  SET_DATA: 1n << 36n,
  UPGRADE: 1n << 124n,
} as const;

/**
 * Permissioned Registry roles, verified against
 * `contracts/src/registry/libraries/RegistryRolesLib.sol`. These are a separate
 * namespace from the resolver roles and the values collide, so never mix them.
 */
export const REGISTRY_ROLE = {
  REGISTRAR: 1n << 0n,
  REGISTER_RESERVED: 1n << 4n,
  SET_PARENT: 1n << 8n,
  UNREGISTER: 1n << 12n,
  RENEW: 1n << 16n,
  SET_SUBREGISTRY: 1n << 20n,
  SET_RESOLVER: 1n << 24n,
  CAN_TRANSFER_ADMIN: (1n << 28n) << ADMIN_SHIFT,
  SET_URI: 1n << 36n,
  UPGRADE: 1n << 124n,
} as const;

/**
 * The three role pairs that must be revoked together for a methodology lock to
 * hold. Revoking only SET_CONTENTHASH leaves two escapes: UPGRADE can swap the
 * implementation for one that ignores access control, and CLEAR can bump the
 * record version so the locked value reads back empty.
 */
export const METHODOLOGY_LOCK_BITMAP =
  withAdmin(RESOLVER_ROLE.SET_CONTENTHASH) |
  withAdmin(RESOLVER_ROLE.CLEAR) |
  withAdmin(RESOLVER_ROLE.UPGRADE);

const NYBBLE_MASK = 0xfn;
const NYBBLE_BITS = 4n;

/** Read the assignee count for a single role out of a packed `roleCount` bitmap. */
export const getAssigneeCount = (roleCounts: bigint, role: bigint): number => {
  const nybbleIndex = BigInt(role.toString(2).length - 1) / NYBBLE_BITS;
  return Number((roleCounts >> (nybbleIndex * NYBBLE_BITS)) & NYBBLE_MASK);
};

/**
 * A methodology is locked when no account holds the contenthash, clear or
 * upgrade roles on the resolver's ROOT_RESOURCE, nor their admin counterparts.
 */
export const isMethodologyLocked = (rootRoleCounts: bigint): boolean =>
  [
    RESOLVER_ROLE.SET_CONTENTHASH,
    RESOLVER_ROLE.CLEAR,
    RESOLVER_ROLE.UPGRADE,
  ].every(
    (role) =>
      getAssigneeCount(rootRoleCounts, role) === 0 &&
      getAssigneeCount(rootRoleCounts, role << ADMIN_SHIFT) === 0,
  );

/**
 * An entry is transferable only while somebody holds CAN_TRANSFER_ADMIN on its
 * token. The role has no regular variant and cannot be granted after
 * registration, so this reads as a permanent property of the entry.
 */
export const isTransferable = (tokenRoleCounts: bigint): boolean =>
  getAssigneeCount(tokenRoleCounts, REGISTRY_ROLE.CAN_TRANSFER_ADMIN) > 0;
