export const verifiableFactoryAbi = [
  {
    type: "function",
    name: "deployProxy",
    inputs: [
      {
        name: "implementation",
        type: "address",
        internalType: "address",
      },
      {
        name: "salt",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "proxy",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "verifyContract",
    inputs: [
      {
        name: "proxy",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "implementation",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ProxyDeployed",
    inputs: [
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "proxyAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "salt",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "implementation",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
] as const;
