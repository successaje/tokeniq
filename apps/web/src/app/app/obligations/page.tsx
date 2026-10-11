"use client";

import { addDays } from "@tokeniq/core";
import { ArrowDownLeft, CalendarClock, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CertaintyBadge, ObligationStatusBadge, PriorityLabel } from "@/components/app/obligations/badges";
import { CATEGORIES, categoryLabel, CERTAINTY, currencyAmount, dueInLabel, recurrenceLabel, sumUsd, usdByObligation } from "@/components/app/obligations/format";
import { ObligationSheet } from "@/components/app/obligations/obligation-sheet";
import { ObligationTimeline } from "@/components/app/obligations/timeline";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { dateLabel, usd } from "@/lib/format";
import { useCan, useOrgQuery } from "@/lib/org";
import type { ObligationDto, ObligationScheduleDto, OverviewDto } from "@/lib/types";

type StatusFilter = "active" | "paused" | "completed" | "cancelled" | "all";

export default function ObligationsPage() {
  return (
    <Suspense fallback={<ObligationsSkeleton />}>
      <Obligations />
    </Suspense>
  );
}

function Obligations() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canWrite = useCan("obligations.write");
  const list = useOrgQuery<{ obligations: ObligationDto[] }>("/obligations?status=all");
  // One year of occurrences: the 90-day timeline, due-window totals and the engine's USD value of EUR obligations.
  const schedule = useOrgQuery<ObligationScheduleDto>("/obligations/schedule?days=366");
  const overview = useOrgQuery<OverviewDto>("/treasury");
  const [localOpen, setLocalOpen] = useState(false);
  const sheetOpen = localOpen || params.get("new") === "1";
  const setSheetOpen = (v: boolean) => {
    setLocalOpen(v);
    if (!v && params.get("new")) router.replace(pathname, { scroll: false });
  };

  const header = (
    <PageHeader
      title="Obligations"
      description="Payroll, vendors, invoices and other commitments. Unpaid amounts due within the policy horizon are protected by the reserve."
      meta={
        schedule.data ? (
          <>
            <span>Schedule as of {dateLabel(schedule.data.asOf)}</span>
            <span>EUR converted at the current rate</span>
          </>
        ) : null
      }
      actions={
        canWrite ? (
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Record obligation
          </Button>
        ) : null
      }
    />
  );

  const sheet = canWrite ? <ObligationSheet open={sheetOpen} onOpenChange={setSheetOpen} /> : null;

  if (list.isLoading || schedule.isLoading) return <ObligationsSkeleton />;
  if (list.isError || !list.data) {
    return (
      <div>
        {header}
        <Callout tone="danger" title="Couldn't load obligations" action={<Button variant="secondary" size="sm" onClick={() => list.refetch()}>Try again</Button>}>
          {(list.error as Error)?.message ?? "Unknown error"}. Nothing was changed.
        </Callout>
        {sheet}
      </div>
    );
  }

  const obligations = list.data.obligations;
  if (obligations.length === 0) {
    return (
      <div>
        {header}
        <EmptyState
          icon={CalendarClock}
          title="Record your first obligation"
          description={
            <>
              <p>Add what the organization has to pay: payroll, contributors, vendors, audits, taxes, grants. TokenIQ protects unpaid amounts due within your policy horizon before anything is considered deployable.</p>
              <p className="mt-2 text-text-3">Recurring items (like monthly payroll) only need to be entered once. Mark each one as an estimate, committed or invoiced so the reserve reflects how sure you are.</p>
            </>
          }
          actions={canWrite ? <Button size="sm" onClick={() => setSheetOpen(true)}>Record obligation</Button> : <span className="text-xs text-text-3">Owners, admins and finance members can record obligations.</span>}
        />
        {sheet}
      </div>
    );
  }

  return (
    <div>
      {header}
      {schedule.isError && (
        <Callout tone="warning" className="mb-4" title="The schedule couldn't be loaded" action={<Button variant="secondary" size="sm" onClick={() => schedule.refetch()}>Try again</Button>}>
          The list is complete, but due-date totals and the timeline are missing. {(schedule.error as Error)?.message}
        </Callout>
      )}
      {schedule.data && <SummaryStrip schedule={schedule.data} overview={overview.data ?? null} />}
      {schedule.data && (
        <Card className="mb-4">
          <CardHeader title="Next 90 days" description="Unpaid due dates by week. Paid and skipped dates are removed; overdue ones stay until they are recorded." />
          <CardBody>
            <ObligationTimeline occurrences={schedule.data.occurrences} asOf={schedule.data.asOf} days={90} />
          </CardBody>
        </Card>
      )}
      <ObligationList obligations={obligations} schedule={schedule.data ?? null} />
      {sheet}
    </div>
  );
}

function SummaryStrip({ schedule, overview }: { schedule: ObligationScheduleDto; overview: OverviewDto | null }) {
  const out = schedule.occurrences.filter((o) => o.direction === "outflow");
  const overdue = out.filter((o) => o.overdue);
  const within = (days: number) => out.filter((o) => !o.overdue && o.dueDate <= addDays(schedule.asOf, days));
  const windows = [7, 30, 90].map((d) => ({ d, items: within(d) }));
  const unconverted = out.filter((o) => o.usd === null).length;
  const burn = overview?.reserve.burn;

  return (
    <Card className="mb-4">
      <dl className="grid grid-cols-2 divide-hairline sm:grid-cols-3 lg:grid-cols-5 lg:divide-x [&>div]:border-hairline max-lg:[&>div]:border-b">
        <div className="px-4 py-3 sm:px-5">
          <dt className="text-xs font-medium text-text-2">Overdue</dt>
          <dd className={cn("mt-0.5 text-xl font-medium tracking-tight", overdue.length ? "text-danger" : "text-text")}>
            <Money value={sumUsd(overdue.map((o) => o.usd))} compact />
          </dd>
          <dd className={cn("mt-0.5 text-xs", overdue.length ? "text-danger" : "text-text-3")}>{overdue.length ? `${overdue.length} unpaid date${overdue.length === 1 ? "" : "s"} in the last 30 days` : "Nothing overdue"}</dd>
        </div>
        {windows.map(({ d, items }) => (
          <div key={d} className="px-4 py-3 sm:px-5">
            <dt className="text-xs font-medium text-text-2">Due in {d} days</dt>
            <dd className="mt-0.5 text-xl font-medium tracking-tight text-text">
              <Money value={sumUsd(items.map((o) => o.usd))} compact />
            </dd>
            <dd className="mt-0.5 text-xs text-text-3">
              {items.length} payment{items.length === 1 ? "" : "s"} · through {dateLabel(addDays(schedule.asOf, d), { month: "short", day: "numeric" })}
            </dd>
          </div>
        ))}
        <div className="col-span-2 px-4 py-3 sm:col-span-1 sm:px-5">
          <dt className="text-xs font-medium text-text-2">Recurring monthly burn</dt>
          <dd className="mt-0.5 text-xl font-medium tracking-tight text-text">{burn ? <Money value={burn.itemized} compact /> : <Skeleton className="mt-1 h-6 w-20" />}</dd>
          <dd className="mt-0.5 text-xs text-text-3">
            {burn ? (burn.declared !== null ? `Declared burn ${usd(burn.declared, { compact: true })}/mo · ${burn.basis === "itemized_exceeds_declared" ? "itemized is higher, so it is used" : "declared is used"}` : "From recurring obligations · no burn declared") : "Calculating…"}
          </dd>
        </div>
      </dl>
      {unconverted > 0 && <p className="border-t border-hairline px-4 py-2 text-xs text-warning sm:px-5">{unconverted} due date{unconverted === 1 ? "" : "s"} could not be converted to USD and are not in these totals.</p>}
    </Card>
  );
}

function ObligationList({ obligations, schedule }: { obligations: ObligationDto[]; schedule: ObligationScheduleDto | null }) {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [category, setCategory] = useState<string>("all");
  const [certainty, setCertainty] = useState<string>("all");
  const [q, setQ] = useState("");
  const usdOf = useMemo(() => usdByObligation(schedule?.occurrences ?? []), [schedule]);
  const overdueIds = useMemo(() => new Set((schedule?.occurrences ?? []).filter((o) => o.overdue).map((o) => o.obligationId)), [schedule]);
  const asOf = schedule?.asOf ?? new Date().toISOString().slice(0, 10);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { active: 0, paused: 0, completed: 0, cancelled: 0, all: obligations.length };
    for (const o of obligations) c[o.status]++;
    return c;
  }, [obligations]);

  const needle = q.trim().toLowerCase();
  const rows = obligations
    .filter((o) => status === "all" || o.status === status)
    .filter((o) => category === "all" || o.category === category)
    .filter((o) => certainty === "all" || o.certainty === certainty)
    .filter((o) => !needle || [o.title, o.counterparty, o.invoiceNumber, o.notes].some((v) => v?.toLowerCase().includes(needle)))
    .sort((a, b) => (a.nextDueDate ?? "9999").localeCompare(b.nextDueDate ?? "9999") || a.title.localeCompare(b.title));
  const filtered = category !== "all" || certainty !== "all" || needle !== "";
  const usedCategories = CATEGORIES.filter((c) => obligations.some((o) => o.category === c));

  return (
    <Card>
      <div className="space-y-3 border-b border-hairline px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[15px] font-semibold text-text">All obligations</h2>
          <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
            <Segmented
              label="Status"
              size="sm"
              className="[&>button]:whitespace-nowrap"
              value={status}
              onValueChange={setStatus}
              options={(["active", "paused", "completed", "cancelled", "all"] as const).map((s) => ({ value: s, label: `${s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} · ${counts[s]}` }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="relative col-span-2 sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-3" aria-hidden="true" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, counterparty, invoice" aria-label="Search obligations" className="h-8 pl-8 text-[13px]" type="search" />
          </div>
          <label htmlFor="ob-filter-category" className="sr-only">
            Category
          </label>
          <Select id="ob-filter-category" value={category} onValueChange={setCategory} className="h-8 text-[13px] sm:w-44" options={[{ value: "all", label: "All categories" }, ...usedCategories.map((c) => ({ value: c, label: categoryLabel(c) }))]} />
          <label htmlFor="ob-filter-certainty" className="sr-only">
            Certainty
          </label>
          <Select id="ob-filter-certainty" value={certainty} onValueChange={setCertainty} className="h-8 text-[13px] sm:w-40" options={[{ value: "all", label: "Any certainty" }, ...(Object.keys(CERTAINTY) as Array<keyof typeof CERTAINTY>).map((c) => ({ value: c, label: CERTAINTY[c].label }))]} />
          {filtered && (
            <Button
              variant="ghost"
              size="sm"
              className="col-span-2 justify-self-start"
              onClick={() => {
                setQ("");
                setCategory("all");
                setCertainty("all");
              }}
            >
              <X className="size-3.5" aria-hidden="true" /> Clear
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="text-sm font-medium text-text">No obligations match</p>
          <p className="mt-1 text-[13px] text-text-2">{status !== "all" && counts[status] === 0 ? `Nothing is ${status}.` : "Try a different search or filter."}</p>
          {(filtered || status !== "all") && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                setQ("");
                setCategory("all");
                setCertainty("all");
                setStatus("all");
              }}
            >
              <X className="size-3.5" aria-hidden="true" /> Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop and tablet: table */}
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">Obligations, sorted by next due date</caption>
              <thead>
                <tr>
                  <Th>Obligation</Th>
                  <Th className="hidden xl:table-cell">Category</Th>
                  <Th numeric>Amount</Th>
                  <Th>Schedule</Th>
                  <Th>Next due</Th>
                  <Th>Certainty</Th>
                  <Th className="hidden lg:table-cell">Priority</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <Tr key={o.id} className="relative">
                    <Td className="max-w-72">
                      <Link href={`/app/obligations/${o.id}`} className="block truncate font-medium text-text after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-offset-[-2px]">
                        {o.title}
                      </Link>
                      <div className="flex items-center gap-1.5 truncate text-xs text-text-3">
                        {o.direction === "inflow" && <ArrowDownLeft className="size-3.5 shrink-0" aria-label="Expected inflow" />}
                        <span className="truncate">{o.counterparty ?? (o.invoiceNumber ? `Invoice ${o.invoiceNumber}` : "No counterparty")}</span>
                        <span className="xl:hidden">· {categoryLabel(o.category)}</span>
                      </div>
                    </Td>
                    <Td className="hidden text-text-2 xl:table-cell">{categoryLabel(o.category)}</Td>
                    <Td numeric>
                      <AmountCell o={o} usdValue={usdOf.get(o.id) ?? null} />
                    </Td>
                    <Td className="text-text-2">{recurrenceLabel(o.recurrence, o.firstDueDate)}</Td>
                    <Td>
                      <NextDue o={o} asOf={asOf} overdue={overdueIds.has(o.id)} />
                    </Td>
                    <Td>
                      <CertaintyBadge certainty={o.certainty} />
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <PriorityLabel priority={o.priority} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
          {/* Mobile: stacked rows */}
          <ul className="divide-y divide-hairline md:hidden">
            {rows.map((o) => (
              <li key={o.id} className="relative px-4 py-3 hover:bg-sunken/60">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/app/obligations/${o.id}`} className="min-w-0 text-[13px] font-medium text-text after:absolute after:inset-0 after:content-['']">
                    <span className="line-clamp-2">{o.title}</span>
                  </Link>
                  <AmountCell o={o} usdValue={usdOf.get(o.id) ?? null} />
                </div>
                <div className="mt-0.5 text-xs text-text-3">
                  {o.counterparty ? `${o.counterparty} · ` : ""}
                  {categoryLabel(o.category)} · {recurrenceLabel(o.recurrence, o.firstDueDate)}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <NextDue o={o} asOf={asOf} overdue={overdueIds.has(o.id)} inline />
                  <CertaintyBadge certainty={o.certainty} />
                  <PriorityLabel priority={o.priority} />
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-4 py-2 text-xs text-text-3 sm:px-5">
            {rows.length} of {obligations.length} obligation{obligations.length === 1 ? "" : "s"} · ≈ USD values use the engine's current EUR/USD rate and are shown only for dates in the next year.
          </p>
        </>
      )}
    </Card>
  );
}

function AmountCell({ o, usdValue }: { o: ObligationDto; usdValue: string | null }) {
  return (
    <div className="shrink-0 text-right">
      <div className={cn("num whitespace-nowrap text-[13px] font-medium", o.direction === "inflow" ? "text-text-2" : "text-text")}>
        {o.direction === "inflow" ? "+" : ""}
        {currencyAmount(o.amount, o.currency)}
      </div>
      {o.currency !== "USD" && usdValue && <Money value={usdValue} approximate className="block text-xs text-text-3" />}
    </div>
  );
}

function NextDue({ o, asOf, overdue, inline }: { o: ObligationDto; asOf: string; overdue: boolean; inline?: boolean }) {
  if (o.status !== "active") return <ObligationStatusBadge status={o.status} />;
  if (!o.nextDueDate) return <span className="text-xs text-text-3">{overdue ? <span className="font-medium text-danger">Overdue</span> : "No further dates"}</span>;
  const label = dueInLabel(o.nextDueDate, asOf);
  return (
    <span className={cn(inline ? "inline-flex items-baseline gap-1.5 text-xs" : "block")}>
      <span className={cn("num whitespace-nowrap", inline ? "font-medium text-text" : "text-[13px] text-text")}>{dateLabel(o.nextDueDate, { month: "short", day: "numeric", year: o.nextDueDate.slice(0, 4) === asOf.slice(0, 4) ? undefined : "numeric" })}</span>
      <span className={cn("block whitespace-nowrap text-xs", overdue ? "font-medium text-danger" : "text-text-3", inline && "inline")}>{overdue ? "Earlier date overdue" : label}</span>
    </span>
  );
}

function ObligationsSkeleton() {
  return (
    <LoadingRegion label="Loading obligations…">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-hairline sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface px-4 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-24" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="mb-4 h-64" />
      <div className="rounded-[var(--radius-card)] border border-hairline bg-surface">
        <Skeleton className="m-4 h-8 w-2/3" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mx-4 mb-3 h-10" />
        ))}
      </div>
    </LoadingRegion>
  );
}
