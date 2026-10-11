/** Idempotency-Key on organization-scoped creates (BE-21). */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client, setup, type TestContext } from "./helpers.js";

let ctx: TestContext;
let alice: Client;
let bob: Client;
let org: string;
const obligation = (title: string, amount = "1200") => ({ title, category: "vendors", amount, currency: "USD", firstDueDate: "2026-11-01", recurrence: { freq: "monthly", interval: 1 }, certainty: "committed" });
const create = (client: Client, body: unknown, key?: string) => client.request("POST", `/api/v1/orgs/${org}/obligations`, body, key ? { "idempotency-key": key } : {});
const count = async (title: string) => ((await alice.get(`/api/v1/orgs/${org}/obligations`)).json.obligations as Array<{ title: string }>).filter((o) => o.title === title).length;

beforeAll(async () => {
  ctx = await setup();
  alice = new Client(ctx);
  bob = new Client(ctx);
  await alice.signIn("idem-alice@example.com", "Alice");
  await bob.signIn("idem-bob@example.com", "Bob");
  org = (await alice.post("/api/v1/orgs", { name: "Idempotent DAO" })).json.id;
  const inv = await alice.post(`/api/v1/orgs/${org}/invitations`, { email: "idem-bob@example.com", role: "finance" });
  await bob.post(`/api/v1/invitations/${inv.json.id}/accept`);
}, 60_000);

afterAll(async () => {
  await ctx?.close();
});

describe("Idempotency-Key", () => {
  it("a retried create replays the first result instead of creating a duplicate", async () => {
    const first = await create(alice, obligation("Hosting"), "retry-key-0001");
    expect(first.status).toBe(201);
    const retry = await create(alice, obligation("Hosting"), "retry-key-0001");
    expect(retry.status).toBe(201);
    expect(retry.headers.get("idempotent-replayed")).toBe("true");
    expect(retry.json.id).toBe(first.json.id);
    expect(await count("Hosting")).toBe(1);
  });

  it("refuses the same key with a different body", async () => {
    await create(alice, obligation("Audit retainer"), "reuse-key-0001");
    const other = await create(alice, obligation("Something else"), "reuse-key-0001");
    expect(other.status).toBe(422);
    expect(other.json.error.code).toBe("idempotency_key_reused");
    expect(await count("Something else")).toBe(0);
  });

  it("does not remember failures, so a corrected retry with the same key runs", async () => {
    const bad = await create(alice, obligation("Legal", "0"), "fail-key-0001");
    expect(bad.status).toBe(400);
    const good = await create(alice, obligation("Legal"), "fail-key-0001");
    expect(good.status).toBe(201);
    expect(good.headers.get("idempotent-replayed")).toBeNull();
  });

  it("keys are per person: another member's identical key is a separate request", async () => {
    const a = await create(alice, obligation("Payroll tools"), "shared-key-0001");
    const b = await create(bob, obligation("Payroll tools"), "shared-key-0001");
    expect(b.status).toBe(201);
    expect(b.json.id).not.toBe(a.json.id);
  });

  it("keys expire after a day", async () => {
    const first = await create(alice, obligation("Insurance"), "expire-key-0001");
    const saved = ctx.clock.now;
    ctx.clock.now = new Date(saved.getTime() + 25 * 3600_000);
    try {
      const later = await create(alice, obligation("Insurance"), "expire-key-0001");
      expect(later.status).toBe(201);
      expect(later.json.id).not.toBe(first.json.id);
    } finally {
      ctx.clock.now = saved;
    }
  });

  it("rejects malformed keys and leaves requests without a key untouched", async () => {
    expect((await create(alice, obligation("Bad key"), "short")).status).toBe(400);
    expect((await create(alice, obligation("No key"))).status).toBe(201);
    expect((await create(alice, obligation("No key"))).status).toBe(201);
    expect(await count("No key")).toBe(2);
  });
});
