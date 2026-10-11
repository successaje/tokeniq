import { createRoute, z } from "@hono/zod-openapi";
import { formatUsd, parseDecimal } from "@tokeniq/core";
import { chainName, explorerTx } from "@tokeniq/chain";
import { asc, desc, eq, schema } from "@tokeniq/db";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan } from "../lib/authz.js";
import { clientInfo, errors, json, orgParams, requireUser } from "../lib/route.js";
import { loadOrgState } from "../services/state.js";
import { overviewDto } from "./treasury.js";

const tags = ["Reports"];

/** RFC 4180 CSV with formula-injection protection (cells starting with = + - @ are prefixed). */
export function toCsv(header: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const cell = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

const EXPORTS = ["activity", "obligations", "payments", "balances", "proposals", "policies"] as const;

export function registerReports(app: App, deps: Deps) {
  const { db } = deps;

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/reports/snapshot",
      tags,
      summary: "Point-in-time treasury snapshot for printable summaries",
      description: "Generated from TokenIQ's observations and calculation rules. It is a management report, not an audited financial statement.",
      request: { params: orgParams },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      const [org] = await db.select({ name: schema.organizations.name }).from(schema.organizations).where(eq(schema.organizations.id, m.organizationId));
      const r = state.reserve;
      const sentence = `Of ${formatUsd(state.treasury.gross, { compact: true })} in tracked assets, ${formatUsd(r.required, { compact: true })} is protected by policy, ${formatUsd(r.obligations.total, { compact: true })} is owed in the next ${state.policy.obligationHorizonDays} days, and ${formatUsd(r.surplus.deployable, { compact: true })} could be deployed under current policy.`;
      return c.json({ organization: org?.name ?? "", generatedAt: deps.now().toISOString(), sentence, disclaimer: "Management report generated from on-chain observations and TokenIQ's documented calculation rules. Not an audited financial statement.", ...overviewDto(state) }, 200);
    },
  );

  app.get("/api/v1/orgs/:orgId/reports/export/:kind{[a-z]+\\.csv}", async (c) => {
    const m = c.get("member");
    const user = requireUser(c);
    assertCan(m.role, "reports.export");
    const kind = c.req.param("kind").replace(/\.csv$/, "") as (typeof EXPORTS)[number];
    if (!EXPORTS.includes(kind)) return c.json({ error: { code: "not_found", message: "Unknown export" } }, 404);
    const orgId = m.organizationId;
    let csv = "";
    if (kind === "activity") {
      const rows = await db.select({ e: schema.auditEvents, email: schema.users.email }).from(schema.auditEvents).leftJoin(schema.users, eq(schema.users.id, schema.auditEvents.actorUserId)).where(eq(schema.auditEvents.organizationId, orgId)).orderBy(asc(schema.auditEvents.id));
      csv = toCsv(["id", "timestamp_utc", "actor_type", "actor", "action", "target_type", "target_id", "data_json"], rows.map((r) => [r.e.id.toString(), r.e.createdAt.toISOString(), r.e.actorType, r.email ?? "", r.e.action, r.e.targetType, r.e.targetId, JSON.stringify(r.e.data ?? {})]));
    } else if (kind === "obligations") {
      const rows = await db.select().from(schema.obligations).where(eq(schema.obligations.organizationId, orgId)).orderBy(asc(schema.obligations.firstDueDate));
      csv = toCsv(["id", "title", "category", "direction", "amount", "currency", "first_due_date", "recurrence", "certainty", "priority", "status", "counterparty", "recipient_address", "invoice_number"], rows.map((r) => [r.id, r.title, r.category, r.direction, r.amount, r.currency, r.firstDueDate, JSON.stringify(r.recurrence), r.certainty, r.priority, r.status, r.counterparty, r.recipientAddress, r.invoiceNumber]));
    } else if (kind === "payments") {
      const rows = await db.select({ p: schema.payments, title: schema.obligations.title }).from(schema.payments).innerJoin(schema.obligations, eq(schema.obligations.id, schema.payments.obligationId)).where(eq(schema.payments.organizationId, orgId)).orderBy(asc(schema.payments.dueDate));
      csv = toCsv(
        ["obligation", "due_date", "status", "amount_usd", "asset", "token_amount_raw", "network", "tx_hash", "explorer_url", "verified_at"],
        rows.map(({ p, title }) => [title, p.dueDate, p.status, p.amount, p.assetSymbol, p.tokenAmountRaw, p.chainId ? chainName(p.chainId) : "", p.txHash, p.chainId && p.txHash ? explorerTx(p.chainId, p.txHash) : "", p.verifiedAt?.toISOString()]),
      );
    } else if (kind === "balances") {
      const rows = await db
        .select({ s: schema.balanceSnapshots, label: schema.treasuryAccounts.label, address: schema.treasuryAccounts.address })
        .from(schema.balanceSnapshots)
        .innerJoin(schema.treasuryAccounts, eq(schema.treasuryAccounts.id, schema.balanceSnapshots.accountId))
        .where(eq(schema.balanceSnapshots.organizationId, orgId))
        .orderBy(desc(schema.balanceSnapshots.observedAt))
        .limit(50_000);
      csv = toCsv(["observed_at_utc", "account", "address", "network", "asset", "asset_address", "raw_balance", "block_number", "block_hash"], rows.map(({ s, label, address }) => [s.observedAt.toISOString(), label, address, chainName(s.chainId), s.assetSymbol, s.assetAddress, s.rawBalance, s.blockNumber.toString(), s.blockHash]));
    } else if (kind === "proposals") {
      const rows = await db.select().from(schema.proposals).where(eq(schema.proposals.organizationId, orgId)).orderBy(asc(schema.proposals.createdAt));
      const approvals = await db.select({ a: schema.approvals, email: schema.users.email }).from(schema.approvals).innerJoin(schema.users, eq(schema.users.id, schema.approvals.userId)).where(eq(schema.approvals.organizationId, orgId));
      const execs = await db.select().from(schema.executions).where(eq(schema.executions.organizationId, orgId));
      csv = toCsv(
        ["id", "created_at_utc", "kind", "title", "status", "amount_usd", "network", "safe_tx_hash", "approvals", "executions"],
        rows.map((p) => [
          p.id,
          p.createdAt.toISOString(),
          p.kind,
          p.title,
          p.status,
          formatUsd(parseDecimal(p.amountUsd)),
          chainName(p.chainId),
          p.safeTxHash,
          approvals.filter((a) => a.a.proposalId === p.id).map((a) => `${a.email}:${a.a.decision}@${a.a.createdAt.toISOString()}`).join("; "),
          execs.filter((e) => e.proposalId === p.id).map((e) => `${e.txHash}:${e.status}`).join("; "),
        ]),
      );
    } else if (kind === "policies") {
      const rows = await db.select({ v: schema.policyVersions, email: schema.users.email }).from(schema.policyVersions).leftJoin(schema.users, eq(schema.users.id, schema.policyVersions.createdBy)).where(eq(schema.policyVersions.organizationId, orgId)).orderBy(asc(schema.policyVersions.createdAt));
      csv = toCsv(["kind", "version", "created_at_utc", "author", "reason", "body_json"], rows.map(({ v, email }) => [v.kind, v.version, v.createdAt.toISOString(), email ?? "", v.reason, JSON.stringify(v.body)]));
    }
    await audit(db, { organizationId: orgId, actorUserId: user.id, action: "report.exported", targetType: "report", targetId: kind, ...clientInfo(c) });
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="tokeniq-${kind}-${deps.now().toISOString().slice(0, 10)}.csv"`,
        "cache-control": "private, no-store",
      },
    });
  });
}
