import { decodeFunctionData, maxUint256 } from "viem";
import { describe, expect, it } from "vitest";
import { AAVE_V3_POOL_ABI, ERC20_ABI } from "../src/abis.js";
import {
  AAVE_V3_MARKETS,
  aaveOpportunityId,
  buildAaveSupply,
  buildAaveWithdraw,
  decodeReserveConfiguration,
  liquidityRateToApyBps,
  liquidityRateToApyWad,
} from "../src/aave.js";
import { isListed } from "../src/listing.js";

describe("Aave supply APY from currentLiquidityRate", () => {
  // Expected values: (1 + r/1e27/31_536_000)^31_536_000 − 1 evaluated with Python's
  // decimal module at 100 significant digits, floored to 18 decimals / whole bps.
  const vectors: Array<[bigint, bigint, number]> = [
    // Base USDC on 2026-10-11 (integration-facts E.1); Aave's API reported 0.042439822920742…
    [41563949235092270501610553n, 42439822920742197n, 424],
    // Ethereum USDC on 2026-10-11.
    [43650641493584979629918522n, 44617345145488747n, 446],
    [5n * 10n ** 25n, 51271096334354555n, 512], // 5% APR
    [10n ** 27n, 1718281785360970821n, 17182], // 100% APR → e − 1
    [0n, 0n, 0],
    [1n, 0n, 0],
  ];

  it.each(vectors)("rate %s → APY wad %s, %s bps", (rate, apyWad, bps) => {
    expect(liquidityRateToApyWad(rate)).toBe(apyWad);
    expect(liquidityRateToApyBps(rate)).toBe(bps);
  });

  it("APY ≥ APR and rejects negative rates", () => {
    const rate = 41563949235092270501610553n;
    expect(liquidityRateToApyWad(rate)).toBeGreaterThanOrEqual(rate / 10n ** 9n);
    expect(() => liquidityRateToApyWad(-1n)).toThrow();
  });
});

describe("decodeReserveConfiguration", () => {
  it("decodes the bit layout from ReserveConfiguration.sol", () => {
    const data =
      7500n | // LTV
      (7800n << 16n) | // liquidation threshold
      (6n << 48n) | // decimals
      (1n << 56n) | // active
      (1n << 58n) | // borrowing enabled
      (1000n << 64n) | // reserve factor 10%
      (230_000_000n << 116n); // supply cap
    expect(decodeReserveConfiguration(data)).toEqual({
      decimals: 6,
      active: true,
      frozen: false,
      borrowingEnabled: true,
      paused: false,
      reserveFactorBps: 1000,
      supplyCap: 230_000_000n,
    });
    const frozenPaused = decodeReserveConfiguration(data | (1n << 57n) | (1n << 60n));
    expect(frozenPaused.frozen).toBe(true);
    expect(frozenPaused.paused).toBe(true);
  });
});

describe("Aave transaction builders", () => {
  const base = AAVE_V3_MARKETS[8453]!;
  const usdc = base.reserves.USDC!;
  const safe = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";

  it("approves the exact amount then supplies on behalf of the Safe", () => {
    const txs = buildAaveSupply({ chainId: 8453, asset: usdc.underlying, amount: 5_000_000n, onBehalfOf: safe, currentAllowance: 0n });
    expect(txs).toHaveLength(2);
    expect(txs.every((t) => t.operation === 0 && t.value === 0n)).toBe(true);
    expect(txs[0]!.to).toBe(usdc.underlying);
    expect(decodeFunctionData({ abi: ERC20_ABI, data: txs[0]!.data }).args).toEqual([base.pool, 5_000_000n]);
    expect(txs[1]!.to).toBe(base.pool);
    expect(decodeFunctionData({ abi: AAVE_V3_POOL_ABI, data: txs[1]!.data })).toMatchObject({
      functionName: "supply",
      args: [usdc.underlying, 5_000_000n, safe, 0],
    });
  });

  it("resets a non-zero allowance first", () => {
    const txs = buildAaveSupply({ chainId: 8453, asset: usdc.underlying, amount: 1n, onBehalfOf: safe, currentAllowance: 3n });
    expect(txs.map((t) => decodeFunctionData({ abi: [...ERC20_ABI, ...AAVE_V3_POOL_ABI], data: t.data }).functionName)).toEqual([
      "approve",
      "approve",
      "supply",
    ]);
    expect(decodeFunctionData({ abi: ERC20_ABI, data: txs[0]!.data }).args).toEqual([base.pool, 0n]);
  });

  it("withdraws an exact amount or everything", () => {
    const [exact] = buildAaveWithdraw({ chainId: 8453, asset: usdc.underlying, amount: 10n, to: safe });
    expect(decodeFunctionData({ abi: AAVE_V3_POOL_ABI, data: exact!.data }).args).toEqual([usdc.underlying, 10n, safe]);
    const [all] = buildAaveWithdraw({ chainId: 8453, asset: usdc.underlying, amount: "max", to: safe });
    expect(decodeFunctionData({ abi: AAVE_V3_POOL_ABI, data: all!.data }).args).toEqual([usdc.underlying, maxUint256, safe]);
  });

  it("refuses unknown chains, assets and zero recipients", () => {
    expect(() => buildAaveSupply({ chainId: 137, asset: usdc.underlying, amount: 1n, onBehalfOf: safe, currentAllowance: 0n })).toThrow(/No Aave v3 market/);
    expect(() =>
      buildAaveSupply({ chainId: 8453, asset: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", amount: 1n, onBehalfOf: safe, currentAllowance: 0n }),
    ).toThrow(/not a configured/);
    expect(() => buildAaveWithdraw({ chainId: 8453, asset: usdc.underlying, amount: 1n, to: "0x0000000000000000000000000000000000000000" })).toThrow();
    expect(() => buildAaveSupply({ chainId: 8453, asset: usdc.underlying, amount: 0n, onBehalfOf: safe, currentAllowance: 0n })).toThrow();
  });

  it("identifies reserves by aToken and lists every configured USDC reserve", () => {
    for (const market of Object.values(AAVE_V3_MARKETS)) {
      const id = aaveOpportunityId(market.chainId, market.reserves.USDC!.aToken);
      expect(id).toBe(`aave-v3:${market.chainId}:${market.reserves.USDC!.aToken.toLowerCase()}`);
      expect(isListed(id)).toBe(true);
    }
    // The Pool address alone is not a venue id (one Pool hosts many reserves).
    expect(isListed(`aave-v3:8453:${base.pool.toLowerCase()}`)).toBe(false);
  });
});
