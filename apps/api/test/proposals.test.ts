import { opportunityToJson } from "../src/services/dto.js";
import { schema, sql } from "@tokeniq/db";
import { wad } from "@tokeniq/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client, setup, type TestContext } from "./helpers.js";

let ctx: TestContext;
let owner: Client;
let finance: Client;
let approver: Client;
let viewer: Client;
let admin: Client;
let orgId: string;

const VENUE_ID = "morpho:8453:0xee8f4ec5672f09119b96ab6fb59c27e1b7e44b61";

beforeAll(async () => {
  ctx = await setup();
  owner = new Client(ctx);
  finance = new Client(ctx);
  approver = new Client(ctx);
  viewer = new Client(ctx);
  admin = new Client(ctx);
  await owner.signIn("p-owner@example.com", "Olu Owner");
  await finance.signIn("p-finance@example.com", "Fola Finance");
  await approver.signIn("p-approver@example.com", "Ada Approver");
  await viewer.signIn("p-viewer@example.com", "Vee Viewer");
  await admin.signIn("p-admin@example.com", "Ade Admin");

  // Sample workspace: simulated Safes and balances, recommendations enabled, execution blocked.
  const sample = await owner.post("/api/v1/sample-workspace");
  orgId = sample.json.organizationId;
  for (const [client, email, role] of [
    [finance, "p-finance@example.com", "finance"],
    [approver, "p-approver@example.com", "approver"],
    [viewer, "p-viewer@example.com", "viewer"],
    [admin, "p-admin@example.com", "admin"],
  ] as const) {
    const inv = await owner.post(`/api/v1/orgs/${orgId}/invitations`, { email, role });
    expect((await client.post(`/api/v1/invitations/${inv.json.id}/accept`)).status).toBe(200);
  }

  // One listed venue with fresh data (the real adapter is exercised in packages/chain tests).
  const nowSec = Math.floor(ctx.clock.now.getTime() / 1000);
  await ctx.deps.db.insert(schema.opportunities).values({
    id: VENUE_ID,
    protocol: "morpho",
    chainId: 8453,
    address: "0xee8f4ec5672f09119b96ab6fb59c27e1b7e44b61",
    name: "Gauntlet USDC Prime",
    assetSymbol: "USDC",
    listed: true,
    fetchedAt: ctx.clock.now,
    data: opportunityToJson({
      id: VENUE_ID,
      protocol: "morpho",
      kind: "erc4626_vault",
      chainId: 8453,
      address: "0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61",
      name: "Gauntlet USDC Prime",
      asset: { symbol: "USDC", chainId: 8453, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, assetClass: "stablecoin", pegCurrency: "USD" },
      apy: { nativeBps: 460, rewardsBps: 0, netBps: 460, measurement: "instantaneous" },
      tvlUsd: wad(400_000_000),
      availableLiquidityUsd: wad(90_000_000),
      feeBps: 1000,
      curator: { name: "Gauntlet" },
      withdrawal: "instant_subject_to_liquidity",
      warnings: [],
      dependencies: ["Morpho Blue"],
      audits: [],
      listed: true,
      source: { name: "Morpho API", url: "https://api.morpho.org/graphql", fetchedAt: nowSec - 60 },
    }),
  });
}, 90_000);

afterAll(async () => {
  await ctx?.close();
});

describe("recommendation to proposal", () => {
  let recId: string;
  let proposalId: string;

  it("produces a deterministic, policy-checked recommendation", async () => {
    const res = await viewer.get(`/api/v1/orgs/${orgId}/recommendations`);
    expect(res.status).toBe(200);
    const rec = res.json.recommendations.find((r: any) => r.kind === "deploy_surplus");
    expect(rec).toBeTruthy();
    expect(rec.validation.valid).toBe(true);
    expect(rec.alternatives.map((a: any) => a.title)).toContain("Do nothing");
    recId = rec.id;
  });

  it("does not let viewers or approvers create proposals", async () => {
    expect((await viewer.post(`/api/v1/orgs/${orgId}/proposals`, { recommendationId: recId, idempotencyKey: "viewer-try-1" })).status).toBe(403);
    expect((await approver.post(`/api/v1/orgs/${orgId}/proposals`, { recommendationId: recId, idempotencyKey: "approver-try-1" })).status).toBe(403);
  });

  it("creates a proposal idempotently", async () => {
    const first = await finance.post(`/api/v1/orgs/${orgId}/proposals`, { recommendationId: recId, idempotencyKey: "fin-create-0001" });
    expect(first.status).toBe(201);
    proposalId = first.json.id;
    const again = await finance.post(`/api/v1/orgs/${orgId}/proposals`, { recommendationId: recId, idempotencyKey: "fin-create-0001" });
    expect(again.status).toBe(200);
    expect(again.json.id).toBe(proposalId);
    expect(again.json.duplicate).toBe(true);
    const count = await ctx.deps.db.execute(sql`select count(*)::int as n from proposals where organization_id = ${orgId}`);
    expect((count.rows[0] as { n: number }).n).toBe(1);
  });

  it("counts the pending allocation against deployable capital", async () => {
    const t = await viewer.get(`/api/v1/orgs/${orgId}/treasury`);
    expect(t.json.reserve.pendingAllocations).not.toBe("0");
  });

  it("blocks self-approval and viewers, and requires a reason to reject", async () => {
    const self = await finance.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/decision`, { decision: "approve" });
    expect(self.status).toBe(403);
    expect(self.json.error.code).toBe("cannot_approve");
    expect((await viewer.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/decision`, { decision: "approve" })).status).toBe(403);
    expect((await approver.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/decision`, { decision: "reject" })).status).toBe(400);
  });

  it("requires the approvals the tier demands, one decision per member", async () => {
    const detail = await viewer.get(`/api/v1/orgs/${orgId}/proposals/${proposalId}`);
    const required = detail.json.approval.requiredApprovals;
    expect(detail.json.validationNow.valid).toBe(true);
    const a1 = await approver.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/decision`, { decision: "approve", comment: "Within policy" });
    expect(a1.status).toBe(200);
    expect((await approver.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/decision`, { decision: "approve" })).status).toBe(409);
    // Approve with distinct eligible members until the tier is satisfied (the owner last, for the role requirement).
    let state = a1.json.state;
    for (const c of [admin, owner]) {
      if (state === "approved") break;
      const r = await c.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/decision`, { decision: "approve" });
      expect(r.status).toBe(200);
      state = r.json.state;
    }
    expect(required).toBeGreaterThanOrEqual(1);
    expect(state).toBe("approved");
    const after = await viewer.get(`/api/v1/orgs/${orgId}/proposals/${proposalId}`);
    expect(after.json.status).toBe("approved");
  });

  it("never prepares, signs or executes in a sample workspace", async () => {
    const prep = await owner.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/prepare`);
    expect(prep.status).toBe(409);
    expect(prep.json.error.code).toBe("sample_workspace");
  });

  it("keeps approval decisions append-only", async () => {
    const err = await ctx.deps.db.execute(sql`update approvals set decision = 'reject'`).catch((e) => e);
    expect(String(err?.cause?.message ?? err?.message)).toMatch(/append-only/);
  });

  it("lets the proposer cancel with a reason and records it", async () => {
    const res = await finance.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/cancel`, { reason: "Superseded by treasury committee decision" });
    expect(res.status).toBe(200);
    const events = await viewer.get(`/api/v1/orgs/${orgId}/activity?action=proposal`);
    expect(events.json.events.map((e: any) => e.action)).toEqual(expect.arrayContaining(["proposal.created", "proposal.approved", "proposal.cancelled"]));
  });
});

describe("structured actions are re-validated", () => {
  it("rejects an allocation that breaches policy with the failing checks", async () => {
    const accounts = await viewer.get(`/api/v1/orgs/${orgId}/accounts`);
    const ops = accounts.json.accounts.find((a: any) => a.chainId === 8453);
    const res = await finance.post(`/api/v1/orgs/${orgId}/proposals`, {
      idempotencyKey: "too-big-000001",
      action: { type: "allocate", accountId: ops.id, opportunityId: VENUE_ID, amountUsd: "600000", assetAmountRaw: "600000000000" },
    });
    expect(res.status).toBe(422);
    expect(res.json.error.code).toBe("policy_check_failed");
    const failed = res.json.error.details.checks.filter((c: any) => c.status === "fail").map((c: any) => c.id);
    expect(failed.length).toBeGreaterThan(0);
  });

  it("rejects allocations into venues that are not listed", async () => {
    const accounts = await viewer.get(`/api/v1/orgs/${orgId}/accounts`);
    const ops = accounts.json.accounts.find((a: any) => a.chainId === 8453);
    const res = await finance.post(`/api/v1/orgs/${orgId}/proposals`, {
      idempotencyKey: "unlisted-000001",
      action: { type: "allocate", accountId: ops.id, opportunityId: "morpho:8453:0x0000000000000000000000000000000000000bad", amountUsd: "10000", assetAmountRaw: "10000000000" },
    });
    expect(res.status).toBe(422);
  });
});

describe("account verification", () => {
  it("refuses to verify sample accounts", async () => {
    const accounts = await viewer.get(`/api/v1/orgs/${orgId}/accounts`);
    const a = accounts.json.accounts[0];
    const res = await owner.post(`/api/v1/orgs/${orgId}/accounts/${a.id}/verify/challenge`, { signer: "0x0000000000000000000000000000000000000001" });
    expect(res.status).toBe(409);
  });
});
