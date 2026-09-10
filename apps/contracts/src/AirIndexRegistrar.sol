// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVerifiableFactory {
    function deployProxy(address implementation, uint256 salt, bytes calldata data) external returns (address);
}

interface IPermissionedRegistry {
    function register(
        string calldata label,
        address owner,
        address registry,
        address resolver,
        uint256 roleBitmap,
        uint64 expiry
    ) external returns (uint256);
}

interface IPermissionedResolver {
    function initialize(address admin, uint256 roleBitmap, bytes[] calldata setters) external;
}

/// @notice Lets anyone publish an index under `airindex.eth`.
///
/// `REGISTRAR` on a Permissioned Registry is a role, and Enhanced Access Control
/// caps a role at fifteen holders — so "anyone can register" cannot be expressed
/// by granting the role around. It is expressed by giving the role to one
/// contract that refuses to keep anything for itself.
///
/// The caller ends up owning both halves: the registry entry is registered to
/// `msg.sender`, and the resolver is initialised with `msg.sender` as its admin.
/// This contract holds no role on either afterwards.
contract AirIndexRegistrar {
    uint256 private constant ADMIN_SHIFT = 128;

    /// PermissionedResolverLib. Each role occupies a nybble, so values step by four.
    uint256 private constant SET_ADDR = 1 << 0;
    uint256 private constant SET_TEXT = 1 << 4;
    uint256 private constant SET_CONTENTHASH = 1 << 8;
    uint256 private constant SET_ALIAS = 1 << 28;
    uint256 private constant CLEAR = 1 << 32;
    uint256 private constant SET_DATA = 1 << 36;
    uint256 private constant UPGRADE = 1 << 124;

    /// RegistryRolesLib. A separate namespace whose values collide with the above.
    uint256 private constant SET_SUBREGISTRY = 1 << 20;
    uint256 private constant SET_RESOLVER = 1 << 24;
    uint256 private constant CAN_TRANSFER_ADMIN = (1 << 28) << ADMIN_SHIFT;

    uint64 private constant REGISTRATION_PERIOD = 365 days;

    IVerifiableFactory public immutable factory;
    IPermissionedRegistry public immutable registry;
    address public immutable resolverImplementation;

    event IndexCreated(string label, address indexed owner, address resolver, uint256 tokenId);

    constructor(address _factory, address _registry, address _resolverImplementation) {
        factory = IVerifiableFactory(_factory);
        registry = IPermissionedRegistry(_registry);
        resolverImplementation = _resolverImplementation;
    }

    function _withAdmin(uint256 role) private pure returns (uint256) {
        return role | (role << ADMIN_SHIFT);
    }

    /**
     * The role set every index gets. Fixed here rather than taken from the
     * caller, because two of these cannot be added later and getting them wrong
     * is silent until the day you need them:
     *
     * - SET_ALIAS is root-only and its admin cannot be granted after
     *   registration, so an index that ships without it can never have a ticker
     *   or a mirror.
     * - CONTENTHASH, CLEAR and UPGRADE have to be present in order to be burnt,
     *   which is what the methodology lock does.
     */
    function resolverRoles() public pure returns (uint256) {
        return _withAdmin(SET_ADDR) | _withAdmin(SET_TEXT) | _withAdmin(SET_DATA)
            | _withAdmin(SET_CONTENTHASH) | _withAdmin(SET_ALIAS) | _withAdmin(CLEAR) | _withAdmin(UPGRADE);
    }

    /// CAN_TRANSFER_ADMIN has no regular variant and cannot be granted later.
    function indexRoles(bool transferable) public pure returns (uint256) {
        uint256 roles = _withAdmin(SET_RESOLVER) | _withAdmin(SET_SUBREGISTRY);
        return transferable ? roles | CAN_TRANSFER_ADMIN : roles;
    }

    /**
     * Publishes an index in one transaction.
     *
     * `records` are executed inside the resolver's `initialize`, where access
     * control is bypassed. That is what makes a single call possible: this
     * contract never needs a role on the resolver it just deployed, so it never
     * has one to abuse.
     */
    function create(string calldata label, bytes[] calldata records, bool transferable)
        external
        returns (address resolver, uint256 tokenId)
    {
        resolver = factory.deployProxy(
            resolverImplementation,
            uint256(keccak256(abi.encodePacked(label, msg.sender, block.timestamp))),
            abi.encodeCall(IPermissionedResolver.initialize, (msg.sender, resolverRoles(), records))
        );

        tokenId = registry.register(
            label, msg.sender, address(0), resolver, indexRoles(transferable), uint64(block.timestamp) + REGISTRATION_PERIOD
        );

        emit IndexCreated(label, msg.sender, resolver, tokenId);
    }
}
