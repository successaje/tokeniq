import { describe, expect, it } from "vitest";
import { validateAction, type ValidationContext } from "../src/actions.js";
import { evaluateApprovals, evaluateApprovalsStrictest, type MemberRole } from "../src/approvals.js";
import { wad } from "../src/money.js";
import { DEFAULT_APPROVAL_POLICY, type ApprovalPolicy } from "../src/policy.js";
import { generateRecommendations } from "../src/recommendations.js";
import { assessReserve, type PendingOutflow } from "../src/reserve.js";
import { computeTreasury } from "../src/treasury.js";
import { holding, NOW, obligation, opportunity, policy, quote, SAFE, TODAY, usdc, USDC_BASE } from "./fixtures";

const VENUE = "morpho:8453:0xvault";

function setup(opts: { pending?: PendingOutflow[]; opportunities?: Parameters<typeof opportunity>[0][] } = {}) {
  const pol = policy({ runwayMonths: 3 });
  const accounts = [SAFE];
  const holdings = [holding(SAFE.id, USDC_BASE, usdc(1_000_000))];
  const treasury = computeTreasury({ asOf: NOW, accounts, holdings, positions: [], policy: pol });
  const obligations = [obligation({ id: "payroll", amount: wad(40_000), firstDueDate: "2025-10-25", recurrence: { freq: "monthly", interval: 1 } })];
  const reserve = assessReserve({ asOf: TODAY, policy: pol, treasury, obligations, pendingOutflows: opts.pending ?? [] });
  const opportunities = (opts.opportunities ?? [{}]).map((o) => opportunity(o));
  const ctx: ValidationContext = { nowSec: NOW, policy: pol, treasury, reserve, accounts, positions: [], opportunities, accountAssetBalanceRaw: holdings[0]!.raw, pendingOutflows: opts.pending ?? [] };
  return { pol, accounts, holdings, treasury, reserve, opportunities, ctx };
}

const allocate = (amount: number) => ({ type: "allocate" as const, accountId: SAFE.id, opportunityId: VENUE, amountUsd: wad(amount), assetAmountRaw: usdc(amount) });

describe("proposals in progress count toward concentration limits", () => {
  it("a second allocation cannot exceed the venue cap that the first one already uses", () => {
    // Per-venue cap is 20% of $1M = $200k.
    expect(validateAction(allocate(100_000), setup().ctx).checks.find((c) => c.id === "venue_cap")?.status).toBe("pass");
    const pending: PendingOutflow[] = [{ id: "prop-1", amount: wad(150_000), kind: "allocation", venueId: VENUE, protocol: "morpho" }];
    const v = validateAction(allocate(100_000), setup({ pending }).ctx);
    expect(v.checks.find((c) => c.id === "venue_cap")?.status).toBe("fail");
    expect(v.checks.find((c) => c.id === "venue_cap")?.detail).toContain("including proposals in progress");
  });

  it("protocol limits include pending allocations to other venues of the same protocol", () => {
    // Per-protocol cap is 25% of $1M = $250k.
    const pending: PendingOutflow[] = [{ id: "prop-1", amount: wad(200_000), kind: "allocation", venueId: "morpho:8453:0xother", protocol: "morpho" }];
    const v = validateAction(allocate(100_000), setup({ pending }).ctx);
    expect(v.checks.find((c) => c.id === "protocol_cap")?.status).toBe("fail");
  });

  it("recommendations size around capital already on its way to a venue", () => {
    const pending: PendingOutflow[] = [{ id: "prop-1", amount: wad(150_000), kind: "allocation", venueId: VENUE, protocol: "morpho" }];
    const s = setup({ pending });
    const recs = generateRecommendations({ nowSec: NOW, policy: s.pol, treasury: s.treasury, reserve: s.reserve, accounts: s.accounts, holdings: s.holdings, positions: [], opportunities: s.opportunities, pendingOutflows: pending });
    const deploy = recs.find((r) => r.kind === "deploy_surplus");
    expect(deploy?.action?.amountUsd).toBe(wad(50_000));
    expect(deploy?.validation?.valid).toBe(true);
  });
});

describe("venue ranking ignores incentive rewards", () => {
  it("prefers the venue that pays more before rewards", () => {
    const s = setup({
      opportunities: [
        { id: "morpho:8453:0xrewards", address: "0x00000000000000000000000000000000000000aa", name: "Rewards-heavy vault", apy: { nativeBps: 300, rewardsBps: 300, netBps: 600, measurement: "instantaneous" } },
        { id: VENUE, name: "Plain vault", apy: { nativeBps: 500, rewardsBps: 0, netBps: 500, measurement: "instantaneous" } },
      ],
    });
    const recs = generateRecommendations({ nowSec: NOW, policy: s.pol, treasury: s.treasury, reserve: s.reserve, accounts: s.accounts, holdings: s.holdings, positions: [], opportunities: s.opportunities });
    const deploy = recs.find((r) => r.kind === "deploy_surplus")!;
    expect(deploy.action?.type === "allocate" && deploy.action.opportunityId).toBe(VENUE);
    expect(deploy.upside).toContain("before rewards");
  });
});

describe("approvals follow current membership and the strictest policy", () => {
  const base = { amountUsd: wad(100_000), proposerId: "alice", createdAt: NOW, nowSec: NOW + 60 };
  const approve = (memberId: string, role: MemberRole, at = NOW + 10) => ({ memberId, role, decision: "approve" as const, at });

  it("drops approvals from people who left or can no longer approve", () => {
    const records = [approve("bob", "finance"), approve("carol", "approver", NOW + 11)];
    const everyone = new Map<string, MemberRole>([["alice", "owner"], ["bob", "finance"], ["carol", "approver"]]);
    expect(evaluateApprovals({ ...base, policy: DEFAULT_APPROVAL_POLICY, records, currentRoles: everyone }).state).toBe("approved");
    const bobLeft = new Map<string, MemberRole>([["alice", "owner"], ["carol", "approver"]]);
    expect(evaluateApprovals({ ...base, policy: DEFAULT_APPROVAL_POLICY, records, currentRoles: bobLeft }).approvals).toBe(1);
    const carolViewer = new Map<string, MemberRole>([["alice", "owner"], ["bob", "finance"], ["carol", "viewer"]]);
    expect(evaluateApprovals({ ...base, policy: DEFAULT_APPROVAL_POLICY, records, currentRoles: carolViewer }).state).toBe("pending");
  });

  it("a role requirement needs the role both when approving and now", () => {
    const big = { ...base, amountUsd: wad(1_000_000) };
    const records = [approve("bob", "finance"), approve("carol", "finance", NOW + 11), approve("olu", "owner", NOW + 12)];
    const still = new Map<string, MemberRole>([["bob", "finance"], ["carol", "finance"], ["olu", "owner"]]);
    expect(evaluateApprovals({ ...big, policy: DEFAULT_APPROVAL_POLICY, records, currentRoles: still }).state).toBe("approved");
    const demoted = new Map<string, MemberRole>([["bob", "finance"], ["carol", "finance"], ["olu", "finance"]]);
    const e = evaluateApprovals({ ...big, policy: DEFAULT_APPROVAL_POLICY, records, currentRoles: demoted });
    expect(e.roleRequirementMet).toBe(false);
    expect(e.state).toBe("pending");
  });

  it("loosening the policy does not speed up a proposal created under the stricter one", () => {
    const strict: ApprovalPolicy = { ...DEFAULT_APPROVAL_POLICY, tiers: [{ upToUsd: null, requiredApprovals: 2, requiredRole: null }] };
    const loose: ApprovalPolicy = { ...DEFAULT_APPROVAL_POLICY, tiers: [{ upToUsd: null, requiredApprovals: 1, requiredRole: null }] };
    const records = [approve("bob", "finance")];
    expect(evaluateApprovals({ ...base, policy: loose, records }).state).toBe("approved");
    const e = evaluateApprovalsStrictest([strict, loose], { ...base, records });
    expect(e.state).toBe("pending");
    expect(e.remaining).toBe(1);
    // Tightening applies immediately.
    expect(evaluateApprovalsStrictest([loose, strict], { ...base, records }).state).toBe("pending");
  });

  it("uses the deadline fixed at creation, whatever the current TTL", () => {
    const shortTtl: ApprovalPolicy = { ...DEFAULT_APPROVAL_POLICY, proposalTtlHours: 1 };
    const e = evaluateApprovals({ ...base, policy: shortTtl, nowSec: NOW + 2 * 3600, records: [], expiresAt: NOW + 72 * 3600 });
    expect(e.state).toBe("pending");
    expect(e.expiresAt).toBe(NOW + 72 * 3600);
  });
});

describe("new or changed payee addresses are held", () => {
  const PAYEE = "0x3333333333333333333333333333333333333333";
  const payment = { type: "payment" as const, accountId: SAFE.id, obligationId: "payroll", dueDate: "2025-10-25", amountUsd: wad(40_000), assetAmountRaw: usdc(40_000), assetSymbol: "USDC", recipient: PAYEE };
  const ctxWith = (recipientSetAt: number | null, holdHours = 48): ValidationContext => ({
    ...setup().ctx,
    unsettledOccurrences: new Map([["payroll|2025-10-25", wad(40_000)]]),
    actionAsset: { asset: USDC_BASE, price: quote("1") },
    paymentTerms: new Map([["payroll", { recipient: PAYEE, chainId: 8453, assetSymbol: "USDC", recipientSetAt }]]),
    payeeHoldSec: holdHours * 3600,
  });
  const hold = (ctx: ValidationContext) => validateAction(payment, ctx).checks.find((c) => c.id === "payee_hold");

  it("refuses payments to an address set less than the hold ago", () => {
    const c = hold(ctxWith(NOW - 3600));
    expect(c?.status).toBe("fail");
    expect(c?.detail).toContain("held until");
  });

  it("allows them once the hold has passed", () => {
    expect(hold(ctxWith(NOW - 49 * 3600))?.status).toBe("pass");
    expect(validateAction(payment, ctxWith(NOW - 49 * 3600)).valid).toBe(true);
  });

  it("fails closed when the change time is unknown, and can be switched off by policy", () => {
    expect(hold(ctxWith(null))?.status).toBe("fail");
    expect(hold(ctxWith(NOW - 60, 0))).toBeUndefined();
  });
});
