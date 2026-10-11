import { addDays, addMonths, compareIso, parseIsoDate, type IsoDate } from "./dates";
import { mulDiv, sum, WAD, type Wad } from "./money";

export const CURRENCIES = ["USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type ObligationDirection = "outflow" | "inflow";

/**
 * How certain an obligation is. The distinction matters: a planned expense is
 * not an invoice, and an invoice is not a payment.
 *  - estimate:  an expected cost that has not been agreed (e.g. "marketing ~ $10k/mo")
 *  - committed: agreed with the counterparty (contract, payroll, signed quote)
 *  - invoiced:  a received invoice that someone has checked
 */
export type ObligationCertainty = "estimate" | "committed" | "invoiced";
export type ObligationPriority = "critical" | "high" | "normal" | "low";
export type ObligationStatus = "active" | "paused" | "cancelled" | "completed";

export type Recurrence =
  | { freq: "once" }
  | { freq: "weekly" | "monthly" | "quarterly" | "yearly"; interval: number; until?: IsoDate | null; count?: number | null };

export interface Obligation {
  id: string;
  title: string;
  category: string;
  direction: ObligationDirection;
  /** Amount per occurrence in `currency` units, 18 decimals. */
  amount: Wad;
  currency: Currency;
  firstDueDate: IsoDate;
  recurrence: Recurrence;
  certainty: ObligationCertainty;
  priority: ObligationPriority;
  status: ObligationStatus;
  /**
   * Occurrences before this date are history and are never treated as owed.
   * Usually the date the obligation was recorded in TokenIQ.
   */
  trackFrom: IsoDate;
}

/** An occurrence that no longer needs funding: paid (verified or not) or skipped. */
export interface SettledOccurrence {
  obligationId: string;
  dueDate: IsoDate;
}

export interface FxRate {
  /** Reporting-currency (USD) value of one unit, 18 decimals. */
  usdPerUnit: Wad;
  asOf: string;
  source: string;
}

export type FxTable = Partial<Record<Currency, FxRate>>;

export const USD_FX: FxRate = { usdPerUnit: WAD, asOf: "fixed", source: "identity" };

export interface Occurrence {
  obligationId: string;
  title: string;
  category: string;
  direction: ObligationDirection;
  dueDate: IsoDate;
  index: number;
  amount: Wad;
  currency: Currency;
  /** Value in USD, or null when no FX rate is available for the currency. */
  usd: Wad | null;
  certainty: ObligationCertainty;
  priority: ObligationPriority;
  overdue: boolean;
}

const MAX_OCCURRENCES = 2_000;

/** The nth due date of an obligation (0-based), ignoring until/count. */
export function nthDueDate(ob: Pick<Obligation, "firstDueDate" | "recurrence">, n: number): IsoDate {
  const r = ob.recurrence;
  if (r.freq === "once") {
    if (n !== 0) throw new Error("one-time obligations have a single occurrence");
    return ob.firstDueDate;
  }
  const anchor = parseIsoDate(ob.firstDueDate).d;
  switch (r.freq) {
    case "weekly":
      return addDays(ob.firstDueDate, 7 * r.interval * n);
    case "monthly":
      return addMonths(ob.firstDueDate, r.interval * n, anchor);
    case "quarterly":
      return addMonths(ob.firstDueDate, 3 * r.interval * n, anchor);
    case "yearly":
      return addMonths(ob.firstDueDate, 12 * r.interval * n, anchor);
  }
}

/** All due dates of an obligation within [from, to] inclusive, honouring until/count. */
export function dueDatesBetween(ob: Pick<Obligation, "firstDueDate" | "recurrence">, from: IsoDate, to: IsoDate): Array<{ date: IsoDate; index: number }> {
  const out: Array<{ date: IsoDate; index: number }> = [];
  if (compareIso(from, to) > 0) return out;
  const r = ob.recurrence;
  if (r.freq === "once") {
    if (compareIso(ob.firstDueDate, from) >= 0 && compareIso(ob.firstDueDate, to) <= 0) out.push({ date: ob.firstDueDate, index: 0 });
    return out;
  }
  if (!Number.isInteger(r.interval) || r.interval < 1) throw new Error("recurrence interval must be a positive integer");
  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    if (r.count != null && i >= r.count) break;
    const date = nthDueDate(ob, i);
    if (r.until && compareIso(date, r.until) > 0) break;
    if (compareIso(date, to) > 0) break;
    if (compareIso(date, from) >= 0) out.push({ date, index: i });
  }
  return out;
}

export function convertToUsd(amount: Wad, currency: Currency, fx: FxTable, rounding: "down" | "up" = "up"): Wad | null {
  if (currency === "USD") return amount;
  const rate = fx[currency];
  if (!rate) return null;
  return mulDiv(amount, rate.usdPerUnit, WAD, rounding);
}

export interface ExpandOptions {
  asOf: IsoDate;
  /** Last day (inclusive) to include. */
  through: IsoDate;
  /** How far back unpaid occurrences count as overdue (default 30 days). */
  overdueLookbackDays?: number;
  settled?: SettledOccurrence[];
  fx?: FxTable;
}

/**
 * Expand obligations into unsettled occurrences between (asOf - lookback) and `through`.
 * Occurrences before `asOf` that are still unsettled are flagged overdue.
 * Converting to USD rounds up for outflows (conservative) and down for inflows.
 */
export function expandOccurrences(obligations: Obligation[], opts: ExpandOptions): Occurrence[] {
  const lookback = opts.overdueLookbackDays ?? 30;
  const settledKeys = new Set((opts.settled ?? []).map((s) => `${s.obligationId}|${s.dueDate}`));
  const fx = opts.fx ?? {};
  const windowStart = addDays(opts.asOf, -lookback);
  const out: Occurrence[] = [];
  for (const ob of obligations) {
    if (ob.status !== "active") continue;
    const from = compareIso(ob.trackFrom, windowStart) > 0 ? ob.trackFrom : windowStart;
    for (const { date, index } of dueDatesBetween(ob, from, opts.through)) {
      if (settledKeys.has(`${ob.id}|${date}`)) continue;
      out.push({
        obligationId: ob.id,
        title: ob.title,
        category: ob.category,
        direction: ob.direction,
        dueDate: date,
        index,
        amount: ob.amount,
        currency: ob.currency,
        usd: convertToUsd(ob.amount, ob.currency, fx, ob.direction === "outflow" ? "up" : "down"),
        certainty: ob.certainty,
        priority: ob.priority,
        overdue: compareIso(date, opts.asOf) < 0,
      });
    }
  }
  out.sort((a, b) => compareIso(a.dueDate, b.dueDate) || a.obligationId.localeCompare(b.obligationId));
  return out;
}

/**
 * Normalise active recurring outflows to a monthly figure in USD (rounded up).
 * Weekly obligations use 52/12 weeks per month.
 */
export function itemizedMonthlyBurn(obligations: Obligation[], fx: FxTable): { monthly: Wad; missingFx: Currency[] } {
  const missing = new Set<Currency>();
  const parts: Wad[] = [];
  for (const ob of obligations) {
    if (ob.status !== "active" || ob.direction !== "outflow" || ob.recurrence.freq === "once") continue;
    const usd = convertToUsd(ob.amount, ob.currency, fx, "up");
    if (usd === null) {
      missing.add(ob.currency);
      continue;
    }
    const interval = BigInt(ob.recurrence.interval);
    switch (ob.recurrence.freq) {
      case "weekly":
        parts.push(mulDiv(usd, 52n, 12n * interval, "up"));
        break;
      case "monthly":
        parts.push(mulDiv(usd, 1n, interval, "up"));
        break;
      case "quarterly":
        parts.push(mulDiv(usd, 1n, 3n * interval, "up"));
        break;
      case "yearly":
        parts.push(mulDiv(usd, 1n, 12n * interval, "up"));
        break;
    }
  }
  return { monthly: sum(parts), missingFx: [...missing] };
}

/** Next unsettled due date on or after `asOf`, or null if none within ~10 years. */
export function nextDueDate(ob: Obligation, asOf: IsoDate, settled: SettledOccurrence[] = []): IsoDate | null {
  const keys = new Set(settled.filter((s) => s.obligationId === ob.id).map((s) => s.dueDate));
  for (const { date } of dueDatesBetween(ob, asOf, addDays(asOf, 3_660))) {
    if (!keys.has(date)) return date;
  }
  return null;
}
