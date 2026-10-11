import { createRoute, z } from "@hono/zod-openapi";
import { addDays, decimalString, parseDecimal, projectCashflow, runScenario, wadToString, type ScenarioShock } from "@tokeniq/core";
import { and, eq, gte, schema, sql } from "@tokeniq/db";
import { chainName, explorerAddress } from "@tokeniq/chain";
import type { App, Deps } from "../context.js";
import { badRequest } from "../lib/errors.js";
import { body, errors, IsoDateString, json, orgParams } from "../lib/route.js";
import { cashflowDto, reserveDto, treasuryDto } from "../services/dto.js";
import { loadOrgState, type OrgState } from "../services/state.js";

const tags = ["Treasury"];

function holdingsDto(state: OrgState) {
  const byAccount = new Map(state.accountRows.map((a) => [a.id, a]));
  return {
    holdings: state.holdings.map((h) => {
      const acct = byAccount.get(h.accountId);
      const value = h.price ? (h.raw * h.price.price * 10n ** 18n) / 10n ** BigInt(h.asset.decimals + h.price.decimals) : null;
      return {
        accountId: h.accountId,
        accountLabel: acct?.label ?? "",
        chainId: h.asset.chainId,
        chain: chainName(h.asset.chainId),
        symbol: h.asset.symbol,
        assetAddress: h.asset.address,
        assetClass: h.asset.assetClass,
        raw: h.raw.toString(),
        decimals: h.asset.decimals,
        valueUsd: value === null ? null : wadToString(value),
        price: h.price ? { value: h.price.price.toString(), decimals: h.price.decimals, updatedAt: new Date(h.price.updatedAt * 1000).toISOString(), source: h.price.source, stale: h.price.stale } : null,
      };
    }),
    positions: state.positions.map((p) => {
      const value = p.price ? (p.assetsRaw * p.price.price * 10n ** 18n) / 10n ** BigInt(p.asset.decimals + p.price.decimals) : null;
      return {
        id: p.id,
        accountId: p.accountId,
        accountLabel: byAccount.get(p.accountId)?.label ?? "",
        protocol: p.protocol,
        venueId: p.venueId,
        venueName: p.venueName,
        chainId: p.asset.chainId,
        chain: chainName(p.asset.chainId),
        symbol: p.asset.symbol,
        assetsRaw: p.assetsRaw.toString(),
        withdrawableRaw: p.withdrawableRaw === null ? null : p.withdrawableRaw.toString(),
        decimals: p.asset.decimals,
        valueUsd: value === null ? null : wadToString(value),
        venue: state.opportunities.find((o) => o.id === p.venueId) ? { netApyBps: state.opportunities.find((o) => o.id === p.venueId)!.apy.netBps } : null,
      };
    }),
  };
}

export function overviewDto(state: OrgState) {
  const projection = projectCashflow({ start: state.reserve.available - state.reserve.pendingOutflows, asOf: state.asOf, days: state.policy.obligationHorizonDays, occurrences: [...state.reserve.obligations.occurrences] });
  return {
    organizationId: state.orgId,
    isSample: state.isSample,
    asOf: state.asOf,
    computedAt: new Date(state.nowSec * 1000).toISOString(),
    lastObservedAt: state.lastObservedAt ? new Date(state.lastObservedAt * 1000).toISOString() : null,
    policyVersion: state.policyVersion,
    autonomy: state.policy.autonomy,
    policy: state.policy,
    treasury: treasuryDto(state.treasury),
    reserve: reserveDto(state.reserve),
    projection: { points: cashflowDto(projection.points), lowest: { date: projection.lowest.date, balance: wadToString(projection.lowest.balance) }, firstNegative: projection.firstNegative, reserveFloor: wadToString(state.reserve.required) },
    accounts: state.accountRows.map((a) => ({
      id: a.id,
      label: a.label,
      chainId: a.chainId,
      chain: chainName(a.chainId),
      address: a.address,
      kind: a.kind,
      purpose: a.purpose,
      verified: a.verifiedAt !== null,
      includeInTreasury: a.includeInTreasury,
      lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
      lastSyncError: a.lastSyncError,
      explorer: explorerAddress(a.chainId, a.address),
    })),
    ...holdingsDto(state),
  };
}

const ShockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("depeg"), symbol: z.string().max(16), price: decimalString }),
  z.object({ type: z.literal("new_obligation"), title: z.string().max(120).default("Hypothetical obligation"), amount: decimalString, dueDate: IsoDateString, monthly: z.boolean().default(false) }),
  z.object({ type: z.literal("burn_change"), monthlyBurnUsd: decimalString }),
  z.object({ type: z.literal("runway_months"), months: z.number().int().min(0).max(36) }),
  z.object({ type: z.literal("venue_frozen"), venueId: z.string().max(128) }),
]);

export function registerTreasury(app: App, deps: Deps) {
  const { db } = deps;

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/treasury",
      tags,
      summary: "Treasury overview: balances, reserve requirement, deployable surplus, projection",
      description: "Every figure is computed by the deterministic engine from stored on-chain observations. `reserve.uncertainty` lists reasons the figures may be incomplete.",
      request: { params: orgParams },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      return c.json(overviewDto(state), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/treasury/history",
      tags,
      summary: "Daily stablecoin balance history reconstructed from stored snapshots",
      description: "Uses the last observation of each day per account and asset. Days before TokenIQ started observing an account are absent, not zero.",
      request: { params: orgParams, query: z.object({ days: z.coerce.number().int().min(7).max(365).default(30) }) },
      responses: { 200: json(z.object({ points: z.array(z.object({ date: z.string(), stableRaw: z.array(z.any()) })), coverageStart: z.string().nullable() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const { days } = c.req.valid("query");
      const since = new Date(deps.now().getTime() - days * 86_400_000);
      const rows = await db.execute<{ day: string; account_id: string; chain_id: number; asset_address: string; asset_symbol: string; raw_balance: string }>(sql`
        select distinct on (date_trunc('day', observed_at), account_id, asset_address)
          to_char(date_trunc('day', observed_at), 'YYYY-MM-DD') as day, account_id, chain_id, asset_address, asset_symbol, raw_balance
        from ${schema.balanceSnapshots}
        where organization_id = ${m.organizationId} and observed_at >= ${since}
        order by date_trunc('day', observed_at), account_id, asset_address, observed_at desc`);
      const byDay = new Map<string, Array<{ accountId: string; chainId: number; symbol: string; asset: string; raw: string }>>();
      for (const r of rows.rows) {
        byDay.set(r.day, [...(byDay.get(r.day) ?? []), { accountId: r.account_id, chainId: r.chain_id, symbol: r.asset_symbol, asset: r.asset_address, raw: r.raw_balance }]);
      }
      const points = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, stableRaw]) => ({ date, stableRaw }));
      return c.json({ points, coverageStart: points[0]?.date ?? null }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/treasury/scenario",
      tags,
      summary: "Run a stress scenario without changing any data",
      request: { params: orgParams, ...body(z.object({ shocks: z.array(ShockSchema).min(1).max(8) })) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const { shocks } = c.req.valid("json");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      const engineShocks: ScenarioShock[] = shocks.map((s) => {
        switch (s.type) {
          case "new_obligation":
            return {
              type: "new_obligation",
              obligation: {
                id: `scenario-${crypto.randomUUID()}`,
                title: s.title,
                category: "other",
                direction: "outflow",
                amount: parseDecimal(s.amount),
                currency: "USD",
                firstDueDate: s.dueDate,
                recurrence: s.monthly ? { freq: "monthly", interval: 1 } : { freq: "once" },
                certainty: "committed",
                priority: "normal",
                status: "active",
                trackFrom: state.asOf,
              },
            };
          case "depeg":
            if (Number(s.price) > 2) throw badRequest("invalid_price", "Scenario price must be between 0 and 2");
            return s;
          default:
            return s;
        }
      });
      const result = runScenario(
        { asOf: state.asOf, nowSec: state.nowSec, policy: state.policy, accounts: state.accounts, holdings: state.holdings, positions: state.positions, obligations: state.obligations, settled: state.settled, fx: state.fx, pendingOutflows: state.pendingOutflows, chainName },
        engineShocks,
      );
      return c.json(
        {
          label: "Scenario — hypothetical, no data was changed",
          shocks,
          base: { treasury: treasuryDto(result.base.treasury), reserve: reserveDto(result.base.reserve) },
          scenario: { treasury: treasuryDto(result.scenario.treasury), reserve: reserveDto(result.scenario.reserve) },
          delta: {
            required: wadToString(result.scenario.reserve.required - result.base.reserve.required),
            available: wadToString(result.scenario.reserve.available - result.base.reserve.available),
            deployable: wadToString(result.scenario.reserve.surplus.deployable - result.base.reserve.surplus.deployable),
          },
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/treasury/sync-status",
      tags,
      summary: "Freshness of balances, prices and venue data",
      request: { params: orgParams },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const accounts = await db
        .select({ id: schema.treasuryAccounts.id, label: schema.treasuryAccounts.label, chainId: schema.treasuryAccounts.chainId, lastSyncedAt: schema.treasuryAccounts.lastSyncedAt, lastSyncError: schema.treasuryAccounts.lastSyncError })
        .from(schema.treasuryAccounts)
        .where(and(eq(schema.treasuryAccounts.organizationId, m.organizationId), sql`${schema.treasuryAccounts.archivedAt} is null`));
      const providers = await db.select().from(schema.providerHealth);
      const [opp] = await db.select({ latest: sql<string | null>`max(${schema.opportunities.fetchedAt})` }).from(schema.opportunities);
      const [price] = await db.select({ latest: sql<string | null>`max(${schema.priceObservations.observedAt})` }).from(schema.priceObservations).where(gte(schema.priceObservations.observedAt, new Date(deps.now().getTime() - 7 * 86_400_000)));
      return c.json(
        {
          accounts: accounts.map((a) => ({ ...a, chain: chainName(a.chainId), lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null })),
          providers: providers.map((p) => ({ provider: p.provider, status: p.status, lastOkAt: p.lastOkAt?.toISOString() ?? null, lastErrorAt: p.lastErrorAt?.toISOString() ?? null, lastError: p.lastError, latencyMs: p.latencyMs })),
          opportunitiesFetchedAt: opp?.latest ? new Date(opp.latest).toISOString() : null,
          pricesObservedAt: price?.latest ? new Date(price.latest).toISOString() : null,
          horizonEnd: addDays(new Date(deps.now()).toISOString().slice(0, 10), 90),
        },
        200,
      );
    },
  );
}
