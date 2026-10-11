import { parseDecimal, pow10, type Wad } from "./money";
import type { FxTable, Obligation, SettledOccurrence } from "./obligations";
import type { TreasuryPolicy } from "./policy";
import { assessReserve, type PendingOutflow, type ReserveAssessment } from "./reserve";
import { computeTreasury, type AccountRef, type Holding, type Position, type TreasurySnapshot } from "./treasury";
import type { IsoDate } from "./dates";

/**
 * Hypothetical changes applied on top of the current state. Scenarios never
 * touch stored data; they recompute the same deterministic maths on a copy.
 */
export type ScenarioShock =
  | { type: "depeg"; symbol: string; /** New price as a decimal string, e.g. "0.95". */ price: string }
  | { type: "new_obligation"; obligation: Obligation }
  | { type: "burn_change"; monthlyBurnUsd: string }
  | { type: "runway_months"; months: number }
  | { type: "venue_frozen"; venueId: string }
  | { type: "allocate"; amountUsd: Wad; venueId: string; accountId: string; symbol: string };

export interface ScenarioState {
  asOf: IsoDate;
  nowSec: number;
  policy: TreasuryPolicy;
  accounts: AccountRef[];
  holdings: Holding[];
  positions: Position[];
  obligations: Obligation[];
  settled?: SettledOccurrence[];
  fx?: FxTable;
  pendingOutflows?: PendingOutflow[];
  chainName?: (id: number) => string;
}

export interface ScenarioResult {
  treasury: TreasurySnapshot;
  reserve: ReserveAssessment;
}

export function evaluateState(state: ScenarioState): ScenarioResult {
  const treasury = computeTreasury({
    asOf: state.nowSec,
    accounts: state.accounts,
    holdings: state.holdings,
    positions: state.positions,
    policy: state.policy,
    chainName: state.chainName,
  });
  const reserve = assessReserve({
    asOf: state.asOf,
    policy: state.policy,
    treasury,
    obligations: state.obligations,
    settled: state.settled,
    fx: state.fx,
    pendingOutflows: state.pendingOutflows,
  });
  return { treasury, reserve };
}

export function applyShocks(state: ScenarioState, shocks: ScenarioShock[]): ScenarioState {
  let next: ScenarioState = { ...state, holdings: [...state.holdings], positions: [...state.positions], obligations: [...state.obligations], policy: { ...state.policy } };
  for (const shock of shocks) {
    switch (shock.type) {
      case "depeg": {
        const reprice = <T extends { asset: { symbol: string }; price: Holding["price"] }>(item: T): T => {
          if (item.asset.symbol !== shock.symbol || !item.price) return item;
          const price = parseDecimal(shock.price, item.price.decimals, "down");
          return { ...item, price: { ...item.price, price, source: `${item.price.source} (scenario)` } };
        };
        next = { ...next, holdings: next.holdings.map(reprice), positions: next.positions.map(reprice) };
        break;
      }
      case "new_obligation":
        next = { ...next, obligations: [...next.obligations, shock.obligation] };
        break;
      case "burn_change":
        next = { ...next, policy: { ...next.policy, monthlyBurnUsd: shock.monthlyBurnUsd } };
        break;
      case "runway_months":
        next = { ...next, policy: { ...next.policy, runwayMonths: shock.months } };
        break;
      case "venue_frozen":
        next = { ...next, positions: next.positions.map((p) => (p.venueId === shock.venueId ? { ...p, withdrawableRaw: 0n } : p)) };
        break;
      case "allocate": {
        // Move value from a liquid holding into a hypothetical position.
        const idx = next.holdings.findIndex((h) => h.accountId === shock.accountId && h.asset.symbol === shock.symbol);
        if (idx < 0) break;
        const h = next.holdings[idx]!;
        const raw = (shock.amountUsd * pow10(h.asset.decimals)) / 10n ** 18n;
        const moved = raw > h.raw ? h.raw : raw;
        const holdings = [...next.holdings];
        holdings[idx] = { ...h, raw: h.raw - moved };
        const positions = [
          ...next.positions,
          { id: `scenario:${shock.venueId}`, accountId: h.accountId, protocol: shock.venueId.split(":")[0] ?? "venue", venueId: shock.venueId, venueName: "Scenario allocation", asset: h.asset, assetsRaw: moved, withdrawableRaw: moved, price: h.price },
        ];
        next = { ...next, holdings, positions };
        break;
      }
    }
  }
  return next;
}

/** Evaluate the base case and a shocked case side by side. */
export function runScenario(state: ScenarioState, shocks: ScenarioShock[]): { base: ScenarioResult; scenario: ScenarioResult } {
  return { base: evaluateState(state), scenario: evaluateState(applyShocks(state, shocks)) };
}
