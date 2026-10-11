import { cn } from "@/lib/cn";
import { tokenAmount, usd } from "@/lib/format";

export interface MoneyProps {
  /** USD decimal string. */
  value: string | null | undefined;
  compact?: boolean;
  decimals?: number;
  signed?: boolean;
  /** Mark a converted (≈) value, e.g. a USD equivalent of a token balance. */
  approximate?: boolean;
  className?: string;
  /** Where the figure came from and when, shown on hover and to assistive tech. */
  source?: string;
  tabular?: boolean;
}

/**
 * The single way to show a USD amount. Exact by default; compact values keep the
 * full figure in the accessible name and title.
 */
export function Money({ value, compact, decimals = 2, signed, approximate, className, source, tabular = true }: MoneyProps) {
  const shown = usd(value, { compact, decimals, signed });
  const full = usd(value, { decimals: 2, signed });
  const label = `${approximate ? "approximately " : ""}${full}${source ? `, ${source}` : ""}`;
  return (
    <span className={cn(tabular && "num", "whitespace-nowrap", className)} title={compact || source ? `${full}${source ? ` · ${source}` : ""}` : undefined} aria-label={label}>
      {approximate && <span aria-hidden="true">≈ </span>}
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

/** A token amount with its symbol, e.g. "1,250.00 USDC". */
export function TokenAmount({ raw, decimals, symbol, className, maxFractionDigits = 2 }: { raw: string; decimals: number; symbol: string; className?: string; maxFractionDigits?: number }) {
  return (
    <span className={cn("num whitespace-nowrap", className)}>
      {tokenAmount(raw, decimals, maxFractionDigits)} <span className="text-text-2">{symbol}</span>
    </span>
  );
}
