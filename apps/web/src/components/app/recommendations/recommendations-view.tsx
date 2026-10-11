"use client";

import { CheckCircle2, CircleDashed, DatabaseZap, Settings2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Freshness } from "@/components/ui/identity";
import { PageHeader } from "@/components/ui/page-header";
import { PolicyCheckList } from "@/components/ui/policy-checks";
import { QueryError } from "@/components/ui/query-error";
import { Segmented } from "@/components/ui/segmented";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { cmpUsd, usd } from "@/lib/format";
import { useOrgQuery } from "@/lib/org";
import type { ApprovalPolicyDto, OpportunitiesResponse, OverviewDto, PoliciesDto, PolicyCheck, RecommendationsResponse } from "@/lib/types";
import { RecommendationDocument, type RecommendationContext } from "./recommendation-document";

type Show = "open" | "all";

export function RecommendationsView() {
  const params = useSearchParams();
  const [show, setShow] = useState<Show>(params.get("show") === "all" ? "all" : "open");
  const q = useOrgQuery<RecommendationsResponse>(show === "open" ? "/recommendations" : "/recommendations?include=all");
  const overview = useOrgQuery<OverviewDto>("/treasury", { staleTime: 30_000 });
  const opps = useOrgQuery<OpportunitiesResponse>("/opportunities", { staleTime: 60_000 });
  const policies = useOrgQuery<PoliciesDto>("/policies", { staleTime: 60_000 });
  const [highlight, setHighlight] = useState<string | null>(null);

  // Deep links (/app/recommendations#<id>) arrive before the list renders; scroll once it has.
  const ready = !!q.data;
  useEffect(() => {
    if (!ready) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setHighlight(id);
    const t = setTimeout(() => setHighlight(null), 2500);
    return () => clearTimeout(t);
  }, [ready]);

  const ctx: RecommendationContext = {
    isSample: q.data?.isSample ?? false,
    accounts: overview.data?.accounts ?? [],
    positions: overview.data?.positions ?? [],
    opportunities: opps.data?.opportunities ?? [],
    approval: (policies.data?.approval as ApprovalPolicyDto | undefined) ?? null,
  };
  const list = q.data?.recommendations ?? [];
  const openCount = list.filter((r) => r.status === "open").length;
  const sorted = [...list].sort((a, b) => Number(b.status === "open") - Number(a.status === "open") || Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Recommendations"
        description="Actions the deterministic policy engine proposes from your balances, obligations and policy. Nothing moves until people approve it and Safe owners sign."
        meta={
          <>
            <span>Recomputed from current data on every visit</span>
            {opps.data && <span>Policy v{opps.data.policyVersion}</span>}
            {overview.data && <Freshness at={overview.data.lastObservedAt} label="Balances synced" />}
          </>
        }
        actions={
          <Segmented<Show>
            label="Which recommendations to show"
            size="sm"
            value={show}
            onValueChange={setShow}
            options={[
              { value: "open", label: "Open" },
              { value: "all", label: "Including past" },
            ]}
          />
        }
      />

      {q.isLoading ? (
        <LoadingRegion label="Running the policy engine…" className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </LoadingRegion>
      ) : q.isError || !q.data ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't load recommendations" />
      ) : (
        <div className="space-y-4">
          {q.data.isSample && (
            <Callout tone="warning" title="Sample workspace">
              These recommendations are computed from simulated balances and real venue data. You can explore every step up to approval, but nothing can be signed or executed.
            </Callout>
          )}

          {openCount === 0 &&
            (q.data.whyNone === null ? (
              <Callout tone="success" title="Nothing open: the current recommendation was already handled" action={show === "open" ? <Button variant="secondary" size="sm" onClick={() => setShow("all")}>Show past</Button> : undefined}>
                The engine&apos;s suggestion for the current situation was already turned into a proposal or dismissed, so it is not raised again. A new recommendation appears when balances, obligations, venues or policy change materially.
              </Callout>
            ) : (
              <WhyNone whyNone={q.data.whyNone} overview={overview.data} opps={opps.data} />
            ))}

          {sorted.length > 0 && (
            <>
              {show === "all" && <h2 className="sr-only">All recommendations</h2>}
              <ol className="space-y-5" aria-label={show === "open" ? "Open recommendations" : "All recommendations"}>
                {sorted.map((r) => (
                  <li key={r.id}>
                    <RecommendationDocument rec={r} ctx={ctx} highlighted={highlight === r.id} />
                  </li>
                ))}
              </ol>
            </>
          )}
          {show === "all" && sorted.length === 0 && <p className="text-sm text-text-2">No recommendations have been raised for this organization yet.</p>}
        </div>
      )}
    </div>
  );
}

type WhyKind = "setup" | "data" | "policy" | "clear";

function classify(whyNone: string | null): { kind: WhyKind; title: string; action?: { label: string; href: string } } {
  const w = whyNone ?? "";
  if (/add a treasury account/i.test(w)) return { kind: "setup", title: "TokenIQ can't see any balances yet", action: { label: "Add account", href: "/app/accounts?add=1" } };
  if (/missing or stale|key inputs are missing/i.test(w)) return { kind: "data", title: "Waiting for complete data", action: { label: "Check accounts and data", href: "/app/accounts" } };
  if (/no venue data/i.test(w)) return { kind: "data", title: "Waiting for venue data", action: { label: "View opportunities", href: "/app/opportunities" } };
  if (/observe-only/i.test(w)) return { kind: "policy", title: "Observe-only mode", action: { label: "Review policy", href: "/app/reserves" } };
  if (/verified safe/i.test(w)) return { kind: "setup", title: "No verified Safe to act from", action: { label: "Verify an account", href: "/app/accounts" } };
  if (/no venue passes/i.test(w)) return { kind: "clear", title: "No venue qualifies for the deployable amount", action: { label: "See which checks fail", href: "/app/opportunities" } };
  if (/nothing is deployable/i.test(w)) return { kind: "clear", title: "Nothing qualifies right now", action: { label: "See the reserve calculation", href: "/app/reserves" } };
  return { kind: "clear", title: "Nothing qualifies right now" };
}

/** Explains an empty list: is the treasury simply within policy, or is the engine paused on missing data? */
function WhyNone({ whyNone, overview, opps }: { whyNone: string | null; overview?: OverviewDto; opps?: OpportunitiesResponse }) {
  const c = classify(whyNone);
  const Icon = c.kind === "clear" ? CheckCircle2 : c.kind === "policy" ? Settings2 : c.kind === "data" ? DatabaseZap : CircleDashed;
  const tone = c.kind === "clear" ? "text-success" : c.kind === "policy" ? "text-text-2" : "text-warning";
  const checks = overview ? engineChecks(overview, opps) : [];
  return (
    <Card>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CardBody className="sm:p-6">
          <Icon className={`size-6 ${tone}`} aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-text">{c.title}</h2>
          <p className="mt-1 text-sm text-text-2 text-pretty">{whyNone ?? "The engine found no action that passes every policy check."}</p>
          <p className="mt-3 text-xs text-text-3">
            {c.kind === "clear"
              ? "This is a normal state: the engine only recommends an action when one is needed or clearly allowed. It re-checks every time balances, obligations, venues or policy change."
              : c.kind === "policy"
                ? "Your policy tells the engine to watch without proposing actions. Alerts and reports still work."
                : "Recommendations are paused rather than guessed. They resume automatically once the inputs are complete."}
          </p>
          {c.action && (
            <Button size="sm" variant={c.kind === "clear" ? "secondary" : "primary"} className="mt-4" asChild>
              <Link href={c.action.href}>{c.action.label}</Link>
            </Button>
          )}
        </CardBody>
        {checks.length > 0 && (
          <div className="border-t border-hairline lg:border-l lg:border-t-0">
            <CardHeader title="What the engine checked" description="In this order, against your current data and policy." />
            <CardBody className="pt-1">
              <PolicyCheckList checks={checks} order={false} />
            </CardBody>
          </div>
        )}
      </div>
    </Card>
  );
}

/** The engine's gates, evaluated from the same overview the shell shows, for context only. */
function engineChecks(d: OverviewDto, opps?: OpportunitiesResponse): PolicyCheck[] {
  const r = d.reserve;
  const out: PolicyCheck[] = [];
  out.push({ id: "accounts", label: "Treasury accounts connected", status: d.accounts.length > 0 ? "pass" : "fail", detail: `${d.accounts.length} account${d.accounts.length === 1 ? "" : "s"} tracked` });
  out.push({
    id: "data",
    label: "Balances and prices complete",
    status: d.treasury.complete && r.uncertainty.level !== "high" ? "pass" : "fail",
    detail: d.treasury.complete ? (r.uncertainty.level === "high" ? r.uncertainty.reasons.find((x) => x.level === "high")?.message ?? "Key inputs are missing" : "All balances and prices are current") : `${d.treasury.issues.length} data issue${d.treasury.issues.length === 1 ? "" : "s"}`,
  });
  out.push({
    id: "reserve",
    label: "Protected reserve covered",
    status: r.status === "shortfall" ? "fail" : r.status === "no_requirement" ? "warn" : "pass",
    detail: r.status === "shortfall" ? `${usd(r.shortfall)} short of the ${usd(r.required)} requirement` : r.status === "no_requirement" ? "No reserve requirement is configured" : `${usd(r.available)} eligible against ${usd(r.required)} required`,
  });
  out.push({ id: "autonomy", label: "Policy allows proposals", status: d.policy.autonomy === "observe" ? "fail" : "pass", detail: d.policy.autonomy === "observe" ? "Observe-only mode" : "Every action needs approval and Safe signatures" });
  const enough = cmpUsd(r.surplus.deployable, d.policy.minActionUsd) >= 0;
  out.push({ id: "deployable", label: "Deployable surplus above the minimum action", status: enough ? "pass" : "fail", detail: `${usd(r.surplus.deployable)} deployable; minimum action is ${usd(d.policy.minActionUsd)}` });
  const safe = d.accounts.some((a) => a.verified && a.kind === "safe" && a.includeInTreasury);
  out.push({ id: "safe", label: "Verified Safe to act from", status: safe ? "pass" : "fail", detail: safe ? "Proposals execute through a verified Safe" : "Verify control of a Safe account" });
  if (opps) {
    const suitable = opps.opportunities.filter((o) => o.suitability.suitable).length;
    out.push({ id: "venues", label: "A listed venue passes every policy check", status: suitable > 0 ? "pass" : "fail", detail: `${suitable} of ${opps.opportunities.length} venue${opps.opportunities.length === 1 ? "" : "s"} suitable` });
  }
  return out;
}
