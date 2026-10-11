import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

/**
 * A ledger section: a full-width hairline with a numbered caption, then the
 * section's own grid. The numbering reads like the sections of a statement.
 */
export function Section({ id, index, label, className, children, tone = "canvas" }: { id?: string; index?: string; label?: string; className?: string; children: ReactNode; tone?: "canvas" | "surface" }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-caption ${id}-title` : undefined} className={cn(tone === "surface" ? "bg-surface" : "bg-canvas", "scroll-mt-20", className)}>
      <Container>
        {label && (
          <div className="flex items-center gap-3 border-t border-hairline pt-4 text-xs">
            {index && (
              <span className="font-mono text-[11px] text-text-3" aria-hidden="true">
                {index}
              </span>
            )}
            <span id={id ? `${id}-caption` : undefined} className="font-medium text-text-2">
              {label}
            </span>
          </div>
        )}
        <div className="pb-20 pt-10 sm:pb-24 sm:pt-12 lg:pb-28">{children}</div>
      </Container>
    </section>
  );
}

export function SectionHeading({ id, title, lead, className, as: As = "h2" }: { id?: string; title: ReactNode; lead?: ReactNode; className?: string; as?: "h1" | "h2" }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <As id={id} className={cn("font-medium tracking-[-0.02em] text-text text-balance", As === "h1" ? "text-[36px] leading-[42px] sm:text-[48px] sm:leading-[54px]" : "text-[28px] leading-[34px] sm:text-[36px] sm:leading-[42px]")}>
        {title}
      </As>
      {lead && <p className="mt-4 text-[16px] leading-7 text-text-2 text-pretty sm:text-[17px]">{lead}</p>}
    </div>
  );
}

/** Intro block for secondary pages: h1, lead, optional meta and actions, sitting on the ledger grid. */
export function PageIntro({ eyebrow, title, lead, children, className }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("border-b border-hairline bg-canvas", className)}>
      <Container className="pb-12 pt-12 sm:pb-16 sm:pt-16">
        {eyebrow && <p className="mb-4 text-xs font-medium text-text-2">{eyebrow}</p>}
        <SectionHeading as="h1" id="page-title" title={title} lead={lead} className="max-w-3xl" />
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </div>
  );
}

const btn = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-border-strong/60 bg-surface text-text hover:bg-sunken",
  quiet: "text-accent hover:underline px-0",
};

export function ButtonLink({ href, children, variant = "primary", size = "md", className, arrow }: { href: string; children: ReactNode; variant?: keyof typeof btn; size?: "md" | "lg"; className?: string; arrow?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] font-medium transition-colors duration-[var(--dur-fast)]",
        variant !== "quiet" && (size === "lg" ? "h-11 px-5 text-[15px]" : "h-9 px-4 text-sm"),
        variant === "quiet" && "text-sm",
        btn[variant],
        className,
      )}
    >
      {children}
      {arrow && <ArrowRight className="size-4" aria-hidden="true" />}
    </Link>
  );
}

/** Label for anything drawn to explain, not to report: schematics and examples. */
export function IllustrationLabel({ children = "Illustration · not live data", className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] border border-dashed border-border-strong/60 px-1.5 py-0.5 text-[11px] font-medium leading-4 text-text-2", className)}>
      {children}
    </span>
  );
}

/** Two-column ledger layout: caption on the left (sticky on wide screens), content on the right. */
export function Split({ aside, children, className }: { aside: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-10 lg:grid-cols-12 lg:gap-8", className)}>
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-24">{aside}</div>
      </div>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </div>
  );
}

/** Definition rows: label left, value right, hairline between. */
export function FactList({ items, className }: { items: Array<{ label: ReactNode; value: ReactNode }>; className?: string }) {
  return (
    <dl className={cn("divide-y divide-hairline border-y border-hairline text-[13px]", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-text-2">{it.label}</dt>
          <dd className="text-right text-text">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
