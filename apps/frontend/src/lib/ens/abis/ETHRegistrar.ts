export const ethRegistrarAbi = [
  {
    type: "function",
    name: "commit",
    inputs: [
      {
        name: "commitment",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getRegisterPrice",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "duration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "paymentToken",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    outputs: [
      {
        name: "base",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "premium",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAvailable",
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
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "makeCommitment",
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
        name: "secret",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "subregistry",
        type: "address",
        internalType: "contract IRegistry",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "duration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "referrer",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "pure",
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
        name: "secret",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "subregistry",
        type: "address",
        internalType: "contract IRegistry",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "duration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "paymentToken",
        type: "address",
        internalType: "contract IERC20",
      },
      {
        name: "referrer",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
] as const;
