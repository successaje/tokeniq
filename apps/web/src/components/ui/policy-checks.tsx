"use client";

import { AlertTriangle, CheckCircle2, ChevronDown, OctagonAlert } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { PolicyCheck } from "@/lib/types";

const META = {
  pass: { icon: CheckCircle2, tone: "text-success", label: "Pass" },
  warn: { icon: AlertTriangle, tone: "text-warning", label: "Warning" },
  fail: { icon: OctagonAlert, tone: "text-danger", label: "Fails" },
} as const;

export function checkCounts(checks: PolicyCheck[]) {
  return {
    pass: checks.filter((c) => c.status === "pass").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
  };
}

/** "12 pass · 1 warning · 2 failing" (only non-zero parts after the passes). */
export function checkSummary(checks: PolicyCheck[]): string {
  const c = checkCounts(checks);
  return [`${c.pass} pass`, c.warn ? `${c.warn} warning${c.warn === 1 ? "" : "s"}` : null, c.fail ? `${c.fail} failing` : null].filter(Boolean).join(" · ");
}

function Row({ c }: { c: PolicyCheck }) {
  const m = META[c.status];
  return (
    <li className="flex gap-2.5 py-2">
      <m.icon className={cn("mt-0.5 size-4 shrink-0", m.tone)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[13px] font-medium text-text">{c.label}</span>
          <span className={cn("text-xs font-medium", m.tone)}>{m.label}</span>
        </div>
        <p className="text-xs text-text-2">{c.detail}</p>
      </div>
    </li>
  );
}

/**
 * Policy checks from the deterministic engine, failures and warnings first.
 * Each row is icon + status word + label + detail, so status never depends on
 * colour. With `collapsePassing`, passing checks sit behind a disclosure so the
 * ones that need attention are read first.
 */
export function PolicyCheckList({ checks, className, order = true, collapsePassing = false }: { checks: PolicyCheck[]; className?: string; order?: boolean; collapsePassing?: boolean }) {
  const [open, setOpen] = useState(false);
  const rank = { fail: 0, warn: 1, pass: 2 } as const;
  const list = order ? [...checks].sort((a, b) => rank[a.status] - rank[b.status]) : checks;
  if (!collapsePassing) {
    return (
      <ul className={cn("divide-y divide-hairline", className)}>
        {list.map((c) => (
          <Row key={c.id} c={c} />
        ))}
      </ul>
    );
  }
  const attention = list.filter((c) => c.status !== "pass");
  const passing = list.filter((c) => c.status === "pass");
  return (
    <div className={className}>
      {attention.length > 0 && (
        <ul className="divide-y divide-hairline">
          {attention.map((c) => (
            <Row key={c.id} c={c} />
          ))}
        </ul>
      )}
      {passing.length > 0 && (
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger className={cn("inline-flex items-center gap-1.5 py-2 text-[13px] font-medium text-text-2 hover:text-text", attention.length > 0 && "mt-1")}>
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
            {open ? "Hide" : "Show"} {passing.length} passing check{passing.length === 1 ? "" : "s"}
            <ChevronDown className={cn("size-3.5 transition-transform duration-[var(--dur-fast)]", open && "rotate-180")} aria-hidden="true" />
          </Collapsible.Trigger>
          <Collapsible.Content>
            <ul className="divide-y divide-hairline border-t border-hairline">
              {passing.map((c) => (
                <Row key={c.id} c={c} />
              ))}
            </ul>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </div>
  );
}
