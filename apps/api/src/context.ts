import type { MemberRole } from "@tokeniq/core";
import type { Database } from "@tokeniq/db";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { PgBoss } from "pg-boss";
import type { Auth } from "./auth.js";
import type { Env } from "./env.js";
import type { Logger } from "./lib/logger.js";
import type { Mailer } from "./lib/mailer.js";
import type { PublicClientFor } from "./services/chains.js";
import type { ClientRegistry } from "@tokeniq/chain";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface Membership {
  id: string;
  organizationId: string;
  role: MemberRole;
}

export type AppEnv = {
  Variables: {
    requestId: string;
    /** Client IP resolved from X-Forwarded-For with TRUSTED_PROXY_COUNT (see lib/rate-limit.ts). */
    clientIp: string | null;
    user: SessionUser | null;
    sessionId: string | null;
    member: Membership;
  };
};

export interface Deps {
  env: Env;
  db: Database;
  auth: Auth;
  logger: Logger;
  mailer: Mailer;
  clients: ClientRegistry;
  clientFor: PublicClientFor;
  /** Present when the job queue is running; enqueue failures must not break user requests. */
  boss: PgBoss | null;
  /** Clock injection for deterministic tests. */
  now: () => Date;
  /** Optional injected Claude client (tests); otherwise created from ANTHROPIC_API_KEY. */
  copilotClient?: import("@anthropic-ai/sdk").default;
}

export type App = OpenAPIHono<AppEnv>;
