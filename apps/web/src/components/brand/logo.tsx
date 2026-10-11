import { cn } from "@/lib/cn";

/**
 * TokenIQ mark: three ledger lines of decreasing length — protected, committed,
 * and the accent line that is free to work. It is the product's model in one glyph.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--text)" />
      <rect x="5.5" y="15.5" width="13" height="2.5" rx="1.25" fill="var(--canvas)" />
      <rect x="5.5" y="10.75" width="9" height="2.5" rx="1.25" fill="var(--canvas)" opacity="0.7" />
      <rect x="5.5" y="6" width="5" height="2.5" rx="1.25" fill="var(--accent)" className="[filter:brightness(1.35)] dark:[filter:none]" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {!compact && <span className="text-[17px] font-semibold tracking-[-0.02em] text-text">TokenIQ</span>}
    </span>
  );
}
