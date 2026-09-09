export const permissionedRegistryAbi = [
  {
    type: "function",
    name: "findExpiry",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "findOwner",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "findTokenId",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getResolver",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getState",
    inputs: [
      {
        name: "anyId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "state",
        type: "tuple",
        internalType: "struct IPermissionedRegistry.State",
        components: [
          {
            name: "status",
            type: "uint8",
            internalType: "enum IPermissionedRegistry.Status",
          },
          {
            name: "expiry",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "latestOwner",
            type: "address",
            internalType: "address",
          },
          {
            name: "tokenId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "resource",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStatus",
    inputs: [
      {
        name: "anyId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum IPermissionedRegistry.Status",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSubregistry",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IRegistry",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "grantRootRoles",
    inputs: [
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "register",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "registry",
        type: "address",
        internalType: "contract IRegistry",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expiry",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeRootRoles",
    inputs: [
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "roleCount",
    inputs: [
      {
        name: "anyId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setParent",
    inputs: [
      {
        name: "parent",
        type: "address",
        internalType: "contract IRegistry",
      },
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setResolver",
    inputs: [
      {
        name: "anyId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setSubregistry",
    inputs: [
      {
        name: "anyId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "registry",
        type: "address",
        internalType: "contract IRegistry",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "LabelRegistered",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "labelHash",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "owner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "expiry",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
] as const;
