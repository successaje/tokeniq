import { applyBps, parseDecimal, type Bps, type Wad } from "./money.js";
import type { ProtocolId, TreasuryPolicy } from "./policy.js";
import type { AssetRef } from "./treasury.js";

/**
 * A capital-allocation venue as observed from a data source at a point in time.
 * Every number carries its measurement context so the UI never presents an
 * instantaneous rate as a guaranteed return.
 */
export interface Opportunity {
  /** Stable identifier: `${protocol}:${chainId}:${address}`. */
  id: string;
  protocol: ProtocolId;
  kind: "erc4626_vault" | "lending_market";
  chainId: number;
  /** Vault address (ERC-4626) or lending pool address. */
  address: string;
  name: string;
  asset: AssetRef;
  apy: {
    /** Yield paid by borrowers, after vault fees, in bps. */
    nativeBps: number;
    /** Additional incentive rewards, in bps. Rewards can end at any time. */
    rewardsBps: number;
    /** Net = native + rewards, after fees, in bps. */
    netBps: number;
    /** What the APY figure measures. */
    measurement: "instantaneous" | "1d_average" | "7d_average" | "30d_average";
  };
  tvlUsd: Wad;
  /** Assets that could be withdrawn from the venue right now, in USD. */
  availableLiquidityUsd: Wad;
  /** Fee the curator or protocol takes from yield, in bps (null when not applicable). */
  feeBps: number | null;
  curator: { name: string; url?: string | null } | null;
  withdrawal: "instant_subject_to_liquidity" | "queued" | "locked";
  warnings: Array<{ code: string; level: "info" | "warning" | "critical"; message: string }>;
  dependencies: string[];
  audits: Array<{ name: string; url: string }>;
  /** TokenIQ's vetted list: only listed venues can become executable proposals. */
  listed: boolean;
  source: { name: string; url: string; fetchedAt: number };
}

export type CheckStatus = "pass" | "fail" | "warn";

export interface PolicyCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface SuitabilityResult {
  suitable: boolean;
  checks: PolicyCheck[];
}

/** Static checks of a venue against the policy (independent of how much we would deploy). */
export function assessSuitability(opp: Opportunity, policy: TreasuryPolicy, nowSec: number): SuitabilityResult {
  const checks: PolicyCheck[] = [];
  const minTvl = parseDecimal(policy.minVenueTvlUsd);
  const push = (id: string, label: string, ok: boolean, detail: string, warnOnly = false) =>
    checks.push({ id, label, status: ok ? "pass" : warnOnly ? "warn" : "fail", detail });

  push("listed", "On the TokenIQ vetted list", opp.listed, opp.listed ? "Venue has been reviewed for integration" : "Venue is shown for reference only and cannot be executed");
  push("protocol", "Protocol allowed by policy", policy.allowedProtocols.includes(opp.protocol), `${opp.protocol} ${policy.allowedProtocols.includes(opp.protocol) ? "is" : "is not"} in the allowed protocols`);
  push("chain", "Network allowed by policy", policy.allowedChains.includes(opp.chainId), `Chain ${opp.chainId} ${policy.allowedChains.includes(opp.chainId) ? "is" : "is not"} allowed`);
  push("asset", "Asset allowed by policy", policy.allowedAssets.includes(opp.asset.symbol), `${opp.asset.symbol} ${policy.allowedAssets.includes(opp.asset.symbol) ? "is" : "is not"} an allowed asset`);
  push("tvl", "Minimum venue size", opp.tvlUsd >= minTvl, `TVL must be at least the policy minimum`);
  if (opp.feeBps !== null) push("fee", "Fee within policy", opp.feeBps <= policy.maxVenueFeeBps, `Fee ${(opp.feeBps / 100).toFixed(2)}% vs maximum ${(policy.maxVenueFeeBps / 100).toFixed(2)}%`);
  push("withdrawal", "Withdrawals not locked", opp.withdrawal !== "locked", opp.withdrawal === "instant_subject_to_liquidity" ? "Instant, subject to available liquidity" : opp.withdrawal === "queued" ? "Withdrawals are queued" : "Withdrawals are locked", opp.withdrawal === "queued");
  const critical = opp.warnings.filter((w) => w.level === "critical");
  push("warnings", "No critical warnings", critical.length === 0, critical.length ? critical.map((w) => w.message).join("; ") : "No critical warnings from the data source");
  const ageMin = Math.floor((nowSec - opp.source.fetchedAt) / 60);
  push("freshness", "Data is fresh", ageMin <= policy.maxDataAgeMinutes, `Data is ${ageMin} minute(s) old (limit ${policy.maxDataAgeMinutes})`);
  if (opp.apy.rewardsBps > 0) {
    checks.push({ id: "rewards", label: "Yield depends on incentives", status: "warn", detail: `${(opp.apy.rewardsBps / 100).toFixed(2)}% of the APY comes from rewards that can end without notice` });
  }
  return { suitable: !checks.some((c) => c.status === "fail"), checks };
}

/** Largest position the policy allows relative to a venue's current liquidity. */
export function liquidityLimit(opp: Opportunity, policy: TreasuryPolicy): Wad {
  return applyBps(opp.availableLiquidityUsd, policy.maxShareOfVenueLiquidityBps, "down");
}

/** Estimated yield over `days` for `amount` at the venue's current net APY (simple, not compounded). */
export function estimateYield(amount: Wad, netBps: number | Bps, days: number): Wad {
  return (amount * BigInt(netBps) * BigInt(days)) / (10_000n * 365n);
}
