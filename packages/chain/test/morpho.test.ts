import { describe, expect, it } from "vitest";
import {
  fetchMorphoVaults,
  floatToDecimalString,
  fractionFloatToBps,
  mapMorphoV1Vault,
  MORPHO_API_URL,
  morphoV1Query,
  morphoV2Query,
  usdFloatToWad,
} from "../src/morpho.js";
import v1Fixture from "./fixtures/morpho-v1-usdc.json" with { type: "json" };
import v2Fixture from "./fixtures/morpho-v2-usdc.json" with { type: "json" };

// Fixtures: real responses from https://api.morpho.org/graphql captured 2026-10-11 with the
// module's own queries (instantaneous APY, chains 8453 + 1, USDC, totalAssetsUsd ≥ $20M).

const NOW = 1_791_746_000;

/** A fetch stub that answers the V1 and V2 queries with the recorded fixtures. */
function fixtureFetch(overrides: { v1?: unknown; v2?: unknown } = {}): typeof fetch {
  return (async (_url: unknown, init?: RequestInit) => {
    const { query } = JSON.parse(String(init?.body)) as { query: string };
    const body = query.includes("vaultV2s") ? (overrides.v2 ?? v2Fixture.response) : (overrides.v1 ?? v1Fixture.response);
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
}

describe("float conversion without float arithmetic", () => {
  it("uses the exact decimal expansion of the double and rounds explicitly", () => {
    expect(floatToDecimalString(0.1)).toBe("0.100000000000");
    // 182393937.768877 is stored as 182393937.768876999617…; truncation keeps …876.
    expect(usdFloatToWad(182393937.768877)).toBe(182393937768876000000000000n);
    expect(usdFloatToWad(414367896.5948938)).toBe(414367896594893000000000000n);
    expect(usdFloatToWad(0)).toBe(0n);
    expect(fractionFloatToBps(0.04601522875221099, "down")).toBe(460);
    expect(fractionFloatToBps(0.0039999999705119995, "up")).toBe(40);
    expect(fractionFloatToBps(0.25, "up")).toBe(2500);
    expect(fractionFloatToBps(-0.00001, "down")).toBe(-1);
    expect(() => floatToDecimalString(Number.NaN)).toThrow();
    expect(() => floatToDecimalString(1e22)).toThrow();
  });
});

describe("fetchMorphoVaults with recorded responses", () => {
  it("maps V1 and V2 vaults to core Opportunities", async () => {
    const r = await fetchMorphoVaults({ chainIds: [8453, 1], assetSymbols: ["USDC"], minTvlUsd: 20_000_000, fetchImpl: fixtureFetch(), nowSec: NOW });
    if (!r.ok) throw new Error(JSON.stringify(r.error));
    expect(r.skipped).toEqual([]);
    expect(r.opportunities).toHaveLength(5 + 18);

    const gauntlet = r.opportunities.find((o) => o.id === "morpho:8453:0xee8f4ec5672f09119b96ab6fb59c27e1b7e44b61")!;
    expect(gauntlet).toMatchObject({
      protocol: "morpho",
      kind: "erc4626_vault",
      chainId: 8453,
      address: "0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61",
      name: "Gauntlet USDC Prime",
      asset: {
        symbol: "USDC",
        chainId: 8453,
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
        assetClass: "stablecoin",
        pegCurrency: "USD",
      },
      apy: { nativeBps: 460, rewardsBps: 0, netBps: 460, measurement: "instantaneous" },
      tvlUsd: 414367896594893000000000000n,
      availableLiquidityUsd: 182393937768876000000000000n,
      feeBps: 0,
      curator: { name: "Gauntlet", url: "https://www.gauntlet.xyz/" },
      withdrawal: "instant_subject_to_liquidity",
      warnings: [],
      listed: true,
      source: { name: "Morpho API", url: MORPHO_API_URL, fetchedAt: NOW },
    });
    expect(gauntlet.dependencies.slice(0, 2)).toEqual(["Morpho Blue", "MetaMorpho vault contract (Vault V1)"]);
    expect(gauntlet.dependencies.some((d) => /^Oracle \S+ 0x[0-9a-fA-F]{40} \(.+\/USDC market\)$/.test(d))).toBe(true);
    expect(gauntlet.audits.map((a) => a.url)).toContain("https://github.com/morpho-org/metamorpho/tree/main/audits");

    const steakhouseBase = r.opportunities.find((o) => o.id === "morpho:8453:0xbeef010f9cb27031ad51e3333f9af9c6b1228183")!;
    expect(steakhouseBase.feeBps).toBe(2500);
    expect(steakhouseBase.apy.nativeBps).toBe(343);
    expect(steakhouseBase.listed).toBe(true);

    // net APY slightly below ex-rewards APY (float noise) must not produce negative rewards.
    const spark = r.opportunities.find((o) => o.id === "morpho:8453:0x7bfa7c4f149e7415b73bdedfe609237e29cbf34a")!;
    expect(spark.apy).toEqual({ nativeBps: 413, rewardsBps: 0, netBps: 413, measurement: "instantaneous" });
    expect(spark.feeBps).toBe(1000);
    expect(spark.listed).toBe(false);

    // V2: rewards come from netApy − netApyExcludingRewards, and the withdrawable caveat is attached.
    const clearstar = r.opportunities.find((o) => o.id === "morpho:8453:0x91c056b6d4311a743614fbc03ac32d4e6a2d3a3c")!;
    expect(clearstar.apy).toEqual({ nativeBps: 424, rewardsBps: 180, netBps: 604, measurement: "instantaneous" });
    expect(clearstar.feeBps).toBe(1000);
    expect(clearstar.tvlUsd).toBe(36276702803330000000000000n);
    expect(clearstar.dependencies[1]).toBe("Morpho Vault V2 contract and adapters");
    expect(clearstar.warnings.map((w) => w.code)).toContain("morpho:v2_withdrawable_unknown");
    expect(clearstar.listed).toBe(false);

    // Every opportunity: liquidity never above TVL, net = native + rewards.
    for (const o of r.opportunities) {
      expect(o.availableLiquidityUsd <= o.tvlUsd).toBe(true);
      expect(o.apy.netBps).toBe(o.apy.nativeBps + o.apy.rewardsBps);
      expect(o.apy.rewardsBps).toBeGreaterThanOrEqual(0);
    }
  });

  it("applies the minimum TVL locally and skips non-allowlisted assets and malformed items", async () => {
    const items = v1Fixture.response.data.vaults.items;
    const imposter = {
      ...items[0]!,
      address: "0x1111111111111111111111111111111111111111",
      asset: { address: "0x2222222222222222222222222222222222222222", symbol: "USDC", decimals: 6 },
    };
    const v1 = { data: { vaults: { pageInfo: { count: 3, countTotal: 3 }, items: [items[0], imposter, { nonsense: true }] } } };
    const r = await fetchMorphoVaults({
      chainIds: [8453, 1],
      assetSymbols: ["USDC"],
      minTvlUsd: 100_000_000,
      versions: ["v1"],
      fetchImpl: fixtureFetch({ v1 }),
      nowSec: NOW,
    });
    if (!r.ok) throw new Error("expected ok");
    expect(r.opportunities.map((o) => o.name)).toEqual(["Gauntlet USDC Prime"]);
    expect(r.skipped.map((s) => s.reason)).toEqual([expect.stringMatching(/not an allowlisted USDC token/), "malformed vault item"]);
  });

  it("maps API warnings to levels and messages", () => {
    const item = {
      ...v1Fixture.response.data.vaults.items[0]!,
      warnings: [
        { type: "short_timelock", level: "RED" },
        { type: "low_liquidity", level: "YELLOW" },
        { type: "brand_new", level: "YELLOW" },
      ],
    };
    const r = mapMorphoV1Vault(item, { assetSymbols: ["USDC"], measurement: "instantaneous", fetchedAt: NOW, sourceUrl: MORPHO_API_URL });
    if (!r.ok) throw new Error("expected ok");
    expect(r.opportunity.warnings).toEqual([
      { code: "morpho:short_timelock", level: "critical", message: "The vault timelock is short, so curator changes can take effect quickly" },
      { code: "morpho:low_liquidity", level: "warning", message: "The vault has little liquidity available for withdrawals" },
      { code: "morpho:brand_new", level: "warning", message: "Morpho API warning: brand_new" },
    ]);
  });

  it("queries averaged APY when asked", async () => {
    let seen = "";
    const fetchImpl = (async (_u: unknown, init?: RequestInit) => {
      seen = (JSON.parse(String(init?.body)) as { query: string }).query;
      return new Response(JSON.stringify(v1Fixture.response), { status: 200 });
    }) as typeof fetch;
    const r = await fetchMorphoVaults({ chainIds: [8453], assetSymbols: ["USDC"], versions: ["v1"], apyMeasurement: "7d_average", fetchImpl, nowSec: NOW });
    expect(seen).toContain("avgNetApy(lookback: SEVEN_DAYS)");
    expect(r.ok && r.opportunities[0]!.apy.measurement).toBe("7d_average");
    expect(morphoV1Query()).toContain("apyNet: netApy");
    expect(morphoV2Query("30d_average")).toContain("avgNetApyExcludingRewards(lookback: THIRTY_DAYS)");
  });
});

describe("fetchMorphoVaults failures are typed", () => {
  const opts = { chainIds: [8453], assetSymbols: ["USDC"], versions: ["v1"] as const, nowSec: NOW };

  it("HTTP errors", async () => {
    const r = await fetchMorphoVaults({ ...opts, fetchImpl: (async () => new Response("<html>bad gateway</html>", { status: 502 })) as typeof fetch });
    expect(r).toEqual({ ok: false, error: { kind: "http", status: 502, message: "Morpho API returned HTTP 502" } });
  });

  it("GraphQL errors (even with HTTP 200)", async () => {
    const body = { errors: [{ message: "Query is too complex", status: "FORBIDDEN", extensions: { complexity: 1047750 } }] };
    const r = await fetchMorphoVaults({ ...opts, fetchImpl: (async () => new Response(JSON.stringify(body), { status: 200 })) as typeof fetch });
    expect(r).toEqual({
      ok: false,
      error: { kind: "graphql", message: "Query is too complex", errors: [{ message: "Query is too complex", code: "FORBIDDEN" }] },
    });
  });

  it("timeouts", async () => {
    const fetchImpl = ((_u: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
      })) as typeof fetch;
    const r = await fetchMorphoVaults({ ...opts, fetchImpl, timeoutMs: 20 });
    expect(r).toEqual({ ok: false, error: { kind: "timeout", message: "Morpho API did not respond within 20 ms" } });
  });

  it("network errors and invalid bodies", async () => {
    const down = await fetchMorphoVaults({
      ...opts,
      fetchImpl: (async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch,
    });
    expect(down).toMatchObject({ ok: false, error: { kind: "network" } });
    const junk = await fetchMorphoVaults({ ...opts, fetchImpl: (async () => new Response("not json", { status: 200 })) as typeof fetch });
    expect(junk).toMatchObject({ ok: false, error: { kind: "invalid_response" } });
    const empty = await fetchMorphoVaults({ ...opts, fetchImpl: (async () => new Response(JSON.stringify({ data: {} }), { status: 200 })) as typeof fetch });
    expect(empty).toMatchObject({ ok: false, error: { kind: "invalid_response", message: "Morpho API response has no vaults.items" } });
  });
});
