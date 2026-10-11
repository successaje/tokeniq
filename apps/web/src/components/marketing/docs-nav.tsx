"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const GROUPS: Array<{ label: string; items: Array<{ href: string; label: string }> }> = [
  { label: "Start", items: [{ href: "/docs/getting-started", label: "Getting started" }] },
  {
    label: "Concepts",
    items: [
      { href: "/docs/reserve", label: "The protected reserve" },
      { href: "/docs/obligations", label: "Obligations" },
      { href: "/docs/deployable-surplus", label: "Deployable surplus" },
      { href: "/docs/policies", label: "Policies" },
      { href: "/docs/approvals-signatures-execution", label: "Approvals, signatures and execution" },
    ],
  },
  { label: "Reference", items: [{ href: "/docs/calculation-reference", label: "Calculation reference" }] },
  { label: "Help", items: [{ href: "/docs/faq", label: "FAQ" }] },
];

export function DocsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation">
      <Link href="/docs" aria-current={pathname === "/docs" ? "page" : undefined} className="text-[13px] font-semibold text-text hover:text-accent aria-[current=page]:text-accent">
        Documentation
      </Link>
      <div className="mt-4 flex gap-6 overflow-x-auto pb-2 lg:block lg:space-y-5 lg:overflow-visible lg:pb-0">
        {GROUPS.map((g) => (
          <div key={g.label} className="shrink-0">
            <p className="text-xs font-medium text-text-3">{g.label}</p>
            <ul className="mt-1.5 space-y-0.5">
              {g.items.map((it) => {
                const active = pathname === it.href;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "-ml-2 flex min-h-8 items-center rounded-[var(--radius-control)] px-2 text-[13px] transition-colors duration-[var(--dur-fast)] lg:border-l-2 lg:rounded-l-none lg:pl-3",
                        active ? "bg-accent-subtle font-medium text-accent lg:border-accent lg:bg-transparent" : "text-text-2 hover:text-text lg:border-hairline",
                      )}
                    >
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
