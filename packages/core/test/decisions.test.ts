import { describe, expect, it } from "vitest";
import { validateAction, type ValidationContext } from "../src/actions.js";
import { evaluateApprovals, tierFor, canApprove } from "../src/approvals.js";
import { wad } from "../src/money.js";
import { DEFAULT_APPROVAL_POLICY } from "../src/policy.js";
import { generateRecommendations } from "../src/recommendations.js";
import { assessReserve } from "../src/reserve.js";
import { evaluateRisks } from "../src/risk.js";
import { runScenario } from "../src/scenarios.js";
import { computeTreasury } from "../src/treasury.js";
import { holding, NOW, obligation, opportunity, policy, position, quote, SAFE, TODAY, usdc, USDC_BASE, WATCH } from "./fixtures";

const obligations = [obligation({ id: "payroll", amount: wad(40_000), firstDueDate: "2025-10-25", recurrence: { freq: "monthly", interval: 1 } })];

function setup(opts: { liquid?: number; positions?: number; pol?: Parameters<typeof policy>[0]; opp?: Parameters<typeof opportunity>[0] } = {}) {
  const pol = policy({ runwayMonths: 3, ...opts.pol });
  const accounts = [SAFE, WATCH];
  const holdings = [holding(SAFE.id, USDC_BASE, usdc(opts.liquid ?? 1_000_000))];
  const positions = opts.positions ? [position("p1", SAFE.id, usdc(opts.positions))] : [];
  const treasury = computeTreasury({ asOf: NOW, accounts, holdings, positions, policy: pol });
  const reserve = assessReserve({ asOf: TODAY, policy: pol, treasury, obligations });
  const opportunities = [opportunity(opts.opp)];
  const ctx: ValidationContext = { nowSec: NOW, policy: pol, treasury, reserve, accounts, positions, opportunities, accountAssetBalanceRaw: holdings[0]!.raw };
  return { pol, accounts, holdings, positions, treasury, reserve, opportunities, ctx };
}

describe("validateAction", () => {
  it("passes a well-sized allocation", () => {
    const { ctx } = setup();
    const v = validateAction({ type: "allocate", accountId: SAFE.id, opportunityId: "morpho:8453:0xvault", amountUsd: wad(100_000), assetAmountRaw: usdc(100_000) }, ctx);
    expect(v.checks.filter((c) => c.status === "fail")).toEqual([]);
    expect(v.valid).toBe(true);
  });

  it("blocks allocations that breach the reserve, caps, or liquidity share", () => {
    const { ctx } = setup({ liquid: 300_000 });
    const v = validateAction({ type: "allocate", accountId: SAFE.id, opportunityId: "morpho:8453:0xvault", amountUsd: wad(250_000), assetAmountRaw: usdc(250_000) }, ctx);
    expect(v.valid).toBe(false);
    const failed = v.checks.filter((c) => c.status === "fail").map((c) => c.id);
    expect(failed).toContain("reserve_after");
    expect(failed).toContain("deployable");
    expect(failed).toContain("deploy_cap");
  });

  it("blocks unverified accounts, unlisted venues and observe-only mode", () => {
    const { ctx } = setup({ pol: { autonomy: "observe" }, opp: { listed: false } });
    const v = validateAction({ type: "allocate", accountId: WATCH.id, opportunityId: "morpho:8453:0xvault", amountUsd: wad(10_000), assetAmountRaw: usdc(10_000) }, ctx);
    const failed = v.checks.filter((c) => c.status === "fail").map((c) => c.id);
    expect(failed).toEqual(expect.arrayContaining(["autonomy", "account_verified", "account_safe", "listed"]));
  });

  it("blocks stale venue data and critical warnings", () => {
    const { ctx } = setup({ opp: { warnings: [{ code: "bad_debt", level: "critical", message: "Bad debt realized" }], source: { name: "Morpho API", url: "x", fetchedAt: NOW - 7200 } } });
    const v = validateAction({ type: "allocate", accountId: SAFE.id, opportunityId: "morpho:8453:0xvault", amountUsd: wad(10_000), assetAmountRaw: usdc(10_000) }, ctx);
    const failed = v.checks.filter((c) => c.status === "fail").map((c) => c.id);
    expect(failed).toEqual(expect.arrayContaining(["warnings", "freshness"]));
  });

  it("rejects zero and malformed payments", () => {
    const { ctx } = setup();
    const v = validateAction(
      { type: "payment", accountId: SAFE.id, obligationId: "payroll", dueDate: "2025-10-25", amountUsd: 0n, assetAmountRaw: 0n, assetSymbol: "USDC", recipient: "not-an-address" },
      { ...ctx, unsettledOccurrences: new Map() },
    );
    const failed = v.checks.filter((c) => c.status === "fail").map((c) => c.id);
    expect(failed).toEqual(expect.arrayContaining(["amount_positive", "obligation_open", "recipient"]));
  });
});

describe("validateAction binds amounts and payees (security review BE-01, BE-02)", () => {
  const payment = (over: Record<string, unknown> = {}) =>
    ({
      type: "payment",
      accountId: SAFE.id,
      obligationId: "payroll",
      dueDate: "2025-10-25",
      amountUsd: wad(40_000),
      assetAmountRaw: usdc(40_000),
      assetSymbol: "USDC",
      recipient: "0x3333333333333333333333333333333333333333",
      ...over,
    }) as Parameters<typeof validateAction>[0];
  const paymentCtx = (
    ctx: ValidationContext,
    terms: Partial<{ recipient: string | null; chainId: number | null; assetSymbol: string | null }> = {},
  ): ValidationContext => ({
    ...ctx,
    unsettledOccurrences: new Map([["payroll|2025-10-25", wad(40_000)]]),
    actionAsset: { asset: USDC_BASE, price: quote("1") },
    paymentTerms: new Map([["payroll", { recipient: "0x3333333333333333333333333333333333333333", chainId: 8453, assetSymbol: "USDC", ...terms }]]),
  });

  it("rejects an allocation whose USD figure understates the token amount", () => {
    const { ctx } = setup();
    // $10k stated, 900k USDC moved: every USD check would pass on the small figure.
    const v = validateAction(
      { type: "allocate", accountId: SAFE.id, opportunityId: "morpho:8453:0xvault", amountUsd: wad(10_000), assetAmountRaw: usdc(900_000) },
      ctx,
    );
    expect(v.valid).toBe(false);
    expect(v.checks.find((c) => c.id === "amount_consistent")?.status).toBe("fail");
  });

  it("accepts amounts within the 1% tolerance and values USD stablecoins at no less than $1", () => {
    const { ctx } = setup();
    const ok = validateAction(
      { type: "allocate", accountId: SAFE.id, opportunityId: "morpho:8453:0xvault", amountUsd: wad(100_000), assetAmountRaw: usdc("100500") },
      ctx,
    );
    expect(ok.checks.find((c) => c.id === "amount_consistent")?.status).toBe("pass");
    // Depegged quote (0.50): the token amount is still valued at $1 for approval and caps, never understated.
    const depeg = validateAction(
      { type: "allocate", accountId: SAFE.id, opportunityId: "morpho:8453:0xvault", amountUsd: wad(50_000), assetAmountRaw: usdc(100_000) },
      { ...ctx, actionAsset: { asset: USDC_BASE, price: quote("0.5") } },
    );
    expect(depeg.checks.find((c) => c.id === "amount_consistent")?.status).toBe("fail");
  });

  it("rejects understated withdrawals (valued from the position)", () => {
    const { ctx } = setup({ positions: 500_000 });
    const v = validateAction({ type: "withdraw", accountId: SAFE.id, positionId: "p1", amountUsd: wad(1), assetAmountRaw: usdc(400_000) }, ctx);
    expect(v.checks.find((c) => c.id === "amount_consistent")?.status).toBe("fail");
  });

  it("passes a payment to the recorded payee on its network and asset", () => {
    const { ctx } = setup();
    const v = validateAction(payment(), paymentCtx(ctx));
    expect(v.checks.filter((c) => c.status === "fail")).toEqual([]);
  });

  it("rejects payments to an address other than the obligation's payee", () => {
    const { ctx } = setup();
    const v = validateAction(payment({ recipient: "0x4444444444444444444444444444444444444444" }), paymentCtx(ctx));
    expect(v.checks.find((c) => c.id === "recipient_matches")?.status).toBe("fail");
  });

  it("fails closed when the obligation has no recorded payee or terms are not supplied", () => {
    const { ctx } = setup();
    expect(validateAction(payment(), paymentCtx(ctx, { recipient: null })).checks.find((c) => c.id === "recipient_matches")?.status).toBe("fail");
    const noTerms = validateAction(payment(), { ...paymentCtx(ctx), paymentTerms: undefined });
    expect(noTerms.valid).toBe(false);
    const noAsset = validateAction(payment(), { ...paymentCtx(ctx), actionAsset: undefined });
    expect(noAsset.checks.find((c) => c.id === "amount_valued")?.status).toBe("fail");
  });

  it("rejects payments on another network, in another asset, or understating the amount", () => {
    const { ctx } = setup();
    const failed = (v: ReturnType<typeof validateAction>) => v.checks.filter((c) => c.status === "fail").map((c) => c.id);
    expect(failed(validateAction(payment(), paymentCtx(ctx, { chainId: 1 })))).toContain("payment_network");
    expect(failed(validateAction(payment(), paymentCtx(ctx, { assetSymbol: "EURC" })))).toContain("payment_asset");
    expect(failed(validateAction(payment({ amountUsd: wad(100) }), paymentCtx(ctx)))).toContain("amount_consistent");
  });
});

describe("generateRecommendations", () => {
  it("recommends deploying part of the surplus within every cap, with do-nothing as an alternative", () => {
    const s = setup();
    const recs = generateRecommendations({ nowSec: NOW, policy: s.pol, treasury: s.treasury, reserve: s.reserve, accounts: s.accounts, holdings: s.holdings, positions: s.positions, opportunities: s.opportunities });
    expect(recs).toHaveLength(1);
    const rec = recs[0]!;
    expect(rec.kind).toBe("deploy_surplus");
    expect(rec.validation?.valid).toBe(true);
    // liquidity limit 5% of $40M = $2M; per-venue cap 20% of $1M = $200k; protocol 25% = $250k; deployable min(1M-120k... cap 500k)
    expect(rec.action?.amountUsd).toBe(wad(200_000));
    expect(rec.alternatives.some((a) => a.title === "Do nothing")).toBe(true);
    // Deterministic: same input → same fingerprint
    const again = generateRecommendations({ nowSec: NOW, policy: s.pol, treasury: s.treasury, reserve: s.reserve, accounts: s.accounts, holdings: s.holdings, positions: s.positions, opportunities: s.opportunities });
    expect(again[0]!.fingerprint).toBe(rec.fingerprint);
  });

  it("recommends restoring the reserve instead of deploying when short", () => {
    const s = setup({ liquid: 50_000, positions: 200_000 });
    const recs = generateRecommendations({ nowSec: NOW, policy: s.pol, treasury: s.treasury, reserve: s.reserve, accounts: s.accounts, holdings: s.holdings, positions: s.positions, opportunities: s.opportunities });
    expect(recs.map((r) => r.kind)).toContain("restore_reserve");
    expect(recs.map((r) => r.kind)).not.toContain("deploy_surplus");
    const restore = recs.find((r) => r.kind === "restore_reserve")!;
    expect(restore.action?.type).toBe("withdraw");
    expect(restore.action?.amountUsd).toBe(s.reserve.shortfall);
  });

  it("makes no recommendation when nothing qualifies", () => {
    const s = setup({ opp: { listed: false } });
    const recs = generateRecommendations({ nowSec: NOW, policy: s.pol, treasury: s.treasury, reserve: s.reserve, accounts: s.accounts, holdings: s.holdings, positions: s.positions, opportunities: s.opportunities });
    expect(recs).toEqual([]);
  });
});

describe("approvals", () => {
  const pol = DEFAULT_APPROVAL_POLICY;

  it("selects tiers by amount", () => {
    expect(tierFor(pol, wad(10_000)).requiredApprovals).toBe(1);
    expect(tierFor(pol, wad(25_000)).requiredApprovals).toBe(1);
    expect(tierFor(pol, wad(25_001)).requiredApprovals).toBe(2);
    expect(tierFor(pol, wad(10_000_000)).requiredRole).toBe("owner");
  });

  it("ignores self-approval, viewers and late approvals", () => {
    const e = evaluateApprovals({
      policy: pol,
      amountUsd: wad(100_000),
      proposerId: "alice",
      createdAt: NOW,
      nowSec: NOW + 100,
      records: [
        { memberId: "alice", role: "owner", decision: "approve", at: NOW + 1 },
        { memberId: "victor", role: "viewer", decision: "approve", at: NOW + 2 },
        { memberId: "bob", role: "finance", decision: "approve", at: NOW + 3 },
        { memberId: "carol", role: "approver", decision: "approve", at: NOW + 72 * 3600 + 5 },
      ],
    });
    expect(e.approvals).toBe(1);
    expect(e.state).toBe("pending");
    expect(canApprove({ role: "owner", memberId: "alice", proposerId: "alice", policy: pol }).allowed).toBe(false);
  });

  it("requires the tier role and lets a rejection stop the proposal", () => {
    const base = { policy: pol, amountUsd: wad(1_000_000), proposerId: "alice", createdAt: NOW, nowSec: NOW + 10 };
    const noOwner = evaluateApprovals({ ...base, records: ["b", "c", "d"].map((m, i) => ({ memberId: m, role: "finance" as const, decision: "approve" as const, at: NOW + i })) });
    expect(noOwner.state).toBe("pending");
    expect(noOwner.roleRequirementMet).toBe(false);
    const withOwner = evaluateApprovals({ ...base, records: [...["b", "c"].map((m, i) => ({ memberId: m, role: "finance" as const, decision: "approve" as const, at: NOW + i })), { memberId: "o", role: "owner", decision: "approve", at: NOW + 5 }] });
    expect(withOwner.state).toBe("approved");
    const rejected = evaluateApprovals({ ...base, records: [{ memberId: "b", role: "finance", decision: "reject", at: NOW }] });
    expect(rejected.state).toBe("rejected");
  });

  it("expires proposals", () => {
    const e = evaluateApprovals({ policy: pol, amountUsd: wad(1), proposerId: "a", createdAt: NOW, nowSec: NOW + 73 * 3600, records: [] });
    expect(e.state).toBe("expired");
  });
});

describe("risk", () => {
  it("raises depeg and shortfall alerts with evidence", () => {
    const pol = policy({ runwayMonths: 6 });
    const holdings = [holding(SAFE.id, USDC_BASE, usdc(100_000), quote("0.97"))];
    const treasury = computeTreasury({ asOf: NOW, accounts: [SAFE], holdings, positions: [], policy: pol });
    const reserve = assessReserve({ asOf: TODAY, policy: pol, treasury, obligations });
    const alerts = evaluateRisks({ asOf: TODAY, nowSec: NOW, policy: pol, treasury, reserve, accounts: [SAFE], holdings, positions: [], opportunities: [] });
    const kinds = alerts.map((a) => a.kind);
    expect(kinds).toContain("depeg");
    expect(kinds).toContain("reserve_shortfall");
    expect(alerts.find((a) => a.kind === "depeg")!.severity).toBe("critical");
    // Same input → same fingerprints (no alert floods)
    const again = evaluateRisks({ asOf: TODAY, nowSec: NOW, policy: pol, treasury, reserve, accounts: [SAFE], holdings, positions: [], opportunities: [] });
    expect(again.map((a) => a.fingerprint)).toEqual(alerts.map((a) => a.fingerprint));
  });

  it("flags unexplained balance drops but not explained ones", () => {
    const s = setup();
    const changes = [
      { accountId: SAFE.id, accountLabel: "Ops", assetSymbol: "USDC", chainId: 8453, previousUsd: wad(100), currentUsd: wad(50), explained: false, observedAt: NOW },
      { accountId: SAFE.id, accountLabel: "Ops", assetSymbol: "USDC", chainId: 8453, previousUsd: wad(100), currentUsd: wad(10), explained: true, observedAt: NOW },
    ];
    const alerts = evaluateRisks({ asOf: TODAY, nowSec: NOW, policy: s.pol, treasury: s.treasury, reserve: s.reserve, accounts: s.accounts, holdings: s.holdings, positions: [], opportunities: [], balanceChanges: changes });
    expect(alerts.filter((a) => a.kind === "unexpected_balance_change")).toHaveLength(1);
  });
});

describe("scenarios", () => {
  it("shows how a depeg and a new obligation change the deployable amount", () => {
    const state = {
      asOf: TODAY,
      nowSec: NOW,
      policy: policy({ runwayMonths: 3 }),
      accounts: [SAFE],
      holdings: [holding(SAFE.id, USDC_BASE, usdc(500_000))],
      positions: [],
      obligations,
    };
    const { base, scenario } = runScenario(state, [
      { type: "depeg", symbol: "USDC", price: "0.95" },
      { type: "new_obligation", obligation: obligation({ id: "audit", amount: wad(80_000), firstDueDate: "2025-11-15" }) },
    ]);
    expect(base.reserve.surplus.deployable > scenario.reserve.surplus.deployable).toBe(true);
    expect(scenario.treasury.reserveEligible).toBe(wad(475_000));
  });
});
