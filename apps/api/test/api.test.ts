import { schema, sql } from "@tokeniq/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client, setup, type TestContext } from "./helpers.js";

let ctx: TestContext;
let owner: Client;
let finance: Client;
let viewer: Client;
let outsider: Client;
let orgId: string;

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_FEED_BASE = "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B";

beforeAll(async () => {
  ctx = await setup();
  owner = new Client(ctx);
  finance = new Client(ctx);
  viewer = new Client(ctx);
  outsider = new Client(ctx);
  await owner.signIn("owner@example.com", "Olivia Owner");
  await finance.signIn("finance@example.com", "Fin Lead");
  await viewer.signIn("viewer@example.com", "Vic Viewer");
  await outsider.signIn("outsider@example.com", "Oscar Outsider");
}, 60_000);

afterAll(async () => {
  await ctx?.close();
});

describe("authentication", () => {
  it("rejects unauthenticated requests", async () => {
    const anon = new Client(ctx);
    expect((await anon.get("/api/v1/me")).status).toBe(401);
  });

  it("rejects a wrong one-time code", async () => {
    const c = new Client(ctx);
    await c.post("/api/auth/email-otp/send-verification-otp", { email: "wrong@example.com", type: "sign-in" });
    const res = await c.post("/api/auth/sign-in/email-otp", { email: "wrong@example.com", otp: "000000" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect((await c.get("/api/v1/me")).status).toBe(401);
  });

  it("rejects cross-site state-changing requests", async () => {
    const res = await owner.request("POST", "/api/v1/orgs", { name: "Evil" }, { origin: "https://evil.example" });
    expect(res.status).toBe(403);
  });

  it("returns the signed-in user", async () => {
    const me = await owner.get("/api/v1/me");
    expect(me.status).toBe(200);
    expect(me.json.user.email).toBe("owner@example.com");
    expect(me.json.user.emailVerified).toBe(true);
  });
});

describe("organizations and roles", () => {
  it("creates an organization with the creator as owner and versioned default policies", async () => {
    const res = await owner.post("/api/v1/orgs", { name: "Acme Protocol", purpose: "Protocol treasury", preset: "balanced" });
    expect(res.status).toBe(201);
    expect(res.json.role).toBe("owner");
    orgId = res.json.id;
    const p = await owner.get(`/api/v1/orgs/${orgId}/policies`);
    expect(p.json.treasuryVersion).toBe(1);
    expect(p.json.approvalVersion).toBe(1);
  });

  it("hides organizations from non-members (404, not 403)", async () => {
    expect((await outsider.get(`/api/v1/orgs/${orgId}`)).status).toBe(404);
    expect((await outsider.get(`/api/v1/orgs/${orgId}/treasury`)).status).toBe(404);
  });

  it("invites members by email and lets only the addressee accept", async () => {
    const inv = await owner.post(`/api/v1/orgs/${orgId}/invitations`, { email: "finance@example.com", role: "finance" });
    expect(inv.status).toBe(201);
    expect((await outsider.get(`/api/v1/invitations/${inv.json.id}`)).status).toBe(404);
    expect((await outsider.post(`/api/v1/invitations/${inv.json.id}/accept`)).status).toBe(404);
    const accepted = await finance.post(`/api/v1/invitations/${inv.json.id}/accept`);
    expect(accepted.status).toBe(200);
    expect((await finance.post(`/api/v1/invitations/${inv.json.id}/accept`)).status).toBe(409);

    const inv2 = await owner.post(`/api/v1/orgs/${orgId}/invitations`, { email: "viewer@example.com", role: "viewer" });
    await viewer.post(`/api/v1/invitations/${inv2.json.id}/accept`);
    const members = await owner.get(`/api/v1/orgs/${orgId}/members`);
    expect(members.json.members.map((m: any) => m.role).sort()).toEqual(["finance", "owner", "viewer"]);
  });

  it("enforces role permissions server-side", async () => {
    expect((await viewer.post(`/api/v1/orgs/${orgId}/obligations`, obligationBody())).status).toBe(403);
    expect((await finance.post(`/api/v1/orgs/${orgId}/invitations`, { email: "x@example.com", role: "viewer" })).status).toBe(403);
    expect((await finance.put(`/api/v1/orgs/${orgId}/policies/treasury`, { policy: {}, reason: "x", expectedVersion: 1 })).status).toBeGreaterThanOrEqual(400);
  });

  it("keeps at least one owner", async () => {
    const members = await owner.get(`/api/v1/orgs/${orgId}/members`);
    const me = members.json.members.find((m: any) => m.isYou);
    expect((await owner.patch(`/api/v1/orgs/${orgId}/members/${me.id}`, { role: "admin" })).status).toBe(409);
    expect((await owner.del(`/api/v1/orgs/${orgId}/members/${me.id}`)).status).toBe(409);
  });
});

function obligationBody(over: Record<string, unknown> = {}) {
  return { title: "Core team payroll", category: "payroll", amount: "40000", currency: "USD", firstDueDate: "2026-10-25", recurrence: { freq: "monthly", interval: 1 }, certainty: "committed", priority: "critical", ...over };
}

describe("obligations", () => {
  let payrollId: string;

  it("creates obligations and computes next due dates", async () => {
    const res = await finance.post(`/api/v1/orgs/${orgId}/obligations`, obligationBody());
    expect(res.status).toBe(201);
    expect(res.json.nextDueDate).toBe("2026-10-25");
    payrollId = res.json.id;
    const audit = await finance.post(`/api/v1/orgs/${orgId}/obligations`, obligationBody({ title: "Security audit", category: "vendors", amount: "60000", firstDueDate: "2026-11-20", recurrence: { freq: "once" }, certainty: "invoiced", priority: "high" }));
    expect(audit.status).toBe(201);
  });

  it("validates amounts and dates", async () => {
    const bad = await finance.post(`/api/v1/orgs/${orgId}/obligations`, obligationBody({ amount: "1e6" }));
    expect(bad.status).toBe(400);
    expect(bad.json.error.code).toBe("validation_error");
    const badDate = await finance.post(`/api/v1/orgs/${orgId}/obligations`, obligationBody({ firstDueDate: "2026-02-30" }));
    expect(badDate.status).toBe(400);
  });

  it("returns a schedule with occurrences in the horizon", async () => {
    const res = await viewer.get(`/api/v1/orgs/${orgId}/obligations/schedule?days=90`);
    expect(res.status).toBe(200);
    const dates = res.json.occurrences.map((o: any) => o.dueDate);
    expect(dates).toEqual(["2026-10-25", "2026-11-20", "2026-11-25", "2026-12-25"]);
  });

  it("isolates obligations between organizations", async () => {
    const other = await outsider.post("/api/v1/orgs", { name: "Other DAO" });
    const res = await outsider.get(`/api/v1/orgs/${other.json.id}/obligations/${payrollId}`);
    expect(res.status).toBe(404);
  });
});

describe("policies", () => {
  it("versions treasury policy changes with optimistic concurrency and a diff", async () => {
    const current = await owner.get(`/api/v1/orgs/${orgId}/policies`);
    const next = { ...current.json.treasury, runwayMonths: 3, monthlyBurnUsd: "45000" };
    const ok = await owner.put(`/api/v1/orgs/${orgId}/policies/treasury`, { policy: next, reason: "Board approved 3-month runway", expectedVersion: 1 });
    expect(ok.status).toBe(200);
    expect(ok.json.version).toBe(2);
    expect(ok.json.changes.map((c: any) => c.field).sort()).toEqual(["monthlyBurnUsd", "runwayMonths"]);
    const stale = await owner.put(`/api/v1/orgs/${orgId}/policies/treasury`, { policy: next, reason: "Stale edit", expectedVersion: 1 });
    expect(stale.status).toBe(409);
  });

  it("refuses to switch on autonomous execution from settings", async () => {
    const current = await owner.get(`/api/v1/orgs/${orgId}/policies`);
    const res = await owner.put(`/api/v1/orgs/${orgId}/policies/treasury`, { policy: { ...current.json.treasury, autonomy: "bounded_automation" }, reason: "Try automation", expectedVersion: current.json.treasuryVersion });
    expect(res.status).toBe(422);
  });
});

describe("treasury maths end to end", () => {
  it("computes reserve, coverage and deployable from stored observations", async () => {
    const { db } = ctx.deps;
    const [acct] = await db
      .insert(schema.treasuryAccounts)
      .values({ organizationId: orgId, chainId: 8453, address: "0x1111111111111111111111111111111111111111", kind: "safe", label: "Ops Safe", verifiedAt: ctx.clock.now, verificationMethod: "siwe_owner", lastSyncedAt: ctx.clock.now })
      .returning();
    await db.insert(schema.balanceSnapshots).values({ organizationId: orgId, accountId: acct!.id, chainId: 8453, assetAddress: USDC_BASE, assetSymbol: "USDC", rawBalance: "500000000000", blockNumber: 100n, observedAt: ctx.clock.now });
    await db.insert(schema.priceObservations).values({ chainId: 8453, feed: USDC_FEED_BASE, pair: "USDC / USD", answer: "99990000", decimals: 8, roundId: "1", updatedAt: new Date(ctx.clock.now.getTime() - 3600_000) });

    const res = await viewer.get(`/api/v1/orgs/${orgId}/treasury`);
    expect(res.status).toBe(200);
    const t = res.json;
    // 500,000 USDC at $0.9999 market value; reserve value capped at $1 and not above market → 499,950.
    expect(t.treasury.gross).toBe("499950");
    expect(t.treasury.reserveEligible).toBe("499950");
    // Burn: max(declared 45k, itemized 40k) = 45k x 3 = 135k. Obligations in 90d (Oct 11 → Jan 9): 40k x 3 + 60k = 180k, +10% = 198k.
    expect(t.reserve.required).toBe("198000");
    expect(t.reserve.bindingRule).toBe("obligations");
    expect(t.reserve.status).toBe("covered");
    // Deployable = min(499,950 - 198,000, 50% x 499,950) = min(301,950, 249,975)
    expect(t.reserve.surplus.deployable).toBe("249975");
    expect(t.reserve.surplus.limitedBy).toBe("deployment_cap");
    expect(t.treasury.complete).toBe(true);
  });

  it("flags stale prices instead of presenting them as current", async () => {
    ctx.clock.now = new Date(ctx.clock.now.getTime() + 3 * 86_400_000);
    const res = await viewer.get(`/api/v1/orgs/${orgId}/treasury`);
    expect(res.json.treasury.complete).toBe(false);
    expect(res.json.treasury.issues.map((i: any) => i.code)).toEqual(expect.arrayContaining(["price_stale", "account_stale"]));
    expect(res.json.reserve.uncertainty.level).not.toBe("low");
    ctx.clock.now = new Date("2026-10-11T12:00:00Z");
  });

  it("runs scenarios without changing data", async () => {
    const res = await viewer.post(`/api/v1/orgs/${orgId}/treasury/scenario`, { shocks: [{ type: "depeg", symbol: "USDC", price: "0.95" }] });
    expect(res.status).toBe(200);
    expect(res.json.scenario.treasury.reserveEligible).toBe("475000");
    const after = await viewer.get(`/api/v1/orgs/${orgId}/treasury`);
    expect(after.json.treasury.reserveEligible).toBe("499950");
  });
});

describe("audit trail and exports", () => {
  it("records actions append-only", async () => {
    const events = await viewer.get(`/api/v1/orgs/${orgId}/activity`);
    const actions = events.json.events.map((e: any) => e.action);
    expect(actions).toEqual(expect.arrayContaining(["organization.created", "invitation.accepted", "obligation.created", "policy.treasury_updated"]));
    const err = await ctx.deps.db.execute(sql`update audit_events set action = 'tampered'`).catch((e) => e);
    expect(String(err?.cause?.message ?? err?.message)).toMatch(/append-only/);
  });

  it("exports CSV with spreadsheet formula injection neutralised", async () => {
    await finance.post(`/api/v1/orgs/${orgId}/obligations`, obligationBody({ title: '=HYPERLINK("http://evil")', firstDueDate: "2026-12-01", recurrence: { freq: "once" } }));
    const res = await viewer.get(`/api/v1/orgs/${orgId}/reports/export/obligations.csv`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.text).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });
});
