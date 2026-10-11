import { getAddress, isAddress } from "viem";
import { parseDecimal, type Opportunity, type Wad } from "@tokeniq/core";
import { assetRefOf } from "./assets.js";
import { isListed } from "./listing.js";
import { getToken, NATIVE, TOKENS } from "./tokens.js";
import { errorMessage } from "./types.js";

/**
 * Morpho vault adapter over the public Morpho GraphQL API.
 *
 * Endpoint: https://api.morpho.org/graphql (Apollo; no key; documented limit 750 req/min,
 * "provided as-is, without a Service Level Agreement"). Verified 2026-10-11 by
 * introspection and live queries. Root fields used: `vaults` (Vault V1 / MetaMorpho)
 * and `vaultV2s` (Vault V2). `whitelisted` was removed from the schema; `listed` replaces it.
 *
 * What the API's APY fields measure (from the schema descriptions):
 * - V1 `state.netApy`: "Vault APY including rewards and underlying yield, after deducting the performance fee";
 *   `state.netApyExcludingRewards`: "Instantaneous vault APY excluding rewards, after deducting the performance fee".
 * - V2 `netApy`: "Current net APY of the vault (after fees, including rewards), derived from liquidity adapter rates";
 *   `netApyExcludingRewards`: "Instantaneous net APY of the vault after all fees (performance + management), excluding rewards".
 * - `avgNetApy(lookback)` / `avgNetApyExcludingRewards(lookback)`: realized averages derived from share-price evolution.
 * So the default (`apyMeasurement: "instantaneous"`) maps to `measurement: "instantaneous"`; the averaged
 * options query `avgNetApy*` with lookback ONE_DAY / SEVEN_DAYS / THIRTY_DAYS.
 * External incentive programs (e.g. Merkl) are not always reflected in the API's rewards.
 *
 * Numbers: the API returns USD amounts, rates and fees as JSON floats. They are
 * converted without float arithmetic: `Number#toFixed(12)` gives the exact decimal
 * expansion of the IEEE-754 double rounded at 12 places, which is then parsed with
 * core `parseDecimal` — USD truncated (rounded down) to 6 decimals before scaling to
 * a wad, APYs rounded down to whole bps, fees rounded up to whole bps (conservative).
 */
export const MORPHO_API_URL = "https://api.morpho.org/graphql";

/** Morpho Blue singleton on Ethereum and Base (docs.morpho.org/developers/contracts/addresses; vault MORPHO() checked on-chain 2026-10-11). */
export const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

/** Audit references, verified reachable 2026-10-11. */
export const MORPHO_AUDITS: Opportunity["audits"] = [
  { name: "Morpho audits", url: "https://docs.morpho.org/get-started/resources/audits/" },
  { name: "Morpho Blue audit reports", url: "https://github.com/morpho-org/morpho-blue/tree/main/audits" },
];
const V1_AUDITS: Opportunity["audits"] = [
  ...MORPHO_AUDITS,
  { name: "MetaMorpho (Vault V1) audit reports", url: "https://github.com/morpho-org/metamorpho/tree/main/audits" },
];
const V2_AUDITS: Opportunity["audits"] = [
  ...MORPHO_AUDITS,
  { name: "Morpho Vault V2 audit reports", url: "https://github.com/morpho-org/vault-v2/tree/main/audits" },
];

export type ApyMeasurement = Opportunity["apy"]["measurement"];

const LOOKBACK: Record<Exclude<ApyMeasurement, "instantaneous">, string> = {
  "1d_average": "ONE_DAY",
  "7d_average": "SEVEN_DAYS",
  "30d_average": "THIRTY_DAYS",
};

function apyFields(measurement: ApyMeasurement): string {
  if (measurement === "instantaneous") return "apyNative: netApyExcludingRewards apyNet: netApy";
  const lb = LOOKBACK[measurement];
  return `apyNative: avgNetApyExcludingRewards(lookback: ${lb}) apyNet: avgNetApy(lookback: ${lb})`;
}

/** GraphQL query for listed Vault V1 (MetaMorpho) vaults, ordered by TVL. */
export function morphoV1Query(measurement: ApyMeasurement = "instantaneous"): string {
  return `query TokenIqMorphoVaultsV1($chainIds: [Int!], $assetSymbols: [String!], $minTvlUsd: Float, $first: Int!, $skip: Int!) {
  vaults(first: $first, skip: $skip, orderBy: TotalAssetsUsd, orderDirection: Desc, where: { chainId_in: $chainIds, assetSymbol_in: $assetSymbols, listed: true, totalAssetsUsd_gte: $minTvlUsd }) {
    pageInfo { count countTotal }
    items {
      address name symbol listed
      chain { id }
      asset { address symbol decimals }
      liquidity { usd }
      warnings { type level }
      state {
        totalAssetsUsd ${apyFields(measurement)} fee timelock
        curators { name verified socials { type url } }
        allocation { supplyAssetsUsd market { collateralAsset { symbol } loanAsset { symbol } oracle { address type } } }
      }
    }
  }
}`;
}

/** GraphQL query for listed Vault V2 vaults, ordered by TVL. */
export function morphoV2Query(measurement: ApyMeasurement = "instantaneous"): string {
  return `query TokenIqMorphoVaultsV2($chainIds: [Int!], $assets: [Address!], $minTvlUsd: Float, $first: Int!, $skip: Int!) {
  vaultV2s(first: $first, skip: $skip, orderBy: TotalAssetsUsd, orderDirection: Desc, where: { chainId_in: $chainIds, assetAddress_in: $assets, listed: true, totalAssetsUsd_gte: $minTvlUsd }) {
    pageInfo { count countTotal }
    items {
      address name symbol listed type
      chain { id }
      asset { address symbol decimals }
      totalAssetsUsd liquidityUsd ${apyFields(measurement)} performanceFee managementFee
      curators(first: 5) { items { name verified socials { type url } } }
      warnings { type level }
      caps(first: 30) { items { type allocation data { ... on MarketV1CapData { market { collateralAsset { symbol } loanAsset { symbol } oracle { address type } } } } } }
    }
  }
}`;
}

// ---------------------------------------------------------------------------
// Float conversion (no float arithmetic)
// ---------------------------------------------------------------------------

/** Plain decimal string of a JSON float: exact expansion of the double, rounded at `digits` places by toFixed. */
export function floatToDecimalString(x: number, digits = 12): string {
  if (!Number.isFinite(x)) throw new Error(`not a finite number: ${x}`);
  if (Math.abs(x) >= 1e21) throw new Error(`number too large for toFixed: ${x}`);
  return x.toFixed(digits);
}

/** USD float → wad, truncated (rounded down) to 6 decimals. */
export function usdFloatToWad(x: number): Wad {
  return parseDecimal(floatToDecimalString(x), 6, "down") * 10n ** 12n;
}

/** Fraction float (0.0461 = 4.61%) → whole basis points with explicit rounding. */
export function fractionFloatToBps(x: number, rounding: "down" | "up"): number {
  return Number(parseDecimal(floatToDecimalString(x), 4, rounding));
}

// ---------------------------------------------------------------------------
// Response validation helpers
// ---------------------------------------------------------------------------

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const WARNING_LEVEL: Record<string, Opportunity["warnings"][number]["level"]> = { RED: "critical", YELLOW: "warning", GREEN: "info" };

/** Plain-language messages for the warning types observed in the API on 2026-10-11. */
const WARNING_MESSAGES: Record<string, string> = {
  short_timelock: "The vault timelock is short, so curator changes can take effect quickly",
  timelock: "Some vault settings can change with a short or no timelock",
  deposit_disabled: "Deposits into this vault are disabled",
  not_whitelisted: "The vault is not on Morpho's listed set",
  low_liquidity: "The vault has little liquidity available for withdrawals",
  unrecognized_deposit_asset: "Morpho does not recognise the vault's deposit asset",
  unrecognized_asset: "Morpho does not recognise the vault's asset",
  invalid_name: "The vault name is flagged as invalid",
  invalid_symbol: "The vault symbol is flagged as invalid",
  oracle_unusable: "A market the vault lends to has an unusable oracle",
  oracle_price_derivation: "A market the vault lends to derives its oracle price in an unusual way",
  bad_debt_unrealized: "A market the vault lends to has unrealized bad debt",
  multiple_vault_adapters: "The vault allocates through several vault adapters",
  multiple_market_v1_adapters: "The vault allocates through several market adapters",
  custom: "Morpho flagged this vault with a custom warning",
};

function mapWarnings(raw: unknown): Opportunity["warnings"] {
  return arr(raw).flatMap((w) => {
    if (!isRec(w)) return [];
    const type = str(w.type) ?? "unknown";
    const level = WARNING_LEVEL[str(w.level) ?? ""] ?? "warning";
    return [{ code: `morpho:${type}`, level, message: WARNING_MESSAGES[type] ?? `Morpho API warning: ${type}` }];
  });
}

function mapCurator(raw: unknown): Opportunity["curator"] {
  const curators = arr(raw).filter(isRec);
  const pick = curators.find((c) => c.verified === true) ?? curators[0];
  const name = pick ? str(pick.name)?.trim() : null;
  if (!pick || !name) return null;
  const site = arr(pick.socials)
    .filter(isRec)
    .find((s) => s.type === "url" || s.type === "website");
  return { name, url: site ? str(site.url) : null };
}

/** "Oracle <type> <address> (<collateral>/<loan> market)" for markets with a non-zero allocation, largest first. */
function oracleDependencies(markets: Array<{ weight: number; market: unknown }>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { market } of [...markets].sort((a, b) => b.weight - a.weight)) {
    if (!isRec(market) || !isRec(market.oracle)) continue;
    const address = str(market.oracle.address);
    if (!address || !isAddress(address) || seen.has(address.toLowerCase())) continue;
    seen.add(address.toLowerCase());
    const collateral = isRec(market.collateralAsset) ? str(market.collateralAsset.symbol) : null;
    const loan = isRec(market.loanAsset) ? str(market.loanAsset.symbol) : null;
    out.push(`Oracle ${str(market.oracle.type) ?? "unknown type"} ${getAddress(address)} (${collateral ?? "?"}/${loan ?? "?"} market)`);
  }
  return out;
}

export interface MorphoSkip {
  chainId: number | null;
  address: string | null;
  reason: string;
}

type MapResult = { ok: true; opportunity: Opportunity } | { ok: false; skip: MorphoSkip };

interface MapContext {
  assetSymbols: readonly string[];
  measurement: ApyMeasurement;
  fetchedAt: number;
  sourceUrl: string;
}

interface CommonFields {
  chainId: number;
  address: string;
  name: string;
  assetRaw: unknown;
  tvlUsd: unknown;
  liquidityUsd: unknown;
  apyNative: unknown;
  apyNet: unknown;
  fee: unknown;
}

function mapCommon(
  f: CommonFields,
  ctx: MapContext,
  version: "v1" | "v2",
  extra: { curator: Opportunity["curator"]; warnings: Opportunity["warnings"]; dependencies: string[] },
): MapResult {
  const skip = (reason: string): MapResult => ({ ok: false, skip: { chainId: f.chainId, address: f.address, reason } });
  if (!isAddress(f.address)) return skip("invalid vault address");
  const address = getAddress(f.address);
  const assetAddress = isRec(f.assetRaw) ? str(f.assetRaw.address) : null;
  const assetDecimals = isRec(f.assetRaw) ? num(f.assetRaw.decimals) : null;
  const token = assetAddress && isAddress(assetAddress) ? getToken(f.chainId, assetAddress) : undefined;
  if (!token || token.address === NATIVE || !ctx.assetSymbols.includes(token.symbol))
    return skip(`asset ${assetAddress ?? "?"} is not an allowlisted ${ctx.assetSymbols.join("/")} token`);
  if (assetDecimals !== null && assetDecimals !== token.decimals) return skip(`asset decimals ${assetDecimals} differ from the allowlist (${token.decimals})`);
  const tvl = num(f.tvlUsd);
  const apyNative = num(f.apyNative);
  const apyNet = num(f.apyNet);
  const fee = num(f.fee);
  if (tvl === null || tvl < 0) return skip("missing TVL");
  if (apyNative === null || apyNet === null) return skip(`missing ${ctx.measurement} APY`);
  if (fee === null || fee < 0) return skip("missing fee");

  const nativeBps = fractionFloatToBps(apyNative, "down");
  // Rewards are what net APY adds on top of the ex-rewards APY; never negative, so net = native + rewards holds exactly.
  const rewardsBps = Math.max(0, fractionFloatToBps(apyNet, "down") - nativeBps);
  const tvlUsd = usdFloatToWad(tvl);
  const liq = num(f.liquidityUsd);
  const warnings = [...extra.warnings];
  let availableLiquidityUsd = liq !== null && liq > 0 ? usdFloatToWad(liq) : 0n;
  if (liq === null)
    warnings.push({ code: "morpho:liquidity_unknown", level: "warning", message: "The API did not report available liquidity; treated as zero" });
  // Liquidity is shared market liquidity; a vault can never pay out more than it holds.
  if (availableLiquidityUsd > tvlUsd) availableLiquidityUsd = tvlUsd;
  const id = `morpho:${f.chainId}:${address.toLowerCase()}`;
  return {
    ok: true,
    opportunity: {
      id,
      protocol: "morpho",
      kind: "erc4626_vault",
      chainId: f.chainId,
      address,
      name: f.name.trim() || address,
      asset: assetRefOf(token),
      apy: { nativeBps, rewardsBps, netBps: nativeBps + rewardsBps, measurement: ctx.measurement },
      tvlUsd,
      availableLiquidityUsd,
      feeBps: fractionFloatToBps(fee, "up"),
      curator: extra.curator,
      withdrawal: "instant_subject_to_liquidity",
      warnings,
      dependencies: ["Morpho Blue", version === "v1" ? "MetaMorpho vault contract (Vault V1)" : "Morpho Vault V2 contract and adapters", ...extra.dependencies],
      audits: version === "v1" ? V1_AUDITS : V2_AUDITS,
      listed: isListed(id),
      source: { name: "Morpho API", url: ctx.sourceUrl, fetchedAt: ctx.fetchedAt },
    },
  };
}

/** Map one `vaults.items[]` entry (Vault V1) to a core Opportunity, or explain why it was skipped. */
export function mapMorphoV1Vault(item: unknown, ctx: MapContext): MapResult {
  if (!isRec(item) || !isRec(item.chain) || !isRec(item.state)) return { ok: false, skip: { chainId: null, address: null, reason: "malformed vault item" } };
  const chainId = num(item.chain.id);
  const address = str(item.address);
  if (chainId === null || !address) return { ok: false, skip: { chainId, address, reason: "malformed vault item" } };
  const s = item.state;
  const allocations = arr(s.allocation)
    .filter(isRec)
    .map((a) => ({ weight: num(a.supplyAssetsUsd) ?? 0, market: a.market }))
    .filter((a) => a.weight > 0);
  return mapCommon(
    {
      chainId,
      address,
      name: str(item.name) ?? "",
      assetRaw: item.asset,
      tvlUsd: s.totalAssetsUsd,
      liquidityUsd: isRec(item.liquidity) ? item.liquidity.usd : null,
      apyNative: s.apyNative,
      apyNet: s.apyNet,
      fee: s.fee,
    },
    ctx,
    "v1",
    { curator: mapCurator(s.curators), warnings: mapWarnings(item.warnings), dependencies: oracleDependencies(allocations) },
  );
}

/** Map one `vaultV2s.items[]` entry (Vault V2) to a core Opportunity, or explain why it was skipped. */
export function mapMorphoV2Vault(item: unknown, ctx: MapContext): MapResult {
  if (!isRec(item) || !isRec(item.chain)) return { ok: false, skip: { chainId: null, address: null, reason: "malformed vault item" } };
  const chainId = num(item.chain.id);
  const address = str(item.address);
  if (chainId === null || !address) return { ok: false, skip: { chainId, address, reason: "malformed vault item" } };
  const caps = isRec(item.caps) ? arr(item.caps.items) : [];
  const markets = caps
    .filter(isRec)
    .map((c) => ({ weight: num(c.allocation) ?? 0, market: isRec(c.data) ? c.data.market : undefined }))
    .filter((m) => m.weight > 0 && m.market !== undefined);
  const warnings = mapWarnings(item.warnings);
  warnings.push({
    code: "morpho:v2_withdrawable_unknown",
    level: "info",
    message:
      "Vault V2 does not report per-account withdrawable amounts on-chain (max* views return 0); withdrawals are paid from idle assets and the liquidity adapter",
  });
  const mgmt = num(item.managementFee);
  if (mgmt !== null && mgmt > 0) {
    warnings.push({
      code: "morpho:management_fee",
      level: "info",
      message: `The vault charges a management fee of ${fractionFloatToBps(mgmt, "up")} bps per year on assets, in addition to the performance fee`,
    });
  }
  return mapCommon(
    {
      chainId,
      address,
      name: str(item.name) ?? "",
      assetRaw: item.asset,
      tvlUsd: item.totalAssetsUsd,
      liquidityUsd: item.liquidityUsd,
      apyNative: item.apyNative,
      apyNet: item.apyNet,
      fee: item.performanceFee,
    },
    ctx,
    "v2",
    { curator: mapCurator(isRec(item.curators) ? item.curators.items : []), warnings, dependencies: oracleDependencies(markets) },
  );
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

export type MorphoApiError =
  | { kind: "http"; status: number; message: string }
  | { kind: "timeout"; message: string }
  | { kind: "network"; message: string }
  | { kind: "graphql"; message: string; errors: Array<{ message: string; code: string | null }> }
  | { kind: "invalid_response"; message: string };

export type FetchMorphoVaultsResult =
  { ok: true; opportunities: Opportunity[]; skipped: MorphoSkip[]; fetchedAt: number } | { ok: false; error: MorphoApiError };

export interface FetchMorphoVaultsOptions {
  chainIds: readonly number[];
  /** TokenIQ token symbols, e.g. ["USDC"]. Vault assets are matched against the token allowlist by address. */
  assetSymbols: readonly string[];
  /** Minimum TVL in USD (applied by the API and re-checked locally). */
  minTvlUsd?: number;
  fetchImpl?: typeof fetch;
  /** Vault generations to query (default both). */
  versions?: ReadonlyArray<"v1" | "v2">;
  apyMeasurement?: ApyMeasurement;
  timeoutMs?: number;
  /** Unix seconds recorded as `source.fetchedAt` (default: now). */
  nowSec?: number;
  endpoint?: string;
  /** Page size (default 50); at most 10 pages per query are fetched. */
  pageSize?: number;
}

type GqlResult = { ok: true; data: Rec } | { ok: false; error: MorphoApiError };

async function postGraphql(fetchImpl: typeof fetch, endpoint: string, query: string, variables: Rec, timeoutMs: number): Promise<GqlResult> {
  let res: Response;
  try {
    res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const name = err && typeof err === "object" ? (err as { name?: unknown }).name : undefined;
    if (name === "TimeoutError" || name === "AbortError")
      return { ok: false, error: { kind: "timeout", message: `Morpho API did not respond within ${timeoutMs} ms` } };
    return { ok: false, error: { kind: "network", message: `Morpho API request failed: ${errorMessage(err)}` } };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    if (!res.ok) return { ok: false, error: { kind: "http", status: res.status, message: `Morpho API returned HTTP ${res.status}` } };
    return { ok: false, error: { kind: "invalid_response", message: `Morpho API returned invalid JSON: ${errorMessage(err)}` } };
  }
  const errors = isRec(body) ? arr(body.errors) : [];
  if (errors.length > 0) {
    const list = errors.map((e) => ({
      message: isRec(e) ? (str(e.message) ?? "unknown error") : String(e),
      code: isRec(e) ? ((isRec(e.extensions) ? str(e.extensions.code) : null) ?? str(e.status)) : null,
    }));
    return { ok: false, error: { kind: "graphql", message: list.map((e) => e.message).join("; "), errors: list } };
  }
  if (!res.ok) return { ok: false, error: { kind: "http", status: res.status, message: `Morpho API returned HTTP ${res.status}` } };
  if (!isRec(body) || !isRec(body.data)) return { ok: false, error: { kind: "invalid_response", message: "Morpho API response has no data" } };
  return { ok: true, data: body.data };
}

async function fetchAllPages(
  fetchImpl: typeof fetch,
  endpoint: string,
  root: "vaults" | "vaultV2s",
  query: string,
  variables: Rec,
  pageSize: number,
  timeoutMs: number,
): Promise<{ ok: true; items: unknown[] } | { ok: false; error: MorphoApiError }> {
  const items: unknown[] = [];
  for (let page = 0; page < 10; page++) {
    const r = await postGraphql(fetchImpl, endpoint, query, { ...variables, first: pageSize, skip: page * pageSize }, timeoutMs);
    if (!r.ok) return r;
    const conn = r.data[root];
    if (!isRec(conn) || !Array.isArray(conn.items))
      return { ok: false, error: { kind: "invalid_response", message: `Morpho API response has no ${root}.items` } };
    items.push(...conn.items);
    const total = isRec(conn.pageInfo) ? num(conn.pageInfo.countTotal) : null;
    if (conn.items.length < pageSize || (total !== null && items.length >= total)) break;
  }
  return { ok: true, items };
}

/**
 * Listed Morpho vaults (V1 and/or V2) for the given chains and assets, mapped to
 * core `Opportunity` objects. Vaults whose asset is not in TokenIQ's token allowlist
 * (matched by address, not symbol) are skipped with a reason. Any HTTP, timeout or
 * GraphQL failure fails the whole call with a typed error, so a partial list is never
 * mistaken for a complete one.
 */
export async function fetchMorphoVaults(opts: FetchMorphoVaultsOptions): Promise<FetchMorphoVaultsResult> {
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const endpoint = opts.endpoint ?? MORPHO_API_URL;
  const measurement = opts.apyMeasurement ?? "instantaneous";
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const pageSize = opts.pageSize ?? 50;
  const versions = opts.versions ?? ["v1", "v2"];
  const fetchedAt = opts.nowSec ?? Math.floor(Date.now() / 1000);
  const minTvlUsd = opts.minTvlUsd ?? 0;
  const ctx: MapContext = { assetSymbols: opts.assetSymbols, measurement, fetchedAt, sourceUrl: endpoint };
  const chainIds = [...opts.chainIds];

  const v1 = versions.includes("v1")
    ? fetchAllPages(
        fetchImpl,
        endpoint,
        "vaults",
        morphoV1Query(measurement),
        { chainIds, assetSymbols: [...opts.assetSymbols], minTvlUsd },
        pageSize,
        timeoutMs,
      )
    : Promise.resolve({ ok: true as const, items: [] as unknown[] });
  const assetAddresses = TOKENS.filter((t) => chainIds.includes(t.chainId) && opts.assetSymbols.includes(t.symbol) && t.address !== NATIVE).map(
    (t) => t.address,
  );
  const v2 =
    versions.includes("v2") && assetAddresses.length > 0
      ? fetchAllPages(fetchImpl, endpoint, "vaultV2s", morphoV2Query(measurement), { chainIds, assets: assetAddresses, minTvlUsd }, pageSize, timeoutMs)
      : Promise.resolve({ ok: true as const, items: [] as unknown[] });
  const [r1, r2] = await Promise.all([v1, v2]);
  if (!r1.ok) return r1;
  if (!r2.ok) return r2;

  const opportunities: Opportunity[] = [];
  const skipped: MorphoSkip[] = [];
  const minTvlWad = usdFloatToWad(minTvlUsd);
  const collect = (r: MapResult) => {
    if (!r.ok) skipped.push(r.skip);
    else if (!chainIds.includes(r.opportunity.chainId))
      skipped.push({ chainId: r.opportunity.chainId, address: r.opportunity.address, reason: "chain not requested" });
    else if (r.opportunity.tvlUsd < minTvlWad) skipped.push({ chainId: r.opportunity.chainId, address: r.opportunity.address, reason: "below minimum TVL" });
    else opportunities.push(r.opportunity);
  };
  for (const item of r1.items) collect(mapMorphoV1Vault(item, ctx));
  for (const item of r2.items) collect(mapMorphoV2Vault(item, ctx));
  return { ok: true, opportunities, skipped, fetchedAt };
}
