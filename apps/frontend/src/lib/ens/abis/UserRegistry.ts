export const userRegistryAbi = [
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "rootAccount",
        type: "address",
        internalType: "address",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
