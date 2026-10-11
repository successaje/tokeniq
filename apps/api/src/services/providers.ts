import { eq, schema, sql } from "@tokeniq/db";
import type { Deps } from "../context.js";

/**
 * Track the measured health of each external provider (RPC per chain, Morpho API,
 * Aave reads, price feeds). Status is derived only from our own calls:
 * 3+ consecutive failures = down, any recent failure = degraded.
 */
export async function recordProviderResult(deps: Deps, provider: string, ok: boolean, latencyMs: number, error?: string) {
  const now = deps.now();
  if (ok) {
    await deps.db
      .insert(schema.providerHealth)
      .values({ provider, status: "ok", lastOkAt: now, latencyMs, consecutiveFailures: 0 })
      .onConflictDoUpdate({ target: schema.providerHealth.provider, set: { status: "ok", lastOkAt: now, latencyMs, consecutiveFailures: 0, updatedAt: now } });
  } else {
    await deps.db
      .insert(schema.providerHealth)
      .values({ provider, status: "degraded", lastErrorAt: now, lastError: error ?? "unknown error", latencyMs, consecutiveFailures: 1 })
      .onConflictDoUpdate({
        target: schema.providerHealth.provider,
        set: {
          lastErrorAt: now,
          lastError: (error ?? "unknown error").slice(0, 500),
          latencyMs,
          consecutiveFailures: sql`${schema.providerHealth.consecutiveFailures} + 1`,
          status: sql`case when ${schema.providerHealth.consecutiveFailures} + 1 >= 3 then 'down' else 'degraded' end`,
          updatedAt: now,
        },
      });
  }
}

export async function degradedProviders(deps: Deps) {
  const rows = await deps.db.select().from(schema.providerHealth).where(eq(schema.providerHealth.status, "down"));
  return rows.map((r) => ({ name: r.provider, since: Math.floor((r.lastOkAt ?? r.updatedAt).getTime() / 1000), detail: r.lastError ?? "Failing health checks" }));
}
