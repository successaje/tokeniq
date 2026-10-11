import Link from "next/link";
import type { ReactNode } from "react";
import { Callout } from "@/components/ui/status";
import { Container } from "./primitives";

const LEGAL = [
  { href: "/legal/privacy", label: "Privacy notice" },
  { href: "/legal/terms", label: "Terms of use" },
  { href: "/legal/risks", label: "Risk disclosure" },
];

/** Shared frame for legal documents. Every one is marked as a draft until counsel has reviewed it. */
export function LegalPage({ title, intro, updated, current, children }: { title: string; intro: ReactNode; updated: string; current: string; children: ReactNode }) {
  return (
    <Container className="grid gap-10 pb-24 pt-12 lg:grid-cols-12 lg:gap-8 lg:pt-16">
      <aside className="lg:col-span-3">
        <nav aria-label="Legal" className="lg:sticky lg:top-24">
          <p className="text-xs font-medium text-text-3">Legal</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 lg:block lg:space-y-1">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={l.href === current ? "page" : undefined} className="inline-flex min-h-8 items-center text-[13px] text-text-2 hover:text-text aria-[current=page]:font-medium aria-[current=page]:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <article className="min-w-0 lg:col-span-9 xl:col-span-8">
        <h1 className="text-[32px] font-medium leading-[38px] tracking-[-0.02em] text-text sm:text-[40px] sm:leading-[46px]">{title}</h1>
        <p className="mt-2 text-xs text-text-3">Draft · last updated {updated}</p>
        <Callout tone="warning" title="Draft: requires review by qualified counsel before production use" className="mt-6">
          This document is a working draft written by the product team. It is not legal advice and has not been reviewed by a lawyer. Bracketed items are placeholders to be completed.
        </Callout>
        <div className="mk-prose mt-8 max-w-[70ch]">
          <p>{intro}</p>
          {children}
        </div>
      </article>
    </Container>
  );
}
