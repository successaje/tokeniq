import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { IllustrationLabel } from "./primitives";

/**
 * A schematic opportunity card. Every figure is invented for illustration and
 * labelled as such; no real venue's rate is presented as live.
 */
export function ExampleVenueCard({ className }: { className?: string }) {
  const facts: Array<{ label: string; value: string; note?: string }> = [
    { label: "Net rate", value: "4.6%", note: "After the 10% performance fee, rewards excluded" },
    { label: "Gross rate", value: "5.1%", note: "Before fees" },
    { label: "Measured", value: "7-day average", note: "Source and time shown on every rate" },
    { label: "Available liquidity", value: "$38.2M", note: "What could be withdrawn now" },
    { label: "Your position limit", value: "$1.91M", note: "5% of available liquidity, by policy" },
    { label: "Fees", value: "10% performance · 0% management" },
  ];
  const checks = [
    { ok: true, text: "Network, asset and protocol are allowed by policy" },
    { ok: true, text: "Vault size above the $25M minimum" },
    { ok: true, text: "Fee below the 25% policy maximum" },
  ];
  const warnings = ["The curator can change which markets the vault lends to", "Withdrawals depend on how much of the vault is lent out"];

  return (
    <article aria-labelledby="example-venue-title" className={cn("rounded-[var(--radius-card)] border border-hairline bg-surface", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs text-text-3">Morpho vault · Base · USDC</p>
          <h3 id="example-venue-title" className="mt-0.5 text-[15px] font-semibold text-text">
            Example USDC vault
          </h3>
          <p className="mt-0.5 text-xs text-text-2">Curated by Example Curator</p>
        </div>
        <IllustrationLabel>Example · illustrative figures</IllustrationLabel>
      </header>
      <dl className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-2 sm:divide-y-0">
        {facts.map((f, i) => (
          <div key={f.label} className={cn("px-4 py-3 sm:px-5", i >= 2 && "sm:border-t sm:border-hairline", i % 2 === 1 && "sm:border-l sm:border-hairline")}>
            <dt className="text-xs text-text-2">{f.label}</dt>
            <dd className="num mt-0.5 text-[15px] font-medium text-text">{f.value}</dd>
            {f.note && <dd className="text-xs text-text-3">{f.note}</dd>}
          </div>
        ))}
      </dl>
      <div className="grid gap-4 border-t border-hairline px-4 py-4 sm:grid-cols-2 sm:px-5">
        <div>
          <p className="text-xs font-medium text-text-2">Policy checks</p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-text">
            {checks.map((c) => (
              <li key={c.text} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                <span>
                  <span className="sr-only">Passed: </span>
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-text-2">Warnings</p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-text">
            {warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
                <span>
                  <span className="sr-only">Warning: </span>
                  {w}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-hairline px-4 py-2.5 text-xs text-text-3 sm:px-5">Rates are variable and not guaranteed. Past rates do not predict future returns.</p>
    </article>
  );
}
