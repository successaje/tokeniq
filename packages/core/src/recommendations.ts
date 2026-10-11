import { validateAction, type ActionValidation, type TreasuryAction, type ValidationContext } from "./actions";
import { applyBps, clampZero, floorTo, formatBps, formatUsd, fromWad, minOf, parseDecimal, wad, type Wad } from "./money";
import { assessSuitability, estimateYield, liquidityLimit, type Opportunity } from "./opportunities";
import type { TreasuryPolicy } from "./policy";
import type { ReserveAssessment } from "./reserve";
import type { AccountRef, Holding, Position, TreasurySnapshot } from "./treasury";
import { exposureByVenue, marketValue } from "./treasury";

export type RecommendationKind = "deploy_surplus" | "restore_reserve" | "reduce_concentration" | "hold";

export interface Evidence {
  label: string;
  value: string;
  /** Internal record this evidence comes from, e.g. "reserve", "opportunity:morpho:8453:0x..". */
  ref: string;
}

export interface Recommendation {
  /** Deterministic fingerprint: the same situation produces the same id, so it is not re-raised. */
  fingerprint: string;
  kind: RecommendationKind;
  title: string;
  summary: string;
  trigger: string;
  objective: string;
  evidence: Evidence[];
  action: TreasuryAction | null;
  validation: ActionValidation | null;
  upside: string;
  downside: string[];
  liquidityImpact: string;
  whatCouldGoWrong: string[];
  alternatives: Array<{ title: string; consequence: string }>;
  /** Plain statement of where the numbers come from and how certain they are. */
  basis: string;
}

export interface RecommendationInput {
  nowSec: number;
  policy: TreasuryPolicy;
  treasury: TreasurySnapshot;
  reserve: ReserveAssessment;
  accounts: AccountRef[];
  holdings: Holding[];
  positions: Position[];
  opportunities: Opportunity[];
}

const STEP = wad(1000);

/**
 * Generate recommendations from the current state. Pure and deterministic:
 * identical input produces identical output. A language model may explain these
 * recommendations but never creates or edits them.
 */
export function generateRecommendations(input: RecommendationInput): Recommendation[] {
  const out: Recommendation[] = [];
  const restore = restoreReserve(input);
  if (restore) out.push(restore);
  out.push(...reduceConcentration(input));
  if (!restore) {
    const deploy = deploySurplus(input);
    if (deploy) out.push(deploy);
  }
  return out;
}

function ctxFor(input: RecommendationInput, accountAssetBalanceRaw: bigint | null): ValidationContext {
  return {
    nowSec: input.nowSec,
    policy: input.policy,
    treasury: input.treasury,
    reserve: input.reserve,
    accounts: input.accounts,
    positions: input.positions,
    opportunities: input.opportunities,
    accountAssetBalanceRaw,
  };
}

function deploySurplus(input: RecommendationInput): Recommendation | null {
  const { policy, reserve, treasury } = input;
  if (policy.autonomy === "observe") return null;
  const minAction = parseDecimal(policy.minActionUsd);
  if (reserve.surplus.deployable < minAction) return null;
  if (reserve.status === "shortfall" || reserve.uncertainty.level === "high") return null;

  // Candidate source accounts: verified Safes holding an allowed asset.
  const sources = input.holdings
    .filter((h) => {
      const acct = input.accounts.find((a) => a.id === h.accountId);
      return acct && acct.verified && acct.kind === "safe" && acct.includeInTreasury && h.asset.assetClass === "stablecoin" && policy.allowedAssets.includes(h.asset.symbol);
    })
    .map((h) => ({ h, value: marketValue(h.raw, h.asset, h.price) ?? 0n }))
    .filter((s) => s.value > 0n);
  if (sources.length === 0) return null;

  const { byVenue } = exposureByVenue(input.positions, input.accounts);
  const ranked = input.opportunities
    .filter((o) => assessSuitability(o, policy, input.nowSec).suitable)
    .sort((a, b) => b.apy.netBps - a.apy.netBps || (b.tvlUsd > a.tvlUsd ? 1 : b.tvlUsd < a.tvlUsd ? -1 : a.id.localeCompare(b.id)));

  for (const opp of ranked) {
    // v1 sizes USD-pegged assets 1:1 (consistent with the conservative reserve valuation).
    if (opp.asset.pegCurrency !== "USD") continue;
    // Funds must already sit on the venue's chain in its asset; TokenIQ does not bridge.
    const source = sources
      .filter((s) => s.h.asset.chainId === opp.chainId && s.h.asset.address.toLowerCase() === opp.asset.address.toLowerCase())
      .sort((a, b) => (b.value > a.value ? 1 : -1))[0];
    if (!source) continue;
    const venueRoom = clampZero(liquidityLimit(opp, policy) - (byVenue.get(opp.id) ?? 0n));
    const venueCapRoom = clampZero(applyBps(treasury.gross, policy.maxPerVenueBps, "down") - (byVenue.get(opp.id) ?? 0n));
    const protocolExposure = exposureByVenue(input.positions, input.accounts).byProtocol.get(opp.protocol) ?? 0n;
    const protocolRoom = clampZero(applyBps(treasury.gross, policy.maxPerProtocolBps, "down") - protocolExposure);
    const raw = minOf(reserve.surplus.deployable, venueRoom, venueCapRoom, protocolRoom, source.value);
    const amountUsd = floorTo(raw, STEP);
    if (amountUsd < minAction) continue;
    // Token amount at the conservative $1 valuation: never send more tokens than the USD figure implies.
    const assetAmountRaw = fromWad(amountUsd, opp.asset.decimals, "down");
    const action: TreasuryAction = { type: "allocate", accountId: source.h.accountId, opportunityId: opp.id, amountUsd, assetAmountRaw };
    const validation = validateAction(action, ctxFor(input, source.h.raw));
    if (!validation.valid) continue;

    const yearly = estimateYield(amountUsd, opp.apy.netBps, 365);
    const monthly = estimateYield(amountUsd, opp.apy.netBps, 30);
    const alternatives = ranked
      .filter((o) => o.id !== opp.id)
      .slice(0, 2)
      .map((o) => ({ title: `${o.name} (${formatBps(o.apy.netBps)} net)`, consequence: `Comparable venue; ${formatUsd(o.availableLiquidityUsd, { compact: true })} available liquidity` }));
    alternatives.push({ title: "Do nothing", consequence: `Keep ${formatUsd(amountUsd)} liquid. No protocol risk, and no yield (about ${formatUsd(monthly)} per 30 days at today's rate).` });

    return {
      fingerprint: `deploy:${opp.id}:${amountUsd.toString()}:${source.h.accountId}`,
      kind: "deploy_surplus",
      title: `Deploy ${formatUsd(amountUsd, { decimals: 0 })} into ${opp.name}`,
      summary: `${formatUsd(reserve.surplus.deployable, { decimals: 0 })} is deployable after the protected reserve. This proposal uses part of it in the highest-yielding venue that passes every policy check.`,
      trigger: reserve.surplus.explanation,
      objective: "Earn yield on capital that is not needed for obligations or the runway reserve, without breaching exposure limits.",
      evidence: [
        { label: "Protected reserve requirement", value: formatUsd(reserve.required), ref: "reserve" },
        { label: "Reserve-eligible capital", value: formatUsd(reserve.available), ref: "treasury" },
        { label: "Deployable surplus", value: formatUsd(reserve.surplus.deployable), ref: "reserve" },
        { label: "Net APY", value: `${formatBps(opp.apy.netBps)} (${opp.apy.measurement.replace(/_/g, " ")})`, ref: `opportunity:${opp.id}` },
        { label: "Venue available liquidity", value: formatUsd(opp.availableLiquidityUsd, { compact: true }), ref: `opportunity:${opp.id}` },
        { label: "Data source", value: `${opp.source.name}, fetched ${new Date(opp.source.fetchedAt * 1000).toISOString()}`, ref: `opportunity:${opp.id}` },
      ],
      action,
      validation,
      upside: `About ${formatUsd(yearly, { decimals: 0 })} per year (${formatUsd(monthly, { decimals: 0 })} per 30 days) if the current ${formatBps(opp.apy.netBps)} net rate held. Rates change continuously; this is an estimate, not a forecast.`,
      downside: [
        "Smart-contract, oracle or curator failure in the venue or its underlying markets could cause loss.",
        "Withdrawals depend on available liquidity; during stress, liquidity can fall to zero temporarily.",
        opp.apy.rewardsBps > 0 ? `${formatBps(opp.apy.rewardsBps)} of the rate comes from incentives that can stop without notice.` : "Yield can fall as borrowing demand changes.",
      ],
      liquidityImpact: `Liquid reserve-eligible capital falls from ${formatUsd(reserve.available - reserve.pendingOutflows)} to ${formatUsd(validation.after.reserveEligible)}. Coverage after: ${validation.after.coverageBps === null ? "n/a" : formatBps(validation.after.coverageBps, 0)} of the requirement.`,
      whatCouldGoWrong: [
        "The Safe nonce changes before signing (another transaction executes first); the proposal must be re-signed.",
        "The venue's liquidity or rate changes before execution; TokenIQ re-validates immediately before signing.",
        "The transaction reverts (for example if the vault caps deposits); no funds move, gas is still spent.",
      ],
      alternatives,
      basis: `Deterministic policy engine. Amount = min(deployable surplus, ${formatBps(policy.maxShareOfVenueLiquidityBps, 1)} of venue liquidity, per-venue and per-protocol caps, source balance), rounded down to $1,000.`,
    };
  }
  return null;
}

function restoreReserve(input: RecommendationInput): Recommendation | null {
  const { reserve } = input;
  if (reserve.status !== "shortfall" || reserve.shortfall === 0n) return null;
  // Prefer withdrawing from the most liquid positions in verified Safes.
  const candidates = input.positions
    .map((p) => {
      const acct = input.accounts.find((a) => a.id === p.accountId);
      const withdrawable = p.withdrawableRaw === null ? p.assetsRaw : p.withdrawableRaw < p.assetsRaw ? p.withdrawableRaw : p.assetsRaw;
      return { p, acct, value: marketValue(withdrawable, p.asset, p.price) ?? 0n };
    })
    .filter((c) => c.acct && c.acct.verified && c.acct.kind === "safe" && c.value > 0n && c.p.asset.assetClass === "stablecoin")
    .sort((a, b) => (b.value > a.value ? 1 : b.value < a.value ? -1 : 0));
  const evidence: Evidence[] = [
    { label: "Protected reserve requirement", value: formatUsd(reserve.required), ref: "reserve" },
    { label: "Reserve-eligible capital", value: formatUsd(reserve.available), ref: "treasury" },
    { label: "Shortfall", value: formatUsd(reserve.shortfall), ref: "reserve" },
  ];
  const top = candidates[0];
  if (!top) {
    return {
      fingerprint: `shortfall:${reserve.shortfall.toString()}`,
      kind: "restore_reserve",
      title: `Reserve is ${formatUsd(reserve.shortfall, { decimals: 0 })} short`,
      summary: "Liquid stablecoins do not cover the protected reserve, and there are no withdrawable positions to draw from.",
      trigger: "Reserve coverage is below 100%.",
      objective: "Make sure upcoming obligations and the runway reserve can be paid.",
      evidence,
      action: null,
      validation: null,
      upside: "Restores the organization's ability to meet its commitments.",
      downside: ["Requires new funding, reduced spending, or a policy change approved by the team."],
      liquidityImpact: "No automated action is available.",
      whatCouldGoWrong: ["Obligations may go unpaid if the shortfall is not addressed before their due dates."],
      alternatives: [
        { title: "Reduce or defer obligations", consequence: "Lowers the requirement; review upcoming obligations." },
        { title: "Adjust the reserve policy", consequence: "Changes the requirement; record the reason for the change." },
      ],
      basis: "Deterministic reserve assessment.",
    };
  }
  const needed = reserve.shortfall;
  const amountUsd = needed < top.value ? needed : top.value;
  // Round the token amount up so the shortfall is fully covered, but never beyond what is withdrawable.
  let assetAmountRaw = fromWad(amountUsd, top.p.asset.decimals, "up");
  const cap = top.p.withdrawableRaw === null ? top.p.assetsRaw : top.p.withdrawableRaw;
  if (assetAmountRaw > cap) assetAmountRaw = cap;
  const action: TreasuryAction = { type: "withdraw", accountId: top.p.accountId, positionId: top.p.id, amountUsd, assetAmountRaw };
  const validation = validateAction(action, ctxFor(input, null));
  return {
    fingerprint: `restore:${top.p.id}:${amountUsd.toString()}`,
    kind: "restore_reserve",
    title: `Withdraw ${formatUsd(amountUsd, { decimals: 0 })} from ${top.p.venueName} to restore the reserve`,
    summary: `The protected reserve is ${formatUsd(reserve.shortfall, { decimals: 0 })} short. Withdrawing from the most liquid position closes ${amountUsd >= needed ? "the whole gap" : "part of the gap"}.`,
    trigger: "Reserve coverage is below 100%.",
    objective: "Restore coverage of upcoming obligations and the runway reserve.",
    evidence: [...evidence, { label: "Withdrawable from position", value: formatUsd(top.value), ref: `position:${top.p.id}` }],
    action,
    validation,
    upside: "Brings liquid capital back toward the requirement.",
    downside: ["Withdrawn funds stop earning yield."],
    liquidityImpact: `Reserve-eligible capital rises to ${formatUsd(validation.after.reserveEligible)}.`,
    whatCouldGoWrong: ["Venue liquidity could fall before execution, causing a revert or partial withdrawal."],
    alternatives: [{ title: "Do nothing", consequence: `Stay ${formatUsd(reserve.shortfall)} below the requirement.` }],
    basis: "Deterministic reserve assessment and on-chain position data.",
  };
}

function reduceConcentration(input: RecommendationInput): Recommendation[] {
  const { policy, treasury } = input;
  const out: Recommendation[] = [];
  const { byProtocol } = exposureByVenue(input.positions, input.accounts);
  const cap = applyBps(treasury.gross, policy.maxPerProtocolBps, "down");
  for (const [protocol, value] of byProtocol) {
    if (value <= cap) continue;
    const excess = value - cap;
    out.push({
      fingerprint: `concentration:${protocol}:${excess.toString()}`,
      kind: "reduce_concentration",
      title: `${protocol} exposure is ${formatUsd(excess, { decimals: 0 })} above the policy limit`,
      summary: `Positions in ${protocol} total ${formatUsd(value, { decimals: 0 })}, above the ${formatBps(policy.maxPerProtocolBps, 0)} per-protocol limit (${formatUsd(cap, { decimals: 0 })}). This can happen when the treasury shrinks after a deposit.`,
      trigger: "Per-protocol exposure exceeds policy.",
      objective: "Keep any single protocol failure within the loss the organization has agreed to tolerate.",
      evidence: [
        { label: `${protocol} exposure`, value: formatUsd(value), ref: "positions" },
        { label: "Policy limit", value: formatUsd(cap), ref: "policy" },
      ],
      action: null,
      validation: null,
      upside: "Reduces concentration risk.",
      downside: ["Withdrawn funds may earn less elsewhere."],
      liquidityImpact: "Withdrawing increases liquid holdings.",
      whatCouldGoWrong: ["Withdrawals depend on available venue liquidity."],
      alternatives: [{ title: "Raise the limit", consequence: "Accept more concentration; record the reason in the policy history." }],
      basis: "Deterministic exposure calculation against the per-protocol limit.",
    });
  }
  return out;
}
