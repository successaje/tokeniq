import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createDb } from "@tokeniq/db";
import { createApp } from "../app.js";
import { createAuth } from "../auth.js";
import type { Deps } from "../context.js";
import { loadEnv } from "../env.js";
import { createLogger } from "../lib/logger.js";
import { createMailer } from "../lib/mailer.js";
import { createChainClients } from "../services/chains.js";

/** Write docs/api/openapi.json from the route definitions (no server or database connection needed). */
const env = loadEnv({ NODE_ENV: "development", DATABASE_URL: "postgres://unused/unused", BETTER_AUTH_SECRET: "x".repeat(32), RUN_JOBS: "false", LOG_LEVEL: "fatal" });
const logger = createLogger("fatal");
const handle = createDb(env.DATABASE_URL, { max: 1 });
const mailer = createMailer({ from: env.EMAIL_FROM, nodeEnv: "test", logger });
const { clients, clientFor } = createChainClients(env);
const deps: Deps = { env, db: handle.db, auth: createAuth(handle.db, env, mailer, clientFor), logger, mailer, clients, clientFor, boss: null, now: () => new Date() };
const app = createApp(deps);
const doc = app.getOpenAPI31Document({
  openapi: "3.1.0",
  info: { title: "TokenIQ API", version: "2.0.0", description: "Treasury intelligence and operations. USD values are decimal strings; raw token amounts are integer strings." },
});
const out = fileURLToPath(new URL("../../../../docs/api/openapi.json", import.meta.url));
writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
await handle.close();
console.log(`wrote ${out} (${Object.keys(doc.paths ?? {}).length} paths)`);
