import { createRoute, z } from "@hono/zod-openapi";
import { addDays, addMonths, toIsoDate } from "@tokeniq/core";
import { schema } from "@tokeniq/db";
import type { App, Deps } from "../context.js";
import { errors, json, clientInfo, requireUser } from "../lib/route.js";
import { createOrganization } from "./organizations.js";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_ETH = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const EURC_BASE = "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42";

/**
 * A clearly labelled simulation: synthetic accounts (addresses that belong to no
 * one), synthetic balances and obligations. Venue data is the same public market
 * data real organizations see. Sample accounts can never be signed for or executed.
 */
export async function createSampleWorkspace(deps: Deps, userId: string, info: { ip: string | null; userAgent: string | null }) {
  const orgId = await createOrganization(deps, { userId, name: "Sample: Northwind Protocol", purpose: "Simulated workspace for exploring TokenIQ", isSample: true }, info);
  const now = deps.now();
  const today = toIsoDate(now);
  await deps.db.transaction(async (tx) => {
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
  });
  return orgId;
}

export function registerSample(app: App, deps: Deps) {
  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/sample-workspace",
      tags: ["Organizations"],
      summary: "Create a sample workspace with simulated data",
      responses: { 201: json(z.object({ organizationId: z.string() })), ...errors },
    }),
    async (c) => {
      const user = requireUser(c);
      const organizationId = await createSampleWorkspace(deps, user.id, clientInfo(c));
      return c.json({ organizationId }, 201);
    },
  );
}
