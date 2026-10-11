import { createRoute, z } from "@hono/zod-openapi";
import { addDays, addMonths, toIsoDate } from "@tokeniq/core";
import { and, asc, eq, isNull, ne, schema, sql } from "@tokeniq/db";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { conflict, forbidden } from "../lib/errors.js";
import { errors, json, clientInfo, orgParams, requireUser } from "../lib/route.js";
import { insertOrganization } from "./organizations.js";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_ETH = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const EURC_BASE = "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42";

/**
 * A clearly labelled simulation: synthetic accounts (addresses that belong to no
 * one), synthetic balances and obligations. Venue data is the same public market
 * data real organizations see. Sample accounts can never be signed for or executed.
 */
export async function createSampleWorkspace(deps: Deps, userId: string, info: { ip: string | null; userAgent: string | null }): Promise<{ organizationId: string; created: boolean }> {
  const now = deps.now();
  const today = toIsoDate(now);
  return deps.db.transaction(async (tx) => {
    // One sample workspace per person (BE-20). Requests from the same person serialise here, so a double
    // click cannot create two; the organization and its data are created in this one transaction.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sample:${userId}`}))`);
    const [existing] = await tx
      .select({ id: schema.members.organizationId })
      .from(schema.members)
      .innerJoin(schema.orgProfiles, eq(schema.orgProfiles.organizationId, schema.members.organizationId))
      .where(and(eq(schema.members.userId, userId), eq(schema.members.role, "owner"), eq(schema.orgProfiles.isSample, true)))
      .orderBy(asc(schema.members.createdAt))
      .limit(1);
    if (existing) return { organizationId: existing.id, created: false };
    const orgId = await insertOrganization(tx, { userId, name: "Sample: Northwind Protocol", purpose: "Simulated workspace for exploring TokenIQ", isSample: true }, info);
    const accounts = await tx
      .insert(schema.treasuryAccounts)
      .values([
        { organizationId: orgId, chainId: 8453, address: "0x5a3e000000000000000000000000000000000001", kind: "safe", label: "Operations Safe (sample)", purpose: "operating", verifiedAt: now, verificationMethod: "sample", safeOwners: [], safeThreshold: 2, safeVersion: "1.5.0", lastSyncedAt: now },
        { organizationId: orgId, chainId: 1, address: "0x5a3e000000000000000000000000000000000002", kind: "safe", label: "Reserve Safe (sample)", purpose: "reserve", verifiedAt: now, verificationMethod: "sample", safeOwners: [], safeThreshold: 3, safeVersion: "1.4.1", lastSyncedAt: now },
      ])
      .returning({ id: schema.treasuryAccounts.id, chainId: schema.treasuryAccounts.chainId });
    const ops = accounts[0]!.id;
    const reserve = accounts[1]!.id;
    const snaps = [
      { accountId: ops, chainId: 8453, assetAddress: USDC_BASE, assetSymbol: "USDC", rawBalance: "612450000000" },
      { accountId: ops, chainId: 8453, assetAddress: EURC_BASE, assetSymbol: "EURC", rawBalance: "48000000000" },
      { accountId: reserve, chainId: 1, assetAddress: USDC_ETH, assetSymbol: "USDC", rawBalance: "905000000000" },
      { accountId: reserve, chainId: 1, assetAddress: USDT_ETH, assetSymbol: "USDT", rawBalance: "180000000000" },
    ];
    // 30 days of history so charts have something honest to draw (labelled sample).
    for (let i = 30; i >= 0; i -= 3) {
      const at = new Date(now.getTime() - i * 86_400_000);
      for (const s of snaps) {
        const drift = BigInt(i) * 4_000_000_000n;
        await tx
          .insert(schema.balanceSnapshots)
          .values({ organizationId: orgId, ...s, rawBalance: (BigInt(s.rawBalance) + (s.assetSymbol === "USDC" ? drift : 0n)).toString(), blockNumber: BigInt(1_000_000 - i), observedAt: at })
          .onConflictDoNothing();
      }
    }
    const firstOfNext = addMonths(today.slice(0, 8) + "01", 1);
    await tx.insert(schema.obligations).values([
      { organizationId: orgId, title: "Core contributors payroll", category: "payroll", amount: "68000", currency: "USD", firstDueDate: addDays(firstOfNext, -1), recurrence: { freq: "monthly", interval: 1 }, certainty: "committed", priority: "critical", trackFrom: today, counterparty: "8 contributors" },
      { organizationId: orgId, title: "Smart contract audit (final milestone)", category: "vendors", amount: "45000", currency: "USD", firstDueDate: addDays(today, 18), recurrence: { freq: "once" }, certainty: "invoiced", priority: "high", trackFrom: today, counterparty: "Example Security Ltd (sample)", invoiceNumber: "INV-2041" },
      { organizationId: orgId, title: "Infrastructure and RPC providers", category: "infrastructure", amount: "6400", currency: "USD", firstDueDate: addDays(today, 9), recurrence: { freq: "monthly", interval: 1 }, certainty: "committed", priority: "normal", trackFrom: today },
      { organizationId: orgId, title: "EU legal counsel retainer", category: "legal", amount: "9500", currency: "EUR", firstDueDate: addDays(today, 24), recurrence: { freq: "monthly", interval: 1 }, certainty: "committed", priority: "normal", trackFrom: today },
      { organizationId: orgId, title: "Conference sponsorship", category: "marketing", amount: "30000", currency: "USD", firstDueDate: addDays(today, 52), recurrence: { freq: "once" }, certainty: "estimate", priority: "low", trackFrom: today },
      { organizationId: orgId, title: "Grants program round 3", category: "grants", amount: "120000", currency: "USD", firstDueDate: addDays(today, 75), recurrence: { freq: "once" }, certainty: "estimate", priority: "normal", trackFrom: today },
    ]);
    return { organizationId: orgId, created: true };
  });
}

/**
 * Remove a sample workspace: every membership and the simulated data. Approval decisions, policy versions
 * and audit history are append-only (database triggers), so the organization row stays as an empty shell
 * with them, together with any proposal that already carries a decision and the (archived) account it
 * names. With no members, nobody can open it again. Real organizations are refused.
 */
export async function deleteSampleWorkspace(deps: Deps, orgId: string, userId: string, info: { ip: string | null; userAgent: string | null }) {
  await deps.db.transaction(async (tx) => {
    const [profile] = await tx.select({ isSample: schema.orgProfiles.isSample }).from(schema.orgProfiles).where(eq(schema.orgProfiles.organizationId, orgId)).for("update");
    if (!profile?.isSample) throw conflict("not_sample_workspace", "Only sample workspaces can be deleted. Real organizations cannot be deleted in TokenIQ.");
    // Owners are row-locked as for the last-owner rule, so a concurrent role change cannot slip in.
    const owners = await tx
      .select({ userId: schema.members.userId })
      .from(schema.members)
      .where(and(eq(schema.members.organizationId, orgId), eq(schema.members.role, "owner")))
      .for("update");
    if (!owners.some((o) => o.userId === userId)) throw forbidden("Only the owner of a sample workspace can delete it");
    if (owners.length > 1) throw conflict("not_sole_owner", "This sample workspace has other owners. Leave it instead, or remove them first.");
    const [others] = await tx.select({ n: sql<number>`count(*)::int` }).from(schema.members).where(and(eq(schema.members.organizationId, orgId), ne(schema.members.userId, userId)));

    // Proposals without decisions go (comments, signatures and executions cascade); decided ones must stay.
    await tx.delete(schema.proposals).where(and(eq(schema.proposals.organizationId, orgId), sql`not exists (select 1 from ${schema.approvals} where ${schema.approvals.proposalId} = ${schema.proposals.id})`));
    await tx.delete(schema.balanceSnapshots).where(eq(schema.balanceSnapshots.organizationId, orgId));
    await tx.delete(schema.positionSnapshots).where(eq(schema.positionSnapshots.organizationId, orgId));
    await tx.delete(schema.treasuryAccounts).where(and(eq(schema.treasuryAccounts.organizationId, orgId), sql`not exists (select 1 from ${schema.proposals} where ${schema.proposals.accountId} = ${schema.treasuryAccounts.id})`));
    await tx.update(schema.treasuryAccounts).set({ archivedAt: deps.now() }).where(and(eq(schema.treasuryAccounts.organizationId, orgId), isNull(schema.treasuryAccounts.archivedAt)));
    // Obligations take their payments and documents with them; copilot threads their messages.
    await tx.delete(schema.obligations).where(eq(schema.obligations.organizationId, orgId));
    await tx.delete(schema.recommendations).where(eq(schema.recommendations.organizationId, orgId));
    await tx.delete(schema.riskAlerts).where(eq(schema.riskAlerts.organizationId, orgId));
    await tx.delete(schema.notifications).where(eq(schema.notifications.organizationId, orgId));
    await tx.delete(schema.invitations).where(eq(schema.invitations.organizationId, orgId));
    await tx.delete(schema.copilotThreads).where(eq(schema.copilotThreads.organizationId, orgId));
    await tx.delete(schema.idempotencyKeys).where(eq(schema.idempotencyKeys.organizationId, orgId));
    await tx.delete(schema.members).where(eq(schema.members.organizationId, orgId));
    await audit(tx, { organizationId: orgId, actorUserId: userId, action: "sample_workspace.deleted", targetType: "organization", targetId: orgId, data: { otherMembersRemoved: others?.n ?? 0 }, ...info });
  });
}

const SampleWorkspaceSchema = z.object({ organizationId: z.string(), created: z.boolean() }).openapi("SampleWorkspace");

export function registerSample(app: App, deps: Deps) {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/sample-workspace",
      tags: ["Organizations"],
      summary: "Open your sample workspace with simulated data (created on first use)",
      description: "Returns your existing sample workspace (200, `created: false`) if you own one; otherwise creates it (201).",
      responses: {
        200: json(SampleWorkspaceSchema, "Your existing sample workspace"),
        201: json(SampleWorkspaceSchema, "A new sample workspace"),
        ...errors,
      },
    }),
    async (c) => {
      const user = requireUser(c);
      const result = await createSampleWorkspace(deps, user.id, clientInfo(c));
      return result.created ? c.json(result, 201) : c.json(result, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/api/v1/orgs/{orgId}/sample-workspace",
      tags: ["Organizations"],
      summary: "Delete a sample workspace you solely own",
      description:
        "Removes every membership and all simulated data. Only a sample workspace's sole owner can do this; real organizations return `409 not_sample_workspace`.",
      request: { params: orgParams },
      responses: { 200: json(z.object({ ok: z.boolean() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      await deleteSampleWorkspace(deps, m.organizationId, user.id, clientInfo(c));
      return c.json({ ok: true }, 200);
    },
  );
}
