import { chainName } from "@tokeniq/chain";
import {
  addDays,
  assessSuitability,
  decimalString,
  expandOccurrences,
  formatBps,
  fromWad,
  parseDecimal,
  runScenario,
  validateAction,
  WAD,
  wadToString,
  type ScenarioShock,
  type TreasuryAction,
} from "@tokeniq/core";
import { and, desc, eq, inArray, schema } from "@tokeniq/db";
import { z } from "zod";
import type { Deps } from "../context.js";
import { reserveDto } from "./dto.js";
import { ACTIVE_PROPOSAL_STATUSES, loadOrgState, type OrgState } from "./state.js";

/**
 * Copilot tools. Every tool is read-only or a pure calculation, runs with the
 * organization fixed by the server (never by the model), and returns records
 * with `ref` ids the answer must cite. Free-text fields written by users or
 * external sources are wrapped as untrusted data.
 */

export interface ToolContext {
  deps: Deps;
  orgId: string;
  /** Lazily loaded and shared by every tool call in one turn so figures are consistent. */
  state: () => Promise<OrgState>;
}

/** Mark user- or source-supplied text so the model treats it as data, never as instructions. */
const untrusted = (s: string | null | undefined) => (s == null ? null : { untrusted_text: s.slice(0, 300) });

const ws = wadToString;

export interface CopilotTool {
  name: string;
  description: string;
  input: z.ZodType;
  jsonSchema: Record<string, unknown>;
  run: (ctx: ToolContext, input: any) => Promise<unknown>;
}

const shockSchema = z.discriminatedUnion("type", [
  // Same bound as the scenario route: a stablecoin above $2 is not a depeg scenario.
  z.object({ type: z.literal("depeg"), symbol: z.string().max(16), price: decimalString.refine((v) => /^\d+(\.\d{1,18})?$/.test(v) && parseDecimal(v) <= 2n * WAD, "A depeg price must be at most 2") }),
  z.object({ type: z.literal("new_obligation"), title: z.string().max(120), amount: decimalString, dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), monthly: z.boolean().default(false) }),
  z.object({ type: z.literal("burn_change"), monthlyBurnUsd: decimalString }),
  z.object({ type: z.literal("runway_months"), months: z.number().int().min(0).max(36) }),
  z.object({ type: z.literal("venue_frozen"), venueId: z.string().max(128) }),
]);

export const COPILOT_TOOLS: CopilotTool[] = [
  {
    name: "get_treasury_overview",
    description:
      "Current treasury figures computed by TokenIQ's deterministic engine: total tracked value, liquid and deployed amounts, reserve requirement with each rule and which one binds, coverage status, deployable surplus with the limiting factor, runway covered, uncertainty reasons and data freshness. Call this first for any question about how much the organization has, must protect, or can deploy.",
    input: z.object({}),
    jsonSchema: { type: "object", properties: {}, additionalProperties: false },
    async run(ctx) {
      const s = await ctx.state();
      const r = reserveDto(s.reserve);
      return {
        ref: "treasury",
        asOf: s.asOf,
        isSampleWorkspace: s.isSample,
        dataComplete: s.treasury.complete,
        dataIssues: s.treasury.issues.map((i) => i.message),
        lastBalanceObservation: s.lastObservedAt ? new Date(s.lastObservedAt * 1000).toISOString() : null,
        totals: { grossUsd: ws(s.treasury.gross), liquidStableUsd: ws(s.treasury.liquid.stable), liquidOtherUsd: ws(s.treasury.liquid.other), deployedUsd: ws(s.treasury.allocated.total), withdrawableNowUsd: ws(s.treasury.allocated.withdrawableNow), reserveEligibleUsd: ws(s.treasury.reserveEligible), excludedUnverifiedUsd: ws(s.treasury.unverifiedValue) },
        reserve: { ref: "reserve", requiredUsd: r.required, bindingRule: r.bindingRule, rules: r.rules, status: r.status, coverageBps: r.coverageBps, shortfallUsd: r.shortfall, runwayCoveredMonths: r.runwayCoveredMonths, burn: r.burn, obligationsInHorizonUsd: r.obligations.total, overdueUsd: r.obligations.overdue, pendingOutflowsUsd: r.pendingOutflows },
        deployable: { ref: "reserve", amountUsd: r.surplus.deployable, limitedBy: r.surplus.limitedBy, explanation: r.surplus.explanation, capRemainingUsd: r.surplus.capRemaining },
        uncertainty: r.uncertainty,
        currencyMismatches: r.currencyMismatches,
        byAsset: s.treasury.byAsset.map((b) => ({ asset: b.label, valueUsd: ws(b.value), shareBps: b.shareBps.toString() })),
        byChain: s.treasury.byChain.map((b) => ({ network: b.label, valueUsd: ws(b.value) })),
      };
    },
  },
  {
    name: "list_obligations",
    description: "Unpaid obligation occurrences due within the next N days (overdue ones included), plus every active obligation with its recurrence. Use for questions about upcoming payments, payroll, invoices or what is owed when.",
    input: z.object({ days: z.number().int().min(1).max(366).default(30) }),
    jsonSchema: { type: "object", properties: { days: { type: "integer", minimum: 1, maximum: 366, description: "Look-ahead window in days (default 30)" } }, additionalProperties: false },
    async run(ctx, input: { days: number }) {
      const s = await ctx.state();
      const occ = expandOccurrences(s.obligations, { asOf: s.asOf, through: addDays(s.asOf, input.days), settled: s.settled, fx: s.fx });
      return {
        asOf: s.asOf,
        windowDays: input.days,
        occurrences: occ.map((o) => ({ ref: `obligation:${o.obligationId}`, title: untrusted(o.title), category: o.category, direction: o.direction, dueDate: o.dueDate, overdue: o.overdue, amount: ws(o.amount), currency: o.currency, usd: o.usd === null ? null : ws(o.usd), certainty: o.certainty, priority: o.priority })),
        obligations: s.obligationRows
          .filter((o) => o.status === "active")
          .map((o) => ({ ref: `obligation:${o.id}`, title: untrusted(o.title), counterparty: untrusted(o.counterparty), category: o.category, amount: o.amount, currency: o.currency, recurrence: o.recurrence, firstDueDate: o.firstDueDate, certainty: o.certainty, priority: o.priority })),
      };
    },
  },
  {
    name: "list_accounts_and_holdings",
    description: "Tracked Safes and wallets (network, type, verified or not, last sync) and their stablecoin and ETH balances with USD values and price sources.",
    input: z.object({}),
    jsonSchema: { type: "object", properties: {}, additionalProperties: false },
    async run(ctx) {
      const s = await ctx.state();
      return {
        accounts: s.accountRows.map((a) => ({ ref: `account:${a.id}`, label: untrusted(a.label), network: chainName(a.chainId), address: a.address, kind: a.kind, verified: a.verifiedAt !== null, includeInTreasury: a.includeInTreasury, lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null, safe: a.kind === "safe" ? { threshold: a.safeThreshold, owners: a.safeOwners?.length ?? null, version: a.safeVersion } : null })),
        holdings: s.holdings.map((h) => ({ ref: `account:${h.accountId}`, asset: h.asset.symbol, network: chainName(h.asset.chainId), amount: ws((h.raw * 10n ** 18n) / 10n ** BigInt(h.asset.decimals)), price: h.price ? { value: (Number(h.price.price) / 10 ** h.price.decimals).toFixed(6), source: h.price.source, updatedAt: new Date(h.price.updatedAt * 1000).toISOString(), stale: h.price.stale } : null })),
      };
    },
  },
  {
    name: "list_positions",
    description: "Current positions in protocols (Morpho vaults, Aave) with value, what is withdrawable now, and the venue's current net APY with its measurement window.",
    input: z.object({}),
    jsonSchema: { type: "object", properties: {}, additionalProperties: false },
    async run(ctx) {
      const s = await ctx.state();
      return {
        positions: s.positions.map((p) => {
          const venue = s.opportunities.find((o) => o.id === p.venueId);
          return { ref: `position:${p.id}`, venue: p.venueName, venueRef: `opportunity:${p.venueId}`, protocol: p.protocol, network: chainName(p.asset.chainId), asset: p.asset.symbol, amount: ws((p.assetsRaw * 10n ** 18n) / 10n ** BigInt(p.asset.decimals)), withdrawableNow: p.withdrawableRaw === null ? "unknown" : ws((p.withdrawableRaw * 10n ** 18n) / 10n ** BigInt(p.asset.decimals)), netApy: venue ? formatBps(venue.apy.netBps) : null, apyMeasurement: venue?.apy.measurement ?? null };
        }),
      };
    },
  },
  {
    name: "list_recommendations",
    description: "Open recommendations produced by TokenIQ's deterministic engine, with trigger, sizing basis, policy checks, upside, downside and alternatives. The copilot can explain these but never creates or changes them.",
    input: z.object({}),
    jsonSchema: { type: "object", properties: {}, additionalProperties: false },
    async run(ctx) {
      const rows = await ctx.deps.db
        .select()
        .from(schema.recommendations)
        .where(and(eq(schema.recommendations.organizationId, ctx.orgId), eq(schema.recommendations.status, "open")))
        .orderBy(desc(schema.recommendations.createdAt))
        .limit(10);
      // Recommendation text embeds venue names from external data sources, so the narrative is passed as
      // untrusted data; the structured action and check results come straight from the engine.
      return {
        recommendations: rows.map((r) => {
          const {
            action,
            validation,
            kind,
            fingerprint: _f,
            ...narrative
          } = r.payload as {
            action?: unknown;
            validation?: { valid: boolean; checks: Array<{ id: string; status: string }> } | null;
            kind?: string;
            fingerprint?: string;
          } & Record<string, unknown>;
          return {
            ref: `recommendation:${r.id}`,
            kind,
            action: action ?? null,
            policyChecks: validation ? { valid: validation.valid, checks: validation.checks.map((c) => ({ id: c.id, status: c.status })) } : null,
            details: { untrusted_json: JSON.stringify(narrative).slice(0, 6000) },
          };
        }),
      };
    },
  },
  {
    name: "list_opportunities",
    description: "Venues TokenIQ tracks, with net APY (and what it measures), TVL, available liquidity, fee, curator, warnings, whether the venue is listed for execution, and which of the organization's policy checks pass or fail.",
    input: z.object({ suitableOnly: z.boolean().default(false) }),
    jsonSchema: { type: "object", properties: { suitableOnly: { type: "boolean", description: "Only venues that pass every policy check" } }, additionalProperties: false },
    async run(ctx, input: { suitableOnly: boolean }) {
      const s = await ctx.state();
      return {
        venues: s.opportunities
          .map((o) => ({ o, suit: assessSuitability(o, s.policy, s.nowSec) }))
          .filter((x) => !input.suitableOnly || x.suit.suitable)
          .slice(0, 25)
          .map(({ o, suit }) => ({ ref: `opportunity:${o.id}`, name: untrusted(o.name), protocol: o.protocol, network: chainName(o.chainId), asset: o.asset.symbol, netApy: formatBps(o.apy.netBps), rewardsApy: formatBps(o.apy.rewardsBps), measurement: o.apy.measurement, tvlUsd: ws(o.tvlUsd), availableLiquidityUsd: ws(o.availableLiquidityUsd), feeBps: o.feeBps, curator: o.curator ? untrusted(o.curator.name) : null, warnings: o.warnings.map((w) => ({ level: w.level, message: untrusted(w.message) })), listedForExecution: o.listed, suitable: suit.suitable, failingChecks: suit.checks.filter((c) => c.status === "fail").map((c) => c.label), source: o.source.name, fetchedAt: new Date(o.source.fetchedAt * 1000).toISOString() })),
      };
    },
  },
  {
    name: "list_alerts",
    description: "Active risk alerts (reserve shortfall, depegs, stale prices, concentration, venue liquidity, unexplained balance drops) with evidence and recommended next steps.",
    input: z.object({}),
    jsonSchema: { type: "object", properties: {}, additionalProperties: false },
    async run(ctx) {
      const rows = await ctx.deps.db
        .select()
        .from(schema.riskAlerts)
        .where(and(eq(schema.riskAlerts.organizationId, ctx.orgId), inArray(schema.riskAlerts.status, ["open", "acknowledged"])))
        .orderBy(desc(schema.riskAlerts.lastSeenAt))
        .limit(30);
      // Alert text can quote account labels, venue names and provider error messages: pass it as untrusted data.
      return {
        alerts: rows.map((a) => ({
          ref: `alert:${a.id}`,
          kind: a.kind,
          severity: a.severity,
          title: untrusted(a.title),
          condition: untrusted(a.condition),
          evidence: { untrusted_json: JSON.stringify(a.evidence).slice(0, 2000) },
          recommendedAction: untrusted(a.recommendedAction),
          status: a.status,
          since: a.firstSeenAt.toISOString(),
        })),
      };
    },
  },
  {
    name: "get_policy",
    description: "The organization's current treasury policy (reserve rules, valuation, allocation limits, autonomy level) and approval policy (tiers by amount), with versions and the most recent changes and their reasons.",
    input: z.object({}),
    jsonSchema: { type: "object", properties: {}, additionalProperties: false },
    async run(ctx) {
      const s = await ctx.state();
      const history = await ctx.deps.db.select().from(schema.policyVersions).where(eq(schema.policyVersions.organizationId, ctx.orgId)).orderBy(desc(schema.policyVersions.createdAt)).limit(6);
      return { ref: "policy", treasuryPolicy: s.policy, treasuryVersion: s.policyVersion, approvalPolicy: s.approvalPolicy, approvalVersion: s.approvalPolicyVersion, recentVersions: history.map((h) => ({ kind: h.kind, version: h.version, reason: untrusted(h.reason), createdAt: h.createdAt.toISOString() })) };
    },
  },
  {
    name: "run_scenario",
    description:
      "Recompute the treasury under hypothetical changes without saving anything: a stablecoin trading at a different price (depeg), a new one-off or monthly obligation, a different monthly burn, a different runway requirement, or a venue freezing withdrawals. Returns base and scenario figures side by side. Use for 'what if' and 'can we afford' questions.",
    input: z.object({ shocks: z.array(shockSchema).min(1).max(6) }),
    jsonSchema: {
      type: "object",
      properties: {
        shocks: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["depeg", "new_obligation", "burn_change", "runway_months", "venue_frozen"] },
              symbol: { type: "string", description: "depeg: stablecoin symbol, e.g. USDC" },
              price: { type: "string", description: "depeg: USD price as a decimal string, e.g. \"0.97\"" },
              title: { type: "string", description: "new_obligation: short label" },
              amount: { type: "string", description: "new_obligation: USD amount as a decimal string" },
              dueDate: { type: "string", description: "new_obligation: YYYY-MM-DD" },
              monthly: { type: "boolean", description: "new_obligation: recurs monthly" },
              monthlyBurnUsd: { type: "string", description: "burn_change: new monthly burn in USD" },
              months: { type: "integer", description: "runway_months: required months of runway" },
              venueId: { type: "string", description: "venue_frozen: opportunity ref id without the 'opportunity:' prefix" },
            },
            required: ["type"],
            additionalProperties: false,
          },
        },
      },
      required: ["shocks"],
      additionalProperties: false,
    },
    async run(ctx, input: { shocks: z.infer<typeof shockSchema>[] }) {
      const s = await ctx.state();
      const shocks: ScenarioShock[] = input.shocks.map((x) =>
        x.type === "new_obligation"
          ? { type: "new_obligation", obligation: { id: `scenario-${crypto.randomUUID()}`, title: x.title, category: "other", direction: "outflow", amount: parseDecimal(x.amount), currency: "USD", firstDueDate: x.dueDate, recurrence: x.monthly ? { freq: "monthly", interval: 1 } : { freq: "once" }, certainty: "committed", priority: "normal", status: "active", trackFrom: s.asOf } }
          : x,
      );
      const { base, scenario } = runScenario({ asOf: s.asOf, nowSec: s.nowSec, policy: s.policy, accounts: s.accounts, holdings: s.holdings, positions: s.positions, obligations: s.obligations, settled: s.settled, fx: s.fx, pendingOutflows: s.pendingOutflows, chainName }, shocks);
      const pick = (x: typeof base) => ({ reserveEligibleUsd: ws(x.treasury.reserveEligible), requiredUsd: ws(x.reserve.required), bindingRule: x.reserve.bindingRule, status: x.reserve.status, coverageBps: x.reserve.coverageBps?.toString() ?? null, shortfallUsd: ws(x.reserve.shortfall), deployableUsd: ws(x.reserve.surplus.deployable), runwayCoveredMonths: x.reserve.runwayCoveredMonths });
      return { ref: "scenario", hypothetical: true, note: "Nothing was saved or changed.", shocks: input.shocks, base: pick(base), scenario: pick(scenario) };
    },
  },
  {
    name: "check_allocation",
    description:
      "Check, without creating anything, whether allocating a USD amount from a verified Safe into a venue would pass every policy check right now (reserve after, caps, venue liquidity share, listing, data freshness). Returns each check with pass/fail. To act, a person must create a proposal in the app, get it approved, and Safe owners must sign.",
    input: z.object({ opportunityId: z.string().max(128), amountUsd: decimalString, accountId: z.string().max(64).optional() }),
    jsonSchema: {
      type: "object",
      properties: {
        opportunityId: { type: "string", description: "Venue ref id without the 'opportunity:' prefix" },
        amountUsd: { type: "string", description: "USD amount as a decimal string" },
        accountId: { type: "string", description: "Source account id (optional; defaults to the verified Safe on the venue's network holding the most of its asset)" },
      },
      required: ["opportunityId", "amountUsd"],
      additionalProperties: false,
    },
    async run(ctx, input: { opportunityId: string; amountUsd: string; accountId?: string }) {
      const s = await ctx.state();
      const opp = s.opportunities.find((o) => o.id === input.opportunityId);
      if (!opp) return { error: "Unknown venue id. Call list_opportunities to get valid ids." };
      const candidates = s.holdings.filter((h) => h.asset.chainId === opp.chainId && h.asset.address.toLowerCase() === opp.asset.address.toLowerCase() && (!input.accountId || h.accountId === input.accountId));
      const source = candidates.sort((a, b) => (b.raw > a.raw ? 1 : -1))[0];
      if (!source) return { error: `No tracked account holds ${opp.asset.symbol} on ${chainName(opp.chainId)}.` };
      const amountUsd = parseDecimal(input.amountUsd);
      const action: TreasuryAction = {
        type: "allocate",
        accountId: source.accountId,
        opportunityId: opp.id,
        amountUsd,
        assetAmountRaw: fromWad(amountUsd, opp.asset.decimals, "down"),
      };
      const v = validateAction(action, {
        nowSec: s.nowSec,
        policy: s.policy,
        treasury: s.treasury,
        reserve: s.reserve,
        accounts: s.accounts,
        positions: s.positions,
        opportunities: s.opportunities,
        accountAssetBalanceRaw: source.raw,
        pendingOutflows: s.pendingOutflows,
        actionAsset: { asset: source.asset, price: source.price },
      });
      return {
        ref: `opportunity:${opp.id}`,
        hypothetical: true,
        wouldPass: v.valid,
        checks: v.checks,
        after: { reserveEligibleUsd: ws(v.after.reserveEligible), coverageBps: v.after.coverageBps?.toString() ?? null, deployableUsd: ws(v.after.deployable) },
        nextStep: v.valid
          ? "A finance member can create a proposal from the Recommendations or Opportunities page; it then needs internal approval and Safe owner signatures."
          : "Resolve the failing checks or choose a smaller amount.",
      };
    },
  },
  {
    name: "list_proposals",
    description: "Proposals in progress and recently closed, with internal approval state, Safe signature count and execution status. Distinguishes internal approval, cryptographic signatures and on-chain execution.",
    input: z.object({}),
    jsonSchema: { type: "object", properties: {}, additionalProperties: false },
    async run(ctx) {
      const rows = await ctx.deps.db.select().from(schema.proposals).where(eq(schema.proposals.organizationId, ctx.orgId)).orderBy(desc(schema.proposals.createdAt)).limit(20);
      const ids = rows.map((r) => r.id);
      const sigs = ids.length ? await ctx.deps.db.select({ proposalId: schema.safeSignatures.proposalId }).from(schema.safeSignatures).where(inArray(schema.safeSignatures.proposalId, ids)) : [];
      const execs = ids.length ? await ctx.deps.db.select().from(schema.executions).where(inArray(schema.executions.proposalId, ids)) : [];
      return {
        proposals: rows.map((p) => ({ ref: `proposal:${p.id}`, title: untrusted(p.title), status: p.status, active: (ACTIVE_PROPOSAL_STATUSES as readonly string[]).includes(p.status), amountUsd: p.amountUsd, createdAt: p.createdAt.toISOString(), safeSignatures: sigs.filter((s) => s.proposalId === p.id).length, executions: execs.filter((e) => e.proposalId === p.id).map((e) => ({ txHash: e.txHash, status: e.status })) })),
      };
    },
  },
  {
    name: "list_recent_activity",
    description: "The most recent entries in the organization's audit trail (who did what and when). Use to explain why something changed, for example why the deployable amount fell.",
    input: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
    jsonSchema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 50 } }, additionalProperties: false },
    async run(ctx, input: { limit: number }) {
      const rows = await ctx.deps.db.select().from(schema.auditEvents).where(eq(schema.auditEvents.organizationId, ctx.orgId)).orderBy(desc(schema.auditEvents.id)).limit(input.limit);
      return { events: rows.map((e) => ({ ref: `activity:${e.id.toString()}`, action: e.action, actorType: e.actorType, target: e.targetType ? `${e.targetType}:${e.targetId}` : null, at: e.createdAt.toISOString(), data: e.data ? { untrusted_json: JSON.stringify(e.data).slice(0, 600) } : null })) };
    },
  },
];

export function toolContext(deps: Deps, orgId: string): ToolContext {
  let cached: Promise<OrgState> | null = null;
  return { deps, orgId, state: () => (cached ??= loadOrgState(deps.db, orgId, deps.now())) };
}
