"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ChevronDown, FileDown, History, Quote } from "lucide-react";
import { Collapsible } from "radix-ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { QueryError } from "@/components/ui/query-error";
import { Select } from "@/components/ui/select";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status";
import { api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateTimeLabel, relativeTime } from "@/lib/format";
import { useOrg, useOrgQuery } from "@/lib/org";
import type { ActivityEventDto, ActivityPageDto, MemberDto, MetaDto } from "@/lib/types";
import { ACTION_FILTERS, describeEvent, type DescribeContext } from "./describe";

const PAGE = 50;
const ALL = "all";

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" }).format(d);
}

export function ActivityView() {
  const { orgId } = useOrg();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = params.get("action") ?? "";
  const [prefix, setPrefix] = useState(ACTION_FILTERS.some((f) => f.value === initial) ? initial : "");

  const q = useInfiniteQuery({
    queryKey: ["org", orgId, "/activity", prefix],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => {
      const sp = new URLSearchParams({ limit: String(PAGE) });
      if (pageParam) sp.set("before", pageParam);
      if (prefix) sp.set("action", prefix);
      return api<ActivityPageDto>(orgPath(orgId, `/activity?${sp.toString()}`), { signal });
    },
    getNextPageParam: (last) => last.nextCursor,
  });
  const members = useOrgQuery<{ members: MemberDto[] }>("/members", { staleTime: 60_000 });
  const meta = useQuery({ queryKey: ["meta"], queryFn: () => api<MetaDto>("/api/v1/meta"), staleTime: 3_600_000 });

  const ctx: DescribeContext = useMemo(
    () => ({
      memberName: (id) => (id ? (members.data?.members.find((m) => m.id === id)?.name ?? null) : null),
      chainName: (id) => meta.data?.chains.find((c) => c.id === id)?.name ?? `Chain ${id}`,
    }),
    [members.data, meta.data],
  );

  const events = q.data?.pages.flatMap((p) => p.events) ?? [];
  const groups: Array<{ key: string; label: string; events: ActivityEventDto[] }> = [];
  for (const e of events) {
    const k = dayKey(e.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.events.push(e);
    else groups.push({ key: k, label: dayLabel(e.createdAt), events: [e] });
  }

  const changeFilter = (v: string) => {
    const next = v === ALL ? "" : v;
    setPrefix(next);
    const sp = new URLSearchParams(params.toString());
    if (next) sp.set("action", next);
    else sp.delete("action");
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Every change made in this organization, by whom and when. Entries are append-only and cannot be edited."
        actions={
          <Button variant="secondary" size="sm" asChild>
            <a href={orgPath(orgId, "/reports/export/activity.csv")} download>
              <FileDown className="size-4" aria-hidden="true" /> Export CSV
            </a>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="activity-filter" className="text-[13px] font-medium text-text">
          Show
        </label>
        <Select id="activity-filter" className="w-60" value={prefix || ALL} onValueChange={changeFilter} options={ACTION_FILTERS.map((f) => ({ value: f.value || ALL, label: f.label }))} />
        {q.data && (
          <span className="text-xs text-text-3" aria-live="polite">
            {events.length} event{events.length === 1 ? "" : "s"} loaded{q.hasNextPage ? " · more available" : ""}
          </span>
        )}
      </div>

      {q.isLoading ? (
        <LoadingRegion label="Loading activity…" className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </LoadingRegion>
      ) : q.isError ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't load activity" />
      ) : events.length === 0 ? (
        <EmptyState
          icon={History}
          title={prefix ? "Nothing of this kind yet" : "No activity yet"}
          description={prefix ? "No events match this filter. Choose “All activity” to see everything." : "Changes to obligations, policies, members, recommendations and proposals are recorded here as they happen."}
          actions={prefix ? <Button size="sm" variant="secondary" onClick={() => changeFilter(ALL)}>Show all activity</Button> : undefined}
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`day-${g.key}`}>
              <h2 id={`day-${g.key}`} className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text-3">
                {g.label}
              </h2>
              <Card>
                <ol className="divide-y divide-hairline">
                  {g.events.map((e) => (
                    <EventRow key={e.id} e={e} ctx={ctx} />
                  ))}
                </ol>
              </Card>
            </section>
          ))}
          <div className="flex flex-col items-center gap-2 pt-2">
            {q.hasNextPage ? (
              <Button variant="secondary" onClick={() => q.fetchNextPage()} loading={q.isFetchingNextPage} loadingLabel="Loading older activity">
                Load more
              </Button>
            ) : (
              <p className="text-xs text-text-3">You’ve reached the beginning of this organization’s history.</p>
            )}
            {q.isFetchNextPageError && <p className="text-xs text-danger" role="alert">Couldn’t load older activity. Try again.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({ e, ctx }: { e: ActivityEventDto; ctx: DescribeContext }) {
  const d = describeEvent(e, ctx);
  const [open, setOpen] = useState(false);
  const Icon = d.icon;
  const changes = d.changes?.filter((c) => c.from !== c.to) ?? [];
  return (
    <li className="flex gap-3 px-4 py-3 sm:px-5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-sunken text-text-2" aria-hidden="true">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <p className="text-[13px] text-text-2">
            <span className="font-medium text-text">{e.actor}</span>{" "}
            {e.actorType === "copilot" && (
              <StatusBadge tone="info" icon={null} className="mr-1 align-middle">
                Copilot
              </StatusBadge>
            )}
            {d.text}
            {d.href && (
              <>
                {" "}
                <Link href={d.href} className="whitespace-nowrap text-accent underline underline-offset-2">
                  View
                </Link>
              </>
            )}
          </p>
          <time dateTime={e.createdAt} title={dateTimeLabel(e.createdAt)} className="shrink-0 text-xs text-text-3">
            {relativeTime(e.createdAt)}
            <span className="hidden md:inline"> · {dateTimeLabel(e.createdAt)}</span>
          </time>
        </div>
        {d.quote && (
          <p className="mt-1.5 flex gap-1.5 text-[13px] text-text-2">
            <Quote className="mt-0.5 size-3.5 shrink-0 text-text-3" aria-hidden="true" />
            <span className="italic">{d.quote}</span>
          </p>
        )}
        {changes.length > 0 && (
          <Collapsible.Root open={open} onOpenChange={setOpen} className="mt-1.5">
            <Collapsible.Trigger className="inline-flex items-center gap-1 text-xs font-medium text-text-2 hover:text-text">
              {open ? "Hide" : "Show"} {changes.length} change{changes.length === 1 ? "" : "s"}
              <ChevronDown className={cn("size-3.5 transition-transform duration-[var(--dur-fast)]", open && "rotate-180")} aria-hidden="true" />
            </Collapsible.Trigger>
            <Collapsible.Content>
              <dl className="mt-2 divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline text-xs">
                {changes.map((c, i) => (
                  <div key={i} className="grid gap-1 px-3 py-2 sm:grid-cols-[12rem_minmax(0,1fr)]">
                    <dt className="font-medium text-text">{c.label}</dt>
                    <dd className="min-w-0 text-text-2">
                      {c.from ? (
                        <>
                          <del className="text-text-3 decoration-text-3">{c.from}</del>
                          <span aria-hidden="true"> → </span>
                          <span className="sr-only"> changed to </span>
                          <ins className="font-medium text-text no-underline">{c.to}</ins>
                        </>
                      ) : (
                        <ins className="font-medium text-text no-underline">{c.to}</ins>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </div>
    </li>
  );
}
