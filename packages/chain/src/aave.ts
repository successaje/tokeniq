import { encodeFunctionData, getAddress, maxUint256, zeroAddress, type Address, type PublicClient } from "viem";
import { minOf, pow10, valueOf, type Opportunity } from "@tokeniq/core";
import { AAVE_V3_POOL_ABI, ATOKEN_ABI, ERC20_ABI } from "./abis.js";
import { assetRefOf } from "./assets.js";
import { pinBlock } from "./blocks.js";
import { explorerAddress, getChain } from "./chains.js";
import type { ClientRegistry } from "./clients.js";
import { buildExactApproval } from "./erc4626.js";
import { isListed } from "./listing.js";
import { isPriceStale, readFeeds, readSequencerStatus } from "./readers.js";
import { findTokenBySymbol, getToken } from "./tokens.js";
import { errorMessage, OPERATION, type MetaTx, type PinnedBlock } from "./types.js";

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export interface AaveReserveRef {
  underlying: Address;
  aToken: Address;
}

export interface AaveMarket {
  chainId: number;
  pool: Address;
  poolAddressesProvider: Address;
  reserves: Record<string, AaveReserveRef>;
}

/**
 * Aave v3 core markets on supported mainnets. Source: aave-dao/aave-address-book
 * `src/AaveV3{Ethereum,Base,Arbitrum,Optimism}.sol` on `main` (fetched 2026-10-11;
 * npm @aave-dao/aave-address-book 4.73.2): `POOL`, `POOL_ADDRESSES_PROVIDER`,
 * `ASSETS.USDC` (Ethereum, Base) / `ASSETS.USDCn` (Arbitrum, Optimism: native USDC)
 * `UNDERLYING` and `A_TOKEN`. Verified on-chain 2026-10-11: `Pool.getReserveData(USDC)`
 * returns this aToken on every chain. Keys are TokenIQ symbols from tokens.ts.
 */
export const AAVE_V3_MARKETS: Record<number, AaveMarket> = {
  1: {
    chainId: 1,
    pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    poolAddressesProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
    reserves: { USDC: { underlying: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", aToken: "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c" } },
  },
  8453: {
    chainId: 8453,
    pool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    poolAddressesProvider: "0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D",
    reserves: { USDC: { underlying: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", aToken: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB" } },
  },
  42161: {
    chainId: 42161,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    poolAddressesProvider: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
    reserves: { USDC: { underlying: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", aToken: "0x724dc807b04555b71ed48a6896b6F41593b8C637" } },
  },
  10: {
    chainId: 10,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    poolAddressesProvider: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
    reserves: { USDC: { underlying: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", aToken: "0x38d693cE1dF5AaDF7bC62595A37D667aD57922e5" } },
  },
};

/** Audit references, verified reachable 2026-10-11. */
export const AAVE_V3_AUDITS: Opportunity["audits"] = [
  { name: "Aave v3 audit reports (aave-dao/aave-v3-origin)", url: "https://github.com/aave-dao/aave-v3-origin/tree/main/audits" },
  { name: "Aave security and audits", url: "https://aave.com/security" },
];

/**
 * Venue id for an Aave v3 reserve. One Pool hosts many reserves, so the reserve's
 * aToken (unique per reserve) identifies the venue; `Opportunity.address` stays the
 * Pool, which receives supply/withdraw calls.
 */
export function aaveOpportunityId(chainId: number, aToken: string): string {
  return `aave-v3:${chainId}:${aToken.toLowerCase()}`;
}

export function requireAaveReserve(chainId: number, asset: string): { market: AaveMarket; symbol: string; reserve: AaveReserveRef } {
  const market = AAVE_V3_MARKETS[chainId];
  if (!market) throw new Error(`No Aave v3 market configured for chain ${chainId}`);
  const target = getAddress(asset);
  for (const [symbol, reserve] of Object.entries(market.reserves)) {
    if (reserve.underlying === target) return { market, symbol, reserve };
  }
  throw new Error(`Asset ${target} is not a configured Aave v3 reserve on chain ${chainId}`);
}

// ---------------------------------------------------------------------------
// Rate maths
// ---------------------------------------------------------------------------

export const RAY = 10n ** 27n;
/** Aave v3 `MathUtils.SECONDS_PER_YEAR = 365 days`. */
export const SECONDS_PER_YEAR = 31_536_000n;
const PRECISION = 10n ** 36n;

function powFloor(base: bigint, exp: bigint, one: bigint): bigint {
  let result = one;
  let b = base;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) / one;
    e >>= 1n;
    if (e > 0n) b = (b * b) / one;
  }
  return result;
}

/** (1 + APR / SECONDS_PER_YEAR) ^ SECONDS_PER_YEAR scaled by 1e36, every step rounded down. */
function yearlyGrowth(liquidityRateRay: bigint): bigint {
  if (liquidityRateRay < 0n) throw new Error("liquidity rate cannot be negative");
  const perSecond = (liquidityRateRay * (PRECISION / RAY)) / SECONDS_PER_YEAR;
  return powFloor(PRECISION + perSecond, SECONDS_PER_YEAR, PRECISION);
}

/**
 * Supply APY from Aave's `currentLiquidityRate` (an APR in RAY, already net of
 * the reserve factor), assuming per-second compounding as Aave's own UI and API do:
 *
 *   APY = (1 + rate / 1e27 / 31_536_000) ^ 31_536_000 − 1
 *
 * Computed with bigint fixed point at 1e36 precision (exponentiation by squaring,
 * each product rounded down), so the result never overstates the yield.
 * Returned as a wad (1e18 = 100%).
 */
export function liquidityRateToApyWad(liquidityRateRay: bigint): bigint {
  return (yearlyGrowth(liquidityRateRay) - PRECISION) / (PRECISION / 10n ** 18n);
}

/** {@link liquidityRateToApyWad} in whole basis points, rounded down. */
export function liquidityRateToApyBps(liquidityRateRay: bigint): number {
  return Number(((yearlyGrowth(liquidityRateRay) - PRECISION) * 10_000n) / PRECISION);
}

// ---------------------------------------------------------------------------
// Reserve configuration
// ---------------------------------------------------------------------------

export interface ReserveConfiguration {
  decimals: number;
  active: boolean;
  frozen: boolean;
  paused: boolean;
  borrowingEnabled: boolean;
  /** Share of borrower interest kept by the protocol, in bps. */
  reserveFactorBps: number;
  /** Supply cap in whole tokens; 0 = no cap. */
  supplyCap: bigint;
}

const bits = (data: bigint, start: bigint, width: bigint) => (data >> start) & ((1n << width) - 1n);

/**
 * Decode the reserve configuration bitmap. Bit positions from aave-dao/aave-v3-origin
 * `ReserveConfiguration.sol`: decimals 48–55, active 56, frozen 57, borrowing 58,
 * paused 60, reserve factor 64–79, supply cap 116–151.
 */
export function decodeReserveConfiguration(data: bigint): ReserveConfiguration {
  return {
    decimals: Number(bits(data, 48n, 8n)),
    active: bits(data, 56n, 1n) === 1n,
    frozen: bits(data, 57n, 1n) === 1n,
    borrowingEnabled: bits(data, 58n, 1n) === 1n,
    paused: bits(data, 60n, 1n) === 1n,
    reserveFactorBps: Number(bits(data, 64n, 16n)),
    supplyCap: bits(data, 116n, 36n),
  };
}

// ---------------------------------------------------------------------------
// Transaction builders
// ---------------------------------------------------------------------------

/** `[approve(pool, 0)?, approve(pool, amount), Pool.supply(asset, amount, onBehalfOf, 0)]`. */
export function buildAaveSupply(params: { chainId: number; asset: string; amount: bigint; onBehalfOf: string; currentAllowance: bigint }): MetaTx[] {
  const { market, reserve } = requireAaveReserve(params.chainId, params.asset);
  const onBehalfOf = getAddress(params.onBehalfOf);
  if (onBehalfOf === zeroAddress) throw new Error("onBehalfOf must not be the zero address");
  return [
    ...buildExactApproval({ token: reserve.underlying, spender: market.pool, amount: params.amount, currentAllowance: params.currentAllowance }),
    {
      to: market.pool,
      value: 0n,
      operation: OPERATION.CALL,
      data: encodeFunctionData({ abi: AAVE_V3_POOL_ABI, functionName: "supply", args: [reserve.underlying, params.amount, onBehalfOf, 0] }),
    },
  ];
}

/**
 * `Pool.withdraw(asset, amount, to)`. Pass `"max"` to withdraw the full balance
 * (Aave treats `type(uint256).max` as "everything", including interest accrued until execution).
 */
export function buildAaveWithdraw(params: { chainId: number; asset: string; amount: bigint | "max"; to: string }): MetaTx[] {
  const { market, reserve } = requireAaveReserve(params.chainId, params.asset);
  const to = getAddress(params.to);
  if (to === zeroAddress) throw new Error("to must not be the zero address");
  const amount = params.amount === "max" ? maxUint256 : params.amount;
  if (amount <= 0n) throw new Error("withdraw amount must be positive");
  return [
    {
      to: market.pool,
      value: 0n,
      operation: OPERATION.CALL,
      data: encodeFunctionData({ abi: AAVE_V3_POOL_ABI, functionName: "withdraw", args: [reserve.underlying, amount, to] }),
    },
  ];
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface AaveReserveState {
  chainId: number;
  pool: Address;
  underlying: Address;
  aToken: Address;
  config: ReserveConfiguration;
  /** APR in RAY. */
  liquidityRate: bigint;
  /** aToken total supply (includes accrued interest), raw underlying units. */
  totalSupply: bigint;
  /**
   * Underlying that can leave the pool now: min(underlying.balanceOf(aToken),
   * Pool.getVirtualUnderlyingBalance(asset)) — v3.1+ caps withdrawals at the virtual balance.
   */
  availableLiquidity: bigint;
  block: PinnedBlock;
}

/** Read one reserve at a pinned block; throws when the on-chain aToken differs from the address book. */
export async function readAaveReserve(client: PublicClient, params: { chainId: number; asset: string; blockNumber?: bigint }): Promise<AaveReserveState> {
  const { market, reserve } = requireAaveReserve(params.chainId, params.asset);
  const block = await pinBlock(client, params.blockNumber);
  if (block.chainId !== params.chainId) throw new Error(`client is on chain ${block.chainId}, expected ${params.chainId}`);
  const [data, totalSupply, cash, virtualBalance] = await client.multicall({
    contracts: [
      { address: market.pool, abi: AAVE_V3_POOL_ABI, functionName: "getReserveData", args: [reserve.underlying] },
      { address: reserve.aToken, abi: ATOKEN_ABI, functionName: "totalSupply" },
      { address: reserve.underlying, abi: ERC20_ABI, functionName: "balanceOf", args: [reserve.aToken] },
      { address: market.pool, abi: AAVE_V3_POOL_ABI, functionName: "getVirtualUnderlyingBalance", args: [reserve.underlying] },
    ],
    allowFailure: true,
    blockNumber: block.number,
  });
  if (data.status !== "success") throw new Error(`getReserveData failed: ${errorMessage(data.error)}`);
  if (totalSupply.status !== "success") throw new Error(`aToken.totalSupply failed: ${errorMessage(totalSupply.error)}`);
  if (cash.status !== "success") throw new Error(`underlying.balanceOf(aToken) failed: ${errorMessage(cash.error)}`);
  if (getAddress(data.result.aTokenAddress) !== reserve.aToken) {
    throw new Error(`on-chain aToken ${data.result.aTokenAddress} differs from the address book (${reserve.aToken})`);
  }
  const availableLiquidity = virtualBalance.status === "success" ? minOf(cash.result, virtualBalance.result) : cash.result;
  return {
    chainId: params.chainId,
    pool: market.pool,
    underlying: reserve.underlying,
    aToken: reserve.aToken,
    config: decodeReserveConfiguration(data.result.configuration.data),
    liquidityRate: data.result.currentLiquidityRate,
    totalSupply: totalSupply.result,
    availableLiquidity,
    block,
  };
}

export interface AavePosition {
  chainId: number;
  owner: Address;
  asset: Address;
  aToken: Address;
  /** aToken balance = supplied underlying including accrued interest. */
  balance: bigint;
  /** min(balance, reserve available liquidity); 0 while the reserve is paused or inactive. */
  withdrawable: bigint;
  availableLiquidity: bigint;
  blockNumber: bigint;
}

/** Supplied balance and what can be withdrawn now, at one pinned block. */
export async function readAavePosition(
  client: PublicClient,
  params: { chainId: number; asset: string; owner: string; blockNumber?: bigint },
): Promise<AavePosition> {
  const reserve = await readAaveReserve(client, params);
  const owner = getAddress(params.owner);
  const balance = await client.readContract({
    address: reserve.aToken,
    abi: ATOKEN_ABI,
    functionName: "balanceOf",
    args: [owner],
    blockNumber: reserve.block.number,
  });
  const blocked = reserve.config.paused || !reserve.config.active;
  return {
    chainId: params.chainId,
    owner,
    asset: reserve.underlying,
    aToken: reserve.aToken,
    balance,
    withdrawable: blocked ? 0n : minOf(balance, reserve.availableLiquidity),
    availableLiquidity: reserve.availableLiquidity,
    blockNumber: reserve.block.number,
  };
}

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

export interface AaveOpportunitiesResult {
  opportunities: Opportunity[];
  errors: Array<{ chainId: number; asset: string; error: string }>;
}

/**
 * Aave v3 supply venues for `assets` on every chain that has both a client and a
 * configured market. All numbers are read on-chain at one pinned block per chain:
 * supply APY from `currentLiquidityRate` (instantaneous), TVL = aToken totalSupply
 * valued at the Chainlink price, available liquidity as in {@link AaveReserveState}.
 * Incentive rewards are not read (rewardsBps = 0). Failures are returned per chain.
 */
export async function fetchAaveOpportunities(
  clients: ClientRegistry,
  opts: { assets: readonly string[]; chainIds?: readonly number[]; nowSec?: number },
): Promise<AaveOpportunitiesResult> {
  const fetchedAt = opts.nowSec ?? Math.floor(Date.now() / 1000);
  const jobs: Array<Promise<{ ok: true; opp: Opportunity } | { ok: false; chainId: number; asset: string; error: string }>> = [];
  for (const [chainId, client] of clients) {
    if (opts.chainIds && !opts.chainIds.includes(chainId)) continue;
    const market = AAVE_V3_MARKETS[chainId];
    if (!market) continue;
    for (const symbol of opts.assets) {
      if (!market.reserves[symbol]) continue;
      jobs.push(
        aaveOpportunity(client, chainId, symbol, fetchedAt).then(
          (opp) => ({ ok: true as const, opp }),
          (err: unknown) => ({ ok: false as const, chainId, asset: symbol, error: errorMessage(err) }),
        ),
      );
    }
  }
  const results = await Promise.all(jobs);
  return {
    opportunities: results.flatMap((r) => (r.ok ? [r.opp] : [])),
    errors: results.flatMap((r) => (r.ok ? [] : [{ chainId: r.chainId, asset: r.asset, error: r.error }])),
  };
}

async function aaveOpportunity(client: PublicClient, chainId: number, symbol: string, fetchedAt: number): Promise<Opportunity> {
  const market = AAVE_V3_MARKETS[chainId]!;
  const ref = market.reserves[symbol]!;
  const token = getToken(chainId, ref.underlying) ?? findTokenBySymbol(chainId, symbol);
  if (!token || token.address.toLowerCase() !== ref.underlying.toLowerCase()) throw new Error(`${symbol} on chain ${chainId} is not in the token allowlist`);
  if (!token.feed) throw new Error(`${symbol} on chain ${chainId} has no price feed`);
  const reserve = await readAaveReserve(client, { chainId, asset: ref.underlying });
  if (reserve.config.decimals !== token.decimals) throw new Error(`reserve decimals ${reserve.config.decimals} differ from token decimals ${token.decimals}`);
  const [feed] = await readFeeds(client, [token.feed], { blockNumber: reserve.block.number });
  if (!feed || !feed.ok) throw new Error(`price feed unavailable: ${feed && !feed.ok ? feed.error : "no result"}`);

  const warnings: Opportunity["warnings"] = [];
  const { config } = reserve;
  if (!config.active)
    warnings.push({ code: "aave:reserve_inactive", level: "critical", message: "The reserve is inactive: supplies and withdrawals are disabled" });
  if (config.paused) warnings.push({ code: "aave:reserve_paused", level: "critical", message: "The reserve is paused: supplies and withdrawals are disabled" });
  if (config.frozen)
    warnings.push({ code: "aave:reserve_frozen", level: "critical", message: "The reserve is frozen: new supplies are disabled (withdrawals still work)" });
  if (config.supplyCap > 0n && reserve.totalSupply >= config.supplyCap * pow10(token.decimals)) {
    warnings.push({ code: "aave:supply_cap_reached", level: "warning", message: "The supply cap is reached: new supplies will revert" });
  }
  if (isPriceStale(token.feed, feed.updatedAt, Number(reserve.block.timestamp))) {
    warnings.push({
      code: "price_stale",
      level: "warning",
      message: `Chainlink ${token.feed.pair} has not updated within its heartbeat; USD values may be off`,
    });
  }
  if (getChain(chainId)?.isL2) {
    try {
      const seq = await readSequencerStatus(client, chainId);
      if (!seq.up) warnings.push({ code: "sequencer_down", level: "warning", message: "The L2 sequencer is down; prices and transactions are unreliable" });
      else if (!seq.pricesUsable)
        warnings.push({ code: "sequencer_grace", level: "warning", message: "The L2 sequencer recently recovered; prices are in their grace period" });
    } catch (err) {
      warnings.push({ code: "sequencer_unknown", level: "warning", message: `Sequencer status could not be read: ${errorMessage(err)}` });
    }
  }
  warnings.push({ code: "aave:rewards_not_included", level: "info", message: "Aave incentive programs are not included in the APY" });

  const nativeBps = liquidityRateToApyBps(reserve.liquidityRate);
  const chain = getChain(chainId);
  return {
    id: aaveOpportunityId(chainId, reserve.aToken),
    protocol: "aave-v3",
    kind: "lending_market",
    chainId,
    address: market.pool,
    name: `Aave v3 ${symbol}${chain ? ` (${chain.name})` : ""}`,
    asset: assetRefOf(token),
    apy: { nativeBps, rewardsBps: 0, netBps: nativeBps, measurement: "instantaneous" },
    tvlUsd: valueOf(reserve.totalSupply, token.decimals, feed.answer, feed.decimals, "down"),
    availableLiquidityUsd: valueOf(reserve.availableLiquidity, token.decimals, feed.answer, feed.decimals, "down"),
    feeBps: config.reserveFactorBps,
    curator: null,
    withdrawal: "instant_subject_to_liquidity",
    warnings,
    dependencies: ["Aave v3 Pool", "Chainlink oracles"],
    audits: AAVE_V3_AUDITS,
    listed: isListed(aaveOpportunityId(chainId, reserve.aToken)),
    source: { name: "Aave v3 on-chain", url: explorerAddress(chainId, market.pool) ?? market.pool, fetchedAt },
  };
}
