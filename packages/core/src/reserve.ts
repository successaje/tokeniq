import { addDays, compareIso, type IsoDate } from "./dates";
import {
  applyBps,
  clampZero,
  formatBps,
  formatUsd,
  maxOf,
  minOf,
  mulDiv,
  parseDecimal,
  ratioBps,
  sum,
  WAD,
  type Bps,
  type Wad,
} from "./money";
import {
  expandOccurrences,
  itemizedMonthlyBurn,
  type Currency,
  type FxTable,
  type Obligation,
  type ObligationCertainty,
  type Occurrence,
  type SettledOccurrence,
} from "./obligations";
import type { TreasuryPolicy } from "./policy";
import type { TreasurySnapshot } from "./treasury";

export type ReserveRuleId = "floor" | "runway" | "obligations";

export interface ReserveRule {
  id: ReserveRuleId;
  label: string;
  enabled: boolean;
  amount: Wad;
  binding: boolean;
  explanation: string;
}

export type CoverageStatus = "covered" | "thin" | "shortfall" | "no_requirement";

export interface PendingOutflow {
  id: string;
  /** USD value leaving liquid holdings once executed. */
  amount: Wad;
  /**
   * Allocations increase deployed capital. Payments that settle an obligation
   * occurrence in the horizon must NOT be passed here (they are already counted
   * through the obligation rule).
   */
  kind: "allocation" | "payment" | "other";
}

export interface UncertaintyReason {
  level: "medium" | "high";
  message: string;
}

export interface ReserveAssessment {
  asOf: IsoDate;
  horizonEnd: IsoDate;
  required: Wad;
  bindingRule: ReserveRuleId | null;
  rules: ReserveRule[];
  burn: { declared: Wad | null; itemized: Wad; used: Wad; basis: "declared" | "itemized" | "itemized_exceeds_declared" | "none" };
  obligations: {
    /** Unsettled outflows due in the horizon (and overdue ones), in USD, before buffer. */
    total: Wad;
    overdue: Wad;
    byCertainty: Record<ObligationCertainty, Wad>;
    excludedEstimates: Wad;
    occurrences: Occurrence[];
    unconvertible: Occurrence[];
  };
  /** Expected inflows in the horizon. Informational: never used to reduce the requirement. */
  expectedInflows: Wad;
  /** Reserve-eligible capital from the treasury snapshot. */
  available: Wad;
  pendingOutflows: Wad;
  /** The part of pendingOutflows that will increase deployed capital. */
  pendingAllocations: Wad;
  coverageBps: Bps | null;
  status: CoverageStatus;
  shortfall: Wad;
  /** Months of operating spend the available capital covers, as a decimal string (1 dp), or null. */
  runwayCoveredMonths: string | null;
  surplus: {
    /** Reserve-eligible capital left after the requirement and pending outflows. */
    afterReserve: Wad;
    /** Room left under the maximum-deployed limit. */
    capRemaining: Wad;
    deployable: Wad;
    limitedBy: "reserve" | "deployment_cap" | "nothing_available";
    explanation: string;
  };
  currencyMismatches: Array<{ currency: Currency; obligations: Wad; holdings: Wad; message: string }>;
  uncertainty: { level: "low" | "medium" | "high"; reasons: UncertaintyReason[] };
}

export interface AssessReserveInput {
  asOf: IsoDate;
  policy: TreasuryPolicy;
  treasury: TreasurySnapshot;
  obligations: Obligation[];
  settled?: SettledOccurrence[];
  fx?: FxTable;
  pendingOutflows?: PendingOutflow[];
  /** Holdings per peg currency (in that currency's units), used to flag currency mismatches. */
  stableHoldingsByCurrency?: Partial<Record<Currency, Wad>>;
}

const CERTAINTIES: ObligationCertainty[] = ["estimate", "committed", "invoiced"];

/**
 * Compute the protected reserve, coverage and deployable surplus.
 *
 * Requirement = the strictest enabled rule:
 *   floor        a fixed minimum
 *   runway       runwayMonths x monthly burn (max of declared and itemized recurring spend)
 *   obligations  unsettled outflows due within the horizon (plus overdue), x (1 + buffer)
 *
 * Deployable = min(reserve-eligible - requirement - pending outflows,
 *                  gross x maxDeployed - already allocated - pending allocations), floored at zero.
 */
export function assessReserve(input: AssessReserveInput): ReserveAssessment {
  const { asOf, policy, treasury } = input;
  const fx = input.fx ?? {};
  const horizonEnd = addDays(asOf, policy.obligationHorizonDays);
  const reasons: UncertaintyReason[] = [];

  // --- Burn ---------------------------------------------------------------
  const declared = policy.monthlyBurnUsd === null ? null : parseDecimal(policy.monthlyBurnUsd);
  const itemized = itemizedMonthlyBurn(input.obligations, fx);
  if (itemized.missingFx.length) {
    reasons.push({ level: "high", message: `No exchange rate for ${itemized.missingFx.join(", ")}, so some recurring spend is missing from the burn estimate` });
  }
  let burnUsed: Wad;
  let basis: ReserveAssessment["burn"]["basis"];
  if (declared === null && itemized.monthly === 0n) {
    burnUsed = 0n;
    basis = "none";
  } else if (declared === null) {
    burnUsed = itemized.monthly;
    basis = "itemized";
    reasons.push({ level: "medium", message: "Monthly burn has not been declared; it is estimated from recurring obligations only" });
  } else if (itemized.monthly > declared) {
    burnUsed = itemized.monthly;
    basis = "itemized_exceeds_declared";
    reasons.push({ level: "medium", message: `Recurring obligations (${formatUsd(itemized.monthly)}/mo) exceed the declared burn (${formatUsd(declared)}/mo); the higher figure is used` });
  } else {
    burnUsed = declared;
    basis = "declared";
  }

  // --- Obligations --------------------------------------------------------
  const occurrences = expandOccurrences(input.obligations, { asOf, through: horizonEnd, settled: input.settled, fx });
  const outflows = occurrences.filter((o) => o.direction === "outflow");
  const unconvertible = outflows.filter((o) => o.usd === null);
  if (unconvertible.length) {
    reasons.push({ level: "high", message: `${unconvertible.length} upcoming obligation(s) could not be converted to USD` });
  }
  const byCertainty = Object.fromEntries(CERTAINTIES.map((c) => [c, 0n])) as Record<ObligationCertainty, Wad>;
  let counted = 0n;
  let excludedEstimates = 0n;
  let overdue = 0n;
  for (const o of outflows) {
    if (o.usd === null) continue;
    byCertainty[o.certainty] += o.usd;
    if (o.certainty === "estimate" && !policy.includeEstimatedObligations) {
      excludedEstimates += o.usd;
      continue;
    }
    counted += o.usd;
    if (o.overdue) overdue += o.usd;
  }
  const expectedInflows = sum(occurrences.filter((o) => o.direction === "inflow" && o.usd !== null).map((o) => o.usd as Wad));
  if (input.obligations.filter((o) => o.status === "active" && o.direction === "outflow").length === 0) {
    reasons.push({ level: "medium", message: "No obligations are recorded, so the requirement may be understated" });
  }
  if (excludedEstimates > 0n) {
    reasons.push({ level: "medium", message: `${formatUsd(excludedEstimates)} of estimated obligations are excluded by policy` });
  }

  // --- Rules --------------------------------------------------------------
  const floorAmount = parseDecimal(policy.minimumReserveUsd);
  const runwayAmount = burnUsed * BigInt(policy.runwayMonths);
  const obligationsAmount = counted + applyBps(counted, policy.obligationBufferBps, "up");
  const rules: ReserveRule[] = [
    {
      id: "floor",
      label: "Minimum reserve",
      enabled: floorAmount > 0n,
      amount: floorAmount,
      binding: false,
      explanation: floorAmount > 0n ? `A fixed floor of ${formatUsd(floorAmount)}` : "No fixed floor is set",
    },
    {
      id: "runway",
      label: "Operating runway",
      enabled: policy.runwayMonths > 0,
      amount: runwayAmount,
      binding: false,
      explanation:
        policy.runwayMonths === 0
          ? "Runway rule is off"
          : burnUsed === 0n
            ? `${policy.runwayMonths} months of runway, but monthly burn is unknown`
            : `${policy.runwayMonths} months × ${formatUsd(burnUsed)} monthly burn`,
    },
    {
      id: "obligations",
      label: "Upcoming obligations",
      enabled: true,
      amount: obligationsAmount,
      binding: false,
      explanation: `${formatUsd(counted)} due within ${policy.obligationHorizonDays} days${overdue > 0n ? ` (including ${formatUsd(overdue)} overdue)` : ""} + ${formatBps(policy.obligationBufferBps, 0)} buffer`,
    },
  ];
  if (policy.runwayMonths > 0 && burnUsed === 0n) {
    reasons.push({ level: "high", message: "The runway rule is enabled but monthly burn is unknown; add a burn estimate or recurring obligations" });
  }
  const enabled = rules.filter((r) => r.enabled);
  const required = enabled.length ? maxOf(...enabled.map((r) => r.amount)) : 0n;
  let bindingRule: ReserveRuleId | null = null;
  if (required > 0n) {
    const binding = enabled.find((r) => r.amount === required)!;
    binding.binding = true;
    bindingRule = binding.id;
  }

  // --- Coverage -----------------------------------------------------------
  const pending = input.pendingOutflows ?? [];
  const pendingTotal = sum(pending.map((p) => p.amount));
  const pendingAllocations = sum(pending.filter((p) => p.kind === "allocation").map((p) => p.amount));
  const available = treasury.reserveEligible;
  const availableAfterPending = clampZero(available - pendingTotal);
  const coverageBps = ratioBps(availableAfterPending, required);
  let status: CoverageStatus;
  if (required === 0n) status = "no_requirement";
  else if (availableAfterPending < required) status = "shortfall";
  else if (coverageBps !== null && coverageBps < BigInt(policy.thinCoverageBps)) status = "thin";
  else status = "covered";
  const shortfall = clampZero(required - availableAfterPending);

  if (!treasury.complete) {
    const high = treasury.issues.some((i) => i.code === "price_missing" || i.code === "account_never_synced");
    reasons.push({
      level: high ? "high" : "medium",
      message: `Treasury data is incomplete (${treasury.issues.length} issue${treasury.issues.length === 1 ? "" : "s"}); figures may change after the next sync`,
    });
  }

  const runwayCoveredMonths = burnUsed > 0n ? formatTenths(mulDiv(availableAfterPending, 10n, burnUsed, "down")) : null;

  // --- Surplus ------------------------------------------------------------
  const afterReserve = clampZero(available - required - pendingTotal);
  const cap = applyBps(treasury.gross, policy.maxDeployedBps, "down");
  const capRemaining = clampZero(cap - treasury.allocated.total - pendingAllocations);
  const deployable = minOf(afterReserve, capRemaining);
  let limitedBy: ReserveAssessment["surplus"]["limitedBy"];
  let explanation: string;
  if (deployable === 0n && afterReserve === 0n) {
    limitedBy = "nothing_available";
    explanation =
      status === "shortfall"
        ? `Nothing is deployable: reserve-eligible capital is ${formatUsd(shortfall)} short of the requirement`
        : "Nothing is deployable: all reserve-eligible capital is needed for the requirement";
  } else if (capRemaining < afterReserve) {
    limitedBy = "deployment_cap";
    explanation = `Limited by the ${formatBps(policy.maxDeployedBps, 0)} maximum-deployed policy: ${formatUsd(capRemaining)} of room remains`;
  } else {
    limitedBy = "reserve";
    explanation = `${formatUsd(available)} reserve-eligible − ${formatUsd(required)} requirement${pendingTotal > 0n ? ` − ${formatUsd(pendingTotal)} pending` : ""}`;
  }

  // --- Currency mismatches -----------------------------------------------
  const currencyMismatches: ReserveAssessment["currencyMismatches"] = [];
  const holdingsByCurrency = input.stableHoldingsByCurrency ?? {};
  const owedByCurrency = new Map<Currency, Wad>();
  for (const o of outflows) {
    if (o.currency === "USD") continue;
    if (o.certainty === "estimate" && !policy.includeEstimatedObligations) continue;
    owedByCurrency.set(o.currency, (owedByCurrency.get(o.currency) ?? 0n) + o.amount);
  }
  for (const [currency, owed] of owedByCurrency) {
    const held = holdingsByCurrency[currency] ?? 0n;
    if (held < owed) {
      currencyMismatches.push({
        currency,
        obligations: owed,
        holdings: held,
        message: `${currency} obligations in the horizon exceed ${currency} stablecoin holdings; paying them will require a conversion at a future rate`,
      });
    }
  }

  const level = reasons.some((r) => r.level === "high") ? "high" : reasons.length ? "medium" : "low";

  return {
    asOf,
    horizonEnd,
    required,
    bindingRule,
    rules,
    burn: { declared, itemized: itemized.monthly, used: burnUsed, basis },
    obligations: { total: counted, overdue, byCertainty, excludedEstimates, occurrences: outflows, unconvertible },
    expectedInflows,
    available,
    pendingOutflows: pendingTotal,
    pendingAllocations,
    coverageBps,
    status,
    shortfall,
    runwayCoveredMonths,
    surplus: { afterReserve, capRemaining, deployable, limitedBy, explanation },
    currencyMismatches,
    uncertainty: { level, reasons },
  };
}

function formatTenths(tenths: bigint): string {
  const whole = tenths / 10n;
  const frac = tenths % 10n;
  return `${whole}.${frac}`;
}

export interface CashflowPoint {
  date: IsoDate;
  outflow: Wad;
  inflow: Wad;
  /** Balance assuming only outflows (conservative). */
  balance: Wad;
  /** Balance if expected inflows also arrive. */
  balanceWithInflows: Wad;
}

/**
 * Project the balance of `start` forward, bucketed every `stepDays`, applying
 * obligation occurrences on their due dates. Overdue occurrences hit the first bucket.
 */
export function projectCashflow(input: { start: Wad; asOf: IsoDate; days: number; stepDays?: number; occurrences: Occurrence[] }): {
  points: CashflowPoint[];
  lowest: { date: IsoDate; balance: Wad };
  firstNegative: IsoDate | null;
} {
  const step = input.stepDays ?? 7;
  const points: CashflowPoint[] = [];
  let balance = input.start;
  let withInflows = input.start;
  let lowest = { date: input.asOf, balance };
  let firstNegative: IsoDate | null = null;
  const sorted = [...input.occurrences].filter((o) => o.usd !== null).sort((a, b) => compareIso(a.dueDate, b.dueDate));
  let idx = 0;
  points.push({ date: input.asOf, outflow: 0n, inflow: 0n, balance, balanceWithInflows: withInflows });
  for (let d = step; d <= input.days + step - 1; d += step) {
    const bucketEnd = addDays(input.asOf, Math.min(d, input.days));
    let out = 0n;
    let inn = 0n;
    while (idx < sorted.length && compareIso(sorted[idx]!.dueDate, bucketEnd) <= 0) {
      const o = sorted[idx]!;
      if (o.direction === "outflow") out += o.usd!;
      else inn += o.usd!;
      idx++;
    }
    balance -= out;
    withInflows += inn - out;
    points.push({ date: bucketEnd, outflow: out, inflow: inn, balance, balanceWithInflows: withInflows });
    if (balance < lowest.balance) lowest = { date: bucketEnd, balance };
    if (firstNegative === null && balance < 0n) firstNegative = bucketEnd;
    if (d >= input.days) break;
  }
  return { points, lowest, firstNegative };
}
