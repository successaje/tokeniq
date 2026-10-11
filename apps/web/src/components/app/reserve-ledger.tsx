"use client";

import { ChevronDown } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState } from "react";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/cn";
import { pct } from "@/lib/format";
import type { ReserveDto, TreasuryDto } from "@/lib/types";

/**
 * "How this is calculated": the deployable figure as visible arithmetic,
 * every line traceable to a policy rule or an observed balance.
 */
export function ReserveLedger({ reserve, treasury, defaultOpen = false, maxDeployedBps }: { reserve: ReserveDto; treasury: TreasuryDto; defaultOpen?: boolean; maxDeployedBps?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  const binding = reserve.rules.find((r) => r.binding);
  const line = (label: React.ReactNode, value: string, opts: { sign?: "−" | "="; note?: React.ReactNode; strong?: boolean } = {}) => (
    <div className={cn("grid grid-cols-[1.25rem_1fr_auto] items-baseline gap-x-2 py-1.5", opts.strong && "border-t border-hairline pt-2 font-medium")}>
      <span className="text-text-3" aria-hidden="true">
        {opts.sign ?? ""}
      </span>
      <span className="min-w-0">
        <span className="text-text">{label}</span>
        {opts.note && <span className="block text-xs text-text-3">{opts.note}</span>}
      </span>
      <Money value={value} className={cn("text-right", opts.strong ? "text-text" : "text-text-2")} />
    </div>
  );
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
        How this is calculated
        <ChevronDown className={cn("size-3.5 transition-transform duration-[var(--dur-fast)]", open && "rotate-180")} aria-hidden="true" />
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-3 rounded-[var(--radius-card)] bg-sunken px-4 py-2 text-[13px]">
        {line("Reserve-eligible stablecoins", reserve.available, { note: "Liquid stablecoins in verified accounts, valued at the oracle price but never above $1, after policy haircuts" })}
        {line(<>Policy requirement {binding && <span className="text-text-3">· {binding.label.toLowerCase()} rule</span>}</>, reserve.required, { sign: "−", note: binding?.explanation ?? "No requirement is set" })}
        {reserve.pendingOutflows !== "0" && line("Pending proposals", reserve.pendingOutflows, { sign: "−", note: "Approved or awaiting signature; counted as already spent" })}
        {line("Available after the reserve", reserve.surplus.afterReserve, { sign: "=", strong: true })}
        {reserve.surplus.limitedBy === "deployment_cap" && line("Room under the maximum-deployed limit", reserve.surplus.capRemaining, { note: `${maxDeployedBps !== undefined ? pct(maxDeployedBps, 0) : "Policy"} of the total treasury, minus what is already deployed` })}
        {line("Deployable surplus", reserve.surplus.deployable, { sign: "=", strong: true, note: reserve.surplus.explanation })}
        <p className="pb-2 pt-1 text-xs text-text-3">
          Total tracked treasury <Money value={treasury.gross} /> includes <Money value={treasury.allocated.total} /> already deployed and <Money value={treasury.liquid.other} /> in non-stable assets, which never count toward the reserve.
        </p>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
