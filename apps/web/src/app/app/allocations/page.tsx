"use client";

import { parseDecimal, wadToString } from "@tokeniq/core";
import { CircleHelp, Layers } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PROTOCOL_LABEL } from "@/components/app/reserves/policy-fields";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChainLabel, Freshness } from "@/components/ui/identity";
import { Money, TokenAmount } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { dateTimeLabel, pct } from "@/lib/format";
import { useOrgQuery } from "@/lib/org";
import type { OpportunityDto, OverviewDto, PositionDto } from "@/lib/types";

const MEASUREMENT: Record<OpportunityDto["apy"]["measurement"], string> = {
  instantaneous: "instantaneous rate",
  "1d_average": "1-day average",
  "7d_average": "7-day average",
  "30d_average": "30-day average",
};

const w = (v: string | null | undefined) => (v ? parseDecimal(v, 18, "down") : 0n);
const shareBps = (part: bigint, whole: bigint) => (whole === 0n ? 0n : (part * 10_000n) / whole);

export default function AllocationsPage() {
  const q = useOrgQuery<OverviewDto>("/treasury");
  const hasPositions = (q.data?.positions.length ?? 0) > 0;
  const opp = useOrgQuery<{ opportunities: OpportunityDto[]; fetchedAt: string | null }>("/opportunities", { enabled: hasPositions });

  if (q.isLoading) return <AllocationsSkeleton />;
  if (q.isError || !q.data) {
    return (
      <div>
        <PageHeader title="Allocations" />
        <Callout tone="danger" title="Couldn't load allocations" action={<Button variant="secondary" size="sm" onClick={() => q.refetch()}>Try again</Button>}>
          {(q.error as Error)?.message ?? "Unknown error"}. Nothing was changed.
        </Callout>
      </div>
    );
  }
  const d = q.data;
  const header = (
    <PageHeader
      title="Allocations"
      description="Capital deployed in protocols, what can be withdrawn right now, and how it compares with your policy limits."
      meta={
        <>
          <Freshness at={d.lastObservedAt} label="Positions synced" staleAfterMinutes={d.policy.maxDataAgeMinutes} />
          <span>
            {d.positions.length} position{d.positions.length === 1 ? "" : "s"}
          </span>
        </>
      }
      actions={
        <Button variant="secondary" size="sm" asChild>
          <Link href="/app/opportunities">Opportunities</Link>
        </Button>
      }
    />
  );

  if (d.positions.length === 0) {
    return (
      <div>
        {header}
        <EmptyState
          icon={Layers}
          title="Nothing is deployed"
          description={
            <>
              <p>All tracked capital is held in your wallets and Safes. TokenIQ shows a position here only when it reads one on-chain in one of your accounts, with its withdrawable amount and the venue's current measured APY.</p>
              <p className="mt-2">
                {d.reserve.surplus.deployable !== "0" ? (
                  <>
                    Under your policy, <Money value={d.reserve.surplus.deployable} className="font-medium text-text" /> could be deployed today ({d.reserve.surplus.explanation.toLowerCase()}).
                  </>
                ) : (
                  <>Under your policy nothing is deployable today: {d.reserve.surplus.explanation.toLowerCase()}.</>
                )}
              </p>
            </>
          }
          actions={
            <>
              <Button size="sm" asChild>
                <Link href="/app/opportunities">Browse vetted venues</Link>
              </Button>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/app/reserves">Review the reserve</Link>
              </Button>
            </>
          }
        />
        <p className="mt-3 text-xs text-text-3">Deploying always goes through a proposal, policy checks, approvals and your Safe signers. Nothing moves from this page.</p>
      </div>
    );
  }

  const gross = w(d.treasury.gross);
  const deployed = w(d.treasury.allocated.total);
  const byOpp = new Map((opp.data?.opportunities ?? []).map((o) => [o.id, o]));

  // Exposure by protocol and venue, exactly, from position values.
  const byProtocol = new Map<string, bigint>();
  const byVenue = new Map<string, { name: string; protocol: string; value: bigint }>();
  for (const p of d.positions) {
    const v = w(p.valueUsd);
    byProtocol.set(p.protocol, (byProtocol.get(p.protocol) ?? 0n) + v);
    const cur = byVenue.get(p.venueId) ?? { name: p.venueName, protocol: p.protocol, value: 0n };
    cur.value += v;
    byVenue.set(p.venueId, cur);
  }
  const unpriced = d.positions.filter((p) => p.valueUsd === null).length;

  // Value-weighted current net APY across positions with venue data (bps, integer maths).
  const withApy = d.positions.filter((p) => p.venue && p.valueUsd);
  const apyWeight = withApy.reduce((s, p) => s + w(p.valueUsd), 0n);
  const weightedApyBps = apyWeight > 0n ? withApy.reduce((s, p) => s + w(p.valueUsd) * BigInt(p.venue!.netApyBps), 0n) / apyWeight : null;

  return (
    <div>
      {header}
      {unpriced > 0 && (
        <Callout tone="warning" className="mb-4" title={`${unpriced} position${unpriced === 1 ? "" : "s"} could not be priced`}>
          They are excluded from the totals and limit checks below until a price is available.
        </Callout>
      )}

      <Card className="mb-4">
        <dl className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-hairline [&>div]:border-hairline max-lg:[&>div]:border-b">
          <Kpi label="Deployed" value={<Money value={d.treasury.allocated.total} compact />} meta={`${pct(shareBps(deployed, gross).toString(), 1)} of the total treasury`} />
          <Kpi label="Withdrawable now" value={<Money value={d.treasury.allocated.withdrawableNow} compact />} meta="What venues would release today" />
          <Kpi
            label="Withdrawability unknown"
            value={<Money value={d.treasury.allocated.unknownWithdrawable} compact />}
            meta={d.treasury.allocated.unknownWithdrawable === "0" ? "Every position reports it" : "Venue doesn't report a limit"}
            tone={d.treasury.allocated.unknownWithdrawable !== "0" ? "warning" : undefined}
          />
          <Kpi label="Current net APY" value={weightedApyBps !== null ? pct(weightedApyBps.toString(), 2) : "—"} meta="Value-weighted, measured now; not a promise" />
        </dl>
      </Card>

      <Card className="mb-4">
        <CardHeader title="Against your policy limits" description={<>Each bar is a share of the total tracked treasury (<Money value={d.treasury.gross} />). The vertical mark is the policy maximum.</>} />
        <CardBody className="space-y-4 pt-3">
          <LimitBar label="Total deployed" value={deployed} gross={gross} capBps={d.policy.maxDeployedBps} />
          {[...byProtocol.entries()].map(([k, v]) => (
            <LimitBar key={k} label={`${PROTOCOL_LABEL[k] ?? k} (protocol)`} value={v} gross={gross} capBps={d.policy.maxPerProtocolBps} />
          ))}
          {[...byVenue.entries()].map(([id, v]) => (
            <LimitBar key={id} label={`${v.name} (venue)`} value={v.value} gross={gross} capBps={d.policy.maxPerVenueBps} />
          ))}
          <p className="text-xs text-text-3">
            Limits come from policy v{d.policyVersion}.{" "}
            <Link href="/app/reserves" className="font-medium text-accent hover:underline">
              Review the policy
            </Link>
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Positions" description="Read on-chain from your accounts at the last sync." />
        <CardBody className="px-0 pb-0 sm:px-0">
          <div className="hidden lg:block">
            <Table>
              <caption className="sr-only">Positions in protocols</caption>
              <thead>
                <tr>
                  <Th>Venue</Th>
                  <Th>Network</Th>
                  <Th>Account</Th>
                  <Th numeric>Position</Th>
                  <Th numeric>Value</Th>
                  <Th numeric>Withdrawable now</Th>
                  <Th numeric>Net APY</Th>
                </tr>
              </thead>
              <tbody>
                {d.positions.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <div className="font-medium text-text">{p.venueName}</div>
                      <div className="text-xs text-text-3">{PROTOCOL_LABEL[p.protocol] ?? p.protocol}</div>
                    </Td>
                    <Td>
                      <ChainLabel chainId={p.chainId} name={p.chain} />
                    </Td>
                    <Td className="text-text-2">{p.accountLabel}</Td>
                    <Td numeric>
                      <TokenAmount raw={p.assetsRaw} decimals={p.decimals} symbol={p.symbol} />
                    </Td>
                    <Td numeric>{p.valueUsd ? <Money value={p.valueUsd} /> : <span className="text-warning">No price</span>}</Td>
                    <Td numeric>
                      <Withdrawable p={p} />
                    </Td>
                    <Td numeric>
                      <Apy p={p} o={byOpp.get(p.venueId)} loading={opp.isLoading} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
          <ul className="divide-y divide-hairline border-t border-hairline lg:hidden">
            {d.positions.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] font-medium text-text">{p.venueName}</span>
                  {p.valueUsd ? <Money value={p.valueUsd} className="text-[13px] font-medium" /> : <span className="text-xs text-warning">No price</span>}
                </div>
                <div className="mt-0.5 text-xs text-text-3">
                  {PROTOCOL_LABEL[p.protocol] ?? p.protocol} · {p.chain} · {p.accountLabel}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-text-3">Withdrawable now</dt>
                    <dd className="mt-0.5">
                      <Withdrawable p={p} />
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-text-3">Net APY</dt>
                    <dd className="mt-0.5">
                      <Apy p={p} o={byOpp.get(p.venueId)} loading={opp.isLoading} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-4 py-2.5 text-xs text-text-3 sm:px-5">
            APY is the venue's current net rate (after fees, including rewards) measured by its data source{opp.data?.fetchedAt ? ` at ${dateTimeLabel(opp.data.fetchedAt)}` : ""}. It changes constantly and is not a promise of future yield.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function Kpi({ label, value, meta, tone }: { label: string; value: ReactNode; meta?: string; tone?: "warning" }) {
  return (
    <div className="px-4 py-3 sm:px-5">
      <dt className="text-xs font-medium text-text-2">{label}</dt>
      <dd className={cn("mt-0.5 text-xl font-medium tracking-tight", tone === "warning" ? "text-warning" : "text-text")}>{value}</dd>
      {meta && <dd className="mt-0.5 text-xs text-text-3">{meta}</dd>}
    </div>
  );
}

function LimitBar({ label, value, gross, capBps }: { label: string; value: bigint; gross: bigint; capBps: number }) {
  const share = shareBps(value, gross);
  const cap = BigInt(capBps);
  const over = share > cap;
  const near = !over && cap > 0n && share * 10n >= cap * 9n;
  const scale = Math.max(Number(cap), Number(share), 1) * 1.15;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]">
        <span className="font-medium text-text">{label}</span>
        <span className="flex items-baseline gap-2">
          <Money value={wadToString(value)} className="text-text-2" />
          <span className={cn("num font-medium", over ? "text-danger" : "text-text")}>{pct(share.toString(), 1)}</span>
          <span className="text-xs text-text-3">of max {pct(capBps, 0)}</span>
          {over ? <StatusBadge tone="danger">Over limit</StatusBadge> : near ? <StatusBadge tone="warning">Near limit</StatusBadge> : null}
        </span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-sunken" aria-hidden="true">
        <div className={cn("h-full rounded-full", over ? "bg-danger" : "bg-deployable")} style={{ width: `${Math.min(100, (Number(share) / scale) * 100)}%` }} />
        <div className="absolute -top-1 h-4 border-l-2 border-text-2" style={{ left: `${(Number(cap) / scale) * 100}%` }} title={`Limit ${pct(capBps, 0)}`} />
      </div>
    </div>
  );
}

function Withdrawable({ p }: { p: PositionDto }) {
  if (p.withdrawableRaw === null) {
    return (
      <span className="inline-flex items-center gap-1 text-warning" title="The venue does not report how much can be withdrawn right now (for example, no maxWithdraw). Assume it may be limited by available liquidity.">
        <CircleHelp className="size-3.5" aria-hidden="true" />
        Unknown
        <span className="sr-only">: the venue does not report how much can be withdrawn now</span>
      </span>
    );
  }
  const partial = BigInt(p.withdrawableRaw) < BigInt(p.assetsRaw);
  return (
    <span className={partial ? "text-warning" : undefined}>
      <TokenAmount raw={BigInt(p.withdrawableRaw) > BigInt(p.assetsRaw) ? p.assetsRaw : p.withdrawableRaw} decimals={p.decimals} symbol={p.symbol} />
      {partial && <span className="block text-xs">Limited by venue liquidity</span>}
    </span>
  );
}

function Apy({ p, o, loading }: { p: PositionDto; o?: OpportunityDto; loading: boolean }) {
  if (!p.venue) return <span className="text-text-3">No venue data</span>;
  return (
    <span>
      <span className="num font-medium text-text">{pct(p.venue.netApyBps, 2)}</span>
      <span className="block text-xs text-text-3">{o ? `${MEASUREMENT[o.apy.measurement]} · ${o.source.name}` : loading ? "Loading source…" : "Measured now"}</span>
    </span>
  );
}

function AllocationsSkeleton() {
  return (
    <LoadingRegion label="Loading allocations…">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mb-5 mt-2 h-4 w-96 max-w-full" />
      <Skeleton className="mb-4 h-24" />
      <Skeleton className="mb-4 h-40" />
      <Skeleton className="h-64" />
    </LoadingRegion>
  );
}
