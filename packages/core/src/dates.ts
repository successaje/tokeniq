/**
 * Date-only arithmetic on ISO calendar dates ("YYYY-MM-DD"), always in UTC.
 * Obligations are due on calendar days, so times of day and time zones are
 * deliberately excluded from the financial calculations.
 */

export type IsoDate = string;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export class DateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DateError";
  }
}

export function parseIsoDate(value: IsoDate): { y: number; m: number; d: number } {
  const match = ISO_DATE_RE.exec(value);
  if (!match) throw new DateError(`"${value}" is not a YYYY-MM-DD date`);
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) throw new DateError(`"${value}" is not a valid calendar date`);
  return { y, m, d };
}

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string") return false;
  try {
    parseIsoDate(value);
    return true;
  } catch {
    return false;
  }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function formatIsoDate(y: number, m: number, d: number): IsoDate {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function toIsoDate(date: Date): IsoDate {
  return formatIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function isoToEpochDay(value: IsoDate): number {
  const { y, m, d } = parseIsoDate(value);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function epochDayToIso(day: number): IsoDate {
  return toIsoDate(new Date(day * 86_400_000));
}

export function addDays(value: IsoDate, days: number): IsoDate {
  return epochDayToIso(isoToEpochDay(value) + days);
}

export function diffDays(a: IsoDate, b: IsoDate): number {
  return isoToEpochDay(a) - isoToEpochDay(b);
}

/**
 * Add calendar months, clamping to the end of shorter months while keeping the
 * original anchor day (Jan 31 + 1 month = Feb 28/29, + 2 months = Mar 31).
 */
export function addMonths(value: IsoDate, months: number, anchorDay?: number): IsoDate {
  const { y, m, d } = parseIsoDate(value);
  const anchor = anchorDay ?? d;
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return formatIsoDate(ny, nm, Math.min(anchor, daysInMonth(ny, nm)));
}

export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function maxIso(a: IsoDate, b: IsoDate): IsoDate {
  return a > b ? a : b;
}

export function minIso(a: IsoDate, b: IsoDate): IsoDate {
  return a < b ? a : b;
}
