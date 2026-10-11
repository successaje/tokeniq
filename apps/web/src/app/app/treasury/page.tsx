"use client";

import { formatDecimal } from "@tokeniq/core";
import { AlertTriangle, ArrowRight, CircleAlert, Clock, Landmark, RefreshCw, ShieldAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { aggregateHistory, BalanceHistoryChart, type HistorySeries } from "@/components/app/treasury/balance-history-chart";
import { PROTOCOL_LABEL } from "@/components/app/reserves/policy-fields";
import { useMetaIndex } from "@/components/app/treasury/meta";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChainLabel, Freshness } from "@/components/ui/identity";
import { Money, TokenAmount } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { dateLabel, pct, relativeTime } from "@/lib/format";
import { useOrgQuery } from "@/lib/org";
import type { Breakdown, DataIssue, HoldingDto, OverviewDto, TreasuryHistoryDto, TreasurySyncStatusDto } from "@/lib/types";

export default function BalancesPage() {
  const q = useOrgQuery<OverviewDto>("/treasury");

  if (q.isLoading) return <BalancesSkeleton />;
  if (q.isError || !q.data) {
    return (
      <div>
        <PageHeader title="Balances" />
        <Callout tone="danger" title="Couldn't load balances" action={<Button variant="secondary" size="sm" onClick={() => q.refetch()}>Try again</Button>}>
          {(q.error as Error)?.message ?? "Unknown error"}. Nothing was changed.
        </Callout>
      </div>
    );
  }
  const d = q.data;
  if (d.accounts.length === 0) {
    return (
      <div>
        <PageHeader title="Balances" description="Holdings by asset, network and account, read directly from the chain." />
        <EmptyState
          icon={Wallet}
          title="No accounts to read yet"
          description="Add a Safe or wallet and TokenIQ will read its balances on every sync, value them at oracle prices and start a daily history. It never asks for keys or seed phrases."
          actions={
            <Button size="sm" asChild>
              <Link href="/app/accounts?add=1">Add account</Link>
            </Button>
          }
        />
      </div>
    );
  }
  return <Balances d={d} />;
}

function Balances({ d }: { d: OverviewDto }) {
  const t = d.treasury;
  const networks = t.byChain.length;
  return (
    <div>
      <PageHeader
        title="Balances"
        description="Everything TokenIQ reads from your accounts, valued at oracle prices. Stablecoins count toward the reserve at no more than $1."
        meta={
          <>
            <Freshness at={d.lastObservedAt} label="Balances synced" staleAfterMinutes={d.policy.maxDataAgeMinutes} />
            <span>
              {d.accounts.length} account{d.accounts.length === 1 ? "" : "s"} · {networks} network{networks === 1 ? "" : "s"}
            </span>
          </>
        }
        actions={
          <Button variant="secondary" size="sm" asChild>
            <Link href="/app/accounts">Manage accounts</Link>
          </Button>
        }
      />

      {!t.complete && (
        <Callout tone="warning" className="mb-4" title="Some figures are incomplete" action={<Button variant="secondary" size="sm" asChild><a href="#issues">See issues</a></Button>}>
          {t.issues.length} data issue{t.issues.length === 1 ? "" : "s"} affect the totals. Recommendations are paused until data is complete.
        </Callout>
      )}

      <Card className="mb-4">
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 [&>div]:border-hairline max-lg:[&>div]:border-b lg:divide-x lg:divide-hairline">
          <Kpi label="Total tracked" value={<Money value={t.gross} compact />} meta="Everything priced, in included accounts" />
          <Kpi label="Liquid stablecoins" value={<Money value={t.liquid.stable} compact />} meta={<>Reserve-eligible <Money value={t.reserveEligible} compact /></>} />
          <Kpi label="Other liquid assets" value={<Money value={t.liquid.other} compact />} meta="Never counted toward the reserve" />
          <Kpi label="Deployed in protocols" value={<Money value={t.allocated.total} compact />} meta={t.allocated.total === "0" ? "Nothing deployed" : <><Money value={t.allocated.withdrawableNow} compact /> withdrawable now</>} href="/app/allocations" />
          <Kpi
            label="Unverified (excluded)"
            value={<Money value={t.unverifiedValue} compact />}
            meta={t.unverifiedValue === "0" ? "All counted accounts verified" : d.policy.includeUnverifiedInReserve ? "Counted: the policy allows unverified accounts" : "Not counted toward reserve or deployable"}
            tone={t.unverifiedValue !== "0" ? "warning" : undefined}
            className="col-span-2 sm:col-span-1"
          />
        </dl>
      </Card>

      <div className="grid gap-4 xl:grid-cols-12">
        <BreakdownCard t={t} className="min-w-0 xl:col-span-5" />
        <HistoryCard d={d} className="min-w-0 xl:col-span-7" />
      </div>

      <HoldingsCard d={d} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <IssuesCard issues={t.issues} />
        <SyncCard d={d} />
      </div>
    </div>
  );
}

/** A dt/dd group. With `href`, the link sits inside the <dd> (a link may not wrap dt/dd) and stretches over the group. */
function Kpi({ label, value, meta, href, tone, className }: { label: string; value: ReactNode; meta?: ReactNode; href?: string; tone?: "warning"; className?: string }) {
  return (
    <div className={cn("px-4 py-3 sm:px-5", href && "relative hover:bg-sunken/60 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-[-2px] has-[a:focus-visible]:outline-[var(--focus)]", className)}>
      <dt className="text-xs font-medium text-text-2">{label}</dt>
      <dd className={cn("mt-0.5 text-xl font-medium tracking-tight", tone === "warning" ? "text-warning" : "text-text")}>
        {href ? (
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {value}
            <span className="sr-only"> — open {label.toLowerCase()}</span>
          </Link>
        ) : (
          value
        )}
      </dd>
      {meta && <dd className="mt-0.5 text-xs text-text-3">{meta}</dd>}
    </div>
  );
}

function BreakdownCard({ t, className }: { t: OverviewDto["treasury"]; className?: string }) {
  const [by, setBy] = useState<"asset" | "network" | "account" | "protocol">("asset");
  const rows: Breakdown[] = by === "asset" ? t.byAsset : by === "network" ? t.byChain : by === "account" ? t.byAccount : t.byProtocol;
  return (
    <Card className={className}>
      <CardHeader title="Where the money is" description="Market value and share of the total tracked treasury." />
      <CardBody className="pt-3">
        <Segmented
          label="Break down by"
          size="sm"
          value={by}
          onValueChange={setBy}
          options={[
            { value: "asset", label: "Asset" },
            { value: "network", label: "Network" },
            { value: "account", label: "Account" },
            { value: "protocol", label: "Venue type" },
          ]}
        />
        {rows.length === 0 ? (
          <p className="mt-4 text-[13px] text-text-2">No priced balances yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((b) => (
              <li key={b.key}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate font-medium text-text">{b.key === "wallet" ? "Held in wallets and Safes" : by === "protocol" ? (PROTOCOL_LABEL[b.key] ?? b.label) : b.label}</span>
                  <span className="flex shrink-0 items-baseline gap-3">
                    <Money value={b.value} className="text-text" />
                    <span className="num w-12 text-right text-xs text-text-3">{pct(b.shareBps, 1)}</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
                  <div className="h-full rounded-full bg-text-3" style={{ width: `${Math.max(0.5, Number(b.shareBps) / 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-text-3">Values are exact at the oracle price; shares are of <Money value={t.gross} />.</p>
      </CardBody>
    </Card>
  );
}

function HistoryCard({ d, className }: { d: OverviewDto; className?: string }) {
  const [days, setDays] = useState<"30" | "90" | "365">("30");
  const [seriesKey, setSeriesKey] = useState("usd");
  const h = useOrgQuery<TreasuryHistoryDto>(`/treasury/history?days=${days}`, { placeholderData: (prev) => prev });
  const { tokens, query: meta } = useMetaIndex();
  const included = useMemo(() => new Set(d.accounts.filter((a) => a.includeInTreasury).map((a) => a.id)), [d.accounts]);
  const symbols = useMemo(() => {
    const s = new Set<string>();
    for (const p of h.data?.points ?? []) for (const e of p.stableRaw) {
      const tk = tokens.get(`${e.chainId}:${e.asset.toLowerCase()}`);
      if (tk?.assetClass === "stablecoin") s.add(tk.symbol);
    }
    return [...s].sort();
  }, [h.data, tokens]);
  const series: HistorySeries = seriesKey === "usd" ? { kind: "usd" } : { kind: "symbol", symbol: seriesKey };
  const agg = useMemo(() => (h.data ? aggregateHistory(h.data.points, tokens, series, included) : null), [h.data, tokens, seriesKey, included]); // eslint-disable-line react-hooks/exhaustive-deps
  const eurHeld = symbols.some((sym) => [...tokens.values()].some((tk) => tk.symbol === sym && tk.pegCurrency === "EUR"));

  return (
    <Card className={className}>
      <CardHeader
        title="Stablecoin balance over time"
        description="Daily, from TokenIQ's own observations of each account."
        action={
          <Segmented
            label="Period"
            size="sm"
            value={days}
            onValueChange={setDays}
            options={[
              { value: "30", label: "30d" },
              { value: "90", label: "90d" },
              { value: "365", label: "1y" },
            ]}
          />
        }
      />
      <CardBody className="pt-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label htmlFor="history-series" className="text-xs text-text-2">
            Show
          </label>
          <Select
            id="history-series"
            value={seriesKey}
            onValueChange={setSeriesKey}
            className="h-8 w-auto min-w-48 text-[13px]"
            options={[{ value: "usd", label: "USD stablecoins (face value)" }, ...symbols.map((s) => ({ value: s, label: `${s} only (token units)` }))]}
          />
        </div>
        {h.isLoading || meta.isLoading ? (
          <Skeleton className="h-[200px]" />
        ) : h.isError ? (
          <Callout tone="danger" title="Couldn't load the history" action={<Button variant="secondary" size="sm" onClick={() => h.refetch()}>Try again</Button>}>
            {(h.error as Error).message}
          </Callout>
        ) : agg ? (
          <div className={cn("transition-opacity", h.isFetching && "opacity-60")}>
            <BalanceHistoryChart points={agg.points} unit={series.kind === "usd" ? { kind: "usd" } : { kind: "token", symbol: series.symbol }} />
          </div>
        ) : null}
        <p className="mt-3 text-xs text-text-3">
          History starts when TokenIQ began observing each account{h.data?.coverageStart ? ` (earliest here: ${dateLabel(h.data.coverageStart)})` : ""}; days before that are absent, not zero.{" "}
          {seriesKey === "usd" ? `USD stablecoins are summed at $1 each (face value), so the line can differ slightly from today's oracle-priced total.${eurHeld ? " EUR stablecoins are excluded; choose EURC to see them in EUR." : ""}` : "Shown in token units, without conversion."}
          {agg && agg.unknownAssets > 0 ? ` ${agg.unknownAssets} asset(s) without token metadata are left out.` : ""}
        </p>
      </CardBody>
    </Card>
  );
}

function priceText(p: NonNullable<HoldingDto["price"]>) {
  return `$${formatDecimal(BigInt(p.value), p.decimals, { maxFractionDigits: Math.min(6, p.decimals), minFractionDigits: 2, grouping: true })}`;
}

function HoldingsCard({ d }: { d: OverviewDto }) {
  const accounts = new Map(d.accounts.map((a) => [a.id, a]));
  const rows = [...d.holdings].filter((h) => h.raw !== "0").sort((a, b) => a.accountLabel.localeCompare(b.accountLabel) || a.symbol.localeCompare(b.symbol));
  return (
    <Card className="mt-4">
      <CardHeader title="Holdings" description="Token balances read on-chain at the last sync. Positions in protocols are on the Allocations page." action={<Button variant="ghost" size="sm" asChild><Link href="/app/allocations">Allocations</Link></Button>} />
      <CardBody className="px-0 pb-0 sm:px-0">
        {rows.length === 0 ? (
          <p className="px-4 pb-4 text-[13px] text-text-2 sm:px-5">No token balances found in your accounts at the last sync.</p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <caption className="sr-only">Holdings by account and asset</caption>
                <thead>
                  <tr>
                    <Th>Account</Th>
                    <Th>Network</Th>
                    <Th>Asset</Th>
                    <Th numeric>Balance</Th>
                    <Th numeric>≈ USD</Th>
                    <Th>Price</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((h) => {
                    const acct = accounts.get(h.accountId);
                    return (
                      <Tr key={`${h.accountId}-${h.chainId}-${h.assetAddress}`}>
                        <Td>
                          <div className="font-medium text-text">{h.accountLabel}</div>
                          {acct && !acct.verified && <span className="text-xs text-warning">Unverified</span>}
                          {acct && !acct.includeInTreasury && <span className="text-xs text-text-3">Excluded from treasury</span>}
                        </Td>
                        <Td>
                          <ChainLabel chainId={h.chainId} name={h.chain} />
                        </Td>
                        <Td>
                          <span className="font-medium">{h.symbol}</span> <span className="text-xs text-text-3">{h.assetClass === "stablecoin" ? "Stablecoin" : h.assetClass === "native" ? "Native" : "Volatile"}</span>
                        </Td>
                        <Td numeric>
                          <TokenAmount raw={h.raw} decimals={h.decimals} symbol={h.symbol} maxFractionDigits={Math.min(h.decimals, h.assetClass === "stablecoin" ? 2 : 6)} />
                        </Td>
                        <Td numeric>{h.valueUsd ? <Money value={h.valueUsd} /> : <span className="text-warning">No price</span>}</Td>
                        <Td>
                          <PriceCell h={h} />
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
            <ul className="divide-y divide-hairline border-t border-hairline md:hidden">
              {rows.map((h) => (
                <li key={`${h.accountId}-${h.chainId}-${h.assetAddress}`} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium text-text">{h.symbol}</span>
                    {h.valueUsd ? <Money value={h.valueUsd} className="text-[13px] font-medium" /> : <span className="text-xs text-warning">No price</span>}
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3 text-xs text-text-3">
                    <span className="truncate">
                      {h.accountLabel} · {h.chain}
                    </span>
                    <TokenAmount raw={h.raw} decimals={h.decimals} symbol={h.symbol} maxFractionDigits={Math.min(h.decimals, h.assetClass === "stablecoin" ? 2 : 6)} />
                  </div>
                  <div className="mt-1">
                    <PriceCell h={h} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function PriceCell({ h }: { h: HoldingDto }) {
  if (!h.price) return <StatusBadge tone="warning">No price: excluded from totals</StatusBadge>;
  return (
    <div className="text-xs">
      <span className="num text-text">{priceText(h.price)}</span>
      <span className="text-text-3"> · {h.price.source}</span>
      <div className="flex items-center gap-1.5 text-text-3">
        <span title={new Date(h.price.updatedAt).toUTCString()}>Updated {relativeTime(h.price.updatedAt)}</span>
        {h.price.stale && (
          <StatusBadge tone="warning" icon={Clock}>
            Stale
          </StatusBadge>
        )}
      </div>
    </div>
  );
}

const ISSUE_ICON: Record<DataIssue["code"], typeof AlertTriangle> = { price_missing: CircleAlert, price_stale: Clock, account_never_synced: RefreshCw, account_stale: Clock, unverified_excluded: ShieldAlert };

function IssuesCard({ issues }: { issues: DataIssue[] }) {
  return (
    <Card id="issues" className="scroll-mt-20">
      <CardHeader title="Data issues" description="Anything that makes a total less certain. Recommendations pause while totals are affected." />
      <CardBody className="pt-3">
        {issues.length === 0 ? (
          <p className="text-[13px] text-text-2">No issues. Every included balance is priced, fresh and from a synced account.</p>
        ) : (
          <ul className="space-y-2.5">
            {issues.map((i, idx) => {
              const Icon = ISSUE_ICON[i.code] ?? AlertTriangle;
              const href = i.code.startsWith("account") || i.code === "unverified_excluded" ? "/app/accounts" : null;
              return (
                <li key={`${i.code}-${i.ref}-${idx}`} className="flex gap-2.5 text-[13px]">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", i.code === "price_missing" || i.code === "account_never_synced" ? "text-danger" : "text-warning")} aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-text-2">
                    {i.message}
                    {href && (
                      <Link href={href} className="ml-1.5 font-medium text-accent hover:underline">
                        {i.code === "unverified_excluded" ? "Verify" : "Check account"}
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function SyncCard({ d }: { d: OverviewDto }) {
  const s = useOrgQuery<TreasurySyncStatusDto>("/treasury/sync-status", { refetchInterval: 60_000 });
  const maxAge = d.policy.maxDataAgeMinutes;
  return (
    <Card>
      <CardHeader title="Sync status" description={`Balances are read on a schedule. Accounts older than ${maxAge} minutes are stale.`} action={<Button variant="ghost" size="sm" asChild><Link href="/app/accounts">Accounts <ArrowRight className="size-3.5" aria-hidden="true" /></Link></Button>} />
      <CardBody className="pt-2">
        {s.isLoading ? (
          <div className="space-y-2" role="status" aria-label="Loading sync status">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : s.isError || !s.data ? (
          <Callout tone="danger" title="Couldn't load sync status" action={<Button variant="secondary" size="sm" onClick={() => s.refetch()}>Try again</Button>}>
            {(s.error as Error)?.message}
          </Callout>
        ) : (
          <>
            <ul className="divide-y divide-hairline">
              {s.data.accounts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <Landmark className="size-4 shrink-0 text-text-3" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-text">{a.label}</div>
                    <div className="text-xs text-text-3">{a.chain}</div>
                    {a.lastSyncError && <div className="mt-0.5 text-xs text-danger">Last sync failed: {a.lastSyncError}</div>}
                  </div>
                  <Freshness at={a.lastSyncedAt} staleAfterMinutes={maxAge} />
                </li>
              ))}
            </ul>
            <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-hairline pt-3 text-xs">
              <div>
                <dt className="text-text-2">Prices last observed</dt>
                <dd className="mt-0.5">
                  <Freshness at={s.data.pricesObservedAt} label="Observed" />
                </dd>
              </div>
              <div>
                <dt className="text-text-2">Venue data fetched</dt>
                <dd className="mt-0.5">
                  <Freshness at={s.data.opportunitiesFetchedAt} label="Fetched" staleAfterMinutes={180} />
                </dd>
              </div>
            </dl>
            {s.data.providers.some((p) => p.status !== "ok") && (
              <ul className="mt-3 space-y-1 text-xs text-warning">
                {s.data.providers
                  .filter((p) => p.status !== "ok")
                  .map((p) => (
                    <li key={p.provider} className="flex gap-1.5">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      {p.provider}: {p.status}
                      {p.lastError ? ` (${p.lastError})` : ""}
                    </li>
                  ))}
              </ul>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function BalancesSkeleton() {
  return (
    <LoadingRegion label="Loading balances…">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mb-5 mt-2 h-4 w-96 max-w-full" />
      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-hairline sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface px-4 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Skeleton className="h-80 xl:col-span-5" />
        <Skeleton className="h-80 xl:col-span-7" />
      </div>
      <Skeleton className="mt-4 h-64" />
    </LoadingRegion>
  );
}
