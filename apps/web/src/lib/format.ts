import { formatBps, formatDecimal, formatUsd, parseDecimal } from "@tokeniq/core";

/** Format a USD decimal string exactly (no floating point). */
export function usd(value: string | null | undefined, opts: { compact?: boolean; decimals?: number; signed?: boolean } = {}): string {
  if (value === null || value === undefined || value === "") return "—";
  try {
    return formatUsd(parseDecimal(value, 18, "down"), opts);
  } catch {
    return "—";
  }
}

/** Format a raw integer token amount with its decimals, e.g. ("1500000", 6) -> "1.5". */
export function tokenAmount(raw: string | bigint, decimals: number, maxFractionDigits = 2): string {
  const v = typeof raw === "bigint" ? raw : BigInt(raw);
  return formatDecimal(v, decimals, { maxFractionDigits, minFractionDigits: Math.min(2, maxFractionDigits), grouping: true });
}

export function pct(bps: string | number | bigint | null | undefined, decimals = 1): string {
  if (bps === null || bps === undefined) return "—";
  return formatBps(BigInt(bps), decimals);
}

export function shortAddress(address: string, chars = 4): string {
  if (!address || address.length < 2 + chars * 2) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

const rtf = typeof Intl !== "undefined" ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }) : null;

/** "2 minutes ago", "in 3 days". */
export function relativeTime(iso: string | Date | null | undefined, now = Date.now()): string {
  if (!iso) return "never";
  const t = typeof iso === "string" ? Date.parse(iso) : iso.getTime();
  if (Number.isNaN(t)) return "—";
  const diff = (t - now) / 1000;
  const abs = Math.abs(diff);
  if (!rtf) return new Date(t).toISOString();
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return rtf.format(Math.round(diff / (86400 * 30)), "month");
}

export function dateLabel(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }): string {
  if (!iso) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat("en", { ...opts, timeZone: "UTC" }).format(d);
}

export function dateTimeLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));
}

/** Compare two USD decimal strings without floating point. */
export function cmpUsd(a: string, b: string): number {
  const x = parseDecimal(a, 18, "down");
  const y = parseDecimal(b, 18, "down");
  return x < y ? -1 : x > y ? 1 : 0;
}

export function isPositive(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    return parseDecimal(value, 18, "down") > 0n;
  } catch {
    return false;
  }
}
