"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Lightbulb, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Money } from "@/components/ui/money";
import { Callout } from "@/components/ui/status";
import { api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateTimeLabel, isPositive, pct, usd } from "@/lib/format";
import type { ObligationDto, OverviewDto, PoliciesDto } from "@/lib/types";
import { StepProgress } from "./onboarding-step";
import { useOnboardingOrg } from "./use-onboarding-org";

export function CompleteStep() {
  const { me, org, resolving } = useOnboardingOrg();
  const orgId = org?.id ?? "";
  const overview = useQuery({ queryKey: ["org", orgId, "/treasury"], queryFn: ({ signal }) => api<OverviewDto>(orgPath(orgId, "/treasury"), { signal }), enabled: !!org });
  const obligations = useQuery({ queryKey: ["org", orgId, "/obligations?status=active"], queryFn: ({ signal }) => api<{ obligations: ObligationDto[] }>(orgPath(orgId, "/obligations?status=active"), { signal }), enabled: !!org });
  const policies = useQuery({ queryKey: ["org", orgId, "/policies"], queryFn: ({ signal }) => api<PoliciesDto>(orgPath(orgId, "/policies"), { signal }), enabled: !!org });

  if (resolving || (org && (overview.isLoading || obligations.isLoading))) {
    return (
      <LoadingRegion label="Calculating your treasury figures…">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80" />
        <Skeleton className="mt-6 h-40 w-full" />
        <Skeleton className="mt-4 h-56 w-full" />
      </LoadingRegion>
    );
  }
  if (!org || !me.data) {
    return (
      <Callout tone="warning" title="No organization to summarise" action={<Button size="sm" asChild><Link href="/onboarding/organization">Start setup</Link></Button>}>
        Create an organization to see its setup summary.
      </Callout>
    );
  }
  if (overview.isError || !overview.data) {
    return (
      <Callout tone="danger" title="Setup is saved, but the figures didn't load" action={<Button size="sm" variant="secondary" onClick={() => overview.refetch()}>Try again</Button>}>
        {(overview.error as Error)?.message ?? "Unknown error"}. You can also go straight to the{" "}
        <Link href="/app" className="font-medium text-accent hover:underline">
          overview
        </Link>
        .
      </Callout>
    );
  }

  const d = overview.data;
  const accounts = d.accounts;
  const verified = accounts.filter((a) => a.verified).length;
  const obligationCount = obligations.data?.obligations.length ?? 0;
  const presetLabel = policies.data ? (Object.values(policies.data.presets).find((p) => p.policy.obligationHorizonDays === d.policy.obligationHorizonDays && p.policy.maxDeployedBps === d.policy.maxDeployedBps && p.policy.obligationBufferBps === d.policy.obligationBufferBps)?.label ?? "Custom") : null;
  const reasons = d.reserve.uncertainty.reasons;

  const steps = [
    accounts.length === 0
      ? { done: false, icon: ShieldCheck, label: "Add a treasury account", detail: "Paste a Safe or wallet address so TokenIQ can read balances.", href: "/app/accounts?add=1" }
      : { done: verified === accounts.length, icon: ShieldCheck, label: verified === accounts.length ? "Accounts verified" : `Verify ${accounts.length - verified === 1 ? "your account" : `${accounts.length - verified} accounts`}`, detail: verified === accounts.length ? "Every tracked account counts toward the reserve." : "An owner signs a free message so the balance counts toward the reserve.", href: "/app/accounts" },
    { done: false, icon: Users, label: "Invite your team", detail: "Approvers review proposals; Safe owners sign them in their own wallets.", href: "/app/team" },
    { done: false, icon: Lightbulb, label: "Review recommendations", detail: "Policy-checked suggestions for what to protect and what could be deployed.", href: "/app/recommendations" },
  ];

  return (
    <div>
      <StepProgress current={5} done={["organization", "treasury", "obligations", "policy"]} />
      <div className="mt-6 flex items-start gap-3">
        <CheckCircle2 className="mt-1 size-6 shrink-0 text-success" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.01em]">{org.name} is set up</h1>
          <p className="mt-1.5 text-sm text-text-2">Here is what TokenIQ knows so far, computed {dateTimeLabel(d.computedAt)}.</p>
        </div>
      </div>

      <Card className="mt-6">
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-text-2">Protected by policy</div>
            <Money value={d.reserve.required} className="mt-1 block text-2xl font-medium tracking-tight text-text" />
            <p className="mt-1 text-xs text-text-3">{d.reserve.bindingRule ? d.reserve.rules.find((r) => r.binding)?.explanation : "No requirement yet: add a monthly spend or obligations."}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-text-2">Could be deployed now</div>
            <Money value={d.reserve.surplus.deployable} className="mt-1 block text-2xl font-medium tracking-tight text-accent" />
            <p className="mt-1 text-xs text-text-3">{d.reserve.surplus.explanation}</p>
          </div>
        </CardBody>
        <dl className="grid grid-cols-2 gap-px border-t border-hairline bg-hairline sm:grid-cols-4">
          {[
            { k: "Accounts", v: accounts.length ? `${accounts.length} · ${verified} verified` : "None yet" },
            { k: "Tracked value", v: <Money value={d.treasury.gross} compact /> },
            { k: "Obligations", v: obligationCount ? `${obligationCount} active` : "None yet" },
            { k: "Policy", v: `${presetLabel ?? "v" + d.policyVersion} · ${d.policy.runwayMonths} mo runway` },
          ].map((x) => (
            <div key={x.k} className="bg-surface px-4 py-3">
              <dt className="text-xs text-text-2">{x.k}</dt>
              <dd className="mt-0.5 text-[13px] font-medium text-text">{x.v}</dd>
            </div>
          ))}
        </dl>
        {(reasons.length > 0 || isPositive(d.treasury.unverifiedValue)) && (
          <div className="border-t border-hairline px-4 py-3 sm:px-5">
            <div className="text-xs font-medium text-text-2">Why these figures may change</div>
            <ul className="mt-1.5 space-y-1">
              {isPositive(d.treasury.unverifiedValue) && (
                <li className="flex gap-1.5 text-xs text-text-2">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning" aria-hidden="true" />
                  {usd(d.treasury.unverifiedValue, { compact: true })} sits in unverified accounts and is excluded until control is proven.
                </li>
              )}
              {reasons.slice(0, 4).map((r, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-text-2">
                  <AlertTriangle className={cn("mt-0.5 size-3 shrink-0", r.level === "high" ? "text-danger" : "text-warning")} aria-hidden="true" />
                  {r.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <p className="mt-2 text-xs text-text-3">
        Up to {pct(d.policy.maxDeployedBps, 0)} of the treasury may be deployed under this policy. Nothing moves without approval and your Safe owners&apos; signatures.
      </p>

      <Card className="mt-4">
        <CardHeader title="Next steps" />
        <CardBody className="pt-2">
          <ol className="space-y-1">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-start gap-3 rounded-[var(--radius-control)] px-2 py-2.5 hover:bg-sunken">
                  {s.done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Done" /> : <Circle className="mt-0.5 size-5 shrink-0 text-text-3" aria-label="To do" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-medium", s.done ? "text-text-2" : "text-text")}>{s.label}</span>
                    <span className="block text-xs text-text-2">{s.detail}</span>
                  </span>
                  {!s.done && <ArrowRight className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />}
                </Link>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button size="lg" asChild className="justify-center">
          <Link href="/app">
            Go to the overview <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button variant="ghost" asChild className="h-11 justify-center sm:h-9">
          <Link href="/onboarding/policy">Back to policy</Link>
        </Button>
      </div>
    </div>
  );
}
