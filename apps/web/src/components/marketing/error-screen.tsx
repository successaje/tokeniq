import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

/**
 * Full-page state for 404, 403, errors and offline. Server-safe (no hooks), so
 * client error boundaries can use it too. The mark is the logo's ledger with
 * the top line missing: nothing to show here.
 */
export function ErrorScreen({
  code,
  title,
  description,
  actions,
  details,
  withHeader = true,
  children,
}: {
  code: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  details?: Array<{ label: string; value: ReactNode }>;
  withHeader?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      {withHeader && (
        <header className="border-b border-hairline pt-safe">
          <div className="mx-auto flex h-16 max-w-[1240px] items-center px-4 sm:px-6 lg:px-8">
            <Link href="/" aria-label="TokenIQ home" className="rounded-[var(--radius-chip)]">
              <Logo />
            </Link>
          </div>
        </header>
      )}
      <main id="main" className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
          <div className="lg:col-span-7">
            <p className="font-mono text-xs text-text-3">{code}</p>
            <h1 className="mt-4 text-[36px] font-medium leading-[42px] tracking-[-0.025em] text-text text-balance sm:text-[48px] sm:leading-[54px]">{title}</h1>
            <div className="mt-4 max-w-xl text-[16px] leading-7 text-text-2">{description}</div>
            {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
            {children}
          </div>
          <div className="lg:col-span-5 lg:pt-8">
            <EmptyLedger />
            {details && details.length > 0 && (
              <dl className="mt-8 divide-y divide-hairline border-y border-hairline text-[13px]">
                {details.map((d) => (
                  <div key={d.label} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-text-2">{d.label}</dt>
                    <dd className="min-w-0 truncate text-right font-mono text-xs text-text">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyLedger() {
  const rows = [
    { w: "w-[38%]", cls: "border border-dashed border-border-strong/70" },
    { w: "w-[68%]", cls: "bg-hairline" },
    { w: "w-full", cls: "bg-hairline" },
  ];
  return (
    <div aria-hidden="true" className="border-t border-hairline">
      {rows.map((r, i) => (
        <div key={i} className="border-b border-hairline py-4">
          <span className={cn("block h-2.5 rounded-full", r.w, r.cls)} />
        </div>
      ))}
    </div>
  );
}

export const errorButton = {
  primary: "inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-[15px] font-medium text-on-accent hover:bg-accent-hover",
  secondary: "inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] border border-border-strong/60 bg-surface px-5 text-[15px] font-medium text-text hover:bg-sunken",
};
