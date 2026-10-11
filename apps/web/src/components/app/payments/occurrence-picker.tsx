"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { dateLabel } from "@/lib/format";
import type { OccurrenceDto } from "@/lib/types";
import { amountLabel } from "./amount";

export const occurrenceKey = (o: Pick<OccurrenceDto, "obligationId" | "dueDate">) => `${o.obligationId}|${o.dueDate}`;

/**
 * Searchable choice of one unpaid occurrence, grouped Overdue / Upcoming.
 * Native radios: arrow keys move the selection, the search narrows the list.
 */
export function OccurrencePicker({
  occurrences,
  value,
  onChange,
  id,
  ...aria
}: {
  occurrences: OccurrenceDto[];
  value: string;
  onChange: (key: string) => void;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const name = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const selectedRef = useRef<HTMLLabelElement | null>(null);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => occurrences.filter((o) => !q || o.title.toLowerCase().includes(q) || o.category.toLowerCase().includes(q) || dateLabel(o.dueDate).toLowerCase().includes(q) || o.dueDate.includes(q)),
    [occurrences, q],
  );
  const groups = [
    { label: "Overdue", items: filtered.filter((o) => o.overdue) },
    { label: "Upcoming", items: filtered.filter((o) => !o.overdue) },
  ].filter((g) => g.items.length > 0);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
    // Only when the list first renders with a preselected occurrence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-[var(--radius-control)] border border-border-strong/50 bg-surface">
      <div className="relative border-b border-hairline">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-3" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, category or date"
          aria-controls={listId}
          aria-describedby={aria["aria-describedby"]}
          aria-invalid={aria["aria-invalid"]}
          autoComplete="off"
          className={cn(inputClass, "h-9 rounded-b-none border-0 pl-8 focus-visible:outline-offset-[-2px]")}
        />
      </div>
      <div id={listId} role="radiogroup" aria-label="Unpaid occurrences" className="max-h-72 overflow-y-auto p-1">
        {groups.length === 0 && <p className="px-2 py-6 text-center text-[13px] text-text-2">{occurrences.length === 0 ? "Nothing unpaid in the next 120 days." : `No unpaid occurrence matches “${query}”.`}</p>}
        {groups.map((g) => (
          <div key={g.label} role="group" aria-label={g.label}>
            <div className={cn("px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em]", g.label === "Overdue" ? "text-danger" : "text-text-3")}>
              {g.label} <span className="num font-normal normal-case tracking-normal">({g.items.length})</span>
            </div>
            {g.items.map((o) => {
              const k = occurrenceKey(o);
              const checked = k === value;
              return (
                <label
                  key={k}
                  ref={checked ? selectedRef : undefined}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-[5px] px-2 py-2 text-[13px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]",
                    checked ? "bg-accent-subtle" : "hover:bg-sunken",
                  )}
                >
                  <input type="radio" name={name} value={k} checked={checked} onChange={() => onChange(k)} className="sr-only" />
                  <span aria-hidden="true" className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", checked ? "border-accent" : "border-border-strong/70")}>
                    <span className={cn("size-2 rounded-full bg-accent", checked ? "opacity-100" : "opacity-0")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text">{o.title}</span>
                    <span className={cn("block text-xs", o.overdue ? "text-danger" : "text-text-3")}>
                      Due {dateLabel(o.dueDate, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      {o.overdue ? " · overdue" : ""}
                    </span>
                  </span>
                  <span className="num shrink-0 text-right text-[13px] text-text">{amountLabel(o.amount, o.currency)}</span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
