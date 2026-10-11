import { createRoute, z } from "@hono/zod-openapi";
import { assessSuitability, estimateYield, generateRecommendations, liquidityLimit, wad, wadToString } from "@tokeniq/core";
import { chainName } from "@tokeniq/chain";
import { and, desc, eq, inArray, notInArray, schema } from "@tokeniq/db";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan } from "../lib/authz.js";
import { notFound } from "../lib/errors.js";
import { body, clientInfo, errors, Id, json, orgParams, requireUser } from "../lib/route.js";
import { opportunityToJson, recommendationDto, type RecommendationJson } from "../services/dto.js";
import { loadOrgState, type OrgState } from "../services/state.js";

const tags = ["Opportunities & recommendations"];

/** Generate deterministic recommendations, persist new ones, supersede ones that no longer apply. */
export async function refreshRecommendations(deps: Deps, state: OrgState) {
  // Sample workspaces get recommendations too, so the product can be explored; they are labelled and cannot execute.
  const all = generateRecommendations({
    nowSec: state.nowSec,
    policy: state.policy,
    treasury: state.treasury,
    reserve: state.reserve,
    accounts: state.accounts,
    holdings: state.holdings,
    positions: state.positions,
    opportunities: state.opportunities,
  });
  const fingerprints = all.map((r) => r.fingerprint);
  await deps.db.transaction(async (tx) => {
    for (const r of all) {
      await tx
        .insert(schema.recommendations)
        .values({ organizationId: state.orgId, fingerprint: r.fingerprint, kind: r.kind, title: r.title, payload: recommendationDto(r), status: "open" })
        .onConflictDoNothing();
    }
    const stale = and(eq(schema.recommendations.organizationId, state.orgId), eq(schema.recommendations.status, "open"), fingerprints.length ? notInArray(schema.recommendations.fingerprint, fingerprints) : undefined);
    await tx.update(schema.recommendations).set({ status: "superseded", resolvedAt: deps.now(), resolution: "Conditions changed; no longer applies" }).where(stale);
  });
  return all;
}

export function registerOpportunities(app: App, deps: Deps) {
  const { db } = deps;

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/opportunities",
      tags,
      summary: "Capital venues with suitability against your policy",
      description: "APY figures are measurements from the named source at `source.fetchedAt`; they are not promises. `listed` venues passed TokenIQ's integration review and are the only ones that can become proposals.",
      request: { params: orgParams },
      responses: { 200: json(z.object({ opportunities: z.array(z.any()), fetchedAt: z.string().nullable(), policyVersion: z.number() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      const sample = wad(100_000);
      const opportunities = state.opportunities
        .map((o) => {
          const s = assessSuitability(o, state.policy, state.nowSec);
          return {
            ...opportunityToJson(o),
            chain: chainName(o.chainId),
            suitability: s,
            maxPositionByLiquidity: wadToString(liquidityLimit(o, state.policy)),
            illustrativeYieldOn100k: wadToString(estimateYield(sample, o.apy.netBps, 365)),
          };
        })
        .sort((a, b) => Number(b.suitability.suitable) - Number(a.suitability.suitable) || b.apy.netBps - a.apy.netBps);
      const fetchedAt = state.opportunities.reduce<number | null>((max, o) => (max === null || o.source.fetchedAt > max ? o.source.fetchedAt : max), null);
      return c.json({ opportunities, fetchedAt: fetchedAt ? new Date(fetchedAt * 1000).toISOString() : null, policyVersion: state.policyVersion }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/recommendations",
      tags,
      summary: "Open recommendations (recomputed from current data on every request)",
      request: { params: orgParams, query: z.object({ include: z.enum(["open", "all"]).default("open") }) },
      responses: { 200: json(z.object({ recommendations: z.array(z.any()), whyNone: z.string().nullable(), isSample: z.boolean() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const { include } = c.req.valid("query");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      const current = await refreshRecommendations(deps, state);
      const rows = await db
        .select()
        .from(schema.recommendations)
        .where(include === "open" ? and(eq(schema.recommendations.organizationId, m.organizationId), eq(schema.recommendations.status, "open")) : eq(schema.recommendations.organizationId, m.organizationId))
        .orderBy(desc(schema.recommendations.createdAt))
        .limit(100);
      let whyNone: string | null = null;
      if (current.length === 0) {
        const r = state.reserve;
        if (state.accounts.length === 0) whyNone = "Add a treasury account so TokenIQ can see balances.";
        else if (!state.treasury.complete) whyNone = "Some balances or prices are missing or stale, so TokenIQ is not making recommendations until data is complete.";
        else if (r.uncertainty.level === "high") whyNone = `Key inputs are missing: ${r.uncertainty.reasons.filter((x) => x.level === "high").map((x) => x.message).join("; ")}.`;
        else if (state.policy.autonomy === "observe") whyNone = "Your policy is set to observe-only, so no actions are proposed.";
        else if (state.opportunities.length === 0) whyNone = "No venue data is available yet.";
        else if (r.surplus.deployable === 0n) whyNone = `Nothing is deployable: ${r.surplus.explanation}.`;
        else if (!state.accounts.some((a) => a.verified && a.kind === "safe")) whyNone = "Proposals need a verified Safe account holding an allowed asset.";
        else whyNone = "No venue passes every policy check for the deployable amount. Review opportunities to see which checks fail.";
      }
      return c.json(
        {
          recommendations: rows.map((r) => ({ id: r.id, status: r.status, createdAt: r.createdAt.toISOString(), resolvedAt: r.resolvedAt?.toISOString() ?? null, resolution: r.resolution, ...(r.payload as RecommendationJson) })),
          whyNone,
          isSample: state.isSample,
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/recommendations/{id}/dismiss",
      tags,
      summary: "Dismiss a recommendation with a reason",
      request: { params: orgParams.extend({ id: Id }), ...body(z.object({ reason: z.string().trim().min(3).max(500) })) },
      responses: { 200: json(z.object({ ok: z.boolean() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "recommendations.manage");
      const { id } = c.req.valid("param");
      const { reason } = c.req.valid("json");
      const res = await db
        .update(schema.recommendations)
        .set({ status: "dismissed", resolvedAt: deps.now(), resolvedBy: user.id, resolution: reason })
        .where(and(eq(schema.recommendations.id, id), eq(schema.recommendations.organizationId, m.organizationId), inArray(schema.recommendations.status, ["open"])))
        .returning({ id: schema.recommendations.id, title: schema.recommendations.title });
      if (!res.length) throw notFound("Open recommendation");
      await audit(db, { organizationId: m.organizationId, actorUserId: user.id, action: "recommendation.dismissed", targetType: "recommendation", targetId: id, data: { reason, title: res[0]!.title }, ...clientInfo(c) });
      return c.json({ ok: true }, 200);
    },
  );
}
