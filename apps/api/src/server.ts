import { serve } from "@hono/node-server";
import { createDb } from "@tokeniq/db";
import { runMigrations } from "@tokeniq/db/migrate";
import { createApp } from "./app.js";
import { createAuth } from "./auth.js";
import type { Deps } from "./context.js";
import { loadEnv } from "./env.js";
import { startJobs } from "./jobs/index.js";
import { createLogger } from "./lib/logger.js";
import { createMailer } from "./lib/mailer.js";
import { createChainClients } from "./services/chains.js";

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);
// Development applies migrations at boot; production runs them as a release step (docs/DEPLOYMENT.md).
if (env.MIGRATE_ON_BOOT) await runMigrations(env.DATABASE_URL);
const handle = createDb(env.DATABASE_URL, { applicationName: "tokeniq-api" });
const mailer = createMailer({ smtpUrl: env.SMTP_URL, from: env.EMAIL_FROM, nodeEnv: env.NODE_ENV, logger });
const { clients, clientFor } = createChainClients(env);
const auth = createAuth(handle.db, env, mailer, clientFor);
const deps: Deps = { env, db: handle.db, auth, logger, mailer, clients, clientFor, boss: null, now: () => new Date() };
if (env.RUN_JOBS) deps.boss = await startJobs(deps);

const app = createApp(deps);
const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => logger.info(`TokenIQ API listening on :${info.port}`));

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close();
  await deps.boss?.stop({ graceful: true, timeout: 20_000 }).catch(() => undefined);
  await handle.close();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
