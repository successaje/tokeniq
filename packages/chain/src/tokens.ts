import type { AssetClass, Currency } from "@tokeniq/core";

/**
 * Supported assets. This allowlist is also the spam filter: balances of tokens
 * not listed here are never read, shown or counted. Every address must be
 * verified against the issuer's documentation (sources in docs/CONTRACTS.md).
 */
export interface TokenInfo {
  chainId: number;
  /** Checksummed address, or "native" for the gas token. */
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  assetClass: AssetClass;
  pegCurrency?: Currency;
  /** Bridged or legacy variants are tracked but flagged, because their risk differs from the canonical token. */
  variant?: "canonical" | "bridged";
  /** Chainlink price feed used to value the asset. Absent = unpriced (reported as missing data). */
  feed?: PriceFeedRef;
}

export interface PriceFeedRef {
  /** Feed proxy address. */
  address: string;
  pair: string;
  decimals: number;
  /** Seconds between guaranteed updates; prices older than heartbeat + grace are stale. */
  heartbeatSec: number;
}

export const NATIVE = "native";

export const TOKENS: TokenInfo[] = [
  // Ethereum
  { chainId: 1, address: NATIVE, symbol: "ETH", name: "Ether", decimals: 18, assetClass: "native", feed: { address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", pair: "ETH / USD", decimals: 8, heartbeatSec: 3600 } },
  { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6", pair: "USDC / USD", decimals: 8, heartbeatSec: 82800 } },
  { chainId: 1, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D", pair: "USDT / USD", decimals: 8, heartbeatSec: 86400 } },
  { chainId: 1, address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin", decimals: 18, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", pair: "DAI / USD", decimals: 8, heartbeatSec: 3600 } },
  { chainId: 1, address: "0xdC035D45d973E3EC169d2276DDab16f1e407384F", symbol: "USDS", name: "USDS Stablecoin", decimals: 18, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0xfF30586cD0F29eD462364C7e81375FC0C71219b1", pair: "USDS / USD", decimals: 8, heartbeatSec: 82800 } },
  { chainId: 1, address: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c", symbol: "EURC", name: "Euro Coin", decimals: 6, assetClass: "stablecoin", pegCurrency: "EUR", variant: "canonical", feed: { address: "0x04F84020Fdf10d9ee64D1dcC2986EDF2F556DA11", pair: "EURC / USD", decimals: 8, heartbeatSec: 86400 } },
  // Base
  { chainId: 8453, address: NATIVE, symbol: "ETH", name: "Ether", decimals: 18, assetClass: "native", feed: { address: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", pair: "ETH / USD", decimals: 8, heartbeatSec: 1200 } },
  { chainId: 8453, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", name: "USD Coin", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", pair: "USDC / USD", decimals: 8, heartbeatSec: 86400 } },
  { chainId: 8453, address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", symbol: "USDbC", name: "USD Base Coin (bridged)", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "bridged", feed: { address: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", pair: "USDC / USD", decimals: 8, heartbeatSec: 86400 } },
  { chainId: 8453, address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", symbol: "DAI", name: "Dai Stablecoin", decimals: 18, assetClass: "stablecoin", pegCurrency: "USD", variant: "bridged", feed: { address: "0x591e79239a7d679378eC8c847e5038150364C78F", pair: "DAI / USD", decimals: 8, heartbeatSec: 86400 } },
  { chainId: 8453, address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", symbol: "EURC", name: "Euro Coin", decimals: 6, assetClass: "stablecoin", pegCurrency: "EUR", variant: "canonical", feed: { address: "0xDAe398520e2B67cd3f27aeF9Cf14D93D927f8250", pair: "EURC / USD", decimals: 8, heartbeatSec: 86400 } },
  // Arbitrum One
  { chainId: 42161, address: NATIVE, symbol: "ETH", name: "Ether", decimals: 18, assetClass: "native", feed: { address: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612", pair: "ETH / USD", decimals: 8, heartbeatSec: 1755 } },
  { chainId: 42161, address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", name: "USD Coin", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3", pair: "USDC / USD", decimals: 8, heartbeatSec: 255 } },
  { chainId: 42161, address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", symbol: "USDC.e", name: "Bridged USDC", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "bridged", feed: { address: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3", pair: "USDC / USD", decimals: 8, heartbeatSec: 255 } },
  { chainId: 42161, address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", name: "Tether USD", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7", pair: "USDT / USD", decimals: 8, heartbeatSec: 255 } },
  // OP Mainnet
  { chainId: 10, address: NATIVE, symbol: "ETH", name: "Ether", decimals: 18, assetClass: "native", feed: { address: "0x13e3Ee699D1909E989722E753853AE30b17e08c5", pair: "ETH / USD", decimals: 8, heartbeatSec: 1200 } },
  { chainId: 10, address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", symbol: "USDC", name: "USD Coin", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3", pair: "USDC / USD", decimals: 8, heartbeatSec: 86400 } },
  { chainId: 10, address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", symbol: "USDT", name: "Tether USD", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0xECef79E109e997bCA29c1c0897ec9d7b03647F5E", pair: "USDT / USD", decimals: 8, heartbeatSec: 86400 } },
  // Testnets (test tokens have no market value; they are priced at the peg only so flows can be exercised)
  { chainId: 84532, address: NATIVE, symbol: "ETH", name: "Sepolia Ether", decimals: 18, assetClass: "native", feed: { address: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1", pair: "ETH / USD", decimals: 8, heartbeatSec: 1200 } },
  { chainId: 84532, address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", name: "USD Coin (testnet)", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165", pair: "USDC / USD", decimals: 8, heartbeatSec: 86400 } },
  { chainId: 11155111, address: NATIVE, symbol: "ETH", name: "Sepolia Ether", decimals: 18, assetClass: "native", feed: { address: "0x694AA1769357215DE4FAC081bf1f309aDC325306", pair: "ETH / USD", decimals: 8, heartbeatSec: 3600 } },
  { chainId: 11155111, address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", symbol: "USDC", name: "USD Coin (testnet)", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD", variant: "canonical", feed: { address: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E", pair: "USDC / USD", decimals: 8, heartbeatSec: 86400 } },
];

const key = (chainId: number, address: string) => `${chainId}:${address.toLowerCase()}`;
const index = new Map(TOKENS.map((t) => [key(t.chainId, t.address), t]));

export function getToken(chainId: number, address: string): TokenInfo | undefined {
  return index.get(key(chainId, address));
}

export function tokensOn(chainId: number): TokenInfo[] {
  return TOKENS.filter((t) => t.chainId === chainId);
}

export function findTokenBySymbol(chainId: number, symbol: string): TokenInfo | undefined {
  return TOKENS.find((t) => t.chainId === chainId && t.symbol === symbol);
}
