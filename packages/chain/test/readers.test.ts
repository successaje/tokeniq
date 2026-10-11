import { describe, expect, it } from "vitest";
import { evaluateSequencer, isPriceStale, MIN_STALENESS_GRACE_SEC, stalenessLimitSec, toPriceQuote, type FeedReadResult } from "../src/readers.js";
import { SEQUENCER_GRACE_SECONDS } from "../src/chains.js";
import { findTokenBySymbol } from "../src/tokens.js";

describe("price staleness", () => {
  it("allows heartbeat + max(10% of heartbeat, 1800 s)", () => {
    expect(stalenessLimitSec({ heartbeatSec: 86_400 })).toBe(86_400 + 8_640);
    expect(stalenessLimitSec({ heartbeatSec: 3_600 })).toBe(3_600 + MIN_STALENESS_GRACE_SEC);
    expect(stalenessLimitSec({ heartbeatSec: 255 })).toBe(255 + 1_800);
  });

  it("flags prices only once they are older than the limit", () => {
    const feed = { heartbeatSec: 86_400 };
    const now = 1_800_000_000;
    expect(isPriceStale(feed, now - 95_040, now)).toBe(false);
    expect(isPriceStale(feed, now - 95_041, now)).toBe(true);
    expect(isPriceStale(feed, BigInt(now - 10), now)).toBe(false);
    // An L2 USDC feed with a 255 s heartbeat is stale after 2055 s.
    expect(isPriceStale({ heartbeatSec: 255 }, now - 2_056, now)).toBe(true);
  });

  it("builds a core PriceQuote with the stale flag", () => {
    const feed = findTokenBySymbol(8453, "USDC")!.feed!;
    const read: Extract<FeedReadResult, { ok: true }> = { ok: true, feed, answer: 99_988_329n, decimals: 8, roundId: 1n, startedAt: 100n, updatedAt: 1_000n };
    expect(toPriceQuote(read, 1_000 + 3_600)).toEqual({
      price: 99_988_329n,
      decimals: 8,
      updatedAt: 1_000,
      source: `Chainlink USDC / USD (${feed.address})`,
      stale: false,
    });
    expect(toPriceQuote(read, 1_000 + 200_000).stale).toBe(true);
  });
});

describe("sequencer uptime evaluation", () => {
  const now = 1_800_000_000;

  it("is usable when up for longer than the grace period", () => {
    expect(evaluateSequencer(0n, BigInt(now - SEQUENCER_GRACE_SECONDS - 1), now)).toEqual({
      up: true,
      startedAt: now - 3601,
      inGrace: false,
      pricesUsable: true,
    });
  });

  it("is in grace right after recovery (inclusive of the boundary, as in Chainlink's example)", () => {
    expect(evaluateSequencer(0n, BigInt(now - 60), now)).toMatchObject({ up: true, inGrace: true, pricesUsable: false });
    expect(evaluateSequencer(0n, BigInt(now - SEQUENCER_GRACE_SECONDS), now)).toMatchObject({ inGrace: true, pricesUsable: false });
  });

  it("is unusable when down or when the round is not initialised", () => {
    expect(evaluateSequencer(1n, BigInt(now - 100_000), now)).toMatchObject({ up: false, inGrace: false, pricesUsable: false });
    expect(evaluateSequencer(0n, 0n, now)).toMatchObject({ up: true, pricesUsable: false });
  });
});
