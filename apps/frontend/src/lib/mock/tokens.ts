import {
  TOKEN_SYMBOLS,
  type Token,
  type TokenSymbol,
} from "@/types/index-fund";
import sepolia from "./sepolia-tokens.json";

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

interface TokenMeta {
  name: string;
  decimals: number;
}

const DEFAULT_DECIMALS = 18;

/**
 * Display metadata, hand maintained. Addresses are not here on purpose: they
 * come from `sepolia-tokens.json`, which `pnpm deploy-tokens` writes from the
 * receipts it actually got back. A symbol with no entry there resolves to the
 * zero address and is treated as not tradeable on this network.
 */
const TOKEN_META: Record<TokenSymbol, TokenMeta> = {
  btc: { name: "Bitcoin", decimals: 8 },
  eth: { name: "Ethereum", decimals: 18 },
  weth: { name: "Wrapped Ether", decimals: 18 },
  wbtc: { name: "Wrapped Bitcoin", decimals: 8 },
  sol: { name: "Solana", decimals: 9 },
  xrp: { name: "XRP", decimals: 6 },
  doge: { name: "Dogecoin", decimals: 8 },
  uni: { name: "Uniswap", decimals: 18 },
  aave: { name: "Aave", decimals: 18 },
  mkr: { name: "Maker", decimals: 18 },
  ldo: { name: "Lido DAO", decimals: 18 },
  crv: { name: "Curve DAO", decimals: 18 },
  link: { name: "Chainlink", decimals: 18 },
  comp: { name: "Compound", decimals: 18 },
  snx: { name: "Synthetix", decimals: 18 },
  arb: { name: "Arbitrum", decimals: 18 },
  op: { name: "Optimism", decimals: 18 },
  matic: { name: "Polygon", decimals: 18 },
  usdc: { name: "USD Coin", decimals: 6 },
  usdt: { name: "Tether", decimals: 6 },
  dai: { name: "Dai", decimals: 18 },
  avax: { name: "Avalanche", decimals: 18 },
  dot: { name: "Polkadot", decimals: 10 },
  ada: { name: "Cardano", decimals: 6 },
  rpl: { name: "Rocket Pool", decimals: 18 },
  fxs: { name: "Frax Share", decimals: 18 },
  rndr: { name: "Render", decimals: 18 },
  fet: { name: "Fetch.ai", decimals: 18 },
  inj: { name: "Injective", decimals: 18 },
  tia: { name: "Celestia", decimals: 6 },
  sui: { name: "Sui", decimals: 9 },
  apt: { name: "Aptos", decimals: 8 },
  near: { name: "NEAR Protocol", decimals: 18 },
  atom: { name: "Cosmos", decimals: 6 },
};

const DEPLOYED = sepolia.tokens as Partial<Record<TokenSymbol, `0x${string}`>>;

/** `eth` has no ERC20 to deploy; every other zero address means "not deployed yet". */
export const NATIVE_SYMBOLS = new Set<TokenSymbol>(["eth"]);

export const TOKENS = Object.fromEntries(
  TOKEN_SYMBOLS.map((symbol) => [
    symbol,
    {
      symbol,
      name: TOKEN_META[symbol].name,
      decimals: TOKEN_META[symbol].decimals,
      address: DEPLOYED[symbol] ?? ZERO_ADDRESS,
    } satisfies Token,
  ]),
) as Record<TokenSymbol, Token>;

export const getToken = (symbol: TokenSymbol): Token => TOKENS[symbol];

const isTokenSymbol = (symbol: string): symbol is TokenSymbol =>
  symbol in TOKENS;

/** Display metadata lookup for a symbol published onchain. */
export const findToken = (symbol: string): Token | undefined =>
  isTokenSymbol(symbol) ? TOKENS[symbol] : undefined;

/** True when the symbol has a real ERC20 on Sepolia that can hold a balance. */
export const isDeployed = (token: Pick<Token, "address">): boolean =>
  token.address !== ZERO_ADDRESS;

export const getTokenDecimals = (symbol: string): number =>
  findToken(symbol)?.decimals ?? DEFAULT_DECIMALS;

/** The symbols the deploy script mints, in a stable order. */
export const getDeployableSymbols = (): TokenSymbol[] =>
  TOKEN_SYMBOLS.filter((symbol) => !NATIVE_SYMBOLS.has(symbol));
