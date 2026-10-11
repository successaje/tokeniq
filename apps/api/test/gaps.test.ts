/**
 * Regression tests for the gaps listed in docs/USER_FLOWS.md ("Gaps noticed") and BE-20.
 * Each test names the gap it guards. Chain reads for manual sync are scripted with MockChain.
 */
import { schema, sql, eq, and } from "@tokeniq/db";
import { Writable } from "node:stream";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { evaluateOrg } from "../src/jobs/evaluate.js";
import { createLogger } from "../src/lib/logger.js";
import { Client, ORIGIN, setup, type TestContext } from "./helpers.js";
import { MockChain } from "./mock-chain.js";

let ctx: TestContext;
let owner: Client;
let admin: Client;
let finance: Client;
let approver: Client;
let viewer: Client;
let orgId: string;
const EMAILS = { owner: "g-owner@example.com", admin: "g-admin@example.com", finance: "g-finance@example.com", approver: "g-approver@example.com", viewer: "g-viewer@example.com" };

const p = (path: string) => `/api/v1/orgs/${orgId}${path}`;
const undo = (c: Client, paymentId: string) => c.request("DELETE", p(`/payments/${paymentId}`), { reason: "Recorded by mistake" });
const obligationStatus = async (id: string) => (await viewer.get(p(`/obligations/${id}`))).json.obligation.status as string;
const scheduled = async (id: string) =>
  ((await viewer.get(p("/obligations/schedule"))).json.occurrences as Array<{ obligationId: string; dueDate: string }>).filter((o) => o.obligationId === id).map((o) => o.dueDate);

async function join(inviter: Client, org: string, client: Client, email: string, role: string) {
  const inv = await inviter.post(`/api/v1/orgs/${org}/invitations`, { email, role });
  expect(inv.status).toBe(201);
  expect((await client.post(`/api/v1/invitations/${inv.json.id}/accept`)).status).toBe(200);
}

beforeAll(async () => {
  ctx = await setup();
  const chain = new MockChain({ address: "0x5afe0000000000000000000000000000000000c1", owners: ["0x0000000000000000000000000000000000000001"], threshold: 1 });
  ctx.deps.clientFor = (id) => (id === 8453 ? chain.client : undefined);
  [owner, admin, finance, approver, viewer] = [0, 1, 2, 3, 4].map(() => new Client(ctx)) as [Client, Client, Client, Client, Client];
  await owner.signIn(EMAILS.owner, "Gail Owner");
  await admin.signIn(EMAILS.admin, "Gus Admin");
  await finance.signIn(EMAILS.finance, "Gwen Finance");
  await approver.signIn(EMAILS.approver, "Gil Approver");
  await viewer.signIn(EMAILS.viewer, "Gia Viewer");
  orgId = (await owner.post("/api/v1/orgs", { name: "Gaps DAO" })).json.id;
  await join(owner, orgId, admin, EMAILS.admin, "admin");
  await join(owner, orgId, finance, EMAILS.finance, "finance");
  await join(owner, orgId, approver, EMAILS.approver, "approver");
  await join(owner, orgId, viewer, EMAILS.viewer, "viewer");
}, 120_000);

afterAll(async () => {
  await ctx?.close();
});

// ---------------------------------------------------------------------------------------------------------

describe("gaps 1, 2 and 29: alerts evaluated on page reads", () => {
  const health = (provider: string) => ({ provider, status: "down", lastError: "Failing health checks", consecutiveFailures: 3, lastErrorAt: ctx.clock.now });

  afterAll(async () => {
    await ctx.deps.db.delete(schema.providerHealth);
  });

  it("gap 2: sequencer and provider alerts opened by the job stay open across page reads", async () => {
    await ctx.deps.db.insert(schema.providerHealth).values([health("sequencer:8453"), health("morpho-api")]);
    await evaluateOrg(ctx.deps, orgId);
    const opened = await ctx.deps.db
      .select({ id: schema.riskAlerts.id, fingerprint: schema.riskAlerts.fingerprint })
      .from(schema.riskAlerts)
      .where(and(eq(schema.riskAlerts.organizationId, orgId), sql`${schema.riskAlerts.fingerprint} in ('sequencer_down:8453', 'provider_degraded:morpho-api')`));
    expect(opened.map((a) => a.fingerprint).sort()).toEqual(["provider_degraded:morpho-api", "sequencer_down:8453"]);
    for (let i = 0; i < 2; i++) {
      const res = await viewer.get(p("/alerts"));
      expect(res.status).toBe(200);
      const active = new Map((res.json.alerts as Array<{ id: string; status: string }>).map((a) => [a.id, a.status]));
      // Same rows, still open: not resolved by the page read and re-opened as new alerts by the job.
      for (const a of opened) expect(active.get(a.id)).toBe("open");
    }
    await evaluateOrg(ctx.deps, orgId);
    const rows = await ctx.deps.db.select().from(schema.riskAlerts).where(and(eq(schema.riskAlerts.organizationId, orgId), sql`${schema.riskAlerts.fingerprint} in ('sequencer_down:8453', 'provider_degraded:morpho-api')`));
    expect(rows.map((r) => [r.id, r.status, r.resolvedAt]).sort()).toEqual(opened.map((a) => [a.id, "open", null]).sort());
  });

  it("gaps 1 and 29: an alert opened by a page read is notified once, and its email names the organization", async () => {
    ctx.deps.mailer.outbox.length = 0;
    await ctx.deps.db.insert(schema.providerHealth).values(health("sequencer:42161"));
    const res = await viewer.get(p("/alerts"));
    const alert = (res.json.alerts as Array<{ title: string; ref: string; severity: string }>).find((a) => a.ref === "chain:42161");
    expect(alert?.severity).toBe("critical");
    const notified = async () => {
      const counts: number[] = [];
      for (const c of [owner, admin, finance, approver, viewer]) counts.push((await c.get(p("/notifications"))).json.notifications.filter((n: { title: string }) => n.title === alert!.title).length);
      return counts;
    };
    // In-app for every member; email for critical alerts to roles that can act.
    expect(await notified()).toEqual([1, 1, 1, 1, 1]);
    const emails = () => ctx.deps.mailer.outbox.filter((m) => m.subject === `TokenIQ alert: ${alert!.title}`);
    expect(emails().map((m) => m.to).sort()).toEqual([EMAILS.admin, EMAILS.finance, EMAILS.owner]);
    for (const m of emails()) expect(m.text).toContain(`${ORIGIN}/app/risk?org=${orgId}`);
    // Later page reads and job runs see the alert as already open: nothing is sent twice.
    await viewer.get(p("/alerts"));
    await evaluateOrg(ctx.deps, orgId);
    expect(await notified()).toEqual([1, 1, 1, 1, 1]);
    expect(emails()).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------------------------------------

describe("gap 14: undoing a payment", () => {
  const create = async (title: string, firstDueDate: string, recurrence: Record<string, unknown>) =>
    (await finance.post(p("/obligations"), { title, category: "vendors", amount: "1200", firstDueDate, recurrence, certainty: "committed" })).json.id as string;
  const pay = async (obligationId: string, dueDate: string, status = "paid") => {
    const res = await finance.post(p("/payments"), { obligationId, dueDate, status });
    expect(res.status).toBe(201);
    return res.json.payment.id as string;
  };

  it("re-opens a one-off obligation that the undone payment had completed", async () => {
    const id = await create("Audit milestone", "2026-10-20", { freq: "once" });
    const payment = await pay(id, "2026-10-20");
    expect(await obligationStatus(id)).toBe("completed");
    expect(await scheduled(id)).toEqual([]);
    expect((await undo(finance, payment)).status).toBe(200);
    expect(await obligationStatus(id)).toBe("active");
    expect(await scheduled(id)).toEqual(["2026-10-20"]);
    const [event] = await ctx.deps.db.select().from(schema.auditEvents).where(and(eq(schema.auditEvents.action, "payment.undone"), eq(schema.auditEvents.targetId, id)));
    expect(event?.data).toMatchObject({ previousStatus: "paid_unverified", obligationStatus: "active" });
  });

  it("leaves recurring obligations active and a status set by hand alone", async () => {
    const monthly = await create("Hosting", "2026-10-15", { freq: "monthly", interval: 1 });
    const payment = await pay(monthly, "2026-10-15");
    expect(await obligationStatus(monthly)).toBe("active");
    expect(await scheduled(monthly)).not.toContain("2026-10-15");
    expect((await undo(finance, payment)).status).toBe(200);
    expect(await obligationStatus(monthly)).toBe("active");
    expect(await scheduled(monthly)).toContain("2026-10-15");

    // Paid, then cancelled by hand: undoing the payment does not resurrect it.
    const once = await create("Event deposit", "2026-10-22", { freq: "once" });
    const paid = await pay(once, "2026-10-22");
    expect((await finance.patch(p(`/obligations/${once}`), { status: "cancelled" })).status).toBe(200);
    expect((await undo(finance, paid)).status).toBe(200);
    expect(await obligationStatus(once)).toBe("cancelled");
  });
});

describe("gap 16: backdated obligations", () => {
  // Needs apps/api/src/modules/obligations.ts to set `trackFrom: initialTrackFrom(input, today)` (core helper,
  // covered in packages/core/test/obligations.test.ts). Remove `.skip` once that line is in.
  it("owes a backdated recurring obligation from today, and a backdated one-off from its due date", async () => {
    const res = await finance.post(p("/obligations"), { title: "Backdated payroll", category: "payroll", amount: "5000", firstDueDate: "2026-04-01", recurrence: { freq: "weekly", interval: 1 }, certainty: "committed" });
    const once = await finance.post(p("/obligations"), { title: "Late invoice", category: "vendors", amount: "700", firstDueDate: "2026-10-01", recurrence: { freq: "once" }, certainty: "invoiced" });
    const occ = (await viewer.get(p("/obligations/schedule"))).json.occurrences as Array<{ obligationId: string; dueDate: string; overdue: boolean }>;
    expect(occ.filter((o) => o.obligationId === res.json.id && o.overdue)).toEqual([]);
    expect(occ.filter((o) => o.obligationId === once.json.id).map((o) => [o.dueDate, o.overdue])).toEqual([["2026-10-01", true]]);
  });
});

// ---------------------------------------------------------------------------------------------------------

describe("gap 18 and BE-20: sample workspaces", () => {
  let sampler: Client;
  let samplerId: string;

  beforeAll(async () => {
    sampler = new Client(ctx);
    await sampler.signIn("g-sampler@example.com", "Sid Sampler");
    samplerId = (await sampler.get("/api/v1/me")).json.user.id;
  });

  const ownedSamples = async () =>
    (
      await ctx.deps.db.execute<{ id: string }>(
        sql`select m.organization_id as id from members m join org_profiles op on op.organization_id = m.organization_id where m.user_id = ${samplerId} and m.role = 'owner' and op.is_sample`,
      )
    ).rows.map((r) => r.id);

  it("returns the caller's existing sample workspace instead of creating another, even under concurrent requests", async () => {
    const results = await Promise.all([0, 1, 2].map(() => sampler.post("/api/v1/sample-workspace")));
    expect(results.map((r) => r.status).sort()).toEqual([200, 200, 201]);
    expect(new Set(results.map((r) => r.json.organizationId)).size).toBe(1);
    expect(results.find((r) => r.status === 201)!.json.created).toBe(true);
    const again = await sampler.post("/api/v1/sample-workspace");
    expect(again.status).toBe(200);
    expect(again.json).toEqual({ organizationId: results[0]!.json.organizationId, created: false });
    expect(await ownedSamples()).toEqual([results[0]!.json.organizationId]);
  });

  it("lets the sole owner delete it: memberships and simulated data go, append-only records stay, and it is audited", async () => {
    const [sample] = await ownedSamples();
    const s = (path: string) => `/api/v1/orgs/${sample}${path}`;
    await join(sampler, sample!, viewer, EMAILS.viewer, "viewer");
    await sampler.post(s("/invitations"), { email: "g-pending@example.com", role: "finance" });
    expect((await viewer.get(s("/treasury"))).status).toBe(200);
    // A decided proposal (approval decisions are append-only) and an undecided one.
    const { db } = ctx.deps;
    const [account] = await db.select().from(schema.treasuryAccounts).where(eq(schema.treasuryAccounts.organizationId, sample!)).limit(1);
    const proposal = (key: string) => ({ organizationId: sample!, kind: "allocate", title: key, status: "pending_approval", action: {}, amountUsd: "1000", accountId: account!.id, chainId: account!.chainId, validation: {}, proposerId: samplerId, idempotencyKey: key, expiresAt: new Date(ctx.clock.now.getTime() + 86_400_000) });
    const [decided] = await db.insert(schema.proposals).values(proposal("decided")).returning();
    await db.insert(schema.proposals).values(proposal("undecided"));
    await db.insert(schema.approvals).values({ organizationId: sample!, proposalId: decided!.id, userId: samplerId, role: "owner", decision: "approve" });

    expect((await viewer.request("DELETE", s("/sample-workspace"))).status).toBe(403);
    const res = await sampler.request("DELETE", s("/sample-workspace"));
    expect(res.status).toBe(200);

    expect((await sampler.get(s(""))).status).toBe(404);
    expect((await viewer.get(s("/treasury"))).status).toBe(404);
    expect((await sampler.get("/api/v1/me")).json.organizations.map((o: { id: string }) => o.id)).not.toContain(sample);
    const count = async (table: string, extra = sql``) => (await db.execute<{ n: number }>(sql`select count(*)::int as n from ${sql.identifier(table)} where organization_id = ${sample} ${extra}`)).rows[0]!.n;
    expect(await count("members")).toBe(0);
    expect(await count("invitations")).toBe(0);
    expect(await count("obligations")).toBe(0);
    expect(await count("balance_snapshots")).toBe(0);
    expect(await count("treasury_accounts", sql`and archived_at is null`)).toBe(0);
    expect((await db.select({ title: schema.proposals.title }).from(schema.proposals).where(eq(schema.proposals.organizationId, sample!))).map((r) => r.title)).toEqual(["decided"]);
    expect(await count("approvals")).toBe(1);
    expect(await count("policy_versions")).toBe(2);
    const [event] = await db.select().from(schema.auditEvents).where(and(eq(schema.auditEvents.action, "sample_workspace.deleted"), eq(schema.auditEvents.targetId, sample!)));
    expect(event).toMatchObject({ organizationId: sample, actorUserId: samplerId, data: { otherMembersRemoved: 1 } });

    // The next request starts a fresh sample.
    const next = await sampler.post("/api/v1/sample-workspace");
    expect(next.status).toBe(201);
    expect(next.json.organizationId).not.toBe(sample);
  });

  it("refuses real organizations, other roles and shared ownership", async () => {
    expect((await owner.request("DELETE", p("/sample-workspace"))).json.error.code).toBe("not_sample_workspace");
    expect((await owner.get(p(""))).status).toBe(200);
    const [sample] = await ownedSamples();
    await join(sampler, sample!, admin, EMAILS.admin, "owner");
    const res = await sampler.request("DELETE", `/api/v1/orgs/${sample}/sample-workspace`);
    expect([res.status, res.json.error.code]).toEqual([409, "not_sole_owner"]);
  });

  it("documents both routes in OpenAPI", async () => {
    const doc = (await owner.get("/api/openapi.json")).json;
    expect(Object.keys(doc.paths["/api/v1/sample-workspace"].post.responses)).toEqual(expect.arrayContaining(["200", "201"]));
    expect(doc.paths["/api/v1/orgs/{orgId}/sample-workspace"].delete.summary).toMatch(/Delete a sample workspace/);
  });
});

// ---------------------------------------------------------------------------------------------------------

describe("gaps 19, 25, 27 and BE-20: permissions", () => {
  it("gap 19: only roles that manage the organization record onboarding progress", async () => {
    for (const c of [viewer, approver, finance]) expect((await c.post(p("/onboarding"), { step: "treasury" })).status).toBe(403);
    expect((await viewer.post(p("/onboarding"), { complete: true })).status).toBe(403);
    expect((await admin.post(p("/onboarding"), { step: "treasury" })).json.onboardingSteps).toContain("treasury");
  });

  it("gap 25: only roles that manage members can list pending invitations", async () => {
    for (const c of [viewer, approver, finance]) expect((await c.get(p("/invitations"))).status).toBe(403);
    for (const c of [admin, owner]) expect((await c.get(p("/invitations"))).status).toBe(200);
  });

  it("gap 27: any member may sync an account, at most once per 30 seconds per account, and is told why not", async () => {
    const { db } = ctx.deps;
    const account = async (address: string, syncedAgoMs: number) =>
      (await db.insert(schema.treasuryAccounts).values({ organizationId: orgId, chainId: 8453, address, kind: "eoa", label: address.slice(-4), lastSyncedAt: new Date(ctx.clock.now.getTime() - syncedAgoMs) }).returning())[0]!.id;
    // Synced by the job 10 seconds ago.
    const recent = await account("0x0000000000000000000000000000000000c0ffee", 10_000);
    const tooSoon = await viewer.post(p(`/accounts/${recent}/sync`));
    expect([tooSoon.status, tooSoon.json.error.code]).toEqual([429, "sync_rate_limited"]);
    expect(tooSoon.json.error.message).toBe("This account was synced 10 seconds ago. Try again in 20 seconds.");
    expect(tooSoon.headers.get("retry-after")).toBe("20");
    // Last synced 31 seconds ago: allowed once, for a viewer too; an immediate repeat is refused.
    const stale = await account("0x0000000000000000000000000000000000c0ffef", 31_000);
    const first = await viewer.post(p(`/accounts/${stale}/sync`));
    expect(first.status).toBe(200);
    expect(first.json.ok).toBe(true);
    const repeat = await finance.post(p(`/accounts/${stale}/sync`));
    expect([repeat.status, repeat.json.error.code]).toEqual([429, "sync_rate_limited"]);
    expect(Number(repeat.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------------------

describe("gap 21: invitation emails that fail", () => {
  it("still creates the invitation and returns emailSent: false with the link to share, without logging the link", async () => {
    const lines: string[] = [];
    const logger = ctx.deps.logger;
    const send = ctx.deps.mailer.send;
    ctx.deps.logger = createLogger("warn", new Writable({ write: (chunk, _enc, cb) => (lines.push(String(chunk)), cb()) }));
    ctx.deps.mailer.send = async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:587");
    };
    try {
      const res = await owner.post(p("/invitations"), { email: "g-unreachable@example.com", role: "viewer" });
      expect(res.status).toBe(201);
      expect(res.json).toMatchObject({ email: "g-unreachable@example.com", emailSent: false, inviteUrl: `${ORIGIN}/invite/${res.json.id}` });
      expect((await owner.get(p("/invitations"))).json.invitations.map((i: { id: string }) => i.id)).toContain(res.json.id);
      expect(lines.join("")).toContain("invitation email failed");
      expect(lines.join("")).not.toContain(res.json.id);
    } finally {
      ctx.deps.logger = logger;
      ctx.deps.mailer.send = send;
    }
    // Sending again (the "Resend" action) supersedes it with a new link, and reports the email as sent.
    const resent = await owner.post(p("/invitations"), { email: "g-unreachable@example.com", role: "viewer" });
    expect(resent.json).toMatchObject({ emailSent: true, inviteUrl: `${ORIGIN}/invite/${resent.json.id}` });
    expect(ctx.deps.mailer.outbox.at(-1)!.text).toContain(resent.json.inviteUrl);
  });
});

// ---------------------------------------------------------------------------------------------------------

describe("gap 26: concurrent policy saves", () => {
  it("answers 409 policy_version_conflict, never 500, when saves race on one version", async () => {
    for (const kind of ["treasury", "approval"] as const) {
      const current = (await owner.get(p("/policies"))).json;
      const expectedVersion = current[`${kind}Version`];
      const results = await Promise.all(
        Array.from({ length: 6 }, (_, i) => (i % 2 ? owner : admin).put(p(`/policies/${kind}`), { policy: current[kind], reason: `Concurrent save ${i}`, expectedVersion })),
      );
      expect(results.map((r) => r.status).sort()).toEqual([200, 409, 409, 409, 409, 409]);
      for (const r of results.filter((x) => x.status === 409)) expect(r.json.error.code).toBe("policy_version_conflict");
      expect((await owner.get(p("/policies"))).json[`${kind}Version`]).toBe(expectedVersion + 1);
    }
  });
});

describe("gap 15: scenario validation without floats", () => {
  it("bounds the depeg price exactly", async () => {
    const run = (price: string) => viewer.post(p("/treasury/scenario"), { shocks: [{ type: "depeg", symbol: "USDC", price }] });
    // A float compare rounds this to 2 and lets it through.
    const over = await run("2.000000000000000001");
    expect([over.status, over.json.error.code]).toEqual([400, "invalid_price"]);
    for (const ok of ["2", "0.97", "0"]) expect((await run(ok)).status).toBe(200);
  });
});

describe("activity filter", () => {
  it("matches action names containing underscores, and treats LIKE wildcards literally", async () => {
    const current = (await owner.get(p("/policies"))).json;
    expect((await owner.put(p("/policies/treasury"), { policy: current.treasury, reason: "Activity filter check", expectedVersion: current.treasuryVersion })).status).toBe(200);
    expect((await owner.put(p("/policies/approval"), { policy: current.approval, reason: "Activity filter check", expectedVersion: current.approvalVersion })).status).toBe(200);
    const events = async (action: string) => (await viewer.get(p(`/activity?action=${encodeURIComponent(action)}&limit=200`))).json.events as Array<{ action: string }>;
    const treasury = await events("policy.treasury_updated");
    expect(treasury.length).toBeGreaterThan(0);
    expect(new Set(treasury.map((e) => e.action))).toEqual(new Set(["policy.treasury_updated"]));
    expect(new Set((await events("policy.approval_")).map((e) => e.action))).toEqual(new Set(["policy.approval_updated"]));
    // "_" and "%" are literal: neither matches "policy.treasury_updated" as a wildcard would.
    expect(await events("policy_")).toEqual([]);
    expect(await events("%")).toEqual([]);
  });
});
