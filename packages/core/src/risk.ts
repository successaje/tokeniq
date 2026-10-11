import { addDays, compareIso, type IsoDate } from "./dates.js";
import { applyBps, formatBps, formatUsd, mulDiv, pow10, ratioBps, type Wad } from "./money.js";
import type { Opportunity } from "./opportunities.js";
import type { TreasuryPolicy } from "./policy.js";
import type { ReserveAssessment } from "./reserve.js";
import type { AccountRef, Holding, Position, TreasurySnapshot } from "./treasury.js";
import { exposureByVenue, marketValue } from "./treasury.js";

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertKind =
  | "reserve_shortfall"
  | "reserve_thin"
  | "obligation_overdue"
  | "obligation_unfunded"
  | "depeg"
  | "price_stale"
  | "sync_stale"
  | "asset_concentration"
  | "protocol_concentration"
  | "venue_liquidity"
  | "venue_warning"
  | "unexpected_balance_change"
  | "sequencer_down"
  | "provider_degraded";

export interface Alert {
  /** Same condition → same fingerprint, so alerts update instead of duplicating. */
  fingerprint: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  /** The condition that is true right now. */
  condition: string;
  evidence: Array<{ label: string; value: string }>;
  recommendedAction: string;
  ref: string | null;
}

export interface BalanceChange {
  accountId: string;
  accountLabel: string;
  assetSymbol: string;
  chainId: number;
  previousUsd: Wad;
  currentUsd: Wad;
  /** True when a known TokenIQ execution or recorded payment explains the change. */
  explained: boolean;
  observedAt: number;
}

export interface RiskInput {
  asOf: IsoDate;
  nowSec: number;
  policy: TreasuryPolicy;
  treasury: TreasurySnapshot;
  reserve: ReserveAssessment;
  accounts: AccountRef[];
  holdings: Holding[];
  positions: Position[];
  opportunities: Opportunity[];
  balanceChanges?: BalanceChange[];
  /** Chains whose L2 sequencer uptime feed reports down or within the grace period. */
  sequencerDown?: number[];
  /** Data providers currently failing health checks. */
  degradedProviders?: Array<{ name: string; since: number; detail: string }>;
  chainName?: (id: number) => string;
}

export const DEPEG_WARNING_BPS = 50n;
export const DEPEG_CRITICAL_BPS = 200n;
export const ASSET_CONCENTRATION_BPS = 8_000n;
export const UNEXPECTED_CHANGE_BPS = 1_000n;

/** Evaluate every risk rule. Pure; the API persists, de-duplicates and resolves alerts by fingerprint. */
export function evaluateRisks(input: RiskInput): Alert[] {
  const alerts: Alert[] = [];
  const chain = input.chainName ?? ((id: number) => `chain ${id}`);
  const { reserve, treasury, policy } = input;

  if (reserve.status === "shortfall") {
    alerts.push({
      fingerprint: "reserve_shortfall",
      kind: "reserve_shortfall",
      severity: "critical",
      title: "Protected reserve is not covered",
      condition: `Reserve-eligible capital is ${formatUsd(reserve.shortfall)} below the ${formatUsd(reserve.required)} requirement.`,
      evidence: [
        { label: "Requirement", value: formatUsd(reserve.required) },
        { label: "Reserve-eligible", value: formatUsd(reserve.available) },
        { label: "Pending outflows", value: formatUsd(reserve.pendingOutflows) },
      ],
      recommendedAction: "Review the restore-reserve recommendation, defer non-critical obligations, or arrange funding.",
      ref: "reserve",
    });
  } else if (reserve.status === "thin") {
    alerts.push({
      fingerprint: "reserve_thin",
      kind: "reserve_thin",
      severity: "warning",
      title: "Reserve coverage is thin",
      condition: `Coverage is ${reserve.coverageBps === null ? "n/a" : formatBps(reserve.coverageBps, 0)} of the requirement, below the ${formatBps(policy.thinCoverageBps, 0)} comfort level.`,
      evidence: [{ label: "Requirement", value: formatUsd(reserve.required) }, { label: "Reserve-eligible", value: formatUsd(reserve.available) }],
      recommendedAction: "Avoid new allocations until coverage recovers.",
      ref: "reserve",
    });
  }

  // Obligations
  const soon = addDays(input.asOf, 7);
  const overdue = reserve.obligations.occurrences.filter((o) => o.overdue);
  for (const o of overdue) {
    alerts.push({
      fingerprint: `obligation_overdue:${o.obligationId}:${o.dueDate}`,
      kind: "obligation_overdue",
      severity: o.priority === "critical" ? "critical" : "warning",
      title: `${o.title} is overdue`,
      condition: `Due ${o.dueDate} and not marked as paid.`,
      evidence: [{ label: "Amount", value: `${o.currency === "USD" ? formatUsd(o.amount) : `${o.amount / 10n ** 18n} ${o.currency}`}` }],
      recommendedAction: "Pay it, mark it paid with the transaction hash, or skip this occurrence.",
      ref: `obligation:${o.obligationId}`,
    });
  }
  const dueSoon = reserve.obligations.occurrences.filter((o) => !o.overdue && compareIso(o.dueDate, soon) <= 0 && o.usd !== null);
  const dueSoonTotal = dueSoon.reduce((s, o) => s + (o.usd ?? 0n), 0n);
  if (dueSoonTotal > 0n && treasury.liquid.stable < dueSoonTotal) {
    alerts.push({
      fingerprint: `obligation_unfunded:${input.asOf}`,
      kind: "obligation_unfunded",
      severity: "critical",
      title: "Payments due this week exceed liquid stablecoins",
      condition: `${formatUsd(dueSoonTotal)} is due by ${soon}; liquid stablecoins total ${formatUsd(treasury.liquid.stable)}.`,
      evidence: dueSoon.slice(0, 5).map((o) => ({ label: `${o.title} (${o.dueDate})`, value: formatUsd(o.usd!) })),
      recommendedAction: "Withdraw from positions or move funds to the paying account before the due dates.",
      ref: "obligations",
    });
  }

  // Prices: depeg and staleness
  const seenAssets = new Set<string>();
  for (const h of [...input.holdings, ...input.positions.map((p) => ({ asset: p.asset, price: p.price, raw: p.assetsRaw, accountId: p.accountId }))]) {
    const key = `${h.asset.chainId}:${h.asset.address.toLowerCase()}`;
    if (seenAssets.has(key) || !h.price) continue;
    seenAssets.add(key);
    if (h.price.stale) {
      alerts.push({
        fingerprint: `price_stale:${key}`,
        kind: "price_stale",
        severity: "warning",
        title: `${h.asset.symbol} price on ${chain(h.asset.chainId)} is stale`,
        condition: `Last update ${new Date(h.price.updatedAt * 1000).toISOString()} from ${h.price.source}.`,
        evidence: [{ label: "Source", value: h.price.source }],
        recommendedAction: "Treat valuations of this asset with caution. Proposals are blocked until prices are fresh.",
        ref: `asset:${key}`,
      });
    }
    if (h.asset.assetClass === "stablecoin" && h.asset.pegCurrency === "USD") {
      const one = pow10(h.price.decimals);
      const diff = h.price.price > one ? h.price.price - one : one - h.price.price;
      const devBps = mulDiv(diff, 10_000n, one, "down");
      if (devBps >= DEPEG_WARNING_BPS) {
        alerts.push({
          fingerprint: `depeg:${key}`,
          kind: "depeg",
          severity: devBps >= DEPEG_CRITICAL_BPS ? "critical" : "warning",
          title: `${h.asset.symbol} is trading ${formatBps(devBps)} from its peg`,
          condition: `Oracle price is ${formatPrice(h.price.price, h.price.decimals)} USD.`,
          evidence: [
            { label: "Oracle", value: h.price.source },
            { label: "Updated", value: new Date(h.price.updatedAt * 1000).toISOString() },
          ],
          recommendedAction: "Check issuer communications and on-chain liquidity before moving funds. Reserve values never count a stablecoin above $1.",
          ref: `asset:${key}`,
        });
      }
    }
  }

  // Sync freshness
  for (const a of input.accounts) {
    if (!a.includeInTreasury) continue;
    if (a.lastSyncedAt !== null && input.nowSec - a.lastSyncedAt > policy.maxDataAgeMinutes * 60 * 3) {
      alerts.push({
        fingerprint: `sync_stale:${a.id}`,
        kind: "sync_stale",
        severity: "warning",
        title: `${a.label} has not synced recently`,
        condition: `Last successful sync ${Math.floor((input.nowSec - a.lastSyncedAt) / 60)} minutes ago.`,
        evidence: [{ label: "Network", value: chain(a.chainId) }],
        recommendedAction: "Check provider status; balances shown for this account may be out of date.",
        ref: `account:${a.id}`,
      });
    }
  }

  // Concentration
  for (const b of treasury.byAsset) {
    if (b.shareBps >= ASSET_CONCENTRATION_BPS && treasury.byAsset.length > 0 && treasury.gross > 0n) {
      alerts.push({
        fingerprint: `asset_concentration:${b.key}`,
        kind: "asset_concentration",
        severity: "info",
        title: `${formatBps(b.shareBps, 0)} of the treasury is in ${b.label}`,
        condition: `A single asset holds more than ${formatBps(ASSET_CONCENTRATION_BPS, 0)} of the treasury.`,
        evidence: [{ label: b.label, value: formatUsd(b.value) }],
        recommendedAction: "Consider whether issuer risk is acceptable; run a depeg scenario on the Reserves page.",
        ref: `asset:${b.key}`,
      });
    }
  }
  const { byProtocol, byVenue } = exposureByVenue(input.positions, input.accounts);
  const protocolCap = applyBps(treasury.gross, policy.maxPerProtocolBps, "down");
  for (const [protocol, value] of byProtocol) {
    if (value > protocolCap) {
      alerts.push({
        fingerprint: `protocol_concentration:${protocol}`,
        kind: "protocol_concentration",
        severity: "warning",
        title: `${protocol} exposure exceeds policy`,
        condition: `${formatUsd(value)} is above the ${formatUsd(protocolCap)} per-protocol limit.`,
        evidence: [{ label: "Share of treasury", value: formatBps(ratioBps(value, treasury.gross) ?? 0n, 1) }],
        recommendedAction: "Review the concentration recommendation.",
        ref: `protocol:${protocol}`,
      });
    }
  }

  // Venue liquidity and warnings for venues we hold
  for (const [venueId, value] of byVenue) {
    const opp = input.opportunities.find((o) => o.id === venueId);
    if (!opp) continue;
    if (value > 0n && opp.availableLiquidityUsd < value * 2n) {
      alerts.push({
        fingerprint: `venue_liquidity:${venueId}`,
        kind: "venue_liquidity",
        severity: opp.availableLiquidityUsd < value ? "critical" : "warning",
        title: `Withdrawal liquidity in ${opp.name} is low relative to our position`,
        condition: `Available liquidity ${formatUsd(opp.availableLiquidityUsd)} vs our position ${formatUsd(value)}.`,
        evidence: [{ label: "Measured", value: new Date(opp.source.fetchedAt * 1000).toISOString() }],
        recommendedAction: "A full withdrawal may not be possible right now. Monitor or withdraw partially.",
        ref: `opportunity:${venueId}`,
      });
    }
    for (const w of opp.warnings.filter((w) => w.level !== "info")) {
      alerts.push({
        fingerprint: `venue_warning:${venueId}:${w.code}`,
        kind: "venue_warning",
        severity: w.level === "critical" ? "critical" : "warning",
        title: `${opp.name}: ${w.message}`,
        condition: `Reported by ${opp.source.name}.`,
        evidence: [{ label: "Our position", value: formatUsd(value) }],
        recommendedAction: "Review the venue before adding funds; consider withdrawing if the warning concerns solvency.",
        ref: `opportunity:${venueId}`,
      });
    }
  }

  // Unexpected balance changes
  for (const c of input.balanceChanges ?? []) {
    if (c.explained || c.previousUsd === 0n) continue;
    const delta = c.currentUsd - c.previousUsd;
    const magnitude = delta < 0n ? -delta : delta;
    const changeBps = mulDiv(magnitude, 10_000n, c.previousUsd, "down");
    if (delta < 0n && changeBps >= UNEXPECTED_CHANGE_BPS) {
      alerts.push({
        fingerprint: `unexpected_balance_change:${c.accountId}:${c.chainId}:${c.assetSymbol}:${c.observedAt}`,
        kind: "unexpected_balance_change",
        severity: changeBps >= 5_000n ? "critical" : "warning",
        title: `${c.assetSymbol} in ${c.accountLabel} fell ${formatBps(changeBps, 0)} without a matching record`,
        condition: `${formatUsd(c.previousUsd)} → ${formatUsd(c.currentUsd)} on ${chain(c.chainId)}.`,
        evidence: [{ label: "Observed", value: new Date(c.observedAt * 1000).toISOString() }],
        recommendedAction: "Check the account's transaction history. If this was an expected payment, record it so it reconciles.",
        ref: `account:${c.accountId}`,
      });
    }
  }

  for (const chainId of input.sequencerDown ?? []) {
    alerts.push({
      fingerprint: `sequencer_down:${chainId}`,
      kind: "sequencer_down",
      severity: "critical",
      title: `${chain(chainId)} sequencer is down or recovering`,
      condition: "The Chainlink sequencer uptime feed reports an outage or grace period; prices on this network may be unreliable.",
      evidence: [],
      recommendedAction: "Do not sign transactions on this network until the sequencer has recovered.",
      ref: `chain:${chainId}`,
    });
  }

  for (const p of input.degradedProviders ?? []) {
    alerts.push({
      fingerprint: `provider_degraded:${p.name}`,
      kind: "provider_degraded",
      severity: "warning",
      title: `${p.name} is degraded`,
      condition: p.detail,
      evidence: [{ label: "Since", value: new Date(p.since * 1000).toISOString() }],
      recommendedAction: "Figures depending on this provider may be stale. See the status page.",
      ref: `provider:${p.name}`,
    });
  }

  return alerts;
}

function formatPrice(price: bigint, decimals: number): string {
  const s = price.toString().padStart(decimals + 1, "0");
  return `${s.slice(0, -decimals)}.${s.slice(-decimals).slice(0, 4)}`;
}

/** Positions' current market value per account (helper for balance-change detection). */
export function valueByAccountAsset(holdings: Holding[]): Map<string, Wad> {
  const out = new Map<string, Wad>();
  for (const h of holdings) {
    const v = marketValue(h.raw, h.asset, h.price);
    if (v === null) continue;
    const key = `${h.accountId}|${h.asset.chainId}|${h.asset.symbol}`;
    out.set(key, (out.get(key) ?? 0n) + v);
  }
  return out;
}
