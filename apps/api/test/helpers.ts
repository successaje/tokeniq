import { createDb, sql, type DbHandle } from "@tokeniq/db";
import { runMigrations } from "@tokeniq/db/migrate";
import { createApp } from "../src/app.js";
import { createAuth } from "../src/auth.js";
import type { Deps } from "../src/context.js";
import { loadEnv } from "../src/env.js";
import { createLogger } from "../src/lib/logger.js";
import { createMailer } from "../src/lib/mailer.js";
import { createChainClients } from "../src/services/chains.js";

export const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgres://localhost:5432/tokeniq_test";
export const ORIGIN = "http://localhost:3000";

export interface TestContext {
  app: ReturnType<typeof createApp>;
  deps: Deps;
  handle: DbHandle;
  clock: { now: Date };
  close(): Promise<void>;
}

/** Fresh schema per test file: drop everything, migrate, build the app with an in-memory mail outbox. */
export async function setup(): Promise<TestContext> {
  const reset = createDb(TEST_DB, { max: 1 });
  await reset.db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; drop schema if exists pgboss cascade; create schema public;`);
  await reset.close();
  await runMigrations(TEST_DB);
  const env = loadEnv({
    NODE_ENV: "test",
    DATABASE_URL: TEST_DB,
    APP_URL: ORIGIN,
    API_PUBLIC_URL: ORIGIN,
    BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123456789",
    RUN_JOBS: "false",
    LOG_LEVEL: "fatal",
  });
  const logger = createLogger("fatal");
  const handle = createDb(TEST_DB, { max: 5 });
  const mailer = createMailer({ from: "test@tokeniq.local", nodeEnv: "test", logger });
  const { clients, clientFor } = createChainClients(env);
  const auth = createAuth(handle.db, env, mailer, clientFor);
  const clock = { now: new Date("2026-10-11T12:00:00Z") };
  const deps: Deps = { env, db: handle.db, auth, logger, mailer, clients, clientFor, boss: null, now: () => clock.now };
  const app = createApp(deps);
  return { app, deps, handle, clock, close: () => handle.close() };
}

export class Client {
  cookie = "";
  constructor(private ctx: TestContext) {}

  async request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await this.ctx.app.request(path, {
      method,
      headers: { origin: ORIGIN, ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(this.cookie ? { cookie: this.cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    if (setCookie.length) {
      const jar = new Map(this.cookie.split("; ").filter(Boolean).map((c) => [c.split("=")[0]!, c]));
      for (const sc of setCookie) {
        const pair = sc.split(";")[0]!;
        jar.set(pair.split("=")[0]!, pair);
      }
      this.cookie = [...jar.values()].join("; ");
    }
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, json, text, headers: res.headers };
  }

  get = (p: string) => this.request("GET", p);
  post = (p: string, b?: unknown) => this.request("POST", p, b ?? {});
  put = (p: string, b: unknown) => this.request("PUT", p, b);
  patch = (p: string, b: unknown) => this.request("PATCH", p, b);
  del = (p: string) => this.request("DELETE", p);

  /** Sign in through the real email one-time-code flow, reading the code from the test outbox. */
  async signIn(email: string, name = email.split("@")[0]!) {
    const sent = await this.post("/api/auth/email-otp/send-verification-otp", { email, type: "sign-in" });
    if (sent.status !== 200) throw new Error(`send otp failed: ${sent.status} ${sent.text}`);
    const mail = [...this.ctx.deps.mailer.outbox].reverse().find((m) => m.to === email);
    const code = /\b(\d{6})\b/.exec(mail?.subject ?? "")?.[1];
    if (!code) throw new Error("no code in outbox");
    const res = await this.post("/api/auth/sign-in/email-otp", { email, otp: code });
    if (res.status !== 200) throw new Error(`sign in failed: ${res.status} ${res.text}`);
    await this.patch("/api/v1/me", { name });
    return res.json;
  }
}
