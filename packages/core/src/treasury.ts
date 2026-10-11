import type { Currency } from "./obligations";
import { applyBps, mulDiv, pow10, ratioBps, sum, valueOf, type Bps, type Wad } from "./money";

export type AssetClass = "stablecoin" | "native" | "volatile";

export interface AssetRef {
  symbol: string;
  name?: string;
  chainId: number;
  /** Token contract address, or "native" for the chain's gas token. */
  address: string;
  decimals: number;
  assetClass: AssetClass;
  /** For stablecoins: the currency the token is designed to track. */
  pegCurrency?: Currency;
}

export interface PriceQuote {
  /** Price of one whole token in USD, scaled by `decimals`. */
  price: bigint;
  decimals: number;
  /** Unix seconds when the source last updated the price. */
  updatedAt: number;
  source: string;
  /** Set by the pricing layer when updatedAt exceeds the feed's heartbeat plus grace. */
  stale: boolean;
}

export interface AccountRef {
  id: string;
  label: string;
  chainId: number;
  address: string;
  kind: "safe" | "eoa" | "contract";
  /** Ownership or control has been proven by an organization member. */
  verified: boolean;
  /** Members can exclude earmarked accounts (e.g. a grants wallet) from treasury maths. */
  includeInTreasury: boolean;
  /** Unix seconds of the last successful balance sync, or null if never synced. */
  lastSyncedAt: number | null;
}

export interface Holding {
  accountId: string;
  asset: AssetRef;
  raw: bigint;
  price: PriceQuote | null;
}

export interface Position {
  id: string;
  accountId: string;
  protocol: string;
  venueId: string;
  venueName: string;
  /** Underlying asset of the position. */
  asset: AssetRef;
  /** Underlying assets the position is currently worth (e.g. ERC-4626 convertToAssets(shares)). */
  assetsRaw: bigint;
  /** Underlying assets that could be withdrawn right now, if known (e.g. ERC-4626 maxWithdraw). */
  withdrawableRaw: bigint | null;
  price: PriceQuote | null;
}

export interface ValuationPolicy {
  /** Haircut applied to each stablecoin's value when counting it toward the reserve. Keyed by symbol. */
  haircutsBps: Record<string, number>;
  /** Count accounts whose control has not been verified toward reserve and deployable maths. */
  includeUnverifiedInReserve: boolean;
  /** Stablecoins that may be counted toward the reserve. Empty = all stablecoins. */
  reserveAssets: string[];
  /** Accounts not synced within this many minutes are flagged stale. */
  maxDataAgeMinutes: number;
}

export interface Breakdown {
  key: string;
  label: string;
  value: Wad;
  shareBps: Bps;
}

export interface DataIssue {
  code: "price_missing" | "price_stale" | "account_never_synced" | "account_stale" | "unverified_excluded";
  message: string;
  ref: string;
}

export interface TreasurySnapshot {
  /** Unix seconds the snapshot was computed for. */
  asOf: number;
  /** Market value of everything priced, in every included account. */
  gross: Wad;
  liquid: { total: Wad; stable: Wad; other: Wad };
  allocated: { total: Wad; withdrawableNow: Wad; unknownWithdrawable: Wad };
  /**
   * Liquid stablecoins that count toward the protected reserve, valued
   * conservatively: never above $1 per token, minus the policy haircut, and
   * only in accounts the policy allows.
   */
  reserveEligible: Wad;
  /** Market value held in accounts excluded because their control is unverified. */
  unverifiedValue: Wad;
  byAsset: Breakdown[];
  byChain: Breakdown[];
  byAccount: Breakdown[];
  byProtocol: Breakdown[];
  issues: DataIssue[];
  /** True when no data issue affects the totals. */
  complete: boolean;
}

/** Market value of a token amount at its quote, or null when unpriced. */
export function marketValue(raw: bigint, asset: AssetRef, price: PriceQuote | null): Wad | null {
  if (!price) return null;
  return valueOf(raw, asset.decimals, price.price, price.decimals, "down");
}

/**
 * Conservative value for reserve purposes: stablecoins are never valued above
 * their peg (taken as 1.00 USD for USD stables; EUR stables use the oracle
 * price, which already reflects EUR/USD), then the haircut is deducted.
 */
export function reserveValue(raw: bigint, asset: AssetRef, price: PriceQuote | null, haircutBps: number): Wad | null {
  if (!price || asset.assetClass !== "stablecoin") return null;
  let p = price.price;
  if (asset.pegCurrency === "USD") {
    const one = pow10(price.decimals);
    if (p > one) p = one;
  }
  const value = valueOf(raw, asset.decimals, p, price.decimals, "down");
  return value - applyBps(value, haircutBps, "up");
}

function breakdown(map: Map<string, { label: string; value: Wad }>, total: Wad): Breakdown[] {
  return [...map.entries()]
    .map(([key, { label, value }]) => ({ key, label, value, shareBps: ratioBps(value, total) ?? 0n }))
    .sort((a, b) => (b.value > a.value ? 1 : b.value < a.value ? -1 : a.key.localeCompare(b.key)));
}

function add(map: Map<string, { label: string; value: Wad }>, key: string, label: string, value: Wad) {
  const cur = map.get(key);
  if (cur) cur.value += value;
  else map.set(key, { label, value });
}

export interface ChainLabeler {
  (chainId: number): string;
}

export function computeTreasury(input: {
  asOf: number;
  accounts: AccountRef[];
  holdings: Holding[];
  positions: Position[];
  policy: ValuationPolicy;
  chainName?: ChainLabeler;
}): TreasurySnapshot {
  const { asOf, policy } = input;
  const chainName = input.chainName ?? ((id: number) => `Chain ${id}`);
  const accounts = new Map(input.accounts.map((a) => [a.id, a]));
  const issues: DataIssue[] = [];
  const byAsset = new Map<string, { label: string; value: Wad }>();
  const byChain = new Map<string, { label: string; value: Wad }>();
  const byAccount = new Map<string, { label: string; value: Wad }>();
  const byProtocol = new Map<string, { label: string; value: Wad }>();
  const reserveAssets = new Set(policy.reserveAssets);

  let liquidStable = 0n;
  let liquidOther = 0n;
  let allocatedTotal = 0n;
  let withdrawableNow = 0n;
  let unknownWithdrawable = 0n;
  let reserveEligible = 0n;
  let unverifiedValue = 0n;
  let affectsTotals = false;

  for (const account of input.accounts) {
    if (!account.includeInTreasury) continue;
    if (account.lastSyncedAt === null) {
      issues.push({ code: "account_never_synced", message: `${account.label} has not been synced yet`, ref: account.id });
      affectsTotals = true;
    } else if (asOf - account.lastSyncedAt > policy.maxDataAgeMinutes * 60) {
      issues.push({ code: "account_stale", message: `${account.label} was last synced more than ${policy.maxDataAgeMinutes} minutes ago`, ref: account.id });
      affectsTotals = true;
    }
  }

  const countsForReserve = (account: AccountRef) => account.verified || policy.includeUnverifiedInReserve;

  for (const h of input.holdings) {
    const account = accounts.get(h.accountId);
    if (!account || !account.includeInTreasury || h.raw === 0n) continue;
    const value = marketValue(h.raw, h.asset, h.price);
    const assetKey = `${h.asset.chainId}:${h.asset.address.toLowerCase()}`;
    if (value === null) {
      issues.push({ code: "price_missing", message: `No price for ${h.asset.symbol} on ${chainName(h.asset.chainId)}`, ref: assetKey });
      affectsTotals = true;
      continue;
    }
    if (h.price?.stale) {
      issues.push({ code: "price_stale", message: `${h.asset.symbol} price from ${h.price.source} is stale`, ref: assetKey });
      affectsTotals = true;
    }
    if (h.asset.assetClass === "stablecoin") liquidStable += value;
    else liquidOther += value;
    add(byAsset, h.asset.symbol, h.asset.symbol, value);
    add(byChain, String(h.asset.chainId), chainName(h.asset.chainId), value);
    add(byAccount, account.id, account.label, value);
    add(byProtocol, "wallet", "Held in wallets", value);

    if (!countsForReserve(account)) {
      unverifiedValue += value;
      continue;
    }
    if (h.asset.assetClass === "stablecoin" && (reserveAssets.size === 0 || reserveAssets.has(h.asset.symbol))) {
      const rv = reserveValue(h.raw, h.asset, h.price, policy.haircutsBps[h.asset.symbol] ?? 0);
      if (rv !== null) reserveEligible += rv;
    }
  }

  for (const p of input.positions) {
    const account = accounts.get(p.accountId);
    if (!account || !account.includeInTreasury || p.assetsRaw === 0n) continue;
    const value = marketValue(p.assetsRaw, p.asset, p.price);
    const assetKey = `${p.asset.chainId}:${p.asset.address.toLowerCase()}`;
    if (value === null) {
      issues.push({ code: "price_missing", message: `No price for ${p.asset.symbol} position in ${p.venueName}`, ref: assetKey });
      affectsTotals = true;
      continue;
    }
    if (p.price?.stale) {
      issues.push({ code: "price_stale", message: `${p.asset.symbol} price from ${p.price.source} is stale`, ref: assetKey });
      affectsTotals = true;
    }
    allocatedTotal += value;
    if (p.withdrawableRaw === null) unknownWithdrawable += value;
    else {
      const w = p.withdrawableRaw < p.assetsRaw ? p.withdrawableRaw : p.assetsRaw;
      withdrawableNow += marketValue(w, p.asset, p.price) ?? 0n;
    }
    add(byAsset, p.asset.symbol, p.asset.symbol, value);
    add(byChain, String(p.asset.chainId), chainName(p.asset.chainId), value);
    add(byAccount, account.id, account.label, value);
    add(byProtocol, p.protocol, p.protocol, value);
    if (!countsForReserve(account)) unverifiedValue += value;
  }

  if (unverifiedValue > 0n) {
    issues.push({
      code: "unverified_excluded",
      message: "Some accounts are not verified, so they are excluded from reserve and deployable calculations",
      ref: "accounts",
    });
  }

  const gross = liquidStable + liquidOther + allocatedTotal;
  return {
    asOf,
    gross,
    liquid: { total: liquidStable + liquidOther, stable: liquidStable, other: liquidOther },
    allocated: { total: allocatedTotal, withdrawableNow, unknownWithdrawable },
    reserveEligible,
    unverifiedValue,
    byAsset: breakdown(byAsset, gross),
    byChain: breakdown(byChain, gross),
    byAccount: breakdown(byAccount, gross),
    byProtocol: breakdown(byProtocol, gross),
    issues,
    complete: !affectsTotals,
  };
}

/** Total value of positions per protocol and per venue (used for exposure caps). */
export function exposureByVenue(positions: Position[], accounts: AccountRef[]): { byProtocol: Map<string, Wad>; byVenue: Map<string, Wad> } {
  const included = new Set(accounts.filter((a) => a.includeInTreasury).map((a) => a.id));
  const byProtocol = new Map<string, Wad>();
  const byVenue = new Map<string, Wad>();
  for (const p of positions) {
    if (!included.has(p.accountId)) continue;
    const value = marketValue(p.assetsRaw, p.asset, p.price);
    if (value === null) continue;
    byProtocol.set(p.protocol, (byProtocol.get(p.protocol) ?? 0n) + value);
    byVenue.set(p.venueId, (byVenue.get(p.venueId) ?? 0n) + value);
  }
  return { byProtocol, byVenue };
}

export function totalOf(values: Iterable<Wad>): Wad {
  return sum(values);
}

/** Share of `part` in `whole` in bps; zero when whole is zero. */
export function shareBps(part: Wad, whole: Wad): Bps {
  return whole === 0n ? 0n : mulDiv(part, 10_000n, whole, "down");
}
