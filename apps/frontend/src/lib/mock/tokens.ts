import type { Token, TokenSymbol } from "@/types/index-fund";

export const TOKENS = {
  btc: {
    symbol: "btc",
    name: "Bitcoin",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  },
  eth: {
    symbol: "eth",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000",
  },
  weth: {
    symbol: "weth",
    name: "Wrapped Ether",
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  wbtc: {
    symbol: "wbtc",
    name: "Wrapped Bitcoin",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  },
  sol: {
    symbol: "sol",
    name: "Solana",
    address: "0xd31a59c85ae9d8edefec411d448f90841571b89c",
  },
  xrp: {
    symbol: "xrp",
    name: "XRP",
    address: "0x39fbbabf11738317a448031930706cd3e612e1b9",
  },
  doge: {
    symbol: "doge",
    name: "Dogecoin",
    address: "0x4206931337dc273a630d328da6441786bfad668f",
  },
  uni: {
    symbol: "uni",
    name: "Uniswap",
    address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  },
  aave: {
    symbol: "aave",
    name: "Aave",
    address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
  },
  mkr: {
    symbol: "mkr",
    name: "Maker",
    address: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
  },
  ldo: {
    symbol: "ldo",
    name: "Lido DAO",
    address: "0x5a98fcbea516cf06857215779fd812ca3bef1b32",
  },
  crv: {
    symbol: "crv",
    name: "Curve DAO",
    address: "0xd533a949740bb3306d119cc777fa900ba034cd52",
  },
  link: {
    symbol: "link",
    name: "Chainlink",
    address: "0x514910771af9ca656af840dff83e8264ecf986ca",
  },
  comp: {
    symbol: "comp",
    name: "Compound",
    address: "0xc00e94cb662c3520282e6f5717214004a7f26888",
  },
  snx: {
    symbol: "snx",
    name: "Synthetix",
    address: "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
  },
  arb: {
    symbol: "arb",
    name: "Arbitrum",
    address: "0xb50721bcf8d664c30412cfbc6cf7a15145234ad1",
  },
  op: {
    symbol: "op",
    name: "Optimism",
    address: "0x4200000000000000000000000000000000000042",
  },
  matic: {
    symbol: "matic",
    name: "Polygon",
    address: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
  },
  usdc: {
    symbol: "usdc",
    name: "USD Coin",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  usdt: {
    symbol: "usdt",
    name: "Tether",
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
  dai: {
    symbol: "dai",
    name: "Dai",
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  avax: {
    symbol: "avax",
    name: "Avalanche",
    address: "0x85f138bfee4ef8e540890cfb48f620571d67eda3",
  },
  dot: {
    symbol: "dot",
    name: "Polkadot",
    address: "0x7083609fce4d1d8dc0c979aab8c869ea2c873402",
  },
  ada: {
    symbol: "ada",
    name: "Cardano",
    address: "0x3ee2200efb3400fabb9aacf31297cbdd1d435d47",
  },
  rpl: {
    symbol: "rpl",
    name: "Rocket Pool",
    address: "0xd33526068d116ce69f19a9ee46f0bd304f21a51f",
  },
  fxs: {
    symbol: "fxs",
    name: "Frax Share",
    address: "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
  },
  rndr: {
    symbol: "rndr",
    name: "Render",
    address: "0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24",
  },
  fet: {
    symbol: "fet",
    name: "Fetch.ai",
    address: "0xaea46a60368a7bd060eec7df8cba43b7ef41ad85",
  },
  inj: {
    symbol: "inj",
    name: "Injective",
    address: "0xe28b3b32b6c345a34ff64674606124dd5aceca30",
  },
  tia: {
    symbol: "tia",
    name: "Celestia",
    address: "0xd9b612ea6f0d0dd0d1f8e1e5b9b3f5a2b6c8d4e1",
  },
  sui: {
    symbol: "sui",
    name: "Sui",
    address: "0x84074ea631dec7a4edcd5303d164d5dea4c653d6",
  },
  apt: {
    symbol: "apt",
    name: "Aptos",
    address: "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d",
  },
  near: {
    symbol: "near",
    name: "NEAR Protocol",
    address: "0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4",
  },
  atom: {
    symbol: "atom",
    name: "Cosmos",
    address: "0x8d983cb9388eac77af0474fa441c4815500cb7bb",
  },
} as const satisfies Record<TokenSymbol, Token>;

export const getToken = (symbol: TokenSymbol): Token => TOKENS[symbol];
