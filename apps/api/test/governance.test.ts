/**
 * Governance rules around proposals: capital in flight, policy changes mid-flight, approvers who leave,
 * and the hold on new or changed payee addresses. Chain access is scripted with MockChain.
 */
import { wad } from "@tokeniq/core";
import { and, eq, schema } from "@tokeniq/db";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { opportunityToJson } from "../src/services/dto.js";
import { Client, setup, type TestContext } from "./helpers.js";
import { MockChain } from "./mock-chain.js";

const VENUE_ID = "morpho:8453:0xee8f4ec5672f09119b96ab6fb59c27e1b7e44b61";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_FEED_BASE = "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B";
const SAFE = "0x5afe00000000000000000000000000000000000c";
const PAYEE = "0x9a7e000000000000000000000000000000000011";
const NEW_PAYEE = "0x9a7e000000000000000000000000000000000022";
const owners = [0, 1, 2].map(() => privateKeyToAccount(generatePrivateKey()));

let ctx: TestContext;
let owner: Client;
let finance: Client;
let approver: Client;
let approver2: Client;
let admin: Client;
let org: string;
let account: string;
const p = (path: string) => `/api/v1/orgs/${org}${path}`;
const usdcRaw = (usd: number) => String(BigInt(usd) * 1_000_000n);
const allocate = (usd: number) => ({ type: "allocate", accountId: account, opportunityId: VENUE_ID, amountUsd: String(usd), assetAmountRaw: usdcRaw(usd) });
const propose = (action: Record<string, unknown>) => finance.post(p("/proposals"), { action, idempotencyKey: `k-${crypto.randomUUID()}` });
const failed = (validation: { checks: Array<{ id: string; status: string }> }) => validation.checks.filter((c) => c.status === "fail").map((c) => c.id);

async function cancel(id: string) {
  const res = await finance.post(p(`/proposals/${id}/cancel`), { reason: "Test cleanup" });
  expect(res.status, `cancel ${id}: ${res.text}`).toBe(200);
}

beforeAll(async () => {
  ctx = await setup();
  const chain = new MockChain({ address: SAFE, owners: owners.map((o) => o.address), threshold: 2 });
  ctx.deps.clientFor = (id) => (id === 8453 ? chain.client : undefined);
  [owner, finance, approver, approver2, admin] = [0, 1, 2, 3, 4].map(() => new Client(ctx)) as [Client, Client, Client, Client, Client];
  await owner.signIn("g-owner@example.com", "Gia Owner");
  await finance.signIn("g-finance@example.com", "Gus Finance");
  await approver.signIn("g-approver@example.com", "Gwen Approver");
  await approver2.signIn("g-approver2@example.com", "Gil Approver");
  await admin.signIn("g-admin@example.com", "Glen Admin");
  org = (await owner.post("/api/v1/orgs", { name: "Governance DAO" })).json.id;
  for (const [client, email, role] of [
    [finance, "g-finance@example.com", "finance"],
    [approver, "g-approver@example.com", "approver"],
    [approver2, "g-approver2@example.com", "approver"],
    [admin, "g-admin@example.com", "admin"],
  ] as const) {
    const inv = await owner.post(p("/invitations"), { email, role });
    expect((await client.post(`/api/v1/invitations/${inv.json.id}/accept`)).status).toBe(200);
  }
  const { db } = ctx.deps;
  const now = ctx.clock.now;
  const [a] = await db
    .insert(schema.treasuryAccounts)
    .values({ organizationId: org, chainId: 8453, address: SAFE, kind: "safe", label: "Ops Safe", verifiedAt: now, verificationMethod: "siwe_owner", verificationSigner: owners[0]!.address, safeOwners: owners.map((o) => o.address), safeThreshold: 2, safeVersion: "1.4.1", lastSyncedAt: now })
    .returning();
  account = a!.id;
  await db.insert(schema.balanceSnapshots).values({ organizationId: org, accountId: account, chainId: 8453, assetAddress: USDC_BASE, assetSymbol: "USDC", rawBalance: usdcRaw(1_000_000), blockNumber: 100n, observedAt: now });
  await db.insert(schema.priceObservations).values({ chainId: 8453, feed: USDC_FEED_BASE, pair: "USDC / USD", answer: "100000000", decimals: 8, roundId: "1", updatedAt: new Date(now.getTime() - 60_000) });
  await db.insert(schema.opportunities).values({
    id: VENUE_ID,
    protocol: "morpho",
    chainId: 8453,
    address: "0xee8f4ec5672f09119b96ab6fb59c27e1b7e44b61",
    name: "Gauntlet USDC Prime",
    assetSymbol: "USDC",
    listed: true,
    fetchedAt: now,
    data: opportunityToJson({
      id: VENUE_ID,
      protocol: "morpho",
      kind: "erc4626_vault",
      chainId: 8453,
      address: "0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61",
      name: "Gauntlet USDC Prime",
      asset: { symbol: "USDC", chainId: 8453, address: USDC_BASE, decimals: 6, assetClass: "stablecoin", pegCurrency: "USD" },
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
      source: { name: "Morpho API", url: "https://api.morpho.org/graphql", fetchedAt: Math.floor(now.getTime() / 1000) - 60 },
    }),
  });
}, 120_000);

afterAll(async () => {
  await ctx?.close();
});

describe("capital in flight", () => {
  it("a proposal is never counted against itself when it is re-checked", async () => {
    // $200k is exactly the per-venue cap (20% of $1M).
    const created = await propose(allocate(200_000));
    expect(created.status).toBe(201);
    const detail = await finance.get(p(`/proposals/${created.json.id}`));
    expect(failed(detail.json.validationNow)).toEqual([]);
    expect(detail.json.validationNow.valid).toBe(true);
    await cancel(created.json.id);
  });

  it("a second proposal to the same venue counts the first one toward the venue cap", async () => {
    const first = await propose(allocate(150_000));
    expect(first.status).toBe(201);
    const second = await propose(allocate(100_000));
    expect(second.status).toBe(422);
    expect(second.json.error.details.checks.find((c: { id: string }) => c.id === "venue_cap").detail).toContain("including proposals in progress");
    await cancel(first.json.id);
    const retry = await propose(allocate(100_000));
    expect(retry.status).toBe(201);
    await cancel(retry.json.id);
  });

  it("a proposal awaiting approval past its deadline stops holding capital, even before anyone reads it", async () => {
    const before = (await owner.get(p("/treasury"))).json.reserve.pendingOutflows;
    const created = await propose(allocate(50_000));
    expect(Number((await owner.get(p("/treasury"))).json.reserve.pendingOutflows)).toBe(Number(before) + 50_000);
    const saved = ctx.clock.now;
    ctx.clock.now = new Date(saved.getTime() + 73 * 3600_000);
    try {
      expect(Number((await owner.get(p("/treasury"))).json.reserve.pendingOutflows)).toBe(Number(before));
    } finally {
      ctx.clock.now = saved;
    }
    await cancel(created.json.id);
  });
});

describe("approvals", () => {
  it("loosening the approval policy does not speed up proposals already in flight", async () => {
    const created = await propose(allocate(30_000)); // $25k–$250k tier: two approvals
    expect(created.status).toBe(201);
    const policies = (await admin.get(p("/policies"))).json;
    const loosened = await admin.put(p("/policies/approval"), {
      policy: { ...policies.approval, tiers: [{ upToUsd: null, requiredApprovals: 1, requiredRole: null }] },
      reason: "Fewer approvals for routine allocations",
      expectedVersion: policies.approvalVersion,
    });
    expect(loosened.status).toBe(200);
    const decided = await approver.post(p(`/proposals/${created.json.id}/decision`), { decision: "approve" });
    expect(decided.json.state).toBe("pending");
    const detail = await finance.get(p(`/proposals/${created.json.id}`));
    expect(detail.json.status).toBe("pending_approval");
    expect(detail.json.approval.remaining).toBe(1);
    // New proposals follow the new policy.
    const next = await propose(allocate(30_000));
    expect((await approver.post(p(`/proposals/${next.json.id}/decision`), { decision: "approve" })).json.state).toBe("approved");
    await cancel(created.json.id);
    await cancel(next.json.id);
  });

  it("approval lapses if the approver is demoted before the transaction is prepared", async () => {
    const created = await propose(allocate(10_000));
    expect((await approver2.post(p(`/proposals/${created.json.id}/decision`), { decision: "approve" })).json.state).toBe("approved");
    const members = (await owner.get(p("/members"))).json.members as Array<{ id: string; email: string }>;
    const target = members.find((x) => x.email === "g-approver2@example.com")!;
    expect((await owner.patch(p(`/members/${target.id}`), { role: "viewer" })).status).toBe(200);
    const prep = await finance.post(p(`/proposals/${created.json.id}/prepare`));
    expect(prep.status).toBe(409);
    expect(prep.json.error.code).toBe("approval_lapsed");
    const detail = await finance.get(p(`/proposals/${created.json.id}`));
    expect(detail.json.status).toBe("pending_approval");
    expect(detail.json.approval.approvals).toBe(0);
    const audit = (await owner.get(p("/activity?action=proposal.approval_lapsed"))).json.events;
    expect(audit.some((e: { targetId: string }) => e.targetId === created.json.id)).toBe(true);
    await cancel(created.json.id);
  });
});

describe("new or changed payee addresses", () => {
  let obligationId = "";
  const payment = (recipient: string) => ({ type: "payment", accountId: account, obligationId, dueDate: "2026-10-30", amountUsd: "8000", assetAmountRaw: usdcRaw(8_000), assetSymbol: "USDC", recipient });

  it("payments to a payee added moments ago are held", async () => {
    const ob = await finance.post(p("/obligations"), {
      title: "Design agency",
      category: "vendors",
      amount: "8000",
      currency: "USD",
      firstDueDate: "2026-10-30",
      recurrence: { freq: "monthly", interval: 1 },
      certainty: "committed",
      recipientAddress: PAYEE,
      recipientChainId: 8453,
      paymentAsset: "USDC",
    });
    expect(ob.status).toBe(201);
    expect(ob.json.recipientSetAt).toBe(ctx.clock.now.toISOString());
    obligationId = ob.json.id;
    const res = await propose(payment(PAYEE));
    expect(res.status).toBe(422);
    const hold = res.json.error.details.checks.find((c: { id: string }) => c.id === "payee_hold");
    expect(hold.status).toBe("fail");
    expect(hold.detail).toContain("held until");
  });

  it("the hold lifts after the policy's waiting period", async () => {
    const saved = ctx.clock.now;
    // Keep data fresh at the later time so only the hold is under test.
    ctx.clock.now = new Date(saved.getTime() + 49 * 3600_000);
    try {
      const { db } = ctx.deps;
      await db.insert(schema.priceObservations).values({ chainId: 8453, feed: USDC_FEED_BASE, pair: "USDC / USD", answer: "100000000", decimals: 8, roundId: "2", updatedAt: new Date(ctx.clock.now.getTime() - 60_000) });
      await db.update(schema.treasuryAccounts).set({ lastSyncedAt: ctx.clock.now }).where(eq(schema.treasuryAccounts.id, account));
      await db.update(schema.opportunities).set({ fetchedAt: ctx.clock.now }).where(eq(schema.opportunities.id, VENUE_ID));
      const res = await propose(payment(PAYEE));
      const checks = res.status === 201 ? (await finance.get(p(`/proposals/${res.json.id}`))).json.validationAtCreation.checks : res.json.error.details.checks;
      expect(checks.find((c: { id: string }) => c.id === "payee_hold").status).toBe("pass");
      if (res.status === 201) await cancel(res.json.id);
    } finally {
      ctx.clock.now = saved;
    }
  });

  it("changing the address restarts the hold, is audited, and alerts owners and admins", async () => {
    const changed = await finance.patch(p(`/obligations/${obligationId}`), { recipientAddress: NEW_PAYEE });
    expect(changed.status).toBe(200);
    expect(changed.json.recipientSetAt).toBe(ctx.clock.now.toISOString());
    const res = await propose(payment(NEW_PAYEE));
    expect(res.status).toBe(422);
    expect(res.json.error.details.checks.find((c: { id: string }) => c.id === "payee_hold").status).toBe("fail");
    const events = (await owner.get(p("/activity?action=obligation.payee_changed"))).json.events;
    expect(events[0].data).toMatchObject({ from: PAYEE.toLowerCase(), to: NEW_PAYEE.toLowerCase() });
    const notes = (await admin.get(p("/notifications"))).json.notifications as Array<{ kind: string; title: string }>;
    expect(notes.some((n) => n.kind === "obligation.payee_changed" && n.title.includes("Design agency"))).toBe(true);
    // Saving the same address again does not restart the hold.
    const [row] = await ctx.deps.db.select({ at: schema.obligations.recipientSetAt }).from(schema.obligations).where(and(eq(schema.obligations.id, obligationId)));
    await finance.patch(p(`/obligations/${obligationId}`), { recipientAddress: NEW_PAYEE.toUpperCase().replace("0X", "0x") });
    const [after] = await ctx.deps.db.select({ at: schema.obligations.recipientSetAt }).from(schema.obligations).where(eq(schema.obligations.id, obligationId));
    expect(after!.at!.getTime()).toBe(row!.at!.getTime());
  });
});
