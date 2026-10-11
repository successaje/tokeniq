/**
 * The illustrative treasury used on the public website.
 *
 * Every figure the marketing pages show is computed by the same deterministic
 * engine the product uses (@tokeniq/core): computeTreasury → assessReserve via
 * runScenario. Nothing here is customer data, and nothing is a live market rate.
 * The date is fixed so server and browser renders always agree.
 */
import {
  addDays,
  diffDays,
  projectCashflow,
  runScenario,
  wad,
  wadToString,
  type AccountRef,
  type Holding,
  type Obligation,
  type ObligationCertainty,
  type ReserveAssessment,
  type ReserveRuleId,
  type ScenarioShock,
  type ScenarioState,
  type TreasuryPolicy,
} from "@tokeniq/core";
import { bucketsFromReserve, type Bucket } from "./buckets";

export const MODEL_AS_OF = "2026-10-01";
const NOW_SEC = Date.parse(`${MODEL_AS_OF}T12:00:00Z`) / 1000;

export const MODEL_LIMITS = { runwayMin: 3, runwayMax: 12 } as const;
export const HORIZONS = [30, 60, 90] as const;
export type Horizon = (typeof HORIZONS)[number];

export type ModelEventId = "audit" | "contractors" | "depeg";

export interface ModelInputs {
  runwayMonths: number;
  horizonDays: Horizon;
  events: Record<ModelEventId, boolean>;
}

export const DEFAULT_INPUTS: ModelInputs = {
  runwayMonths: 6,
  horizonDays: 90,
  events: { audit: false, contractors: false, depeg: false },
};

export const MODEL_EVENTS: Array<{ id: ModelEventId; label: string; detail: string }> = [
  { id: "audit", label: "$60k audit invoice due in 3 weeks", detail: "An invoiced, one-time payment" },
  { id: "contractors", label: "Hire 2 contractors (+$24k/mo)", detail: "A committed, recurring cost" },
  { id: "depeg", label: "USDC trades at $0.97", detail: "A stablecoin depeg" },
];

/** Plain facts about the illustrative treasury, for copy. */
export const MODEL_FACTS = {
  totalUsd: "1250000",
  declaredBurnUsd: "80000",
  floorUsd: "200000",
  bufferPct: "10%",
  maxDeployedPct: "80%",
  accounts: [
    { label: "Operations Safe", network: "Base", usdc: "900000" },
    { label: "Payroll Safe", network: "Ethereum", usdc: "350000" },
  ],
} as const;

const USDC_BASE = { symbol: "USDC", name: "USD Coin", chainId: 8453, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, assetClass: "stablecoin" as const, pegCurrency: "USD" as const };
const USDC_ETH = { ...USDC_BASE, chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" };
const PRICE = { price: 100_000_000n, decimals: 8, updatedAt: NOW_SEC - 300, source: "Chainlink USDC / USD", stale: false };

const ACCOUNTS: AccountRef[] = [
  { id: "ops", label: "Operations Safe", chainId: 8453, address: "0x0000000000000000000000000000000000000001", kind: "safe", verified: true, includeInTreasury: true, lastSyncedAt: NOW_SEC - 60 },
  { id: "payroll", label: "Payroll Safe", chainId: 1, address: "0x0000000000000000000000000000000000000002", kind: "safe", verified: true, includeInTreasury: true, lastSyncedAt: NOW_SEC - 60 },
];

const HOLDINGS: Holding[] = [
  { accountId: "ops", asset: USDC_BASE, raw: 900_000_000_000n, price: PRICE },
  { accountId: "payroll", asset: USDC_ETH, raw: 350_000_000_000n, price: PRICE },
];

const POLICY: TreasuryPolicy = {
  monthlyBurnUsd: "80000",
  runwayMonths: 6,
  minimumReserveUsd: "200000",
  obligationHorizonDays: 90,
  obligationBufferBps: 1_000,
  includeEstimatedObligations: true,
  thinCoverageBps: 11_000,
  haircutsBps: {},
  includeUnverifiedInReserve: false,
  reserveAssets: [],
  maxDataAgeMinutes: 60,
  maxDeployedBps: 8_000,
  maxPerProtocolBps: 2_500,
  maxPerVenueBps: 2_000,
  maxShareOfVenueLiquidityBps: 500,
  minVenueTvlUsd: "25000000",
  maxVenueFeeBps: 2_500,
  allowedChains: [1, 8453, 42161, 10],
  allowedAssets: ["USDC"],
  allowedProtocols: ["morpho", "aave-v3"],
  minActionUsd: "5000",
  autonomy: "approval_required",
};

function obligation(o: Pick<Obligation, "id" | "title" | "category" | "amount" | "firstDueDate" | "recurrence" | "certainty" | "priority">): Obligation {
  return { direction: "outflow", currency: "USD", status: "active", trackFrom: MODEL_AS_OF, ...o };
}

export const MODEL_OBLIGATIONS: Obligation[] = [
  obligation({ id: "payroll", title: "Core team payroll", category: "Payroll", amount: wad("52000"), firstDueDate: "2026-10-25", recurrence: { freq: "monthly", interval: 1 }, certainty: "committed", priority: "critical" }),
  obligation({ id: "infra", title: "Infrastructure and tooling", category: "Vendors", amount: wad("9000"), firstDueDate: "2026-10-05", recurrence: { freq: "monthly", interval: 1 }, certainty: "committed", priority: "high" }),
  obligation({ id: "legal", title: "Legal retainer", category: "Vendors", amount: wad("18000"), firstDueDate: "2026-10-13", recurrence: { freq: "once" }, certainty: "invoiced", priority: "high" }),
  obligation({ id: "grant", title: "Ecosystem grant, tranche 2", category: "Grants", amount: wad("40000"), firstDueDate: "2026-11-15", recurrence: { freq: "once" }, certainty: "committed", priority: "normal" }),
  obligation({ id: "event", title: "Community event", category: "Marketing", amount: wad("15000"), firstDueDate: "2026-12-10", recurrence: { freq: "once" }, certainty: "estimate", priority: "low" }),
];

const AUDIT = obligation({ id: "audit", title: "Security audit invoice", category: "Vendors", amount: wad("60000"), firstDueDate: addDays(MODEL_AS_OF, 21), recurrence: { freq: "once" }, certainty: "invoiced", priority: "high" });
const CONTRACTORS = obligation({ id: "contractors", title: "Two contractors", category: "Payroll", amount: wad("24000"), firstDueDate: "2026-10-15", recurrence: { freq: "monthly", interval: 1 }, certainty: "committed", priority: "high" });

function stateFor(inputs: ModelInputs): ScenarioState {
  return {
    asOf: MODEL_AS_OF,
    nowSec: NOW_SEC,
    policy: { ...POLICY, runwayMonths: inputs.runwayMonths, obligationHorizonDays: inputs.horizonDays },
    accounts: ACCOUNTS,
    holdings: HOLDINGS,
    positions: [],
    obligations: MODEL_OBLIGATIONS,
    chainName: (id) => (id === 1 ? "Ethereum" : id === 8453 ? "Base" : `Chain ${id}`),
  };
}

function shocksFor(inputs: ModelInputs): ScenarioShock[] {
  const shocks: ScenarioShock[] = [];
  if (inputs.events.audit) shocks.push({ type: "new_obligation", obligation: AUDIT });
  if (inputs.events.contractors) shocks.push({ type: "new_obligation", obligation: CONTRACTORS });
  if (inputs.events.depeg) shocks.push({ type: "depeg", symbol: "USDC", price: "0.97" });
  return shocks;
}

export interface ModelRule {
  id: ReserveRuleId;
  label: string;
  amount: string;
  enabled: boolean;
  binding: boolean;
  basis: string;
}

export interface ModelOccurrence {
  key: string;
  title: string;
  category: string;
  dueDate: string;
  inDays: number;
  usd: string;
  certainty: ObligationCertainty;
}

export interface ModelResult {
  inputs: ModelInputs;
  /** Market value of everything tracked. */
  gross: string;
  /** Reserve-eligible capital (stablecoins valued at most $1, verified accounts only). */
  available: string;
  required: string;
  binding: ReserveRuleId | null;
  rules: ModelRule[];
  obligationsDue: string;
  obligationsWithBuffer: string;
  burnUsed: string;
  burnBasis: ReserveAssessment["burn"]["basis"];
  buckets: Bucket[];
  total: string;
  shortfall: string;
  deployable: string;
  /** Reserve-eligible capital left after the requirement and pending outflows. */
  afterReserve: string;
  /** Room under the maximum-deployed limit. */
  capRemaining: string;
  held: string;
  limitedBy: ReserveAssessment["surplus"]["limitedBy"];
  /** Deployable before the selected events (same policy inputs), for the change line. */
  baseDeployable: string;
  deployableDelta: string;
  occurrences: ModelOccurrence[];
}

const s = wadToString;

/** Run the real engine on the illustrative treasury. Pure and deterministic. */
export function runModel(inputs: ModelInputs): ModelResult {
  const { base, scenario } = runScenario(stateFor(inputs), shocksFor(inputs));
  const r = scenario.reserve;
  const t = scenario.treasury;
  const reserveLike = {
    required: s(r.required),
    available: s(r.available),
    pendingOutflows: s(r.pendingOutflows),
    shortfall: s(r.shortfall),
    rules: r.rules.map((x) => ({ id: x.id, amount: s(x.amount), enabled: x.enabled })),
    surplus: { deployable: s(r.surplus.deployable) },
  };
  const { buckets, total, shortfall } = bucketsFromReserve(reserveLike);
  const held = buckets.find((b) => b.key === "held")?.value ?? "0";
  const burn = r.burn.used;

  const rules: ModelRule[] = r.rules.map((x) => ({
    id: x.id,
    label: x.id === "floor" ? "Fixed floor" : x.id === "runway" ? "Operating runway" : "Obligations in horizon",
    amount: s(x.amount),
    enabled: x.enabled,
    binding: x.binding,
    basis:
      x.id === "floor"
        ? "Minimum the policy always keeps"
        : x.id === "runway"
          ? `${inputs.runwayMonths} months × ${formatWhole(burn)}/mo burn`
          : `${formatWhole(r.obligations.total)} due within ${inputs.horizonDays} days + 10%`,
  }));

  return {
    inputs,
    gross: s(t.gross),
    available: s(r.available),
    required: s(r.required),
    binding: r.bindingRule,
    rules,
    obligationsDue: s(r.obligations.total),
    obligationsWithBuffer: s(r.rules.find((x) => x.id === "obligations")?.amount ?? 0n),
    burnUsed: s(burn),
    burnBasis: r.burn.basis,
    buckets,
    total,
    shortfall,
    deployable: s(r.surplus.deployable),
    afterReserve: s(r.surplus.afterReserve),
    capRemaining: s(r.surplus.capRemaining),
    held,
    limitedBy: r.surplus.limitedBy,
    baseDeployable: s(base.reserve.surplus.deployable),
    deployableDelta: s(r.surplus.deployable - base.reserve.surplus.deployable),
    occurrences: r.obligations.occurrences
      .filter((o) => o.usd !== null)
      .map((o) => ({ key: `${o.obligationId}:${o.dueDate}`, title: o.title, category: o.category, dueDate: o.dueDate, inDays: diffDays(o.dueDate, MODEL_AS_OF), usd: s(o.usd!), certainty: o.certainty })),
  };
}

/** "$80,000" from a wad, without cents (every illustrative amount is whole dollars). */
function formatWhole(v: bigint): string {
  const whole = v / 10n ** 18n;
  return `$${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** Projected liquid balance if the deployable surplus were allocated today (obligations only, no inflows). */
export function runProjection(inputs: ModelInputs = DEFAULT_INPUTS) {
  const { scenario } = runScenario(stateFor(inputs), shocksFor(inputs));
  const r = scenario.reserve;
  const start = r.available - r.surplus.deployable;
  const { points, lowest } = projectCashflow({ start, asOf: MODEL_AS_OF, days: inputs.horizonDays, stepDays: 1, occurrences: r.obligations.occurrences });
  return {
    start: s(start),
    floor: POLICY.minimumReserveUsd,
    deployed: s(r.surplus.deployable),
    lowest: { inDays: diffDays(lowest.date, MODEL_AS_OF), balance: s(lowest.balance) },
    points: points.map((p) => ({ inDays: diffDays(p.date, MODEL_AS_OF), balance: s(p.balance), outflow: s(p.outflow) })),
    events: r.obligations.occurrences.filter((o) => o.usd !== null).map((o) => ({ inDays: diffDays(o.dueDate, MODEL_AS_OF), title: o.title, usd: s(o.usd!), certainty: o.certainty })),
  };
}
