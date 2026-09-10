/** Only what the app calls. Full ABI in apps/contracts/out. */
export const airIndexRegistrarAbi = [
  {
    type: "function",
    name: "create",
    stateMutability: "nonpayable",
    inputs: [
      { name: "label", type: "string" },
      { name: "records", type: "bytes[]" },
      { name: "transferable", type: "bool" },
    ],
    outputs: [
      { name: "resolver", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "IndexCreated",
    inputs: [
      { name: "label", type: "string", indexed: false },
      { name: "owner", type: "address", indexed: true },
      { name: "resolver", type: "address", indexed: false },
      { name: "tokenId", type: "uint256", indexed: false },
    ],
  },
] as const;

export const getAirIndexRegistrar = (): `0x${string}` | undefined =>
  process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRAR as `0x${string}` | undefined;
