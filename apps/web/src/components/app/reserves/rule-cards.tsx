import { parseDecimal, wadToString } from "@tokeniq/core";
import { CalendarClock, Flag, Hourglass, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { StatusBadge } from "@/components/ui/status";
import { sharePct } from "@/lib/buckets";
import { cn } from "@/lib/cn";
import { dateLabel, pct, usd } from "@/lib/format";
import type { PolicyDto, ReserveDto } from "@/lib/types";

const ICON = { floor: Flag, runway: Hourglass, obligations: CalendarClock } as const;

export const BURN_BASIS: Record<ReserveDto["burn"]["basis"], string> = {
  declared: "Declared burn (recurring obligations are lower)",
  itemized: "Recurring obligations (no burn declared)",
  itemized_exceeds_declared: "Recurring obligations, which exceed the declared burn",
  none: "Unknown: no burn declared and no recurring obligations",
};

/**
 * The three reserve rules side by side, each with the inputs the engine used.
 * The requirement is the largest enabled rule; that card is marked as binding.
 */
export function RuleCards({ reserve, policy }: { reserve: ReserveDto; policy: PolicyDto }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {reserve.rules.map((r) => {
        const Icon = ICON[r.id];
        return (
          <Card key={r.id} className={cn("relative flex flex-col overflow-hidden", r.binding && "border-reserve/70")}>
            {r.binding && <span aria-hidden="true" className="hatch-reserve absolute inset-x-0 top-0 h-1" />}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 pt-4 sm:px-5">
              <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                <Icon className="size-4 text-text-2" aria-hidden="true" />
                {r.label}
              </h3>
              {r.binding ? (
                <StatusBadge tone="neutral" icon={Lock} className="bg-transparent text-text shadow-[inset_0_0_0_1px_var(--bucket-reserve)]">
                  Binding · sets the requirement
                </StatusBadge>
              ) : !r.enabled ? (
                <StatusBadge tone="neutral" icon={null}>
                  Off
                </StatusBadge>
              ) : null}
            </div>
            <div className="px-4 pt-2 sm:px-5">
              <Money value={r.amount} className={cn("text-2xl font-medium tracking-tight", r.enabled ? "text-text" : "text-text-3")} />
              {r.enabled && reserve.required !== "0" && !r.binding && <span className="ml-2 inline-block text-xs text-text-3">{sharePct(r.amount, reserve.required).toFixed(0)}% of the requirement</span>}
            </div>
            <p className="px-4 pt-1 text-xs text-text-2 sm:px-5">{r.explanation}</p>
            <dl className="mt-3 flex-1 space-y-1.5 border-t border-hairline px-4 py-3 text-[13px] sm:px-5">
              {r.id === "floor" && (
                <>
                  <Row label="Minimum reserve (policy)" value={usd(policy.minimumReserveUsd)} />
                  {!r.enabled && <p className="text-xs text-text-3">A fixed floor protects a minimum balance even when burn and obligations are small.</p>}
                </>
              )}
              {r.id === "runway" && (
                <>
                  <Row label="Months of runway (policy)" value={policy.runwayMonths === 0 ? "Off" : String(policy.runwayMonths)} />
                  <Row label="Monthly burn used" value={<Money value={reserve.burn.used} />} />
                  <p className="text-xs text-text-3">{BURN_BASIS[reserve.burn.basis]}</p>
                </>
              )}
              {r.id === "obligations" && (
                <>
                  <Row label={`Due by ${dateLabel(reserve.horizonEnd)}`} value={<Money value={reserve.obligations.total} />} />
                  {(["invoiced", "committed", "estimate"] as const).map((c) => {
                    const v = reserve.obligations.byCertainty[c] ?? "0";
                    const excluded = c === "estimate" && !policy.includeEstimatedObligations;
                    return <Row key={c} sub label={`${c === "invoiced" ? "Invoiced" : c === "committed" ? "Committed" : "Estimates"}${excluded ? " (excluded)" : ""}`} value={<Money value={v} className={excluded ? "text-text-3 line-through decoration-text-3" : undefined} />} />;
                  })}
                  {reserve.obligations.overdue !== "0" && <Row sub label="of which overdue" value={<Money value={reserve.obligations.overdue} className="text-danger" />} />}
                  <Row label={`Buffer (${pct(policy.obligationBufferBps, 0)})`} value={<Money value={subtract(r.amount, reserve.obligations.total)} />} />
                  {reserve.obligations.unconvertible > 0 && <p className="text-xs text-warning">{reserve.obligations.unconvertible} due date(s) have no USD rate and are not included.</p>}
                </>
              )}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}

function subtract(a: string, b: string) {
  return wadToString(parseDecimal(a, 18, "down") - parseDecimal(b, 18, "down"));
}

function Row({ label, value, sub }: { label: string; value: ReactNode; sub?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", sub && "pl-3 text-xs")}>
      <dt className={sub ? "text-text-3" : "text-text-2"}>{label}</dt>
      <dd className="num text-right text-text">{value}</dd>
    </div>
  );
}
