"use client";

import { addDays, parseDecimal } from "@tokeniq/core";
import { ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/cn";
import { dateLabel, usd } from "@/lib/format";
import type { OccurrenceDto } from "@/lib/types";
import { CertaintyBadge } from "./badges";
import { currencyAmount, sumUsd } from "./format";

interface Bucket {
  key: string;
  label: string;
  short: string;
  from: string | null;
  to: string;
  overdue: boolean;
  items: OccurrenceDto[];
  total: string;
  byCertainty: Record<OccurrenceDto["certainty"], string>;
}

const toNum = (v: string) => Number.parseFloat(v); // bar geometry only

/**
 * The next 90 days as weekly columns, with an "Overdue" column first. Bars show
 * outflows stacked by certainty (pattern, not just colour); each column is a
 * button that filters the list below, which doubles as the table alternative.
 */
export function ObligationTimeline({ occurrences, asOf, days = 90 }: { occurrences: OccurrenceDto[]; asOf: string; days?: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const through = addDays(asOf, days);

  const buckets = useMemo(() => {
    const inWindow = occurrences.filter((o) => o.overdue || o.dueDate <= through);
    const mk = (key: string, label: string, short: string, from: string | null, to: string, overdue: boolean): Bucket => {
      const items = inWindow.filter((o) => (overdue ? o.overdue : !o.overdue && o.dueDate >= from! && o.dueDate <= to));
      const out = items.filter((o) => o.direction === "outflow");
      return {
        key,
        label,
        short,
        from,
        to,
        overdue,
        items,
        total: sumUsd(out.map((o) => o.usd)),
        byCertainty: {
          invoiced: sumUsd(out.filter((o) => o.certainty === "invoiced").map((o) => o.usd)),
          committed: sumUsd(out.filter((o) => o.certainty === "committed").map((o) => o.usd)),
          estimate: sumUsd(out.filter((o) => o.certainty === "estimate").map((o) => o.usd)),
        },
      };
    };
    const list: Bucket[] = [mk("overdue", "Overdue", "Overdue", null, asOf, true)];
    for (let i = 0; i * 7 <= days; i++) {
      const from = addDays(asOf, i * 7);
      const to = addDays(asOf, Math.min(i * 7 + 6, days));
      list.push(mk(`w${i}`, `${dateLabel(from, { month: "short", day: "numeric" })} – ${dateLabel(to, { month: "short", day: "numeric" })}`, dateLabel(from, { month: "short", day: "numeric" }), from, to, false));
    }
    return list;
  }, [occurrences, asOf, days, through]);

  const max = Math.max(1, ...buckets.map((b) => toNum(b.total)));
  const active = buckets.find((b) => b.key === selected) ?? null;
  const listed = active ? active.items : buckets.flatMap((b) => b.items);
  const visible = showAll || active ? listed : listed.slice(0, 10);
  const totalOut = sumUsd(buckets.flatMap((b) => b.items.filter((o) => o.direction === "outflow").map((o) => o.usd)));
  const overdue = buckets[0]!;
  const peak = buckets.slice(1).reduce((best, b) => (parseDecimal(b.total) > parseDecimal(best.total) ? b : best), buckets[1]!);
  const summary = `${usd(totalOut)} of outflows in the next ${days} days${parseDecimal(overdue.total) > 0n ? `, plus ${usd(overdue.total)} overdue` : ""}. Busiest week: ${peak.label}, ${usd(peak.total)}.`;

  return (
    <div>
      <p className="sr-only">{summary}</p>
      <div className="flex items-end gap-[3px] sm:gap-1" role="group" aria-label={`Payments due by week. ${summary} Select a week to filter the list.`}>
        {buckets.map((b, i) => {
          const h = toNum(b.total) / max;
          const isSel = selected === b.key;
          const empty = b.items.length === 0;
          if (b.overdue && empty) return null;
          return (
            <button
              key={b.key}
              type="button"
              aria-pressed={isSel}
              aria-label={`${b.label}: ${usd(b.total)} due across ${b.items.length} payment${b.items.length === 1 ? "" : "s"}${b.overdue ? ", overdue" : ""}`}
              onClick={() => setSelected(isSel ? null : b.key)}
              className={cn(
                "group flex min-w-0 flex-1 flex-col items-stretch rounded-[var(--radius-chip)] px-[1px] pb-1 pt-1 text-left transition-colors duration-[var(--dur-fast)] hover:bg-sunken",
                isSel && "bg-sunken ring-1 ring-border-strong/40",
                b.overdue && "mr-1 max-w-16 sm:mr-2",
              )}
            >
              <span className="flex h-24 flex-col justify-end sm:h-28">
                {b.overdue ? (
                  <span className="w-full rounded-[3px] border border-danger bg-danger-subtle" style={{ height: `${Math.max(6, h * 100)}%` }} />
                ) : (
                  <span className="flex w-full flex-col justify-end gap-[2px] overflow-hidden rounded-[3px]" style={{ height: `${empty ? 0 : Math.max(4, h * 100)}%` }}>
                    {(["estimate", "committed", "invoiced"] as const).map((c) => {
                      const v = toNum(b.byCertainty[c]);
                      if (v <= 0) return null;
                      return <span key={c} className={cn("w-full shrink-0", c === "invoiced" ? "bg-obligations" : c === "committed" ? "ticks-obligations" : "border border-dashed border-obligations bg-transparent")} style={{ flexGrow: v, flexBasis: 0, minHeight: 3 }} />;
                    })}
                  </span>
                )}
                {empty && !b.overdue && <span className="h-px w-full bg-hairline" />}
              </span>
              <span className={cn("-mx-2 mt-1 block whitespace-nowrap text-center text-[10px] leading-3 sm:mx-0 sm:truncate sm:text-[11px]", b.overdue ? "font-medium text-danger" : isSel ? "font-medium text-text" : "text-text-3", !b.overdue && i % 2 === 0 && !isSel && "max-sm:invisible")}>
                {b.overdue ? "Overdue" : b.short}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-3">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-[2px] bg-obligations" /> Invoiced
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="ticks-obligations inline-block size-3 rounded-[2px]" /> Committed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-[2px] border border-dashed border-obligations" /> Estimate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-[2px] border border-danger bg-danger-subtle" /> Overdue (unpaid)
        </span>
        <span className="ml-auto">Weeks start {dateLabel(asOf, { weekday: "long" })}s · amounts in USD</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-medium text-text">
          {active ? (
            <>
              {active.overdue ? "Overdue" : `Week of ${active.label}`} · <Money value={active.total} />
            </>
          ) : (
            `All ${listed.length} due date${listed.length === 1 ? "" : "s"} through ${dateLabel(through)}`
          )}
        </h3>
        {active && (
          <button type="button" onClick={() => setSelected(null)} className="text-xs font-medium text-accent hover:underline">
            Show all weeks
          </button>
        )}
      </div>
      {listed.length === 0 ? (
        <p className="mt-2 text-[13px] text-text-2">{active ? "Nothing is due this week." : `Nothing is due in the next ${days} days.`}</p>
      ) : (
        <ul className="mt-1 divide-y divide-hairline">
          {visible.map((o) => (
            <li key={`${o.obligationId}-${o.dueDate}`} className="flex items-center gap-3 py-2.5">
              <div className="w-16 shrink-0 text-xs">
                <div className={cn("num font-medium", o.overdue ? "text-danger" : "text-text")}>{dateLabel(o.dueDate, { month: "short", day: "numeric" })}</div>
                <div className={o.overdue ? "text-danger" : "text-text-3"}>{o.overdue ? "Overdue" : dateLabel(o.dueDate, { weekday: "short" })}</div>
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/app/obligations/${o.obligationId}`} className="block truncate text-[13px] font-medium text-text hover:underline">
                  {o.title}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <CertaintyBadge certainty={o.certainty} />
                  {o.direction === "inflow" && (
                    <span className="inline-flex items-center gap-1 text-xs text-text-2">
                      <ArrowDownLeft className="size-3.5" aria-hidden="true" /> Expected inflow
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={cn("num text-[13px] font-medium", o.direction === "inflow" ? "text-text-2" : "text-text")}>
                  {o.direction === "inflow" ? "+" : ""}
                  {currencyAmount(o.amount, o.currency)}
                </div>
                {o.currency !== "USD" && (o.usd ? <Money value={o.usd} approximate className="block text-xs text-text-3" /> : <span className="block text-xs text-warning">No USD rate</span>)}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!active && listed.length > 10 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-medium text-accent hover:underline" aria-expanded={showAll}>
          {showAll ? "Show fewer" : `Show all ${listed.length}`}
        </button>
      )}
    </div>
  );
}
