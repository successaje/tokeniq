"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { refTarget } from "@/components/app/recommendations/refs";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { errorMessage, QueryError } from "@/components/ui/query-error";
import { Segmented } from "@/components/ui/segmented";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type Tone } from "@/components/ui/status";
import { Timestamp } from "@/components/ui/timestamp";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useCan, useOrg, useOrgQuery } from "@/lib/org";
import type { AlertDto, AlertsResponse } from "@/lib/types";

type View = "active" | "resolved";

const SEVERITY: Record<AlertDto["severity"], { label: string; tone: Tone; icon: typeof ShieldAlert; description: string }> = {
  critical: { label: "Critical", tone: "danger", icon: ShieldAlert, description: "Act now: money owed or protected may be at risk." },
  warning: { label: "Warning", tone: "warning", icon: AlertTriangle, description: "Needs attention soon." },
  info: { label: "Information", tone: "info", icon: Info, description: "Worth knowing; no action required." },
};

export function RiskView() {
  const [view, setView] = useState<View>("active");
  // "/alerts" (active) is the same key the shell badge and Overview use, so acknowledging updates them too.
  const active = useOrgQuery<AlertsResponse>("/alerts");
  const resolved = useOrgQuery<AlertsResponse>("/alerts?status=resolved", { enabled: view === "resolved" });
  const q = view === "active" ? active : resolved;
  const alerts = q.data?.alerts ?? [];
  const openCount = active.data?.alerts.filter((a) => a.status === "open").length;

  return (
    <div>
      <PageHeader
        title="Risk"
        description="Conditions in your treasury that need attention, with the evidence behind each one and what to do next."
        meta={
          <>
            <span>Re-evaluated on every visit and every 10 minutes</span>
            {openCount !== undefined && (
              <span>
                {openCount} unacknowledged · {active.data!.alerts.length} active
              </span>
            )}
          </>
        }
        actions={
          <Segmented<View>
            label="Which alerts to show"
            size="sm"
            value={view}
            onValueChange={setView}
            options={[
              { value: "active", label: "Active" },
              { value: "resolved", label: "Resolved" },
            ]}
          />
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {q.isLoading ? (
            <LoadingRegion label="Evaluating risk rules…" className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </LoadingRegion>
          ) : q.isError || !q.data ? (
            <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't load alerts" />
          ) : alerts.length === 0 ? (
            view === "active" ? (
              <EmptyState
                icon={ShieldCheck}
                title="No active alerts"
                description="TokenIQ watches reserve coverage, overdue and unfunded obligations, stablecoin depegs, stale prices and account syncs, concentration, venue liquidity and venue warnings. Anything that needs attention appears here with its evidence."
              />
            ) : (
              <EmptyState icon={CheckCircle2} title="No resolved alerts yet" description="When a condition clears, its alert moves here automatically with the time it resolved." />
            )
          ) : view === "active" ? (
            <div className="space-y-6">
              {(["critical", "warning", "info"] as const).map((sev) => {
                const group = alerts.filter((a) => a.severity === sev);
                if (!group.length) return null;
                const s = SEVERITY[sev];
                return (
                  <section key={sev} aria-labelledby={`sev-${sev}`}>
                    <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                      <h2 id={`sev-${sev}`} className="flex items-center gap-1.5 text-[15px] font-semibold text-text">
                        <s.icon className={cn("size-4", toneText(s.tone))} aria-hidden="true" />
                        {s.label}
                        <span className="num text-sm font-normal text-text-3">{group.length}</span>
                      </h2>
                      <span className="text-xs text-text-3">{s.description}</span>
                    </div>
                    <ul className="space-y-3">
                      {group.map((a) => (
                        <li key={a.id}>
                          <AlertCard alert={a} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Resolved alerts">
              {alerts.map((a) => (
                <li key={a.id}>
                  <AlertCard alert={a} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="How alerts work" />
          <CardBody className="pt-2">
            <ol className="space-y-3 text-[13px] text-text-2">
              <li>
                <strong className="font-medium text-text">One condition, one alert.</strong> Each rule produces a fingerprint for the exact condition (for example “USDC on Base below peg”). While it stays true, the same alert updates its last-seen time instead of opening duplicates or re-notifying.
              </li>
              <li>
                <strong className="font-medium text-text">Acknowledging is a signal to your team</strong> that someone is handling it. It does not hide or close the alert.
              </li>
              <li>
                <strong className="font-medium text-text">Alerts resolve themselves.</strong> When the condition is no longer true on the next evaluation, the alert moves to Resolved. If it happens again later, a new alert opens.
              </li>
              <li>
                <strong className="font-medium text-text">Severity is fixed by the rule</strong>, not by opinion: for example, a depeg of 2% or more is critical, 0.5% is a warning.
              </li>
            </ol>
            <p className="mt-3 text-xs text-text-3">
              Rules run on your latest balances, prices, obligations and venue data.{" "}
              <Link href="/app/help#calculations" className="text-accent hover:underline">
                How calculations work
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function toneText(t: Tone) {
  return t === "danger" ? "text-danger" : t === "warning" ? "text-warning" : t === "info" ? "text-info" : "text-text-2";
}

function AlertCard({ alert: a }: { alert: AlertDto }) {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const canManage = useCan("alerts.manage");
  const s = SEVERITY[a.severity];
  const target = refTarget(a.ref);
  const ack = useMutation({
    mutationFn: () => api(orgPath(orgId, `/alerts/${encodeURIComponent(a.id)}/acknowledge`), { method: "POST" }),
    onSuccess: () => {
      toast({ id: `ack-${a.id}`, tone: "success", title: "Alert acknowledged", description: "Your team can see you're handling it. It resolves automatically when the condition clears." });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 404) toast({ id: `ack-${a.id}`, tone: "info", title: "Already handled", description: "This alert was acknowledged or resolved in the meantime." });
      else toast({ id: `ack-${a.id}`, tone: "danger", title: "Couldn't acknowledge the alert", description: errorMessage(err) });
    },
    onSettled: () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "org" && q.queryKey[1] === orgId && typeof q.queryKey[2] === "string" && q.queryKey[2].startsWith("/alerts") }),
  });

  return (
    <Card className={cn("overflow-hidden", a.status === "open" && a.severity === "critical" && "border-danger/40")}>
      <div className="flex gap-3 px-4 py-4 sm:px-5">
        <s.icon className={cn("mt-0.5 size-5 shrink-0", a.status === "resolved" ? "text-text-3" : toneText(s.tone))} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-text">{a.title}</h3>
            {a.status === "open" && (
              <StatusBadge tone={s.tone} icon={null}>
                {s.label} · Open
              </StatusBadge>
            )}
            {a.status === "acknowledged" && (
              <StatusBadge tone="neutral" icon={Eye}>
                Acknowledged
              </StatusBadge>
            )}
            {a.status === "resolved" && <StatusBadge tone="success">Resolved</StatusBadge>}
          </div>
          <p className="mt-1 text-sm text-text">{a.condition}</p>

          {a.evidence.length > 0 && (
            <dl className="mt-3 grid gap-x-6 gap-y-1.5 rounded-[var(--radius-control)] bg-sunken px-3 py-2 sm:grid-cols-2">
              {a.evidence.map((e, i) => (
                <div key={i} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <dt className="text-text-2">{e.label}</dt>
                  <dd className="num text-right font-medium text-text">{e.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-3 flex gap-2 text-[13px]">
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <p>
              <span className="font-medium text-text">Recommended action: </span>
              <span className="text-text-2">{a.recommendedAction}</span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
            <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-3">
              <span>
                First seen <Timestamp at={a.firstSeenAt} />
              </span>
              <span>
                Last seen <Timestamp at={a.lastSeenAt} />
              </span>
              {a.acknowledgedAt && (
                <span>
                  Acknowledged <Timestamp at={a.acknowledgedAt} />
                </span>
              )}
              {a.resolvedAt && (
                <span>
                  Resolved <Timestamp at={a.resolvedAt} />
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {target.href && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={target.href}>View {target.label.toLowerCase()}</Link>
                </Button>
              )}
              {a.status === "open" && canManage && (
                <Button variant="secondary" size="sm" onClick={() => ack.mutate()} loading={ack.isPending} loadingLabel="Acknowledging">
                  Acknowledge
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
