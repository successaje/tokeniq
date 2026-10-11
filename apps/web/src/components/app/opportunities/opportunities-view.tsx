"use client";

import { AlertTriangle, BarChart3, ChevronRight, FilterX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChainLabel, Freshness } from "@/components/ui/identity";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { checkCounts } from "@/components/ui/policy-checks";
import { QueryError } from "@/components/ui/query-error";
import { Select } from "@/components/ui/select";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { pct } from "@/lib/format";
import { useOrgQuery } from "@/lib/org";
import type { OpportunitiesResponse, OpportunityDto } from "@/lib/types";
import { fetchedIso, MEASUREMENT_LABEL, protocolLabel, VENUE_STALE_MINUTES, WITHDRAWAL_LABEL } from "./labels";
import { OpportunitySheet } from "./opportunity-sheet";

const ALL = "all";

export function OpportunitiesView() {
  const q = useOrgQuery<OpportunitiesResponse>("/opportunities");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const venueId = params.get("venue");
  const [suitableOnly, setSuitableOnly] = useState(false);
  const [network, setNetwork] = useState<string>(ALL);
  const [protocol, setProtocol] = useState<string>(ALL);

  const all = useMemo(() => q.data?.opportunities ?? [], [q.data]);
  const networks = useMemo(() => [...new Map(all.map((o) => [String(o.chainId), o.chain])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [all]);
  const protocols = useMemo(() => [...new Set(all.map((o) => o.protocol))].sort(), [all]);
  const shown = all.filter((o) => (!suitableOnly || o.suitability.suitable) && (network === ALL || String(o.chainId) === network) && (protocol === ALL || o.protocol === protocol));
  const filtered = suitableOnly || network !== ALL || protocol !== ALL;
  const selected = venueId ? all.find((o) => o.id === venueId) : undefined;
  const suitableCount = all.filter((o) => o.suitability.suitable).length;

  const openVenue = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("venue", id);
    else next.delete("venue");
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };
  const clear = () => {
    setSuitableOnly(false);
    setNetwork(ALL);
    setProtocol(ALL);
  };

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Lending venues TokenIQ tracks, checked against your treasury policy. Rates are measurements from the named source, not promises."
        meta={
          q.data && (
            <>
              <Freshness at={q.data.fetchedAt} staleAfterMinutes={VENUE_STALE_MINUTES} label="Venue data fetched" />
              <span>Checked against policy v{q.data.policyVersion}</span>
              {all.length > 0 && (
                <span>
                  {suitableCount} of {all.length} suitable
                </span>
              )}
            </>
          )
        }
      />

      {q.isLoading ? (
        <LoadingRegion label="Loading venues…" className="space-y-3">
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-96 w-full" />
        </LoadingRegion>
      ) : q.isError || !q.data ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't load venues" />
      ) : all.length === 0 ? (
        <EmptyState icon={BarChart3} title="No venue data yet" description="Venue data is refreshed every 15 minutes; none has been fetched yet. Rates, liquidity and policy checks appear here after the first refresh." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <label className="flex h-9 items-center gap-2 text-[13px] font-medium text-text">
              <Switch checked={suitableOnly} onCheckedChange={setSuitableOnly} aria-label="Suitable only" />
              Suitable only
            </label>
            <div className="grid grid-cols-2 gap-2 md:flex">
              <div>
                <label htmlFor="opp-network" className="sr-only">
                  Network
                </label>
                <Select id="opp-network" value={network} onValueChange={setNetwork} className="md:w-44" options={[{ value: ALL, label: "All networks" }, ...networks.map(([id, name]) => ({ value: id, label: name }))]} />
              </div>
              <div>
                <label htmlFor="opp-protocol" className="sr-only">
                  Protocol
                </label>
                <Select id="opp-protocol" value={protocol} onValueChange={setProtocol} className="md:w-44" options={[{ value: ALL, label: "All protocols" }, ...protocols.map((p) => ({ value: p, label: protocolLabel(p) }))]} />
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-3 md:ml-auto" aria-live="polite">
              <span>
                Showing {shown.length} of {all.length} venue{all.length === 1 ? "" : "s"}
              </span>
              {filtered && (
                <Button variant="ghost" size="sm" onClick={clear}>
                  <FilterX className="size-3.5" aria-hidden="true" /> Clear filters
                </Button>
              )}
            </div>
          </div>

          {shown.length === 0 ? (
            <EmptyState icon={FilterX} title="No venues match these filters" description="Try another network or protocol, or include venues that fail a policy check." actions={<Button size="sm" variant="secondary" onClick={clear}>Clear filters</Button>} />
          ) : (
            <>
              <VenueTable venues={shown} onOpen={openVenue} />
              <VenueCards venues={shown} onOpen={openVenue} />
            </>
          )}

          <Callout tone="info" title="How to read this">
            Net APY is native yield after fees plus incentive rewards, measured as stated (an instantaneous rate can move within minutes). <strong className="font-medium text-text">Listed for execution</strong> venues passed TokenIQ&apos;s integration review and are the only ones that can become proposals; <strong className="font-medium text-text">reference only</strong> venues are shown for comparison. Suitability is a static check against your policy; the amount you could deploy is checked again when a recommendation or proposal is made.
          </Callout>
        </div>
      )}

      <OpportunitySheet venue={selected} open={!!venueId && !!q.data} missing={!!venueId && !!q.data && !selected} onOpenChange={(v) => !v && openVenue(null)} />
    </div>
  );
}

function Suitability({ o }: { o: OpportunityDto }) {
  const c = checkCounts(o.suitability.checks);
  if (o.suitability.suitable) {
    return (
      <StatusBadge tone="success">
        Suitable{c.warn ? ` · ${c.warn} warning${c.warn === 1 ? "" : "s"}` : ""}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="danger">
      {c.fail} check{c.fail === 1 ? "" : "s"} fail
    </StatusBadge>
  );
}

function Listed({ o }: { o: OpportunityDto }) {
  return o.listed ? (
    <StatusBadge tone="accent" icon={null}>
      Listed for execution
    </StatusBadge>
  ) : (
    <StatusBadge tone="neutral" icon={null}>
      Reference only
    </StatusBadge>
  );
}

function Warnings({ o }: { o: OpportunityDto }) {
  const n = o.warnings.filter((w) => w.level !== "info").length;
  if (!n) return null;
  const critical = o.warnings.some((w) => w.level === "critical");
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", critical ? "text-danger" : "text-warning")}>
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      {n} warning{n === 1 ? "" : "s"}
    </span>
  );
}

function VenueTable({ venues, onOpen }: { venues: OpportunityDto[]; onOpen: (id: string) => void }) {
  return (
    <Card className="hidden lg:block">
      <Table>
        <caption className="sr-only">Venues with rate, size, terms and policy suitability. Select a venue name for every check.</caption>
        <thead>
          <tr>
            <Th>Venue</Th>
            <Th numeric>Net APY</Th>
            <Th numeric>TVL · available</Th>
            <Th>Fee · withdrawals</Th>
            <Th>Status</Th>
            <Th>Source</Th>
          </tr>
        </thead>
        <tbody>
          {venues.map((o) => (
            <Tr key={o.id} className="cursor-pointer" onClick={() => onOpen(o.id)}>
              <Td className="py-2.5">
                <button type="button" onClick={(e) => (e.stopPropagation(), onOpen(o.id))} className="text-left text-[13px] font-medium text-text hover:underline">
                  {o.name}
                </button>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-3">
                  <span>{protocolLabel(o.protocol)}</span>
                  <ChainLabel chainId={o.chainId} name={o.chain} />
                  <span>{o.asset.symbol}</span>
                  {o.curator && <span>Curator: {o.curator.name}</span>}
                  <Warnings o={o} />
                </div>
              </Td>
              <Td numeric className="py-2.5">
                <div className="text-[13px] font-medium">{pct(o.apy.netBps, 2)}</div>
                <div className="text-xs text-text-3">
                  {pct(o.apy.nativeBps, 2)} native{o.apy.rewardsBps > 0 ? ` + ${pct(o.apy.rewardsBps, 2)} rewards` : ""}
                </div>
                <div className="text-[11px] text-text-3">{MEASUREMENT_LABEL[o.apy.measurement]}</div>
              </Td>
              <Td numeric className="py-2.5">
                <Money value={o.tvlUsd} compact className="text-[13px]" />
                <div className="text-xs text-text-3">
                  <Money value={o.availableLiquidityUsd} compact /> available
                </div>
              </Td>
              <Td className="py-2.5 text-xs text-text-2">
                <div>{o.feeBps === null ? "No fee" : `${pct(o.feeBps, 2)} fee`}</div>
                <div className={cn(o.withdrawal !== "instant_subject_to_liquidity" && "text-warning")}>{WITHDRAWAL_LABEL[o.withdrawal]}</div>
              </Td>
              <Td className="py-2.5">
                <div className="flex flex-col items-start gap-1">
                  <Suitability o={o} />
                  <Listed o={o} />
                </div>
              </Td>
              <Td className="py-2.5">
                <div className="text-xs text-text-2">{o.source.name}</div>
                <Freshness at={fetchedIso(o)} staleAfterMinutes={VENUE_STALE_MINUTES} label="Fetched" />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function VenueCards({ venues, onOpen }: { venues: OpportunityDto[]; onOpen: (id: string) => void }) {
  return (
    <ul className="space-y-2 lg:hidden" aria-label="Venues">
      {venues.map((o) => (
        <li key={o.id}>
          <button type="button" onClick={() => onOpen(o.id)} className="flex w-full items-start gap-3 rounded-[var(--radius-card)] border border-hairline bg-surface p-3 text-left hover:bg-sunken/60">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-text">{o.name}</span>
                <span className="num shrink-0 text-sm font-medium text-text">{pct(o.apy.netBps, 2)}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 text-xs text-text-3">
                <span>
                  {protocolLabel(o.protocol)} · {o.chain} · {o.asset.symbol}
                </span>
                <span>{MEASUREMENT_LABEL[o.apy.measurement]}</span>
              </div>
              <div className="mt-1 text-xs text-text-2">
                <Money value={o.tvlUsd} compact /> TVL · <Money value={o.availableLiquidityUsd} compact /> available · {WITHDRAWAL_LABEL[o.withdrawal].toLowerCase()}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Suitability o={o} />
                <Listed o={o} />
                <Warnings o={o} />
              </div>
            </div>
            <ChevronRight className="mt-1 size-4 shrink-0 text-text-3" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
