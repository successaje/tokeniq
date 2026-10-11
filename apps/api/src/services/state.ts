import { chainName, getChain, getToken, type TokenInfo } from "@tokeniq/chain";
import {
  assessReserve,
  computeTreasury,
  parseDecimal,
  toIsoDate,
  WAD,
  type AccountRef,
  type ApprovalPolicy,
  type AssetRef,
  type Currency,
  type FxTable,
  type Holding,
  type IsoDate,
  type Obligation,
  type Opportunity,
  type PendingOutflow,
  type Position,
  type PriceQuote,
  type Recurrence,
  type ReserveAssessment,
  type SettledOccurrence,
  type TreasuryPolicy,
  type TreasurySnapshot,
  type Wad,
} from "@tokeniq/core";
import { and, eq, inArray, isNull, schema, sql, type Database } from "@tokeniq/db";
import { opportunityFromJson, type OpportunityJson } from "./dto.js";
import { getPolicies } from "./policies.js";

/** Proposal statuses whose funds are committed but not yet moved. */
export const ACTIVE_PROPOSAL_STATUSES = ["pending_approval", "approved", "awaiting_signatures", "ready_to_execute", "submitted"] as const;

export interface OrgState {
  orgId: string;
  isSample: boolean;
  nowSec: number;
  asOf: IsoDate;
  policy: TreasuryPolicy;
  policyVersion: number;
  approvalPolicy: ApprovalPolicy;
  approvalPolicyVersion: number;
  accountRows: Array<typeof schema.treasuryAccounts.$inferSelect>;
  accounts: AccountRef[];
  holdings: Holding[];
  positions: Position[];
  obligationRows: Array<typeof schema.obligations.$inferSelect>;
  obligations: Obligation[];
  settled: SettledOccurrence[];
  fx: FxTable;
  pendingOutflows: PendingOutflow[];
  opportunities: Opportunity[];
  treasury: TreasurySnapshot;
  reserve: ReserveAssessment;
  /** Newest balance observation across accounts (unix seconds), or null. */
  lastObservedAt: number | null;
}

export function tokenToAsset(t: TokenInfo): AssetRef {
  return { symbol: t.symbol, name: t.name, chainId: t.chainId, address: t.address, decimals: t.decimals, assetClass: t.assetClass, pegCurrency: t.pegCurrency };
}

export function staleAfter(heartbeatSec: number): number {
  return heartbeatSec + Math.max(Math.floor(heartbeatSec / 10), 1800);
}

export function obligationFromRow(r: typeof schema.obligations.$inferSelect): Obligation {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    direction: r.direction as Obligation["direction"],
    amount: parseDecimal(r.amount),
    currency: r.currency as Currency,
    firstDueDate: r.firstDueDate,
    recurrence: r.recurrence as Recurrence,
    certainty: r.certainty as Obligation["certainty"],
    priority: r.priority as Obligation["priority"],
    status: r.status as Obligation["status"],
    trackFrom: r.trackFrom,
  };
}

/** `nowSec` lets simulated sample accounts always read as current: they are never synced from a chain. */
export function accountFromRow(r: typeof schema.treasuryAccounts.$inferSelect, nowSec?: number): AccountRef {
  return {
    id: r.id,
    label: r.label,
    chainId: r.chainId,
    address: r.address,
    kind: r.kind as AccountRef["kind"],
    verified: r.verifiedAt !== null,
    includeInTreasury: r.includeInTreasury && r.archivedAt === null,
    lastSyncedAt: r.verificationMethod === "sample" && nowSec !== undefined ? nowSec : r.lastSyncedAt ? Math.floor(r.lastSyncedAt.getTime() / 1000) : null,
  };
}

/**
 * Load everything the engine needs for one organization and run the
 * treasury and reserve calculations. Pure reads; safe to call per request.
 */
export async function loadOrgState(db: Database, orgId: string, now: Date, opts: { excludeProposalId?: string } = {}): Promise<OrgState> {
  const nowSec = Math.floor(now.getTime() / 1000);
  const asOf = toIsoDate(now);

  const [policies, profile, accountRows, obligationRows, paymentRows, proposalRows, oppRows] = await Promise.all([
    getPolicies(db, orgId),
    db.select().from(schema.orgProfiles).where(eq(schema.orgProfiles.organizationId, orgId)).limit(1),
    db
      .select()
      .from(schema.treasuryAccounts)
      .where(and(eq(schema.treasuryAccounts.organizationId, orgId), isNull(schema.treasuryAccounts.archivedAt))),
    db.select().from(schema.obligations).where(eq(schema.obligations.organizationId, orgId)),
    db
      .select({ obligationId: schema.payments.obligationId, dueDate: schema.payments.dueDate, status: schema.payments.status })
      .from(schema.payments)
      .where(eq(schema.payments.organizationId, orgId)),
    db
      .select({ id: schema.proposals.id, kind: schema.proposals.kind, status: schema.proposals.status, amountUsd: schema.proposals.amountUsd, action: schema.proposals.action, expiresAt: schema.proposals.expiresAt })
      .from(schema.proposals)
      .where(and(eq(schema.proposals.organizationId, orgId), inArray(schema.proposals.status, [...ACTIVE_PROPOSAL_STATUSES]))),
    db.select().from(schema.opportunities),
  ]);
  const isSample = profile[0]?.isSample ?? false;

  const accountIds = accountRows.map((a) => a.id);
  const [balanceRows, positionRows] = accountIds.length
    ? await Promise.all([
        db
          .selectDistinctOn([schema.balanceSnapshots.accountId, schema.balanceSnapshots.assetAddress])
          .from(schema.balanceSnapshots)
          .where(inArray(schema.balanceSnapshots.accountId, accountIds))
          .orderBy(schema.balanceSnapshots.accountId, schema.balanceSnapshots.assetAddress, sql`${schema.balanceSnapshots.blockNumber} desc`),
        db
          .selectDistinctOn([schema.positionSnapshots.accountId, schema.positionSnapshots.venueId])
          .from(schema.positionSnapshots)
          .where(inArray(schema.positionSnapshots.accountId, accountIds))
          .orderBy(schema.positionSnapshots.accountId, schema.positionSnapshots.venueId, sql`${schema.positionSnapshots.blockNumber} desc`),
      ])
    : [[], []];

  // Latest oracle observation per feed used by these holdings.
  const feedKeys = new Set<string>();
  for (const r of [...balanceRows, ...positionRows]) {
    const t = getToken(r.chainId, r.assetAddress);
    if (t?.feed) feedKeys.add(`${r.chainId}:${t.feed.address.toLowerCase()}`);
  }
  const eurUsdFeeds = ["1:0xb49f677943bc038e9857d61e7d053caa2c1734c1", "8453:0xc91d87e81fab8f93699ecf7ee9b44d11e1d53f0f"];
  const priceRows = await db
    .selectDistinctOn([schema.priceObservations.chainId, schema.priceObservations.feed])
    .from(schema.priceObservations)
    .where(sql`lower(${schema.priceObservations.chainId}::text || ':' || ${schema.priceObservations.feed}) in (${sql.join([...feedKeys, ...eurUsdFeeds].map((k) => sql`${k}`), sql`, `)})`)
    .orderBy(schema.priceObservations.chainId, schema.priceObservations.feed, sql`${schema.priceObservations.observedAt} desc`);
  const prices = new Map(priceRows.map((p) => [`${p.chainId}:${p.feed.toLowerCase()}`, p]));

  const quoteFor = (t: TokenInfo): PriceQuote | null => {
    const chain = getChain(t.chainId);
    if (isSample) {
      // Sample workspaces never show real prices as if they belonged to the user.
      return t.assetClass === "stablecoin" ? { price: 100_000_000n, decimals: 8, updatedAt: nowSec, source: "Sample workspace (simulated $1.00)", stale: false } : null;
    }
    if (chain?.testnet && t.assetClass === "stablecoin") {
      return { price: 100_000_000n, decimals: 8, updatedAt: nowSec, source: "Testnet token valued at peg (no market)", stale: false };
    }
    if (!t.feed) return null;
    const obs = prices.get(`${t.chainId}:${t.feed.address.toLowerCase()}`);
    if (!obs) return null;
    const updatedAt = Math.floor(obs.updatedAt.getTime() / 1000);
    return { price: BigInt(obs.answer), decimals: obs.decimals, updatedAt, source: `Chainlink ${t.feed.pair} on ${chainName(t.chainId)}`, stale: nowSec - updatedAt > staleAfter(t.feed.heartbeatSec) };
  };

  const holdings: Holding[] = [];
  let lastObservedAt: number | null = null;
  for (const r of balanceRows) {
    const t = getToken(r.chainId, r.assetAddress);
    if (!t) continue; // not on the allowlist: never shown or counted
    holdings.push({ accountId: r.accountId, asset: tokenToAsset(t), raw: BigInt(r.rawBalance), price: quoteFor(t) });
    const obs = Math.floor(r.observedAt.getTime() / 1000);
    if (lastObservedAt === null || obs > lastObservedAt) lastObservedAt = obs;
  }
  const positions: Position[] = [];
  for (const r of positionRows) {
    const t = getToken(r.chainId, r.assetAddress);
    if (!t) continue;
    positions.push({
      id: `${r.accountId}:${r.venueId}`,
      accountId: r.accountId,
      protocol: r.protocol,
      venueId: r.venueId,
      venueName: r.venueName,
      asset: tokenToAsset(t),
      assetsRaw: BigInt(r.assetsRaw),
      withdrawableRaw: r.withdrawableRaw === null ? null : BigInt(r.withdrawableRaw),
      price: quoteFor(t),
    });
  }

  const fx: FxTable = {};
  for (const k of eurUsdFeeds) {
    const obs = prices.get(k);
    if (obs) {
      fx.EUR = { usdPerUnit: (BigInt(obs.answer) * WAD) / 10n ** BigInt(obs.decimals), asOf: obs.updatedAt.toISOString(), source: `Chainlink EUR / USD (${chainName(obs.chainId)})` };
      break;
    }
  }
  if (isSample && !fx.EUR) fx.EUR = { usdPerUnit: parseDecimal("1.08"), asOf: now.toISOString(), source: "Sample workspace (simulated rate)" };

  const accounts = accountRows.map((r) => accountFromRow(r, nowSec));
  const obligations = obligationRows.map(obligationFromRow);
  const settled: SettledOccurrence[] = paymentRows.map((p) => ({ obligationId: p.obligationId, dueDate: p.dueDate }));
  const opportunities = oppRows.map((r) => opportunityFromJson(r.data as OpportunityJson));
  // Allocations in flight reduce what can still be deployed and count toward venue and protocol limits.
  // A proposal being re-validated is left out so it is not counted against itself, and proposals still
  // awaiting approval past their deadline no longer hold capital, whether or not a read has expired them yet.
  const pendingOutflows: PendingOutflow[] = proposalRows
    .filter((p) => p.kind === "allocate" && p.id !== opts.excludeProposalId && !(p.status === "pending_approval" && p.expiresAt <= now))
    .map((p) => {
      const venueId = (p.action as { opportunityId?: string }).opportunityId;
      const protocol = venueId ? opportunities.find((o) => o.id === venueId)?.protocol : undefined;
      return { id: p.id, amount: parseDecimal(p.amountUsd), kind: "allocation" as const, ...(venueId ? { venueId } : {}), ...(protocol ? { protocol } : {}) };
    });

  const treasury = computeTreasury({ asOf: nowSec, accounts, holdings, positions, policy: policies.treasury, chainName });
  const stableHoldingsByCurrency: Partial<Record<Currency, Wad>> = {};
  for (const h of holdings) {
    if (h.asset.assetClass !== "stablecoin" || !h.asset.pegCurrency) continue;
    const units = (h.raw * WAD) / 10n ** BigInt(h.asset.decimals);
    stableHoldingsByCurrency[h.asset.pegCurrency] = (stableHoldingsByCurrency[h.asset.pegCurrency] ?? 0n) + units;
  }
  const reserve = assessReserve({ asOf, policy: policies.treasury, treasury, obligations, settled, fx, pendingOutflows, stableHoldingsByCurrency });

  if (isSample) lastObservedAt = nowSec;
  return {
    orgId,
    isSample,
    nowSec,
    asOf,
    policy: policies.treasury,
    policyVersion: policies.treasuryVersion,
    approvalPolicy: policies.approval,
    approvalPolicyVersion: policies.approvalVersion,
    accountRows,
    accounts,
    holdings,
    positions,
    obligationRows,
    obligations,
    settled,
    fx,
    pendingOutflows,
    opportunities,
    treasury,
    reserve,
    lastObservedAt,
  };
}
