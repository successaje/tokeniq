import { createServer } from "node:http";
import { createDb } from "@tokeniq/db";
import { createAuth } from "./auth.js";
import type { Deps } from "./context.js";
import { loadEnv } from "./env.js";
import { startJobs } from "./jobs/index.js";
import { createLogger } from "./lib/logger.js";
import { createMailer } from "./lib/mailer.js";
import { createChainClients } from "./services/chains.js";

/**
 * Background worker: account sync, prices, venue data, execution tracking and
 * risk evaluation. Runs separately from the API in production so request
 * latency never depends on chain reads. Exposes /healthz for the platform.
 */
const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL).child({ service: "tokeniq-worker" });
const handle = createDb(env.DATABASE_URL, { applicationName: "tokeniq-worker" });
const mailer = createMailer({ smtpUrl: env.SMTP_URL, from: env.EMAIL_FROM, nodeEnv: env.NODE_ENV, logger });
const { clients, clientFor } = createChainClients(env);
const auth = createAuth(handle.db, env, mailer, clientFor);
const deps: Deps = { env, db: handle.db, auth, logger, mailer, clients, clientFor, boss: null, now: () => new Date() };
const boss = await startJobs(deps);

const health = createServer((req, res) => {
  res.writeHead(req.url === "/healthz" ? 200 : 404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: req.url === "/healthz" }));
});
health.listen(Number(process.env.WORKER_HEALTH_PORT ?? 4001));

async function shutdown(signal: string) {
  logger.info({ signal }, "worker shutting down");
  health.close();
  await boss.stop({ graceful: true, timeout: 30_000 }).catch(() => undefined);
  await handle.close();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
