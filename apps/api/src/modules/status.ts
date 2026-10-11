import { createRoute, z } from "@hono/zod-openapi";
import { SUPPORTED_CHAINS, TOKENS } from "@tokeniq/chain";
import { schema, sql } from "@tokeniq/db";
import type { App, Deps } from "../context.js";
import { json } from "../lib/route.js";

const tags = ["Status"];

/** Public, organization-free endpoints: liveness, service status and static product metadata. */
export function registerStatus(app: App, deps: Deps) {
  const { db } = deps;

  app.openapi(
    createRoute({ method: "get", path: "/api/health", tags, summary: "Liveness and database reachability", responses: { 200: json(z.object({ ok: z.boolean(), db: z.boolean() })), 503: json(z.object({ ok: z.boolean(), db: z.boolean() })) } }),
    async (c) => {
      try {
        await db.execute(sql`select 1`);
        return c.json({ ok: true, db: true }, 200);
      } catch {
        return c.json({ ok: false, db: false }, 503);
      }
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/status",
      tags,
      summary: "Service and data-provider status",
      description: "Reports measured provider health from TokenIQ's own checks. Components that have never been checked are reported as unknown, never as operational.",
      responses: { 200: json(z.any()) },
    }),
    async (c) => {
      let dbOk = true;
      try {
        await db.execute(sql`select 1`);
      } catch {
        dbOk = false;
      }
      const providers = dbOk ? await db.select().from(schema.providerHealth) : [];
      const [opp] = dbOk ? await db.select({ latest: sql<string | null>`max(${schema.opportunities.fetchedAt})` }).from(schema.opportunities) : [];
      const [price] = dbOk ? await db.select({ latest: sql<string | null>`max(${schema.priceObservations.observedAt})` }).from(schema.priceObservations) : [];
      return c.json(
        {
          checkedAt: deps.now().toISOString(),
          components: [
            { id: "api", name: "API", status: "operational" },
            { id: "database", name: "Database", status: dbOk ? "operational" : "outage" },
            { id: "jobs", name: "Background sync", status: deps.boss ? "operational" : deps.env.RUN_JOBS ? "unknown" : "separate_worker" },
            { id: "copilot", name: "Copilot", status: deps.env.disabled.has("copilot") ? "disabled" : deps.env.ANTHROPIC_API_KEY ? "operational" : "not_configured" },
            { id: "email", name: "Email delivery", status: deps.mailer.configured ? "operational" : "not_configured" },
          ],
          providers: providers.map((p) => ({ provider: p.provider, status: p.status, lastOkAt: p.lastOkAt?.toISOString() ?? null, lastErrorAt: p.lastErrorAt?.toISOString() ?? null, latencyMs: p.latencyMs, consecutiveFailures: p.consecutiveFailures })),
          data: {
            opportunitiesFetchedAt: opp?.latest ? new Date(opp.latest).toISOString() : null,
            pricesObservedAt: price?.latest ? new Date(price.latest).toISOString() : null,
          },
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/meta", tags, summary: "Supported networks and assets", responses: { 200: json(z.any()) } }),
    (c) =>
      c.json(
        {
          chains: SUPPORTED_CHAINS.map((ch) => ({ id: ch.id, key: ch.key, name: ch.name, shortName: ch.shortName, testnet: ch.testnet, explorer: ch.explorer })),
          tokens: TOKENS.map((t) => ({ chainId: t.chainId, address: t.address, symbol: t.symbol, name: t.name, decimals: t.decimals, assetClass: t.assetClass, pegCurrency: t.pegCurrency ?? null, variant: t.variant ?? null, priceFeed: t.feed ? { pair: t.feed.pair, address: t.feed.address, heartbeatSec: t.feed.heartbeatSec } : null })),
          features: { copilot: !!deps.env.ANTHROPIC_API_KEY && !deps.env.disabled.has("copilot"), email: deps.mailer.configured, disabled: [...deps.env.disabled] },
        },
        200,
      ),
  );
}
