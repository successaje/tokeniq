import { addDays, dueDatesBetween, mulDiv, parseDecimal, parseIsoDate, toIsoDate, wadToString } from "@tokeniq/core";
import { dateLabel, usd } from "@/lib/format";
import type { ObligationDto, OccurrenceDto, RecurrenceDto } from "@/lib/types";

export const CATEGORIES = ["payroll", "contractors", "vendors", "infrastructure", "marketing", "legal", "grants", "taxes", "debt", "operations", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<string, string> = {
  payroll: "Payroll",
  contractors: "Contractors",
  vendors: "Vendors",
  infrastructure: "Infrastructure",
  marketing: "Marketing",
  legal: "Legal",
  grants: "Grants",
  taxes: "Taxes",
  debt: "Debt",
  operations: "Operations",
  other: "Other",
};

export const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1);

export const CERTAINTY = {
  estimate: { label: "Estimate", description: "Expected, but not agreed with anyone yet" },
  committed: { label: "Committed", description: "Agreed: a contract, payroll or signed quote" },
  invoiced: { label: "Invoiced", description: "An invoice has been received and checked" },
} as const;

export const PRIORITY = {
  critical: { label: "Critical", description: "Must be paid on time (payroll, taxes, debt service)" },
  high: { label: "High", description: "Late payment has real consequences" },
  normal: { label: "Normal", description: "Standard commitment" },
  low: { label: "Low", description: "Can be deferred if needed" },
} as const;

export const STATUS_LABEL: Record<ObligationDto["status"], string> = { active: "Active", paused: "Paused", cancelled: "Cancelled", completed: "Completed" };

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Monthly on the 25th", "Every 2 weeks on Monday", "Once". Calendar maths matches @tokeniq/core. */
export function recurrenceLabel(r: RecurrenceDto, firstDueDate: string, opts: { withEnd?: boolean; withOnceDate?: boolean } = {}): string {
  const { withEnd = true, withOnceDate = false } = opts;
  if (r.freq === "once") return withOnceDate ? `Once, on ${dateLabel(firstDueDate)}` : "Once";
  let parts: { y: number; m: number; d: number };
  try {
    parts = parseIsoDate(firstDueDate);
  } catch {
    return "Recurring";
  }
  const n = r.interval;
  // The engine clamps to the end of shorter months while keeping the anchor day.
  const dayOfMonth = parts.d === 31 ? "the last day" : parts.d >= 29 ? `the ${ordinal(parts.d)} (or the last day)` : `the ${ordinal(parts.d)}`;
  let base: string;
  switch (r.freq) {
    case "weekly": {
      const wd = WEEKDAYS[new Date(Date.UTC(parts.y, parts.m - 1, parts.d)).getUTCDay()]!;
      base = n === 1 ? `Weekly on ${wd}` : `Every ${n} weeks on ${wd}`;
      break;
    }
    case "monthly":
      base = n === 1 ? `Monthly on ${dayOfMonth}` : `Every ${n} months on ${dayOfMonth}`;
      break;
    case "quarterly":
      base = n === 1 ? `Quarterly on ${dayOfMonth}` : `Every ${n} quarters on ${dayOfMonth}`;
      break;
    case "yearly": {
      const md = dateLabel(firstDueDate, { month: "short", day: "numeric" });
      base = n === 1 ? `Yearly on ${md}` : `Every ${n} years on ${md}`;
      break;
    }
  }
  if (!withEnd) return base;
  if (r.count) return `${base}, ${r.count} payment${r.count === 1 ? "" : "s"}`;
  if (r.until) return `${base}, until ${dateLabel(r.until)}`;
  return base;
}

export const todayIso = () => toIsoDate(new Date());

/**
 * Due dates of an obligation from `from`, using the engine's own calendar rules
 * (month-end clamping, until/count). Returns at most `limit` dates.
 */
export function previewDueDates(firstDueDate: string, recurrence: RecurrenceDto, from: string, limit = 5): string[] {
  try {
    parseIsoDate(firstDueDate);
    parseIsoDate(from);
  } catch {
    return [];
  }
  // Ten years is enough for a yearly schedule to show five dates.
  const to = addDays(from, 3_700);
  try {
    return dueDatesBetween({ firstDueDate, recurrence }, from, to)
      .slice(0, limit)
      .map((d) => d.date);
  } catch {
    return [];
  }
}

/** The last due date of a bounded schedule, or null for open-ended ones. */
export function lastDueDate(firstDueDate: string, recurrence: RecurrenceDto): string | null {
  if (recurrence.freq === "once") return firstDueDate;
  if (!recurrence.count && !recurrence.until) return null;
  try {
    const all = dueDatesBetween({ firstDueDate, recurrence }, firstDueDate, addDays(firstDueDate, 366 * 60));
    return all.at(-1)?.date ?? null;
  } catch {
    return null;
  }
}

/**
 * Monthly-equivalent of a recurring amount, exactly as the engine normalises
 * it for itemized burn (weekly x 52/12, rounded up). Null for one-off obligations.
 */
export function monthlyEquivalent(amount: string, recurrence: RecurrenceDto): string | null {
  if (recurrence.freq === "once") return null;
  let wad: bigint;
  try {
    wad = parseDecimal(amount);
  } catch {
    return null;
  }
  const i = BigInt(recurrence.interval || 1);
  switch (recurrence.freq) {
    case "weekly":
      return wadToString(mulDiv(wad, 52n, 12n * i, "up"));
    case "monthly":
      return wadToString(mulDiv(wad, 1n, i, "up"));
    case "quarterly":
      return wadToString(mulDiv(wad, 1n, 3n * i, "up"));
    case "yearly":
      return wadToString(mulDiv(wad, 1n, 12n * i, "up"));
  }
}

/** Exact amount in its own currency: "$68,000.00" or "9,500.00 EUR". */
export function currencyAmount(amount: string, currency: string): string {
  const shown = usd(amount);
  return currency === "USD" ? shown : `${shown.replace("$", "")} ${currency}`;
}

/** The engine's USD value of one occurrence of each obligation (from the schedule), keyed by obligation id. */
export function usdByObligation(occurrences: OccurrenceDto[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const o of occurrences) if (o.usd && !out.has(o.obligationId)) out.set(o.obligationId, o.usd);
  return out;
}

export function sumUsd(values: Array<string | null | undefined>): string {
  let s = 0n;
  for (const v of values) if (v) s += parseDecimal(v, 18, "down");
  return wadToString(s);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function dueInLabel(dueDate: string, asOf: string): string {
  const d = daysBetween(asOf, dueDate);
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  if (d < 0) return `${-d} day${d === -1 ? "" : "s"} overdue`;
  return `In ${d} days`;
}
