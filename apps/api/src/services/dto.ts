import {
  parseDecimal,
  wadToString,
  type ActionValidation,
  type Alert,
  type Opportunity,
  type Recommendation,
  type ReserveAssessment,
  type TreasuryAction,
  type TreasurySnapshot,
  type CashflowPoint,
} from "@tokeniq/core";

/**
 * Explicit mappers between engine types (bigint wads) and wire/storage JSON
 * (decimal strings). Every wad goes through wadToString; raw token amounts and
 * bps are integer strings. Nothing is converted through JS numbers.
 */

const ws = wadToString;
const bs = (v: bigint) => v.toString();
const bsn = (v: bigint | null) => (v === null ? null : v.toString());

export function treasuryDto(t: TreasurySnapshot) {
  const bd = (b: TreasurySnapshot["byAsset"]) => b.map((x) => ({ key: x.key, label: x.label, value: ws(x.value), shareBps: bs(x.shareBps) }));
  return {
    asOf: new Date(t.asOf * 1000).toISOString(),
    gross: ws(t.gross),
    liquid: { total: ws(t.liquid.total), stable: ws(t.liquid.stable), other: ws(t.liquid.other) },
    allocated: { total: ws(t.allocated.total), withdrawableNow: ws(t.allocated.withdrawableNow), unknownWithdrawable: ws(t.allocated.unknownWithdrawable) },
    reserveEligible: ws(t.reserveEligible),
    unverifiedValue: ws(t.unverifiedValue),
    byAsset: bd(t.byAsset),
    byChain: bd(t.byChain),
    byAccount: bd(t.byAccount),
    byProtocol: bd(t.byProtocol),
    issues: t.issues,
    complete: t.complete,
  };
}

export function reserveDto(r: ReserveAssessment) {
  return {
    asOf: r.asOf,
    horizonEnd: r.horizonEnd,
    required: ws(r.required),
    bindingRule: r.bindingRule,
    rules: r.rules.map((x) => ({ ...x, amount: ws(x.amount) })),
    burn: { declared: r.burn.declared === null ? null : ws(r.burn.declared), itemized: ws(r.burn.itemized), used: ws(r.burn.used), basis: r.burn.basis },
    obligations: {
      total: ws(r.obligations.total),
      overdue: ws(r.obligations.overdue),
      byCertainty: Object.fromEntries(Object.entries(r.obligations.byCertainty).map(([k, v]) => [k, ws(v)])),
      excludedEstimates: ws(r.obligations.excludedEstimates),
      occurrences: r.obligations.occurrences.map(occurrenceDto),
      unconvertible: r.obligations.unconvertible.length,
    },
    expectedInflows: ws(r.expectedInflows),
    available: ws(r.available),
    pendingOutflows: ws(r.pendingOutflows),
    pendingAllocations: ws(r.pendingAllocations),
    coverageBps: bsn(r.coverageBps),
    status: r.status,
    shortfall: ws(r.shortfall),
    runwayCoveredMonths: r.runwayCoveredMonths,
    surplus: { afterReserve: ws(r.surplus.afterReserve), capRemaining: ws(r.surplus.capRemaining), deployable: ws(r.surplus.deployable), limitedBy: r.surplus.limitedBy, explanation: r.surplus.explanation },
    currencyMismatches: r.currencyMismatches.map((m) => ({ ...m, obligations: ws(m.obligations), holdings: ws(m.holdings) })),
    uncertainty: r.uncertainty,
  };
}

export function occurrenceDto(o: ReserveAssessment["obligations"]["occurrences"][number]) {
  return { ...o, amount: ws(o.amount), usd: o.usd === null ? null : ws(o.usd) };
}

export function cashflowDto(points: CashflowPoint[]) {
  return points.map((p) => ({ date: p.date, outflow: ws(p.outflow), inflow: ws(p.inflow), balance: ws(p.balance), balanceWithInflows: ws(p.balanceWithInflows) }));
}

// --- Opportunities (stored as JSON in the opportunities table) -------------

export type OpportunityJson = Omit<Opportunity, "tvlUsd" | "availableLiquidityUsd"> & { tvlUsd: string; availableLiquidityUsd: string };

export function opportunityToJson(o: Opportunity): OpportunityJson {
  return { ...o, tvlUsd: ws(o.tvlUsd), availableLiquidityUsd: ws(o.availableLiquidityUsd) };
}

export function opportunityFromJson(j: OpportunityJson): Opportunity {
  return { ...j, tvlUsd: parseDecimal(j.tvlUsd), availableLiquidityUsd: parseDecimal(j.availableLiquidityUsd) };
}

// --- Actions ---------------------------------------------------------------

export type ActionJson =
  | { type: "allocate"; accountId: string; opportunityId: string; amountUsd: string; assetAmountRaw: string }
  | { type: "withdraw"; accountId: string; positionId: string; amountUsd: string; assetAmountRaw: string }
  | { type: "payment"; accountId: string; obligationId: string; dueDate: string; amountUsd: string; assetAmountRaw: string; assetSymbol: string; recipient: string };

export function actionToJson(a: TreasuryAction): ActionJson {
  return { ...a, amountUsd: ws(a.amountUsd), assetAmountRaw: bs(a.assetAmountRaw) } as ActionJson;
}

export function actionFromJson(j: ActionJson): TreasuryAction {
  return { ...j, amountUsd: parseDecimal(j.amountUsd), assetAmountRaw: BigInt(j.assetAmountRaw) } as TreasuryAction;
}

export function validationDto(v: ActionValidation) {
  return {
    valid: v.valid,
    checks: v.checks,
    after: {
      reserveEligible: ws(v.after.reserveEligible),
      coverageBps: bsn(v.after.coverageBps),
      deployable: ws(v.after.deployable),
      deployedShareBps: bs(v.after.deployedShareBps),
      protocolShareBps: bsn(v.after.protocolShareBps),
      venueShareBps: bsn(v.after.venueShareBps),
    },
  };
}

export type ValidationJson = ReturnType<typeof validationDto>;

export function recommendationDto(r: Recommendation) {
  return {
    ...r,
    action: r.action ? actionToJson(r.action) : null,
    validation: r.validation ? validationDto(r.validation) : null,
  };
}

export type RecommendationJson = ReturnType<typeof recommendationDto>;

export function alertDto(a: Alert) {
  return a;
}
