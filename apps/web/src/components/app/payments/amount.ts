import { formatDecimal, parseDecimal } from "@tokeniq/core";
import { usd } from "@/lib/format";

/** "$12,000.00" or "€9,500.00", exact (no floating point). */
export function amountLabel(amount: string | null | undefined, currency: string): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  if (currency === "USD") return usd(amount);
  try {
    const body = formatDecimal(parseDecimal(amount, 18, "down"), 18, { maxFractionDigits: 2, minFractionDigits: 2, grouping: true });
    return currency === "EUR" ? `€${body}` : `${body} ${currency}`;
  } catch {
    return "—";
  }
}

/**
 * Transfer-check reasons from the API quote raw integer token amounts
 * ("…was 219727816508, below the minimum 5000000000000"). Show them in token units.
 */
export function humanizeReason(reason: string, decimals: number | undefined, symbol: string | null | undefined): string {
  if (decimals === undefined) return reason;
  return reason.replace(/\b\d{4,}\b/g, (raw) => {
    try {
      return `${formatDecimal(BigInt(raw), decimals, { maxFractionDigits: 2, minFractionDigits: 2, grouping: true })}${symbol ? ` ${symbol}` : ""}`;
    } catch {
      return raw;
    }
  });
}
