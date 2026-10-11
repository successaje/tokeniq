import { getAddress, type Address, type PublicClient } from "viem";
import type { PriceQuote } from "@tokeniq/core";
import { AGGREGATOR_V3_ABI, ERC20_ABI } from "./abis.js";
import { pinBlock } from "./blocks.js";
import { SEQUENCER_GRACE_SECONDS, SEQUENCER_UPTIME_FEEDS } from "./chains.js";
import { NATIVE, type PriceFeedRef } from "./tokens.js";
import { errorMessage, type PinnedBlock } from "./types.js";

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

export interface ReadBalancesInput {
  accounts: readonly string[];
  /** ERC-20 token addresses, or `"native"` for the gas token. Usually `TokenInfo` entries from tokens.ts. */
  tokens: ReadonlyArray<{ address: string }>;
  /** Read at this block instead of `latest − confirmations`. */
  blockNumber?: bigint;
}

export type TokenKey = Address | typeof NATIVE;

export interface BalanceEntry {
  account: Address;
  token: TokenKey;
  raw: bigint;
}

export interface BalanceFailure {
  account: Address;
  token: TokenKey;
  error: string;
}

export interface ReadBalancesResult {
  block: PinnedBlock;
  balances: BalanceEntry[];
  /** Calls that failed. They are reported, never silently treated as zero. */
  failures: BalanceFailure[];
}

/**
 * Raw balances of every (account, token) pair at ONE pinned block: ERC-20
 * balances through a single Multicall3 `aggregate3` (failures allowed per
 * call), native balances through `eth_getBalance` at the same block number.
 * Invalid addresses throw; RPC/per-call failures are returned in `failures`.
 */
export async function readBalances(client: PublicClient, input: ReadBalancesInput): Promise<ReadBalancesResult> {
  const accounts = input.accounts.map((a) => getAddress(a));
  const tokens: TokenKey[] = input.tokens.map((t) => (t.address === NATIVE ? NATIVE : getAddress(t.address)));
  const block = await pinBlock(client, input.blockNumber);
  const balances: BalanceEntry[] = [];
  const failures: BalanceFailure[] = [];

  const erc20 = tokens.filter((t): t is Address => t !== NATIVE);
  const pairs = accounts.flatMap((account) => erc20.map((token) => ({ account, token })));
  if (pairs.length > 0) {
    try {
      const results = await client.multicall({
        contracts: pairs.map(({ account, token }) => ({ address: token, abi: ERC20_ABI, functionName: "balanceOf" as const, args: [account] as const })),
        allowFailure: true,
        blockNumber: block.number,
      });
      results.forEach((r, i) => {
        const { account, token } = pairs[i]!;
        if (r.status === "success") balances.push({ account, token, raw: r.result });
        else failures.push({ account, token, error: errorMessage(r.error) });
      });
    } catch (err) {
      const error = errorMessage(err);
      for (const { account, token } of pairs) failures.push({ account, token, error });
    }
  }

  if (tokens.includes(NATIVE)) {
    const native = await Promise.allSettled(accounts.map((address) => client.getBalance({ address, blockNumber: block.number })));
    native.forEach((r, i) => {
      const account = accounts[i]!;
      if (r.status === "fulfilled") balances.push({ account, token: NATIVE, raw: r.value });
      else failures.push({ account, token: NATIVE, error: errorMessage(r.reason) });
    });
  }

  return { block, balances, failures };
}

// ---------------------------------------------------------------------------
// Chainlink price feeds
// ---------------------------------------------------------------------------

export type FeedReadResult =
  | { ok: true; feed: PriceFeedRef; answer: bigint; decimals: number; roundId: bigint; startedAt: bigint; updatedAt: bigint }
  | { ok: false; feed: PriceFeedRef; error: string };

/**
 * `latestRoundData()` and `decimals()` for each feed in one multicall.
 * A feed is rejected (ok: false) when the call fails, the answer is not
 * positive, `updatedAt` is zero, or on-chain decimals differ from the registry.
 */
export async function readFeeds(client: PublicClient, feeds: readonly PriceFeedRef[], opts: { blockNumber?: bigint } = {}): Promise<FeedReadResult[]> {
  if (feeds.length === 0) return [];
  let results;
  try {
    results = await client.multicall({
      contracts: feeds.flatMap((f) => [
        { address: getAddress(f.address), abi: AGGREGATOR_V3_ABI, functionName: "latestRoundData" as const },
        { address: getAddress(f.address), abi: AGGREGATOR_V3_ABI, functionName: "decimals" as const },
      ]),
      allowFailure: true,
      ...(opts.blockNumber !== undefined ? { blockNumber: opts.blockNumber } : {}),
    });
  } catch (err) {
    const error = errorMessage(err);
    return feeds.map((feed) => ({ ok: false as const, feed, error }));
  }
  return feeds.map((feed, i): FeedReadResult => {
    const round = results[i * 2]!;
    const dec = results[i * 2 + 1]!;
    if (round.status !== "success") return { ok: false, feed, error: `latestRoundData failed: ${errorMessage(round.error)}` };
    if (dec.status !== "success") return { ok: false, feed, error: `decimals failed: ${errorMessage(dec.error)}` };
    const [roundId, answer, startedAt, updatedAt] = round.result as readonly [bigint, bigint, bigint, bigint, bigint];
    const decimals = Number(dec.result);
    if (answer <= 0n) return { ok: false, feed, error: `non-positive answer ${answer}` };
    if (updatedAt === 0n) return { ok: false, feed, error: "round not complete (updatedAt = 0)" };
    if (decimals !== feed.decimals) return { ok: false, feed, error: `decimals ${decimals} differ from registry (${feed.decimals})` };
    return { ok: true, feed, answer, decimals, roundId, startedAt, updatedAt };
  });
}

/** Minimum slack added to a heartbeat before a price counts as stale. */
export const MIN_STALENESS_GRACE_SEC = 1800;

/** Seconds a feed may go without an update: heartbeat + max(10% of heartbeat, 1800 s). */
export function stalenessLimitSec(feed: Pick<PriceFeedRef, "heartbeatSec">): number {
  return feed.heartbeatSec + Math.max(Math.floor(feed.heartbeatSec / 10), MIN_STALENESS_GRACE_SEC);
}

/** True when `updatedAt` is older than the feed's heartbeat plus grace (see {@link stalenessLimitSec}). */
export function isPriceStale(feed: Pick<PriceFeedRef, "heartbeatSec">, updatedAt: bigint | number, nowSec: number): boolean {
  return nowSec - Number(updatedAt) > stalenessLimitSec(feed);
}

/** Convert a successful feed read into the core engine's `PriceQuote`. */
export function toPriceQuote(read: Extract<FeedReadResult, { ok: true }>, nowSec: number): PriceQuote {
  return {
    price: read.answer,
    decimals: read.decimals,
    updatedAt: Number(read.updatedAt),
    source: `Chainlink ${read.feed.pair} (${read.feed.address})`,
    stale: isPriceStale(read.feed, read.updatedAt, nowSec),
  };
}

// ---------------------------------------------------------------------------
// L2 sequencer uptime
// ---------------------------------------------------------------------------

export interface SequencerStatus {
  chainId: number;
  /** False on chains without a sequencer feed (L1s and testnets); the other fields are then permissive. */
  applicable: boolean;
  feed: string | null;
  /** Feed answer 0 = up, 1 = down. */
  up: boolean;
  /** When the current status began (unix seconds). */
  startedAt: number;
  /** Up, but for less than SEQUENCER_GRACE_SECONDS since recovery. */
  inGrace: boolean;
  /** Prices on this chain may be consumed: up, past the grace period, and the round is initialised. */
  pricesUsable: boolean;
  /** Chain time the status was evaluated at (unix seconds). */
  checkedAt: number;
}

/**
 * Pure evaluation of a sequencer feed round, following Chainlink's L2 sequencer
 * guidance (https://docs.chain.link/data-feeds/l2-sequencer-feeds): answer 0 = up,
 * 1 = down, and prices are unusable until GRACE seconds after `startedAt`.
 * `startedAt == 0` means the round is not initialised and is treated as unusable.
 */
export function evaluateSequencer(answer: bigint, startedAt: bigint, nowSec: number, graceSec = SEQUENCER_GRACE_SECONDS) {
  const up = answer === 0n;
  const started = Number(startedAt);
  const inGrace = up && nowSec - started <= graceSec;
  return { up, startedAt: started, inGrace, pricesUsable: up && !inGrace && startedAt !== 0n };
}

/** Read the Chainlink sequencer uptime feed for `chainId` at the latest block (throws on RPC failure). */
export async function readSequencerStatus(client: PublicClient, chainId: number): Promise<SequencerStatus> {
  const feed = SEQUENCER_UPTIME_FEEDS[chainId];
  const block = await client.getBlock({ blockTag: "latest" });
  const checkedAt = Number(block.timestamp);
  if (!feed) return { chainId, applicable: false, feed: null, up: true, startedAt: 0, inGrace: false, pricesUsable: true, checkedAt };
  const [, answer, startedAt] = await client.readContract({
    address: getAddress(feed),
    abi: AGGREGATOR_V3_ABI,
    functionName: "latestRoundData",
    ...(block.number !== null ? { blockNumber: block.number } : {}),
  });
  return { chainId, applicable: true, feed, ...evaluateSequencer(answer, startedAt, checkedAt), checkedAt };
}
