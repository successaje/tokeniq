import { createRoute, z } from "@hono/zod-openapi";
import { evaluateRisks, type Alert } from "@tokeniq/core";
import { chainName } from "@tokeniq/chain";
import { and, desc, eq, inArray, isNull, lt, ne, notInArray, schema, sql } from "@tokeniq/db";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan } from "../lib/authz.js";
import { notFound } from "../lib/errors.js";
import { clientInfo, errors, Id, json, orgParams, requireUser, send } from "../lib/route.js";
import { notifyNewAlerts } from "../services/notify.js";
import { degradedProviders } from "../services/providers.js";
import { loadOrgState, type OrgState } from "../services/state.js";

const tags = ["Risk & activity"];

/**
 * Evaluate risk rules and reconcile them with stored alerts: new conditions open
 * alerts, persisting ones update lastSeenAt, cleared ones resolve. Alerts are
 * de-duplicated by fingerprint so a condition never floods notifications.
 */
export async function reconcileAlerts(deps: Deps, state: OrgState, extra: { sequencerDown?: number[]; degradedProviders?: Array<{ name: string; since: number; detail: string }> } = {}) {
  const alerts: Alert[] = evaluateRisks({
    asOf: state.asOf,
    nowSec: state.nowSec,
    policy: state.policy,
    treasury: state.treasury,
    reserve: state.reserve,
    accounts: state.accounts,
    holdings: state.holdings,
    positions: state.positions,
    opportunities: state.opportunities,
    sequencerDown: extra.sequencerDown,
    degradedProviders: extra.degradedProviders,
    chainName,
  });
  const now = deps.now();
  const opened: Alert[] = [];
  await deps.db.transaction(async (tx) => {
    // Reconciles run from GET requests and from the evaluate job, often at the same moment for one org.
    // Serialise them per organization so the read-then-insert below never races (no duplicate-key 500s).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`alerts:${state.orgId}`}))`);
    for (const a of alerts) {
      const updated = await tx
        .update(schema.riskAlerts)
        .set({ lastSeenAt: now, severity: a.severity, title: a.title, condition: a.condition, evidence: a.evidence, recommendedAction: a.recommendedAction })
        .where(and(eq(schema.riskAlerts.organizationId, state.orgId), eq(schema.riskAlerts.fingerprint, a.fingerprint), ne(schema.riskAlerts.status, "resolved")))
        .returning({ id: schema.riskAlerts.id });
      if (updated.length === 0) {
        await tx.insert(schema.riskAlerts).values({ organizationId: state.orgId, fingerprint: a.fingerprint, kind: a.kind, severity: a.severity, title: a.title, condition: a.condition, evidence: a.evidence, recommendedAction: a.recommendedAction, ref: a.ref, firstSeenAt: now, lastSeenAt: now });
        opened.push(a);
      }
    }
    const active = alerts.map((a) => a.fingerprint);
    await tx
      .update(schema.riskAlerts)
      .set({ status: "resolved", resolvedAt: now })
      .where(and(eq(schema.riskAlerts.organizationId, state.orgId), ne(schema.riskAlerts.status, "resolved"), active.length ? notInArray(schema.riskAlerts.fingerprint, active) : undefined));
  });
  return { alerts, opened };
}

/** Platform-wide inputs (provider and L2 sequencer health) that every alert evaluation must pass. */
export async function platformAlertInputs(deps: Deps) {
  const health = await deps.db.select().from(schema.providerHealth);
  const sequencerDown = health.filter((h) => h.provider.startsWith("sequencer:") && h.status !== "ok").map((h) => Number(h.provider.split(":")[1]));
  return { sequencerDown, degradedProviders: await degradedProviders(deps) };
}

/**
 * The one way alerts are evaluated, from a page read or from the job: the same inputs (or sequencer and
 * provider alerts would resolve on a page load and re-open on the next job run), and notifications for
 * whatever this run opened. Reconciles are serialised per organization, so each opened alert is reported
 * by exactly one run; notifications are de-duplicated per member by alert fingerprint as well.
 */
export async function evaluateAlerts(deps: Deps, state: OrgState) {
  const result = await reconcileAlerts(deps, state, await platformAlertInputs(deps));
  if (result.opened.length && !state.isSample) await notifyNewAlerts(deps, state.orgId, result.opened);
  return result;
}

export function registerMonitoring(app: App, deps: Deps) {
  const { db } = deps;

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/alerts",
      tags,
      summary: "Risk alerts (re-evaluated on request)",
      request: { params: orgParams, query: z.object({ status: z.enum(["active", "resolved", "all"]).default("active") }) },
      responses: { 200: json(z.object({ alerts: z.array(z.any()) })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const { status } = c.req.valid("query");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      await evaluateAlerts(deps, state);
      const where =
        status === "active"
          ? and(eq(schema.riskAlerts.organizationId, m.organizationId), inArray(schema.riskAlerts.status, ["open", "acknowledged"]))
          : status === "resolved"
            ? and(eq(schema.riskAlerts.organizationId, m.organizationId), eq(schema.riskAlerts.status, "resolved"))
            : eq(schema.riskAlerts.organizationId, m.organizationId);
      const rows = await db.select().from(schema.riskAlerts).where(where).orderBy(desc(schema.riskAlerts.lastSeenAt)).limit(200);
      const rank = { critical: 0, warning: 1, info: 2 } as Record<string, number>;
      rows.sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3) || b.lastSeenAt.getTime() - a.lastSeenAt.getTime());
      return send(c,
        {
          alerts: rows.map((r) => ({
            id: r.id,
            kind: r.kind,
            severity: r.severity,
            title: r.title,
            condition: r.condition,
            evidence: r.evidence as Array<{ label: string; value: string }>,
            recommendedAction: r.recommendedAction,
            ref: r.ref,
            status: r.status,
            firstSeenAt: r.firstSeenAt.toISOString(),
            lastSeenAt: r.lastSeenAt.toISOString(),
            acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
            resolvedAt: r.resolvedAt?.toISOString() ?? null,
          })),
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({ method: "post", path: "/api/v1/orgs/{orgId}/alerts/{id}/acknowledge", tags, summary: "Acknowledge an alert", request: { params: orgParams.extend({ id: Id }) }, responses: { 200: json(z.object({ ok: z.boolean() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "alerts.manage");
      const { id } = c.req.valid("param");
      const res = await db
        .update(schema.riskAlerts)
        .set({ status: "acknowledged", acknowledgedAt: deps.now(), acknowledgedBy: user.id })
        .where(and(eq(schema.riskAlerts.id, id), eq(schema.riskAlerts.organizationId, m.organizationId), eq(schema.riskAlerts.status, "open")))
        .returning({ title: schema.riskAlerts.title });
      if (!res.length) throw notFound("Open alert");
      await audit(db, { organizationId: m.organizationId, actorUserId: user.id, action: "alert.acknowledged", targetType: "alert", targetId: id, data: { title: res[0]!.title }, ...clientInfo(c) });
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/activity",
      tags,
      summary: "Organization audit trail (newest first, cursor-paginated)",
      request: { params: orgParams, query: z.object({ before: z.coerce.bigint().optional(), limit: z.coerce.number().int().min(1).max(200).default(50), action: z.string().max(64).optional() }) },
      responses: { 200: json(z.object({ events: z.array(z.any()), nextCursor: z.string().nullable() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const { before, limit, action } = c.req.valid("query");
      const rows = await db
        .select({ e: schema.auditEvents, name: schema.users.name, email: schema.users.email })
        .from(schema.auditEvents)
        .leftJoin(schema.users, eq(schema.users.id, schema.auditEvents.actorUserId))
        .where(
          and(
            eq(schema.auditEvents.organizationId, m.organizationId),
            before ? lt(schema.auditEvents.id, before) : undefined,
            // Prefix match. LIKE wildcards in the filter are escaped, not stripped: action names contain "_".
            action ? sql`${schema.auditEvents.action} like ${action.replace(/[\\%_]/g, (ch) => `\\${ch}`) + "%"} escape '\\'` : undefined,
          ),
        )
        .orderBy(desc(schema.auditEvents.id))
        .limit(limit + 1);
      const page = rows.slice(0, limit);
      return c.json(
        {
          events: page.map((r) => ({
            id: r.e.id.toString(),
            action: r.e.action,
            actorType: r.e.actorType,
            actor: r.e.actorType === "system" ? "TokenIQ" : (r.name ?? r.email ?? "Former member"),
            targetType: r.e.targetType,
            targetId: r.e.targetId,
            data: r.e.data,
            createdAt: r.e.createdAt.toISOString(),
          })),
          nextCursor: rows.length > limit ? page[page.length - 1]!.e.id.toString() : null,
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/orgs/{orgId}/notifications", tags, summary: "Your notifications", request: { params: orgParams }, responses: { 200: json(z.object({ notifications: z.array(z.any()), unread: z.number() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const rows = await db
        .select()
        .from(schema.notifications)
        .where(and(eq(schema.notifications.organizationId, m.organizationId), eq(schema.notifications.userId, user.id)))
        .orderBy(desc(schema.notifications.createdAt))
        .limit(50);
      return c.json({ notifications: rows.map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, link: n.link, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() })), unread: rows.filter((n) => !n.readAt).length }, 200);
    },
  );

  app.openapi(
    createRoute({ method: "post", path: "/api/v1/orgs/{orgId}/notifications/read", tags, summary: "Mark all notifications read", request: { params: orgParams }, responses: { 200: json(z.object({ ok: z.boolean() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      await db
        .update(schema.notifications)
        .set({ readAt: deps.now() })
        .where(and(eq(schema.notifications.organizationId, m.organizationId), eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)));
      return c.json({ ok: true }, 200);
    },
  );
}
