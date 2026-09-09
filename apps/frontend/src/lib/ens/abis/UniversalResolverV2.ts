export const universalResolverV2Abi = [
  {
    type: "function",
    name: "findResolver",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "node",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "offset",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
] as const;
