import { wad, type Wad } from "../src/money.js";
import type { Obligation } from "../src/obligations.js";
import type { Opportunity } from "../src/opportunities.js";
import { DEFAULT_TREASURY_POLICY, type TreasuryPolicy } from "../src/policy.js";
import type { AccountRef, AssetRef, Holding, Position, PriceQuote } from "../src/treasury.js";

export const NOW = 1_760_000_000; // 2025-10-09T08:53:20Z
export const TODAY = "2025-10-09";

export const USDC_BASE: AssetRef = {
  symbol: "USDC",
  chainId: 8453,
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  decimals: 6,
  assetClass: "stablecoin",
  pegCurrency: "USD",
};

export const USDT_ETH: AssetRef = {
  symbol: "USDT",
  chainId: 1,
  address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  decimals: 6,
  assetClass: "stablecoin",
  pegCurrency: "USD",
};

export const ETH_BASE: AssetRef = { symbol: "ETH", chainId: 8453, address: "native", decimals: 18, assetClass: "native" };

export function quote(price: string, opts: Partial<PriceQuote> = {}): PriceQuote {
  const [w, f = ""] = price.split(".");
  return { price: BigInt(w + f.padEnd(8, "0")), decimals: 8, updatedAt: NOW - 60, source: "Chainlink", stale: false, ...opts };
}

export function usdc(amount: string | number): bigint {
  const [w, f = ""] = String(amount).split(".");
  return BigInt(w + f.padEnd(6, "0"));
}

export const SAFE: AccountRef = {
  id: "acct-safe",
  label: "Operations Safe",
  chainId: 8453,
  address: "0x1111111111111111111111111111111111111111",
  kind: "safe",
  verified: true,
  includeInTreasury: true,
  lastSyncedAt: NOW - 120,
};

export const WATCH: AccountRef = { ...SAFE, id: "acct-watch", label: "Watch-only wallet", kind: "eoa", verified: false, address: "0x2222222222222222222222222222222222222222" };

export function holding(accountId: string, asset: AssetRef, raw: bigint, price = quote("1")): Holding {
  return { accountId, asset, raw, price };
}

export function position(id: string, accountId: string, raw: bigint, venueId = "morpho:8453:0xvault", withdrawable: bigint | null = raw): Position {
  return { id, accountId, protocol: "morpho", venueId, venueName: "Steady USDC", asset: USDC_BASE, assetsRaw: raw, withdrawableRaw: withdrawable, price: quote("1") };
}

export function obligation(partial: Partial<Obligation> & Pick<Obligation, "id" | "amount">): Obligation {
  return {
    title: partial.id,
    category: "operations",
    direction: "outflow",
    currency: "USD",
    firstDueDate: TODAY,
    recurrence: { freq: "once" },
    certainty: "committed",
    priority: "normal",
    status: "active",
    trackFrom: "2025-01-01",
    ...partial,
  };
}

export function policy(overrides: Partial<TreasuryPolicy> = {}): TreasuryPolicy {
  return { ...DEFAULT_TREASURY_POLICY, ...overrides };
}

export function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "morpho:8453:0xvault",
    protocol: "morpho",
    kind: "erc4626_vault",
    chainId: 8453,
    address: "0x00000000000000000000000000000000000000aa",
    name: "Steady USDC",
    asset: USDC_BASE,
    apy: { nativeBps: 520, rewardsBps: 0, netBps: 520, measurement: "instantaneous" },
    tvlUsd: wad(150_000_000),
    availableLiquidityUsd: wad(40_000_000),
    feeBps: 1000,
    curator: { name: "Example Curator" },
    withdrawal: "instant_subject_to_liquidity",
    warnings: [],
    dependencies: ["Morpho Blue"],
    audits: [],
    listed: true,
    source: { name: "Morpho API", url: "https://api.morpho.org/graphql", fetchedAt: NOW - 300 },
    ...overrides,
  };
}

export const usd = (n: number | string): Wad => wad(String(n));
