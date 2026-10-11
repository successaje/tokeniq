import { PgBoss } from "pg-boss";
import type { Deps } from "../context.js";
import { registerEvaluateJobs } from "./evaluate.js";

/**
 * Durable background work on pg-boss (Postgres-backed; no extra infrastructure).
 * Jobs are idempotent: snapshots are unique per block, alerts per fingerprint,
 * and execution tracking only moves forward.
 */
export async function startJobs(deps: Deps): Promise<PgBoss> {
  const boss = new PgBoss({ connectionString: deps.env.DATABASE_URL, schema: "pgboss", application_name: "tokeniq-jobs" });
  boss.on("error", (err) => deps.logger.error({ err }, "job queue error"));
  await boss.start();
  deps.boss = boss;
  await registerEvaluateJobs(boss, deps);
  deps.logger.info("background jobs started");
  return boss;
}
