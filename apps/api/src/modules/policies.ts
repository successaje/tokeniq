import { createRoute, z } from "@hono/zod-openapi";
import { approvalPolicySchema, POLICY_PRESETS, treasuryPolicySchema } from "@tokeniq/core";
import { and, desc, eq, schema } from "@tokeniq/db";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan } from "../lib/authz.js";
import { body, clientInfo, errors, json, orgParams, requireUser, send } from "../lib/route.js";
import { diffPolicy, getPolicies, writePolicy } from "../services/policies.js";

const tags = ["Policies"];

export function registerPolicies(app: App, deps: Deps) {
  const { db } = deps;

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/policies",
      tags,
      summary: "Current treasury and approval policies",
      request: { params: orgParams },
      responses: { 200: json(z.object({ treasury: z.any(), treasuryVersion: z.number(), approval: z.any(), approvalVersion: z.number(), presets: z.any() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const p = await getPolicies(db, m.organizationId);
      return c.json({ ...p, presets: Object.fromEntries(Object.entries(POLICY_PRESETS).map(([k, v]) => [k, { label: v.label, description: v.description, policy: v.policy }])) }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/api/v1/orgs/{orgId}/policies/treasury",
      tags,
      summary: "Save a new treasury policy version",
      request: { params: orgParams, ...body(z.object({ policy: treasuryPolicySchema, reason: z.string().trim().min(3).max(500), expectedVersion: z.number().int() })) },
      responses: { 200: json(z.object({ version: z.number(), changes: z.array(z.any()) })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "policy.write");
      const { policy, reason, expectedVersion } = c.req.valid("json");
      const result = await db.transaction(async (tx) => {
        const current = await getPolicies(tx, m.organizationId);
        if (current.treasuryVersion !== expectedVersion) {
          return { conflict: true as const, current: current.treasuryVersion };
        }
        // Autonomous execution cannot be enabled from the API: it requires the on-chain guard (docs/CONTRACTS.md).
        if (policy.autonomy === "bounded_automation") return { forbiddenAutomation: true as const };
        const changes = diffPolicy(current.treasury as Record<string, unknown>, policy as Record<string, unknown>);
        const version = await writePolicy(tx, { orgId: m.organizationId, kind: "treasury", body: policy, reason, userId: user.id });
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "policy.treasury_updated", targetType: "policy", targetId: `treasury:${version}`, data: { reason, changes }, ...clientInfo(c) });
        return { version, changes };
      });
      if ("conflict" in result) {
        return send(c, { error: { code: "policy_version_conflict", message: `The policy changed while you were editing (now version ${result.current}). Review the latest version and try again.` } }, 409);
      }
      if ("forbiddenAutomation" in result) {
        return send(c, { error: { code: "automation_not_enabled", message: "Bounded automation requires the on-chain reserve guard and Roles module to be installed on your Safe. It cannot be switched on from settings." } }, 422);
      }
      return c.json(result, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/api/v1/orgs/{orgId}/policies/approval",
      tags,
      summary: "Save a new approval policy version",
      request: { params: orgParams, ...body(z.object({ policy: approvalPolicySchema, reason: z.string().trim().min(3).max(500), expectedVersion: z.number().int() })) },
      responses: { 200: json(z.object({ version: z.number(), changes: z.array(z.any()) })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "policy.write");
      const { policy, reason, expectedVersion } = c.req.valid("json");
      if (!policy.tiers.some((t) => t.upToUsd === null)) {
        return send(c, { error: { code: "invalid_tiers", message: "The last approval tier must have no upper limit so every amount is covered." } }, 400);
      }
      const result = await db.transaction(async (tx) => {
        const current = await getPolicies(tx, m.organizationId);
        if (current.approvalVersion !== expectedVersion) return null;
        const changes = diffPolicy(current.approval as Record<string, unknown>, policy as Record<string, unknown>);
        const version = await writePolicy(tx, { orgId: m.organizationId, kind: "approval", body: policy, reason, userId: user.id });
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "policy.approval_updated", targetType: "policy", targetId: `approval:${version}`, data: { reason, changes }, ...clientInfo(c) });
        return { version, changes };
      });
      if (!result) return send(c, { error: { code: "policy_version_conflict", message: "The approval policy changed while you were editing. Reload and try again." } }, 409);
      return c.json(result, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/policies/history",
      tags,
      summary: "Policy change history",
      request: { params: orgParams },
      responses: { 200: json(z.object({ versions: z.array(z.any()) })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const rows = await db
        .select({ v: schema.policyVersions, name: schema.users.name, email: schema.users.email })
        .from(schema.policyVersions)
        .leftJoin(schema.users, eq(schema.users.id, schema.policyVersions.createdBy))
        .where(and(eq(schema.policyVersions.organizationId, m.organizationId)))
        .orderBy(desc(schema.policyVersions.createdAt))
        .limit(200);
      // Attach the diff against the previous version of the same kind.
      const byKind = new Map<string, typeof rows>();
      for (const r of [...rows].reverse()) byKind.set(r.v.kind, [...(byKind.get(r.v.kind) ?? []), r]);
      const versions = rows.map((r) => {
        const list = byKind.get(r.v.kind)!;
        const idx = list.findIndex((x) => x.v.id === r.v.id);
        const prev = idx > 0 ? list[idx - 1] : undefined;
        return {
          id: r.v.id,
          kind: r.v.kind,
          version: r.v.version,
          reason: r.v.reason,
          createdAt: r.v.createdAt.toISOString(),
          author: r.name ?? r.email ?? "System",
          changes: prev ? diffPolicy(prev.v.body as Record<string, unknown>, r.v.body as Record<string, unknown>) : [],
        };
      });
      return send(c, { versions }, 200);
    },
  );
}
