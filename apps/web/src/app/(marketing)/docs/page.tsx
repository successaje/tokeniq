import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DOC_PAGES } from "@/components/marketing/docs-content";
import { pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "Documentation",
  description: "Get started with TokenIQ and learn how the reserve, obligations, deployable surplus, policies and approvals work, with a full calculation reference.",
  path: "/docs",
});

const GROUPS = ["Start", "Concepts", "Reference", "Help"] as const;

export default function DocsHome() {
  return (
    <div>
      <p className="text-xs font-medium text-text-2">Documentation</p>
      <h1 className="mt-3 text-[36px] font-medium leading-[42px] tracking-[-0.02em] text-text sm:text-[44px] sm:leading-[50px]">How TokenIQ works, precisely.</h1>
      <p className="mt-4 max-w-2xl text-[16px] leading-7 text-text-2">
        Plain explanations of every figure TokenIQ shows and every rule it applies. If something here and the product ever disagree, the product’s calculation is a bug: tell us on the{" "}
        <Link href="/contact" className="text-accent underline underline-offset-2">
          contact page
        </Link>
        .
      </p>
      <div className="mt-12 space-y-12">
        {GROUPS.map((g) => (
          <section key={g} aria-labelledby={`docs-${g}`}>
            <h2 id={`docs-${g}`} className="border-t border-hairline pt-4 text-xs font-medium text-text-2">
              {g}
            </h2>
            <ul className="mt-4 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-hairline sm:grid-cols-2">
              {DOC_PAGES.filter((d) => d.group === g).map((d) => (
                <li key={d.slug} className="bg-surface">
                  <Link href={`/docs/${d.slug}`} className="group flex h-full flex-col p-4 transition-colors duration-[var(--dur-fast)] hover:bg-sunken sm:p-5">
                    <span className="flex items-center justify-between gap-3 text-[15px] font-semibold text-text">
                      {d.title}
                      <ArrowRight className="size-4 text-text-3 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                    </span>
                    <span className="mt-1 text-[13px] leading-5 text-text-2">{d.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
