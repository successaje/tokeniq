import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { CTA, FOOTER_NAV, NETWORKS, TESTNETS } from "@/lib/marketing-site";
import { ThemeSwitch } from "./theme-switch";

/**
 * The footer closes the page like a statement: the logo's three ledger lines
 * written out (what can work, what is committed, what is protected), then the
 * site index in numbered sections, networks, and the legal line.
 */
export function SiteFooter() {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="border-t border-hairline bg-surface" aria-labelledby="site-footer-title">
      <h2 id="site-footer-title" className="sr-only">
        Site information
      </h2>
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 lg:grid-cols-12 lg:gap-8 lg:py-16">
          <div className="lg:col-span-5">
            <LogoMark className="size-9" />
            <p className="mt-6 max-w-sm text-[22px] font-medium leading-8 tracking-[-0.015em] text-text text-balance">Make every treasury decision count.</p>
            <p className="mt-2 max-w-sm text-sm text-text-2">Reserve-first treasury operations for on-chain organizations that hold stablecoins.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href={CTA.primary.href} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] bg-accent px-4 text-[13px] font-medium text-on-accent hover:bg-accent-hover">
                {CTA.primary.label}
              </Link>
              <Link href="/docs" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                Read the docs <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <FooterLedger />
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-9 border-t border-hairline py-10 sm:grid-cols-4">
          {FOOTER_NAV.map((group) => (
            <div key={group.label}>
              <h3 className="flex items-baseline gap-2 text-xs font-medium text-text">
                <span className="font-mono text-[11px] text-text-3" aria-hidden="true">
                  {group.index}
                </span>
                {group.label}
              </h3>
              <ul className="mt-3 space-y-1">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-7 items-center text-[13px] text-text-2 transition-colors duration-[var(--dur-fast)] hover:text-text">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="grid items-center gap-4 border-t border-hairline py-6 text-xs text-text-3 lg:grid-cols-12">
          <p className="lg:col-span-8">
            <span className="font-medium text-text-2">Networks</span> · {NETWORKS.join(" · ")} <span className="text-text-3">· Testnets: {TESTNETS.join(", ")}</span> ·{" "}
            <Link href="/integrations" className="text-accent hover:underline">
              Support details
            </Link>
          </p>
          <div className="flex items-center gap-3 lg:col-span-4 lg:justify-end">
            <span aria-hidden="true">Appearance</span>
            <ThemeSwitch />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-hairline pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-xs text-text-3 sm:flex-row sm:justify-between sm:gap-6">
          <p>
            © {year} TokenIQ. Software for treasury operations, not investment advice. Read the{" "}
            <Link href="/legal/risks" className="text-text-2 underline underline-offset-2 hover:text-text">
              risk disclosure
            </Link>
            .
          </p>
          <p className="shrink-0">Non-custodial: TokenIQ never holds keys or funds.</p>
        </div>
      </div>
    </footer>
  );
}

const LINES = [
  { label: "Free to work", note: "with approval", width: "w-[38%]", fill: "bg-deployable" },
  { label: "Committed", note: "what you owe", width: "w-[68%]", fill: "ticks-obligations" },
  { label: "Protected", note: "what policy keeps", width: "w-full", fill: "hatch-reserve" },
] as const;

/** The logo mark, written out as three ledger rows. Decorative: no figures, no data. */
function FooterLedger() {
  return (
    <div>
      <p className="sr-only">TokenIQ separates what can work, what is committed and what is protected.</p>
      <div aria-hidden="true" className="border-t border-hairline">
        {LINES.map((l) => (
          <div key={l.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-4 border-b border-hairline py-4 sm:grid-cols-[8rem_minmax(0,1fr)_8rem]">
            <span className="text-[13px] font-medium text-text">{l.label}</span>
            <span className="block h-2.5">
              <span className={cn("block h-full rounded-full", l.width, l.fill)} />
            </span>
            <span className="hidden text-right font-mono text-[11px] text-text-3 sm:block">{l.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
