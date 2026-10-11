"use client";

import { parseDecimal, wadToString } from "@tokeniq/core";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Circle, Lightbulb, ShieldAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { CoverageBadge, UncertaintyBadge } from "@/components/app/coverage-badge";
import { ReserveLedger } from "@/components/app/reserve-ledger";
import { AllocationBar } from "@/components/charts/allocation-bar";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Freshness } from "@/components/ui/identity";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { bucketsFromReserve } from "@/lib/buckets";
import { cn } from "@/lib/cn";
import { dateLabel, pct, usd } from "@/lib/format";
import { useOrg, useOrgQuery } from "@/lib/org";
import type { AlertDto, OverviewDto, RecommendationDto } from "@/lib/types";

export default function OverviewPage() {
  const { org } = useOrg();
  const q = useOrgQuery<OverviewDto>("/treasury");

  if (q.isLoading) return <OverviewSkeleton />;
  if (q.isError || !q.data) {
    return (
      <Callout tone="danger" title="Couldn't load the treasury overview" action={<Button variant="secondary" size="sm" onClick={() => q.refetch()}>Try again</Button>}>
        {(q.error as Error)?.message ?? "Unknown error"}. Your data is unchanged.
      </Callout>
    );
  }
  const d = q.data;
  if (d.accounts.length === 0) return <FirstRun orgName={org.name} />;
  return <Overview d={d} />;
}

function Overview({ d }: { d: OverviewDto }) {
  const { reserve, treasury } = d;
  const { buckets, total, shortfall } = useMemo(() => bucketsFromReserve(reserve), [reserve]);
  const due30 = reserve.obligations.occurrences.filter((o) => o.usd && !o.overdue && Date.parse(`${o.dueDate}T00:00:00Z`) <= Date.parse(`${d.asOf}T00:00:00Z`) + 30 * 86_400_000);
  const due30Total = wadToString(due30.reduce((s, o) => s + parseDecimal(o.usd ?? "0"), 0n));
  const sentence = `Of ${usd(treasury.gross, { compact: true })} tracked, ${usd(reserve.required, { compact: true })} is protected by policy, ${usd(reserve.obligations.total, { compact: true })} is owed in the next ${d.policy.obligationHorizonDays} days${d.policy.obligationBufferBps > 0 ? ` (protected with a ${d.policy.obligationBufferBps / 100}% buffer)` : ""}, and ${usd(reserve.surplus.deployable, { compact: true })} could be deployed.`;

  return (
    <div>
      <PageHeader
        title="Overview"
        meta={
          <>
            <Freshness at={d.lastObservedAt} label="Balances synced" />
            <span>Policy v{d.policyVersion}</span>
            <span>{d.autonomy === "observe" ? "Observe-only" : "Approval required for every action"}</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/app/obligations?new=1">Record obligation</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app/recommendations">Review recommendations</Link>
            </Button>
          </>
        }
      />

      {!treasury.complete && (
        <Callout tone="warning" className="mb-4" title="Some figures are incomplete" action={<Button variant="secondary" size="sm" asChild><Link href="/app/accounts">Check accounts</Link></Button>}>
          {treasury.issues.slice(0, 2).map((i) => i.message).join(". ")}
          {treasury.issues.length > 2 ? ` and ${treasury.issues.length - 2} more` : ""}. Recommendations are paused until data is complete.
        </Callout>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* The answer */}
        <Card className="xl:col-span-8">
          <CardBody className="sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[13px] font-medium text-text-2">Safe to deploy now</h2>
              <CoverageBadge reserve={reserve} />
              <UncertaintyBadge level={reserve.uncertainty.level} />
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
              <Money value={reserve.surplus.deployable} tabular={false} className="text-[40px] font-medium leading-[1.1] tracking-[-0.02em] text-text sm:text-5xl" />
              <span className="text-sm text-text-3">USD equivalent · as of {dateLabel(d.computedAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-text-2 text-pretty">{sentence}</p>
            <AllocationBar className="mt-5" buckets={buckets} total={total} shortfall={shortfall} size="lg" />
            <div className="mt-4">
              <ReserveLedger reserve={reserve} treasury={treasury} maxDeployedBps={d.policy.maxDeployedBps} />
            </div>
          </CardBody>
        </Card>

        {/* KPI stack */}
        <Card className="xl:col-span-4">
          <dl className="divide-y divide-hairline">
            <Kpi label="Total tracked treasury" value={<Money value={treasury.gross} compact />} meta={`${d.accounts.length} account${d.accounts.length === 1 ? "" : "s"} · ${treasury.byChain.length} network${treasury.byChain.length === 1 ? "" : "s"}`} href="/app/treasury" />
            <Kpi
              label="Protected by policy"
              value={<Money value={reserve.required} compact />}
              meta={reserve.bindingRule ? `Set by the ${reserve.rules.find((r) => r.binding)?.label.toLowerCase()} rule` : "No requirement configured"}
              href="/app/reserves"
            />
            <Kpi label="Due in the next 30 days" value={<Money value={due30Total} compact />} meta={`${due30.length} payment${due30.length === 1 ? "" : "s"}${reserve.obligations.overdue !== "0" ? ` · ${usd(reserve.obligations.overdue, { compact: true })} overdue` : ""}`} href="/app/obligations" tone={reserve.obligations.overdue !== "0" ? "warning" : undefined} />
            <Kpi label="Runway covered" value={reserve.runwayCoveredMonths ? `${reserve.runwayCoveredMonths} months` : "—"} meta={reserve.burn.basis === "none" ? "Add a monthly burn estimate" : `At ${usd(reserve.burn.used, { compact: true })} per month (${reserve.burn.basis === "declared" ? "declared" : "from recurring obligations"})`} href="/app/reserves" />
            <Kpi label="Deployed in protocols" value={<Money value={treasury.allocated.total} compact />} meta={treasury.allocated.total === "0" ? "Nothing deployed" : `${usd(treasury.allocated.withdrawableNow, { compact: true })} withdrawable now`} href="/app/allocations" />
          </dl>
          {reserve.uncertainty.reasons.length > 0 && (
            <div className="border-t border-hairline px-4 py-3 sm:px-5">
              <div className="text-xs font-medium text-text-2">Why these figures may change</div>
              <ul className="mt-1.5 space-y-1">
                {reserve.uncertainty.reasons.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-text-2">
                    <AlertTriangle className={cn("mt-0.5 size-3 shrink-0", r.level === "high" ? "text-danger" : "text-warning")} aria-hidden="true" />
                    {r.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Runway */}
        <Card className="xl:col-span-8">
          <CardHeader title="Liquidity runway" description={`Reserve-eligible balance if every obligation in the next ${d.policy.obligationHorizonDays} days is paid and nothing new comes in.`} />
          <CardBody>
            <ProjectionChart points={d.projection.points} floor={d.projection.reserveFloor} events={reserve.obligations.occurrences.map((o) => ({ dueDate: o.dueDate, title: o.title, usd: o.usd }))} />
            {d.projection.firstNegative && (
              <Callout tone="danger" className="mt-3" title={`Liquid funds run out around ${dateLabel(d.projection.firstNegative)}`}>
                Withdraw from positions, add funding or reschedule obligations before then.
              </Callout>
            )}
          </CardBody>
        </Card>

        <NeedsAttention className="xl:col-span-4" />

        <UpcomingObligations d={d} className="xl:col-span-7" />
        <Holdings d={d} className="xl:col-span-5" />
      </div>
    </div>
  );
}

/**
 * One term/description group. Inside a <dl> each group must be a <div>, so the
 * link lives in the <dd> and stretches over the whole row for pointer users.
 */
function Kpi({ label, value, meta, href, tone }: { label: string; value: React.ReactNode; meta?: string; href: string; tone?: "warning" }) {
  return (
    // dt/dd must be direct children of the group <div>; the arrow lives inside the link, positioned against the row.
    <div className="group relative px-4 py-3 pr-10 hover:bg-sunken/60 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-[-2px] has-[a:focus-visible]:outline-[var(--focus)] sm:px-5 sm:pr-11">
      <dt className="text-xs font-medium text-text-2">{label}</dt>
      <dd className="mt-0.5 text-xl font-medium tracking-tight text-text">
        <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
          {value}
          <span className="sr-only"> — open {label.toLowerCase()}</span>
          <ArrowRight className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-3 opacity-0 transition-opacity group-hover:opacity-100 sm:right-5" aria-hidden="true" />
        </Link>
      </dd>
      {meta && <dd className={cn("mt-0.5 truncate text-xs", tone === "warning" ? "text-warning" : "text-text-3")}>{meta}</dd>}
    </div>
  );
}

function NeedsAttention({ className }: { className?: string }) {
  const alerts = useOrgQuery<{ alerts: AlertDto[] }>("/alerts");
  const recs = useOrgQuery<{ recommendations: RecommendationDto[]; whyNone: string | null }>("/recommendations");
  const items = [
    ...(alerts.data?.alerts.filter((a) => a.severity !== "info" && a.status === "open").slice(0, 3).map((a) => ({ key: a.id, icon: a.severity === "critical" ? ShieldAlert : AlertTriangle, tone: a.severity === "critical" ? "text-danger" : "text-warning", title: a.title, detail: a.recommendedAction, href: "/app/risk" })) ?? []),
    ...(recs.data?.recommendations.slice(0, 2).map((r) => ({ key: r.id, icon: Lightbulb, tone: "text-accent", title: r.title, detail: r.summary, href: `/app/recommendations#${r.id}` })) ?? []),
  ];
  return (
    <Card className={className}>
      <CardHeader title="Needs attention" description="Alerts and recommendations, most important first." />
      <CardBody className="pt-3">
        {alerts.isLoading || recs.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex gap-2 text-sm text-text-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            <span>
              Nothing needs action. {recs.data?.whyNone && <span className="text-text-3">{recs.data.whyNone}</span>}
            </span>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.key}>
                <Link href={it.href} className="-mx-2 flex gap-2.5 rounded-[var(--radius-control)] px-2 py-2 hover:bg-sunken">
                  <it.icon className={cn("mt-0.5 size-4 shrink-0", it.tone)} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-text">{it.title}</span>
                    <span className="line-clamp-2 block text-xs text-text-2">{it.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function UpcomingObligations({ d, className }: { d: OverviewDto; className?: string }) {
  const occ = d.reserve.obligations.occurrences.slice(0, 7);
  return (
    <Card className={className}>
      <CardHeader title="Upcoming obligations" description={`Unpaid commitments through ${dateLabel(d.reserve.horizonEnd)}.`} action={<Button variant="ghost" size="sm" asChild><Link href="/app/obligations">View all</Link></Button>} />
      <CardBody className="pt-2">
        {occ.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No obligations recorded" description="Add payroll, vendors and other commitments so the reserve reflects what you actually owe." actions={<Button size="sm" asChild><Link href="/app/obligations?new=1">Record obligation</Link></Button>} />
        ) : (
          <ul className="divide-y divide-hairline">
            {occ.map((o) => (
              <li key={`${o.obligationId}-${o.dueDate}`} className="flex items-center gap-3 py-2.5">
                <div className="w-14 shrink-0 text-xs">
                  <div className={cn("font-medium", o.overdue ? "text-danger" : "text-text")}>{dateLabel(o.dueDate, { month: "short", day: "numeric" })}</div>
                  {o.overdue && <div className="text-danger">Overdue</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/app/obligations/${o.obligationId}`} className="block truncate text-[13px] font-medium text-text hover:underline">
                    {o.title}
                  </Link>
                  <div className="text-xs capitalize text-text-3">
                    {o.category} · {o.certainty}
                  </div>
                </div>
                <div className="text-right">
                  {o.currency === "USD" ? <Money value={o.amount} className="text-[13px] font-medium" /> : <span className="num text-[13px] font-medium">{usd(o.amount).replace("$", "")} {o.currency}</span>}
                  {o.currency !== "USD" && o.usd && <Money value={o.usd} approximate className="block text-xs text-text-3" />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function Holdings({ d, className }: { d: OverviewDto; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="Where the money is" description="By asset across all tracked accounts." action={<Button variant="ghost" size="sm" asChild><Link href="/app/treasury">Details</Link></Button>} />
      <CardBody className="pt-2">
        <ul className="space-y-2.5">
          {d.treasury.byAsset.slice(0, 6).map((b) => (
            <li key={b.key}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-medium text-text">{b.label}</span>
                <span className="flex items-baseline gap-3">
                  <Money value={b.value} compact className="text-text" />
                  <span className="num w-12 text-right text-xs text-text-3">{pct(b.shareBps, 1)}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
                <div className="h-full rounded-full bg-text-3" style={{ width: `${Math.max(1, Number(b.shareBps) / 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
        {d.treasury.unverifiedValue !== "0" && (
          <p className="mt-3 text-xs text-warning">
            <Money value={d.treasury.unverifiedValue} compact /> sits in unverified accounts and is excluded from reserve maths.{" "}
            <Link href="/app/accounts" className="font-medium underline">
              Verify
            </Link>
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function FirstRun({ orgName }: { orgName: string }) {
  const steps = [
    { done: true, label: "Create your organization", detail: orgName, href: "/app/settings" },
    { done: false, label: "Add a treasury account", detail: "Connect a Safe or add a wallet to read balances", href: "/app/accounts?add=1" },
    { done: false, label: "Record your obligations", detail: "Payroll, contractors and invoices you expect to pay", href: "/app/obligations?new=1" },
    { done: false, label: "Review your reserve policy", detail: "How much must stay protected and how much may be deployed", href: "/app/reserves" },
  ];
  return (
    <div>
      <PageHeader title="Overview" description="Three steps until TokenIQ can tell you what is safe to deploy." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Set up your treasury" />
          <CardBody>
            <ol className="space-y-1">
              {steps.map((s, i) => (
                <li key={i}>
                  <Link href={s.href} className="flex items-start gap-3 rounded-[var(--radius-control)] px-2 py-2.5 hover:bg-sunken">
                    {s.done ? <CheckCircle2 className="mt-0.5 size-5 text-success" aria-label="Done" /> : <Circle className="mt-0.5 size-5 text-text-3" aria-label="Not done" />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-medium", s.done ? "text-text-2 line-through decoration-text-3" : "text-text")}>{s.label}</span>
                      <span className="block text-xs text-text-2">{s.detail}</span>
                    </span>
                    {!s.done && <ArrowRight className="mt-0.5 size-4 text-text-3" aria-hidden="true" />}
                  </Link>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
        <EmptyState icon={Wallet} title="No accounts yet" description="TokenIQ reads balances directly from the chain. It never asks for keys or seed phrases." actions={<Button size="sm" asChild><Link href="/app/accounts?add=1">Add account</Link></Button>} />
      </div>
      <p className="mt-4 text-xs text-text-3">
        Prefer to look around first?{" "}
        <Link href="/onboarding/treasury?sample=1" className="font-medium text-accent hover:underline">
          Open a sample workspace
        </Link>{" "}
        with simulated data. <StatusBadge tone="neutral" icon={null}>Clearly labelled</StatusBadge>
      </p>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Calculating treasury metrics…</span>
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Skeleton className="h-72 xl:col-span-8" />
        <Skeleton className="h-72 xl:col-span-4" />
        <Skeleton className="h-64 xl:col-span-8" />
        <Skeleton className="h-64 xl:col-span-4" />
      </div>
    </div>
  );
}
