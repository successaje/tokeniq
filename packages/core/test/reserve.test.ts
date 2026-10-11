import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { wad } from "../src/money.js";
import { assessReserve, projectCashflow } from "../src/reserve.js";
import { computeTreasury } from "../src/treasury.js";
import { ETH_BASE, holding, NOW, obligation, policy, position, quote, SAFE, TODAY, usdc, USDC_BASE, WATCH } from "./fixtures";

function treasuryOf(liquidUsdc: number, opts: { positions?: number; watch?: number; price?: string } = {}) {
  const holdings = [holding(SAFE.id, USDC_BASE, usdc(liquidUsdc), quote(opts.price ?? "1"))];
  if (opts.watch) holdings.push(holding(WATCH.id, USDC_BASE, usdc(opts.watch)));
  return computeTreasury({
    asOf: NOW,
    accounts: [SAFE, WATCH],
    holdings,
    positions: opts.positions ? [position("p1", SAFE.id, usdc(opts.positions))] : [],
    policy: policy(),
  });
}

describe("computeTreasury", () => {
  it("never values a USD stablecoin above $1 for the reserve, but reports market value", () => {
    const t = treasuryOf(100_000, { price: "1.002" });
    expect(t.gross).toBe(wad(100_200));
    expect(t.reserveEligible).toBe(wad(100_000));
  });

  it("applies haircuts and excludes unverified accounts from the reserve", () => {
    const t = computeTreasury({
      asOf: NOW,
      accounts: [SAFE, WATCH],
      holdings: [holding(SAFE.id, USDC_BASE, usdc(100_000)), holding(WATCH.id, USDC_BASE, usdc(50_000))],
      positions: [],
      policy: policy({ haircutsBps: { USDC: 100 } }),
    });
    expect(t.gross).toBe(wad(150_000));
    expect(t.reserveEligible).toBe(wad(99_000));
    expect(t.unverifiedValue).toBe(wad(50_000));
    expect(t.issues.some((i) => i.code === "unverified_excluded")).toBe(true);
  });

  it("counts positions as allocated, not reserve-eligible", () => {
    const t = treasuryOf(100_000, { positions: 40_000 });
    expect(t.gross).toBe(wad(140_000));
    expect(t.allocated.total).toBe(wad(40_000));
    expect(t.reserveEligible).toBe(wad(100_000));
  });

  it("flags missing and stale prices as incomplete data", () => {
    const t = computeTreasury({
      asOf: NOW,
      accounts: [SAFE],
      holdings: [holding(SAFE.id, ETH_BASE, 10n ** 18n, null as never), holding(SAFE.id, USDC_BASE, usdc(10), quote("1", { stale: true }))],
      positions: [],
      policy: policy(),
    });
    expect(t.complete).toBe(false);
    expect(t.issues.map((i) => i.code).sort()).toEqual(["price_missing", "price_stale"]);
  });
});

describe("assessReserve", () => {
  const obligations = [
    obligation({ id: "payroll", amount: wad(40_000), firstDueDate: "2025-10-25", recurrence: { freq: "monthly", interval: 1 } }),
    obligation({ id: "audit", amount: wad(60_000), firstDueDate: "2025-11-20", certainty: "invoiced" }),
  ];

  it("uses the strictest rule and explains which one binds", () => {
    const r = assessReserve({ asOf: TODAY, policy: policy({ runwayMonths: 3, obligationBufferBps: 1000 }), treasury: treasuryOf(500_000), obligations });
    // runway: 3 x 40k = 120k. obligations in 90d: payroll Oct 25, Nov 25, Dec 25 = 120k + audit 60k = 180k, +10% = 198k
    expect(r.required).toBe(wad(198_000));
    expect(r.bindingRule).toBe("obligations");
    expect(r.rules.find((x) => x.id === "runway")!.amount).toBe(wad(120_000));
    expect(r.status).toBe("covered");
    expect(r.surplus.afterReserve).toBe(wad(302_000));
    // Deployment cap: 50% of 500k = 250k
    expect(r.surplus.deployable).toBe(wad(250_000));
    expect(r.surplus.limitedBy).toBe("deployment_cap");
  });

  it("uses the higher of declared and itemized burn", () => {
    const r = assessReserve({ asOf: TODAY, policy: policy({ monthlyBurnUsd: "30000", runwayMonths: 6 }), treasury: treasuryOf(500_000), obligations });
    expect(r.burn.used).toBe(wad(40_000));
    expect(r.burn.basis).toBe("itemized_exceeds_declared");
    expect(r.required).toBe(wad(240_000));
    expect(r.bindingRule).toBe("runway");
  });

  it("reports a shortfall and zero deployable when under-covered", () => {
    const r = assessReserve({ asOf: TODAY, policy: policy({ runwayMonths: 6 }), treasury: treasuryOf(100_000), obligations });
    expect(r.status).toBe("shortfall");
    expect(r.shortfall).toBe(wad(140_000));
    expect(r.surplus.deployable).toBe(0n);
    expect(r.surplus.limitedBy).toBe("nothing_available");
  });

  it("subtracts pending outflows and pending allocations from available room", () => {
    const r = assessReserve({
      asOf: TODAY,
      policy: policy({ runwayMonths: 0, obligationBufferBps: 0 }),
      treasury: treasuryOf(400_000),
      obligations,
      pendingOutflows: [{ id: "prop1", amount: wad(50_000), kind: "allocation" }],
    });
    expect(r.required).toBe(wad(180_000));
    expect(r.surplus.afterReserve).toBe(wad(170_000));
    // cap: 200k - 0 allocated - 50k pending = 150k
    expect(r.surplus.capRemaining).toBe(wad(150_000));
    expect(r.surplus.deployable).toBe(wad(150_000));
  });

  it("flags high uncertainty when the runway rule has no burn", () => {
    const r = assessReserve({ asOf: TODAY, policy: policy({ runwayMonths: 6 }), treasury: treasuryOf(100_000), obligations: [] });
    expect(r.uncertainty.level).toBe("high");
    expect(r.burn.basis).toBe("none");
  });

  it("can exclude estimates, and reports what was excluded", () => {
    const est = [obligation({ id: "mkt", amount: wad(20_000), firstDueDate: "2025-10-30", certainty: "estimate" })];
    const r = assessReserve({ asOf: TODAY, policy: policy({ runwayMonths: 0, includeEstimatedObligations: false }), treasury: treasuryOf(100_000), obligations: est });
    expect(r.obligations.total).toBe(0n);
    expect(r.obligations.excludedEstimates).toBe(wad(20_000));
  });

  it("deployable never exceeds what is left after the reserve, nor the cap (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5_000_000 }),
        fc.integer({ min: 0, max: 2_000_000 }),
        fc.integer({ min: 0, max: 24 }),
        fc.integer({ min: 0, max: 200_000 }),
        fc.integer({ min: 0, max: 10_000 }),
        (liquid, allocated, runway, burn, maxDeployedBps) => {
          const t = treasuryOf(liquid, { positions: allocated });
          const r = assessReserve({ asOf: TODAY, policy: policy({ runwayMonths: runway, monthlyBurnUsd: String(burn), maxDeployedBps }), treasury: t, obligations });
          expect(r.surplus.deployable >= 0n).toBe(true);
          expect(r.surplus.deployable + r.required <= t.reserveEligible || r.surplus.deployable === 0n).toBe(true);
          expect(r.surplus.deployable <= r.surplus.capRemaining).toBe(true);
          if (r.status === "shortfall") expect(r.surplus.deployable).toBe(0n);
        },
      ),
    );
  });
});

describe("projectCashflow", () => {
  it("projects balances and finds the lowest point", () => {
    const r = assessReserve({
      asOf: TODAY,
      policy: policy({ runwayMonths: 0 }),
      treasury: treasuryOf(100_000),
      obligations: [obligation({ id: "big", amount: wad(150_000), firstDueDate: "2025-11-01" })],
    });
    const p = projectCashflow({ start: r.available, asOf: TODAY, days: 90, occurrences: r.obligations.occurrences });
    expect(p.lowest.balance).toBe(-wad(50_000));
    expect(p.firstNegative).not.toBeNull();
    expect(p.points.at(-1)!.date).toBe("2026-01-07");
  });
});
