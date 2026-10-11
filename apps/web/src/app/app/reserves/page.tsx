"use client";

import { parseDecimal, wadToString } from "@tokeniq/core";
import { AlertTriangle, ArrowRight, Coins, FlaskConical, Pencil, ShieldAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CoverageBadge, UncertaintyBadge } from "@/components/app/coverage-badge";
import { PolicyEditor } from "@/components/app/reserves/policy-editor";
import { AUTONOMY_LABEL, formatPolicyValue, POLICY_FIELDS } from "@/components/app/reserves/policy-fields";
import { PolicyHistory } from "@/components/app/reserves/policy-history";
import { BURN_BASIS, RuleCards } from "@/components/app/reserves/rule-cards";
import { ScenariosPanel } from "@/components/app/reserves/scenarios";
import { useMetaIndex } from "@/components/app/treasury/meta";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Freshness } from "@/components/ui/identity";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { dateLabel, pct, usd } from "@/lib/format";
import { useCan, useOrgQuery } from "@/lib/org";
import type { OverviewDto, PoliciesDto, PolicyDto } from "@/lib/types";

const RULE_LABEL = { floor: "minimum reserve", runway: "operating runway", obligations: "upcoming obligations" } as const;

export default function ReservesPage() {
  const overview = useOrgQuery<OverviewDto>("/treasury");
  const policies = useOrgQuery<PoliciesDto>("/policies");
  const canEdit = useCan("policy.write");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (overview.data && typeof window !== "undefined" && window.location.hash === "#scenarios") {
      requestAnimationFrame(() => document.getElementById("scenarios")?.scrollIntoView({ block: "start" }));
    }
  }, [overview.data]);

  if (overview.isLoading || policies.isLoading) return <ReservesSkeleton />;
  if (overview.isError || !overview.data || policies.isError || !policies.data) {
    const err = (overview.error ?? policies.error) as Error | null;
    return (
      <div>
        <PageHeader title="Reserves" />
        <Callout
          tone="danger"
          title="Couldn't load the reserve"
          action={
            <Button variant="secondary" size="sm" onClick={() => (overview.refetch(), policies.refetch())}>
              Try again
            </Button>
          }
        >
          {err?.message ?? "Unknown error"}. Nothing was changed.
        </Callout>
      </div>
    );
  }

  const d = overview.data;
  const p = policies.data;
  const { reserve, treasury } = d;
  const binding = reserve.rules.find((r) => r.binding);

  return (
    <div>
      <PageHeader
        title="Reserves"
        description="How much must stay liquid, which policy rule sets that amount, and how it holds up under stress."
        meta={
          <>
            <Freshness at={d.lastObservedAt} label="Balances synced" staleAfterMinutes={d.policy.maxDataAgeMinutes} />
            <span>Policy v{p.treasuryVersion}</span>
            <span>{AUTONOMY_LABEL[d.autonomy]}</span>
            <span>As of {dateLabel(reserve.asOf)}</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" asChild>
              <a href="#scenarios">
                <FlaskConical className="size-4" aria-hidden="true" /> Stress test
              </a>
            </Button>
            {canEdit && (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" aria-hidden="true" /> Edit policy
              </Button>
            )}
          </>
        }
      />

      {!treasury.complete && (
        <Callout tone="warning" className="mb-4" title="Some inputs are incomplete" action={<Button variant="secondary" size="sm" asChild><Link href="/app/treasury#issues">See data issues</Link></Button>}>
          {treasury.issues.slice(0, 2).map((i) => i.message).join(". ")}
          {treasury.issues.length > 2 ? ` and ${treasury.issues.length - 2} more` : ""}. The requirement is still shown; coverage may change after the next sync.
        </Callout>
      )}
      {d.accounts.length === 0 && (
        <Callout tone="info" className="mb-4" title="No treasury accounts yet" action={<Button size="sm" asChild><Link href="/app/accounts?add=1">Add account</Link></Button>}>
          The requirement below comes from your policy and obligations. Reserve-eligible capital stays at $0 until TokenIQ can read an account.
        </Callout>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardBody className="sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[13px] font-medium text-text-2">Protected by policy</h2>
              <CoverageBadge reserve={reserve} />
              <UncertaintyBadge level={reserve.uncertainty.level} />
            </div>
            <Money value={reserve.required} tabular={false} className="mt-2 block text-[40px] font-medium leading-[1.1] tracking-[-0.02em] text-text" />
            <p className="mt-2 max-w-2xl text-sm text-text-2 text-pretty">
              {binding ? (
                <>
                  Set by the <strong className="font-medium text-text">{RULE_LABEL[binding.id]}</strong> rule, the largest of the enabled rules. {usd(reserve.available, { compact: true })} of reserve-eligible stablecoins
                  {reserve.pendingOutflows !== "0" ? `, less ${usd(reserve.pendingOutflows, { compact: true })} in pending proposals,` : ""} {reserve.status === "shortfall" ? `falls ${usd(reserve.shortfall, { compact: true })} short of it.` : "covers it."}
                </>
              ) : (
                "No rule currently requires a reserve. Add obligations, a burn estimate or a minimum reserve."
              )}
            </p>
            <CoverageBar reserve={reserve} thinBps={d.policy.thinCoverageBps} />
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat label="Reserve-eligible" value={<Money value={reserve.available} compact />} meta="Liquid stablecoins, after haircuts" />
              <Stat label="Coverage" value={reserve.coverageBps ? pct(reserve.coverageBps, 0) : "—"} meta={`Thin below ${pct(d.policy.thinCoverageBps, 0)}`} />
              <Stat label="Runway covered" value={reserve.runwayCoveredMonths ? `${reserve.runwayCoveredMonths} mo` : "—"} meta={reserve.burn.basis === "none" ? "Burn unknown" : `At ${usd(reserve.burn.used, { compact: true })}/mo`} />
              <Stat label="Deployable surplus" value={<Money value={reserve.surplus.deployable} compact />} meta={reserve.surplus.limitedBy === "deployment_cap" ? "Limited by the deployment cap" : reserve.surplus.limitedBy === "nothing_available" ? "Nothing available" : "After the requirement"} href="/app/opportunities" />
            </dl>
          </CardBody>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader title="What could change these figures" />
          <CardBody className="space-y-3 pt-3">
            {reserve.uncertainty.reasons.length === 0 && reserve.currencyMismatches.length === 0 && treasury.unverifiedValue === "0" ? (
              <p className="text-[13px] text-text-2">Inputs are complete: burn is known, obligations are recorded and every counted account is verified.</p>
            ) : (
              <ul className="space-y-2">
                {reserve.uncertainty.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-text-2">
                    <AlertTriangle className={cn("mt-0.5 size-3.5 shrink-0", r.level === "high" ? "text-danger" : "text-warning")} aria-label={r.level === "high" ? "High impact" : "Medium impact"} />
                    {r.message}
                  </li>
                ))}
              </ul>
            )}
            {reserve.currencyMismatches.map((m) => (
              <div key={m.currency} className="rounded-[var(--radius-control)] bg-sunken px-3 py-2 text-xs text-text-2">
                <div className="flex items-center gap-1.5 font-medium text-text">
                  <Coins className="size-3.5" aria-hidden="true" /> {m.currency} mismatch
                </div>
                <p className="mt-0.5">{m.message}.</p>
                <p className="num mt-1">
                  Owed {usd(m.obligations).replace("$", "")} {m.currency} · held {usd(m.holdings).replace("$", "")} {m.currency}
                </p>
              </div>
            ))}
            {treasury.unverifiedValue !== "0" && (
              <div className="rounded-[var(--radius-control)] bg-sunken px-3 py-2 text-xs text-text-2">
                <div className="flex items-center gap-1.5 font-medium text-text">
                  <ShieldAlert className="size-3.5" aria-hidden="true" /> <Money value={treasury.unverifiedValue} /> excluded
                </div>
                <p className="mt-0.5">
                  Held in accounts nobody has verified, so {d.policy.includeUnverifiedInReserve ? "it is counted only because the policy allows it" : "it does not count toward the reserve or the deployable surplus"}.{" "}
                  <Link href="/app/accounts" className="font-medium text-accent hover:underline">
                    Verify accounts
                  </Link>
                </p>
              </div>
            )}
            {reserve.pendingOutflows !== "0" && (
              <p className="text-xs text-text-2">
                <Money value={reserve.pendingOutflows} /> in approved or pending proposals is treated as already spent.
              </p>
            )}
            {reserve.expectedInflows !== "0" && (
              <p className="text-xs text-text-3">
                <Money value={reserve.expectedInflows} /> of expected inflows in the horizon is not counted (inflows never reduce the requirement).
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-[15px] font-semibold text-text">The three rules</h2>
      <RuleCards reserve={reserve} policy={d.policy} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Monthly burn" description="Used by the runway rule and the runway-covered figure." />
          <CardBody className="pt-3">
            <dl className="space-y-2 text-[13px]">
              <Line label="Declared in policy" value={reserve.burn.declared === null ? <span className="text-text-3">Not declared</span> : <Money value={reserve.burn.declared} />} active={reserve.burn.basis === "declared"} />
              <Line label="Itemized from recurring obligations" value={<Money value={reserve.burn.itemized} />} active={reserve.burn.basis === "itemized" || reserve.burn.basis === "itemized_exceeds_declared"} />
              <Line label="Used" value={<Money value={reserve.burn.used} className="font-medium" />} strong />
            </dl>
            <p className="mt-3 text-xs text-text-2">{BURN_BASIS[reserve.burn.basis]}. The engine always uses the higher of the two, so recurring obligations can never be under-reserved by a low estimate.</p>
            {reserve.burn.basis !== "declared" && canEdit && (
              <Button variant="link" size="sm" className="mt-1 text-xs" onClick={() => setEditing(true)}>
                {reserve.burn.declared === null ? "Declare a monthly burn" : "Update the declared burn"}
              </Button>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="From requirement to deployable" description="The same arithmetic the engine uses." />
          <CardBody className="pt-3">
            <dl className="space-y-2 text-[13px]">
              <Line label="Reserve-eligible" value={<Money value={reserve.available} />} />
              <Line label="− Requirement" value={<Money value={reserve.required} />} />
              {reserve.pendingOutflows !== "0" && <Line label="− Pending proposals" value={<Money value={reserve.pendingOutflows} />} />}
              <Line label="= Available after the reserve" value={<Money value={reserve.surplus.afterReserve} />} strong />
              <Line label={`Room under the ${pct(d.policy.maxDeployedBps, 0)} deployment cap`} value={<Money value={reserve.surplus.capRemaining} />} active={reserve.surplus.limitedBy === "deployment_cap"} />
              <Line label="Deployable surplus (the lower of the two)" value={<Money value={reserve.surplus.deployable} className="font-medium" />} strong />
            </dl>
            <p className="mt-3 text-xs text-text-2">{reserve.surplus.explanation}.</p>
          </CardBody>
        </Card>
      </div>

      <PolicySummary policy={d.policy} version={p.treasuryVersion} canEdit={canEdit} onEdit={() => setEditing(true)} />

      <div className="mt-4">
        <ScenariosPanel overview={d} />
      </div>

      <div className="mt-4">
        <PolicyHistory currentVersion={p.treasuryVersion} />
      </div>

      {canEdit && <PolicyEditor open={editing} onOpenChange={setEditing} policies={p} overview={d} />}
    </div>
  );
}

function CoverageBar({ reserve, thinBps }: { reserve: OverviewDto["reserve"]; thinBps: number }) {
  if (reserve.required === "0") return null;
  const w = (v: string) => Number.parseFloat(v); // geometry only; labels use exact strings
  const afterPendingWad = clamp(parseDecimal(reserve.available, 18, "down") - parseDecimal(reserve.pendingOutflows, 18, "down"));
  const availableAfter = wadToString(afterPendingWad);
  const thinWad = (parseDecimal(reserve.required, 18, "down") * BigInt(thinBps)) / 10_000n;
  const required = w(reserve.required);
  const thin = w(wadToString(thinWad));
  const scale = Math.max(w(availableAfter), thin * 1.08, 1);
  const pos = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  return (
    <div className="mt-5">
      <div className="relative h-3 rounded-full bg-sunken" aria-hidden="true">
        <div className={cn("absolute inset-y-0 left-0 rounded-full", reserve.status === "shortfall" ? "bg-danger/70" : "bg-deployable")} style={{ width: pos(w(availableAfter)) }} />
        <div className="hatch-reserve absolute -top-1 h-5 w-[3px] -translate-x-1/2 rounded-sm ring-2 ring-surface" style={{ left: pos(required) }} />
        <div className="absolute -top-1 h-5 -translate-x-1/2 border-l border-dashed border-text-2" style={{ left: pos(thin) }} />
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-2">
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={cn("h-2 w-4 rounded-full", reserve.status === "shortfall" ? "bg-danger/70" : "bg-deployable")} />
          Reserve-eligible{reserve.pendingOutflows !== "0" ? " after pending" : ""} <Money value={availableAfter} compact className="font-medium text-text" />
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="hatch-reserve h-3 w-[3px] rounded-sm" />
          Requirement <Money value={reserve.required} compact className="font-medium text-text" />
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 border-l border-dashed border-text-2" />
          Thin below <Money value={wadToString(thinWad)} compact className="font-medium text-text" />
        </li>
      </ul>
    </div>
  );
}

const clamp = (v: bigint) => (v < 0n ? 0n : v);

/** A dt/dd group. With `href`, the link sits inside the <dd> (a link may not wrap dt/dd) and stretches over the group. */
function Stat({ label, value, meta, href }: { label: string; value: ReactNode; meta?: string; href?: string }) {
  return (
    <div className={cn(href && "relative -m-1.5 rounded-[var(--radius-control)] p-1.5 hover:bg-sunken has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-[var(--focus)]")}>
      <dt className="text-xs font-medium text-text-2">{label}</dt>
      <dd className="mt-0.5 text-xl font-medium tracking-tight text-text">
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

function Line({ label, value, strong, active }: { label: string; value: ReactNode; strong?: boolean; active?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", strong && "border-t border-hairline pt-2")}>
      <dt className={cn(strong ? "font-medium text-text" : "text-text-2")}>
        {label}
        {active && (
          <StatusBadge tone="neutral" icon={null} className="ml-1.5 align-middle">
            Applies
          </StatusBadge>
        )}
      </dt>
      <dd className="num text-right text-text">{value}</dd>
    </div>
  );
}

const GROUPS: Array<{ title: string; fields: Array<keyof PolicyDto> }> = [
  { title: "Reserve rules", fields: ["monthlyBurnUsd", "runwayMonths", "minimumReserveUsd", "obligationHorizonDays", "obligationBufferBps", "includeEstimatedObligations", "thinCoverageBps"] },
  { title: "Valuation", fields: ["haircutsBps", "reserveAssets", "includeUnverifiedInReserve", "maxDataAgeMinutes"] },
  { title: "Allocation limits", fields: ["maxDeployedBps", "maxPerProtocolBps", "maxPerVenueBps", "maxShareOfVenueLiquidityBps", "minVenueTvlUsd", "maxVenueFeeBps", "minActionUsd", "allowedChains", "allowedAssets", "allowedProtocols"] },
  { title: "Autonomy", fields: ["autonomy"] },
];

function PolicySummary({ policy, version, canEdit, onEdit }: { policy: PolicyDto; version: number; canEdit: boolean; onEdit: () => void }) {
  const { chains } = useMetaIndex();
  const chainName = (id: number) => chains.get(id)?.name ?? `Chain ${id}`;
  return (
    <Card className="mt-4">
      <CardHeader
        title="Treasury policy"
        description={version === 0 ? "The default balanced policy. Nobody has saved a version yet." : `Version ${version}. Every figure on this page follows from these settings.`}
        action={
          canEdit ? (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil className="size-3.5" aria-hidden="true" /> Edit
            </Button>
          ) : (
            <span className="text-xs text-text-3">Read-only · owners and admins can change it</span>
          )
        }
      />
      <CardBody className="grid gap-x-8 gap-y-5 pt-3 md:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-3">{g.title}</h3>
            <dl className="mt-2 divide-y divide-hairline">
              {g.fields.map((f) => (
                <div key={f} className="flex items-baseline justify-between gap-4 py-1.5 text-[13px]">
                  <dt className="text-text-2">{POLICY_FIELDS[f].label}</dt>
                  <dd className="num text-right text-text">{formatPolicyValue(f, policy[f], chainName)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </CardBody>
      {policy.includeUnverifiedInReserve && (
        <div className="border-t border-hairline px-4 py-3 sm:px-5">
          <Callout tone="warning" title="Unverified accounts count toward the reserve">
            Balances that nobody has proven control of are treated as available. This can overstate coverage.
          </Callout>
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-hairline px-4 py-3 text-xs text-text-3 sm:px-5">
        <Wallet className="size-3.5" aria-hidden="true" />
        Venue limits are checked for every recommendation.{" "}
        <Link href="/app/allocations" className="inline-flex items-center gap-0.5 font-medium text-accent hover:underline">
          Current allocations <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}

function ReservesSkeleton() {
  return (
    <LoadingRegion label="Calculating the reserve…">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mb-5 mt-2 h-4 w-96 max-w-full" />
      <div className="grid gap-4 xl:grid-cols-12">
        <Skeleton className="h-72 xl:col-span-8" />
        <Skeleton className="h-72 xl:col-span-4" />
      </div>
      <Skeleton className="mb-3 mt-8 h-5 w-32" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </LoadingRegion>
  );
}
