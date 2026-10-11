"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { sharePct, type Bucket, type BucketKey } from "@/lib/buckets";

const fill: Record<BucketKey, string> = {
  obligations: "ticks-obligations",
  reserve: "hatch-reserve",
  deployable: "bg-deployable",
  held: "bg-sunken shadow-[inset_0_0_0_1px_var(--border-strong)]",
  shortfall: "",
};

export function BucketSwatch({ k, className }: { k: BucketKey; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-3 shrink-0 rounded-[3px]", fill[k], className)} />;
}

/**
 * 100% bar of reserve-eligible capital. Segments are separated by a 2px surface
 * gap and carry pattern (hatch / ticks / solid) so identity never depends on
 * colour. The bar is one image whose name lists every segment; segments are not
 * separate targets (a thin segment can't meet the 24px target size), and the
 * legend below carries the same values as text. Hover still highlights.
 */
export function AllocationBar({
  buckets,
  total,
  shortfall,
  size = "md",
  highlighted,
  onHighlight,
  showLegend = true,
  className,
}: {
  buckets: Bucket[];
  total: string;
  shortfall?: string;
  size?: "md" | "lg";
  highlighted?: BucketKey | null;
  onHighlight?: (k: BucketKey | null) => void;
  showLegend?: boolean;
  className?: string;
}) {
  const [hover, setHover] = useState<BucketKey | null>(null);
  const active = highlighted ?? hover;
  const visible = buckets.filter((b) => sharePct(b.value, total) > 0);
  const hasShortfall = !!shortfall && shortfall !== "0";
  const set = (k: BucketKey | null) => {
    setHover(k);
    onHighlight?.(k);
  };
  const activeBucket = visible.find((b) => b.key === active);
  const summary =
    visible.length === 0
      ? "No reserve-eligible capital"
      : `Allocation of ${usd(total)} reserve-eligible capital: ${visible.map((b) => `${b.label} ${usd(b.value)}, ${sharePct(b.value, total).toFixed(1)}%`).join("; ")}`;

  return (
    <div className={className}>
      <div className="relative">
        <div role="img" aria-label={summary} className={cn("flex w-full gap-[2px] overflow-hidden rounded-[6px] bg-surface", size === "lg" ? "h-11" : "h-7")}>
          {visible.length === 0 && <div className="h-full w-full rounded-[6px] bg-sunken" />}
          {visible.map((b, i) => {
            const pct = sharePct(b.value, total);
            return (
              <div
                key={b.key}
                onMouseEnter={() => set(b.key)}
                onMouseLeave={() => set(null)}
                className={cn(
                  "h-full min-w-[6px] transition-[flex-grow,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)]",
                  fill[b.key],
                  i === 0 && "rounded-l-[6px]",
                  i === visible.length - 1 && !hasShortfall && "rounded-r-[6px]",
                  active && active !== b.key && "opacity-45",
                )}
                style={{ flexGrow: Math.max(pct, 0.6), flexBasis: 0 }}
              />
            );
          })}
        </div>
        {activeBucket && (
          <div aria-hidden="true" className="pointer-events-none absolute left-0 top-full z-10 mt-2 rounded-[var(--radius-control)] bg-text px-2.5 py-1.5 text-xs text-canvas shadow-[var(--shadow-float)]">
            <span className="font-medium">{activeBucket.label}</span> · <span className="num">{usd(activeBucket.value)}</span> · {sharePct(activeBucket.value, total).toFixed(1)}%
            <div className="mt-0.5 max-w-xs opacity-80">{activeBucket.description}</div>
          </div>
        )}
      </div>
      {hasShortfall && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger">
          <span aria-hidden="true" className="inline-block h-3 w-5 rounded-[3px] border border-dashed border-danger" />
          Short by <span className="num">{usd(shortfall)}</span> against the policy requirement
        </p>
      )}
      {showLegend && (
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2" aria-label="Allocation legend">
          {visible.map((b) => (
            <li key={b.key} className={cn("flex items-center gap-2 text-[13px] transition-opacity", active && active !== b.key && "opacity-60")}>
              <BucketSwatch k={b.key} />
              <span className="text-text-2">{b.label}</span>
              <span className="num ml-auto font-medium text-text">{usd(b.value, { compact: true })}</span>
              <span className="num w-12 text-right text-text-3">{sharePct(b.value, total).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
