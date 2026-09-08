import type {
  Constituent,
  IndexCollection,
  IndexFund,
  PortfolioPosition,
  TokenSymbol,
} from "@/types/index-fund";
import { getToken } from "./tokens";

const PROTOCOL_ROOT = "airindex.eth";

const buildConstituents = (
  allocation: ReadonlyArray<readonly [TokenSymbol, number]>,
): Constituent[] =>
  allocation.map(([symbol, weightBps]) => ({
    token: getToken(symbol),
    weightBps,
  }));

const INDEXES: IndexFund[] = [
  {
    slug: "defi-blue",
    ensName: `defi-blue.${PROTOCOL_ROOT}`,
    ticker: "dfbl",
    name: "DeFi Blue Chips",
    description:
      "Governance tokens of the most battle-tested lending and trading protocols.",
    constituents: buildConstituents([
      ["uni", 3000],
      ["aave", 2500],
      ["mkr", 2000],
      ["ldo", 1500],
      ["crv", 1000],
    ]),
    allTimeReturnPct: 24.18,
    dayReturnPct: -2.14,
    holders: 412,
    totalDepositsUsd: 1_284_930.55,
    isMethodologyLocked: true,
    methodologyCid:
      "bafybeigdyrztktx5b2n3xq7hb4dfnwaqgzvqmcf5w6ltmkzhg3q7ftaqfa",
    creator: "0x4ba1e9e275ef61b56c99532d0066506436201d73",
    rebalancer: {
      label: "Quarterly Cap Weighting",
      address: "0x9c2f7a1de4b3086efc51a09b5d7e2fbc4a1d8e60",
      mandate:
        "Rebalance to float-adjusted market cap on the first block of each quarter.",
      delegatedKey: "weight",
    },
  },
  {
    slug: "big-five",
    ensName: `big-five.${PROTOCOL_ROOT}`,
    ticker: "bg5",
    name: "The Big Five",
    description: "An equal weighted basket of BTC, ETH, SOL, XRP and DOGE.",
    constituents: buildConstituents([
      ["btc", 2000],
      ["eth", 2000],
      ["sol", 2000],
      ["xrp", 2000],
      ["doge", 2000],
    ]),
    allTimeReturnPct: 61.42,
    dayReturnPct: 1.87,
    holders: 1_308,
    totalDepositsUsd: 4_902_117.4,
    isMethodologyLocked: true,
    methodologyCid:
      "bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354",
    creator: "0x4ba1e9e275ef61b56c99532d0066506436201d73",
    rebalancer: {
      label: "Monthly Equal Weight",
      address: "0x71b3c0a5d2e894f16a7d3c5b8e0f9a2d4c6b1e83",
      mandate:
        "Reset every constituent to a 20.00% target allocation each month.",
      delegatedKey: "weight",
    },
  },
  {
    slug: "l2-basket",
    ensName: `l2-basket.${PROTOCOL_ROOT}`,
    ticker: "l2b",
    name: "Layer 2 Basket",
    description:
      "Native tokens of the leading Ethereum rollups, weighted by settled volume.",
    constituents: buildConstituents([
      ["arb", 4000],
      ["op", 3500],
      ["matic", 2500],
    ]),
    allTimeReturnPct: -8.63,
    dayReturnPct: -4.31,
    holders: 287,
    totalDepositsUsd: 863_240.18,
    isMethodologyLocked: true,
    methodologyCid:
      "bafybeihkoviema7g3gxyt6la7b7kbbv2jfxbzhxr2ymnhqrjbkxjyzfnpi",
    creator: "0x2d8f1a4b7c9e0d3f6a5b8c2e4d7f1a9b3c6e8d05",
    rebalancer: null,
  },
  {
    slug: "safe-stables",
    ensName: `safe-stables.${PROTOCOL_ROOT}`,
    ticker: "safe",
    name: "Safe Stables",
    description:
      "Fully collateralised dollar stablecoins held at parity for treasury parking.",
    constituents: buildConstituents([
      ["usdc", 5000],
      ["usdt", 3000],
      ["dai", 2000],
    ]),
    allTimeReturnPct: 0.04,
    dayReturnPct: 0.01,
    holders: 964,
    totalDepositsUsd: 3_417_882.09,
    isMethodologyLocked: true,
    methodologyCid:
      "bafybeifx7yeb55dxwqwvhtxvvbfr4mqvbf2azyjq6cepkzkkxbtsvzwnfe",
    creator: "0x4ba1e9e275ef61b56c99532d0066506436201d73",
    rebalancer: null,
  },
  {
    slug: "liquid-staking",
    ensName: `liquid-staking.${PROTOCOL_ROOT}`,
    ticker: "lsd",
    name: "Liquid Staking",
    description:
      "Protocols that tokenise staked ether and capture consensus layer yield.",
    constituents: buildConstituents([
      ["ldo", 4500],
      ["rpl", 3000],
      ["fxs", 2500],
    ]),
    allTimeReturnPct: 12.75,
    dayReturnPct: 0.62,
    holders: 176,
    totalDepositsUsd: 512_044.73,
    isMethodologyLocked: false,
    methodologyCid:
      "bafybeidmwqzbkzybxpb7pyqk4dcsy2y6ftnp5hzcv4jnq6fnrwqu3jctgi",
    creator: "0x2d8f1a4b7c9e0d3f6a5b8c2e4d7f1a9b3c6e8d05",
    rebalancer: {
      label: "TVL Weighted",
      address: "0x5e9d2c8b1f4a7306d5c8b2e1f9a4d7c0b3e6a850",
      mandate:
        "Track protocol TVL share with a 5% drift band before rebalancing.",
      delegatedKey: "weight",
    },
  },
  {
    slug: "ai-compute",
    ensName: `ai-compute.${PROTOCOL_ROOT}`,
    ticker: "aic",
    name: "AI and Compute",
    description: "Decentralised inference, rendering and agent networks.",
    constituents: buildConstituents([
      ["rndr", 3500],
      ["fet", 3500],
      ["inj", 3000],
    ]),
    allTimeReturnPct: 38.91,
    dayReturnPct: -6.08,
    holders: 523,
    totalDepositsUsd: 1_776_310.62,
    isMethodologyLocked: false,
    methodologyCid:
      "bafybeigb4nqcyqzvfcqrf5b2xhpfvzq5exsmyx2xzqjqhxvnhqk5ldqrsy",
    creator: "0x8c4e2a9d1b7f0356c8a2d5e9f1b4c7a0d3e6b295",
    rebalancer: null,
  },
  {
    slug: "modular-stack",
    ensName: `modular-stack.${PROTOCOL_ROOT}`,
    ticker: null,
    name: "Modular Stack",
    description:
      "Data availability and execution layers of the modular blockchain thesis.",
    constituents: buildConstituents([
      ["tia", 4000],
      ["sui", 2000],
      ["apt", 2000],
      ["near", 1000],
      ["atom", 1000],
    ]),
    allTimeReturnPct: -15.22,
    dayReturnPct: 3.44,
    holders: 91,
    totalDepositsUsd: 294_558.31,
    isMethodologyLocked: false,
    methodologyCid:
      "bafybeic3dkqzy7ktxvbzqmwmqhg5xn4vqzcgxvfjqkbwlnhqrzyx2fdmqe",
    creator: "0x8c4e2a9d1b7f0356c8a2d5e9f1b4c7a0d3e6b295",
    rebalancer: null,
  },
  {
    slug: "majors-pair",
    ensName: `majors-pair.${PROTOCOL_ROOT}`,
    ticker: "mjr",
    name: "Majors Pair",
    description:
      "A two asset core holding split between wrapped bitcoin and ether.",
    constituents: buildConstituents([
      ["wbtc", 5500],
      ["weth", 4500],
    ]),
    allTimeReturnPct: 47.06,
    dayReturnPct: 0.93,
    holders: 2_140,
    totalDepositsUsd: 8_216_004.87,
    isMethodologyLocked: true,
    methodologyCid:
      "bafybeihqzvmxkbtqfzcyxq5r2wnqjhbkxvzfmqyxc3dqrbkzwnhxvqfmta",
    creator: "0x4ba1e9e275ef61b56c99532d0066506436201d73",
    rebalancer: {
      label: "Volatility Parity",
      address: "0x3f7a2e9c5d1b8046a7c3e5f9b2d4c6a8e0f1b374",
      mandate: "Weight inversely to trailing 90 day realised volatility.",
      delegatedKey: "weight",
    },
  },
  {
    slug: "oracle-infra",
    ensName: `oracle-infra.${PROTOCOL_ROOT}`,
    ticker: null,
    name: "Oracle Infrastructure",
    description:
      "Price feed and interoperability networks that secure onchain settlement.",
    constituents: buildConstituents([
      ["link", 6000],
      ["snx", 2500],
      ["comp", 1500],
    ]),
    allTimeReturnPct: 5.31,
    dayReturnPct: -1.02,
    holders: 148,
    totalDepositsUsd: 407_919.44,
    isMethodologyLocked: false,
    methodologyCid:
      "bafybeifzqkxvbmwnhq3yrcdzxvbqkfmtyxwzqjhbnc5rdqkzvxwmhfqbtu",
    creator: "0x2d8f1a4b7c9e0d3f6a5b8c2e4d7f1a9b3c6e8d05",
    rebalancer: null,
  },
  {
    slug: "alt-l1",
    ensName: `alt-l1.${PROTOCOL_ROOT}`,
    ticker: null,
    name: "Alternative Layer 1",
    description:
      "High throughput settlement layers competing outside the Ethereum stack.",
    constituents: buildConstituents([
      ["sol", 3500],
      ["avax", 2500],
      ["dot", 2000],
      ["ada", 2000],
    ]),
    allTimeReturnPct: 19.84,
    dayReturnPct: 2.27,
    holders: 336,
    totalDepositsUsd: 1_052_663.9,
    isMethodologyLocked: false,
    methodologyCid:
      "bafybeidqzkxwvbmthqnyrc5dzxvbqkfmwyxzqjhbnc3rdqkzvxwmhfqbye",
    creator: "0x8c4e2a9d1b7f0356c8a2d5e9f1b4c7a0d3e6b295",
    rebalancer: null,
  },
  {
    slug: "yield-carry",
    ensName: `yield-carry.${PROTOCOL_ROOT}`,
    ticker: null,
    name: "Yield Carry",
    description:
      "Stable base with a measured allocation to lending governance upside.",
    constituents: buildConstituents([
      ["usdc", 6000],
      ["aave", 2500],
      ["comp", 1500],
    ]),
    allTimeReturnPct: 3.12,
    dayReturnPct: 0.08,
    holders: 205,
    totalDepositsUsd: 688_275.16,
    isMethodologyLocked: false,
    methodologyCid:
      "bafybeiazqkxwvbmthqnyrc5dzxvbqkfmwyxzqjhbnc3rdqkzvxwmhfqbyc",
    creator: "0x2d8f1a4b7c9e0d3f6a5b8c2e4d7f1a9b3c6e8d05",
    rebalancer: null,
  },
  {
    slug: "ether-core",
    ensName: `ether-core.${PROTOCOL_ROOT}`,
    ticker: "eco",
    name: "Ether Core",
    description:
      "Concentrated ether exposure paired with its liquid staking derivative.",
    constituents: buildConstituents([
      ["weth", 7000],
      ["ldo", 3000],
    ]),
    allTimeReturnPct: 31.55,
    dayReturnPct: -0.44,
    holders: 617,
    totalDepositsUsd: 2_338_471.28,
    isMethodologyLocked: true,
    methodologyCid:
      "bafybeibzqkxwvbmthqnyrc5dzxvbqkfmwyxzqjhbnc3rdqkzvxwmhfqbyd",
    creator: "0x4ba1e9e275ef61b56c99532d0066506436201d73",
    rebalancer: null,
  },
];

const indexBySlug = new Map(INDEXES.map((fund) => [fund.slug, fund]));

const pickIndexes = (slugs: readonly string[]): IndexFund[] =>
  slugs.flatMap((slug) => {
    const fund = indexBySlug.get(slug);
    return fund ? [fund] : [];
  });

export const getAllIndexes = (): IndexFund[] =>
  [...INDEXES].sort((a, b) => b.totalDepositsUsd - a.totalDepositsUsd);

export const getIndexBySlug = (slug: string): IndexFund | undefined =>
  indexBySlug.get(slug);

export const getFeaturedIndex = (): IndexFund => INDEXES[1];

export const getCollections = (): IndexCollection[] => [
  {
    id: "defi",
    title: "DeFi",
    indexes: pickIndexes(["defi-blue", "yield-carry", "oracle-infra"]),
  },
  {
    id: "trending",
    title: "Trending",
    indexes: pickIndexes(["majors-pair", "ai-compute", "l2-basket"]),
  },
];

export const getPortfolioPositions = (): PortfolioPosition[] =>
  pickIndexes(["big-five", "defi-blue", "safe-stables"]).map(
    (fund, position) => ({
      index: fund,
      valueUsd: [4_182.55, 1_930.14, 812.4][position],
      dayChangePct: fund.dayReturnPct,
    }),
  );
