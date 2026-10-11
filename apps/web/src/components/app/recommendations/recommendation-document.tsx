"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseDecimal, tierFor, type ApprovalPolicy } from "@tokeniq/core";
import { ArrowRight, Bot, CircleSlash, Cpu, FileCheck2, Info, Lightbulb, ShieldAlert, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { Money, TokenAmount } from "@/components/ui/money";
import { checkSummary, PolicyCheckList } from "@/components/ui/policy-checks";
import { errorMessage } from "@/components/ui/query-error";
import { Callout, StatusBadge, type Tone } from "@/components/ui/status";
import { Timestamp } from "@/components/ui/timestamp";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, fieldErrors, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { pct } from "@/lib/format";
import { useCan, useOrg } from "@/lib/org";
import type { AccountDto, ApprovalPolicyDto, OpportunityDto, PositionDto, RecommendationDto } from "@/lib/types";
import { tierRequirement } from "@/components/app/settings/approval-text";
import { refTarget } from "./refs";

export const KIND_LABEL: Record<RecommendationDto["kind"], string> = {
  deploy_surplus: "Deploy surplus",
  restore_reserve: "Restore reserve",
  reduce_concentration: "Reduce concentration",
  hold: "Hold",
};

const KIND_ICON = { deploy_surplus: Lightbulb, restore_reserve: ShieldAlert, reduce_concentration: Undo2, hold: CircleSlash } as const;

const STATUS: Record<RecommendationDto["status"], { tone: Tone; label: string }> = {
  open: { tone: "accent", label: "Open" },
  accepted: { tone: "success", label: "Proposal created" },
  dismissed: { tone: "neutral", label: "Dismissed" },
  superseded: { tone: "neutral", label: "No longer applies" },
};

export interface RecommendationContext {
  isSample: boolean;
  accounts: AccountDto[];
  positions: PositionDto[];
  opportunities: OpportunityDto[];
  approval: ApprovalPolicyDto | null;
}

function Section({ title, children, aside, className }: { title: string; children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-hairline px-4 py-4 sm:px-6", className)}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-text-3">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((d, i) => (
        <li key={i} className="flex gap-2 text-sm text-text-2">
          <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-text-3" />
          <span className="text-pretty">{d}</span>
        </li>
      ))}
    </ul>
  );
}

/** Plain-language approval requirement for an amount under the current approval policy. */
function approvalNeeds(policy: ApprovalPolicyDto | null, amountUsd: string): string | null {
  if (!policy) return null;
  try {
    const tier = tierFor(policy as ApprovalPolicy, parseDecimal(amountUsd));
    return `${tierRequirement(tier).replace(/approval/, "internal approval")}${policy.allowSelfApproval ? "" : " (not the proposer)"}, then Safe signatures`;
  } catch {
    return null;
  }
}

/**
 * A recommendation rendered as a decision document: why it exists, the exact
 * action, the evidence and policy checks behind it, what it costs and what
 * else the team could do. Every word comes from the deterministic engine.
 */
export function RecommendationDocument({ rec, ctx, highlighted }: { rec: RecommendationDto; ctx: RecommendationContext; highlighted?: boolean }) {
  const KindIcon = KIND_ICON[rec.kind];
  const status = STATUS[rec.status];
  const open = rec.status === "open";
  const titleId = `rec-title-${rec.id}`;
  const proposalId = rec.status === "accepted" ? /^Proposal (\S+)$/.exec(rec.resolution ?? "")?.[1] : undefined;
  const alternatives = rec.alternatives.some((a) => a.title.toLowerCase() === "do nothing")
    ? rec.alternatives
    : [...rec.alternatives, { title: "Do nothing", consequence: "Nothing changes. The engine re-checks on every visit and keeps this recommendation open while the condition holds." }];

  return (
    <article id={rec.id} aria-labelledby={titleId} className={cn("scroll-mt-24 rounded-[var(--radius-card)] transition-shadow duration-[var(--dur-slow)]", highlighted && "ring-2 ring-accent ring-offset-2 ring-offset-canvas")}>
      <Card className="overflow-hidden">
        <header className="px-4 pb-4 pt-4 sm:px-6 sm:pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="neutral" icon={KindIcon}>
              {KIND_LABEL[rec.kind]}
            </StatusBadge>
            <StatusBadge tone={status.tone} icon={null}>
              {status.label}
            </StatusBadge>
            <span className="text-xs text-text-3">
              Raised <Timestamp at={rec.createdAt} />
            </span>
          </div>
          <h2 id={titleId} className="mt-2 text-lg font-semibold leading-7 tracking-[-0.01em] text-text text-balance sm:text-xl">
            {rec.title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-text-2 text-pretty">{rec.summary}</p>
          {!open && rec.resolution && (
            <p className="mt-2 text-xs text-text-3">
              {status.label}
              {rec.resolvedAt && (
                <>
                  {" "}
                  <Timestamp at={rec.resolvedAt} />
                </>
              )}
              {proposalId ? (
                <>
                  {" · "}
                  <Link href={`/app/approvals/${encodeURIComponent(proposalId)}`} className="font-medium text-accent hover:underline">
                    View proposal
                  </Link>
                </>
              ) : (
                <>: “{rec.resolution}”</>
              )}
            </p>
          )}
        </header>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <Section title="Why now">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-text-2">Trigger</dt>
                  <dd className="mt-0.5 text-sm text-text">{rec.trigger}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-text-2">Objective</dt>
                  <dd className="mt-0.5 text-sm text-text">{rec.objective}</dd>
                </div>
              </dl>
            </Section>

            <Section title="Evidence">
              <EvidenceTable evidence={rec.evidence} />
            </Section>

            <Section title="Policy checks" aside={rec.validation && <span className="text-xs text-text-3">{checkSummary(rec.validation.checks)}</span>}>
              {rec.validation ? (
                <PolicyCheckList checks={rec.validation.checks} collapsePassing />
              ) : (
                <p className="text-sm text-text-2">There is no executable action, so no transaction checks were run. The finding itself comes from the reserve and exposure calculations listed as evidence.</p>
              )}
            </Section>

            <Section
              title="Upside"
              aside={
                <StatusBadge tone="info" icon={Info}>
                  Estimate
                </StatusBadge>
              }
            >
              <p className="text-sm text-text">{rec.upside}</p>
            </Section>

            <div className="grid md:grid-cols-2">
              <Section title="Downside">
                <Bullets items={rec.downside} />
              </Section>
              <Section title="What could go wrong" className="md:border-l">
                <Bullets items={rec.whatCouldGoWrong} />
              </Section>
            </div>

            <Section title="Liquidity impact">
              <p className="text-sm text-text">{rec.liquidityImpact}</p>
            </Section>

            <Section title="Alternatives">
              <ul className="grid gap-2 sm:grid-cols-2">
                {alternatives.map((a, i) => (
                  <li key={i} className="rounded-[var(--radius-control)] border border-hairline px-3 py-2.5">
                    <div className="text-[13px] font-medium text-text">{a.title}</div>
                    <p className="mt-0.5 text-xs text-text-2">{a.consequence}</p>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Basis">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="neutral" icon={Cpu}>
                  Deterministic policy engine
                </StatusBadge>
                <span className="inline-flex items-center gap-1 text-xs text-text-3">
                  <Bot className="size-3.5" aria-hidden="true" /> No AI-generated text in this recommendation
                </span>
              </div>
              <p className="mt-2 text-sm text-text-2">{rec.basis}</p>
              <p className="mt-1 text-xs text-text-3">The same inputs always produce the same recommendation. The copilot can explain it but cannot create or change it.</p>
            </Section>
          </div>

          <DecisionPanel rec={rec} ctx={ctx} />
        </div>
      </Card>
    </article>
  );
}

function EvidenceTable({ evidence }: { evidence: RecommendationDto["evidence"] }) {
  if (evidence.length === 0) return <p className="text-sm text-text-2">No evidence recorded.</p>;
  return (
    <dl className="divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline">
      {evidence.map((e, i) => {
        const src = refTarget(e.ref);
        return (
          <div key={i} className="grid gap-x-4 gap-y-0.5 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_9rem] sm:items-baseline">
            <dt className="text-[13px] text-text-2">{e.label}</dt>
            <dd className="num text-[13px] font-medium text-text sm:text-right">{e.value}</dd>
            <dd className="text-xs text-text-3 sm:text-right">
              {src.href ? (
                <Link href={src.href} className="hover:text-text hover:underline">
                  {src.label}
                </Link>
              ) : (
                src.label
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function DecisionPanel({ rec, ctx }: { rec: RecommendationDto; ctx: RecommendationContext }) {
  const a = rec.action;
  const v = rec.validation;
  const account = a ? ctx.accounts.find((x) => x.id === a.accountId) : undefined;
  const opp = a?.opportunityId ? ctx.opportunities.find((o) => o.id === a.opportunityId) : undefined;
  const position = a?.positionId ? ctx.positions.find((p) => p.id === a.positionId) : undefined;
  const decimals = opp?.asset.decimals ?? position?.decimals;
  const symbol = opp?.asset.symbol ?? position?.symbol;
  const needs = a ? approvalNeeds(ctx.approval, a.amountUsd) : null;

  return (
    <aside className="border-t border-hairline bg-sunken/50 px-4 py-4 sm:px-6 xl:border-l xl:border-t-0" aria-label="Proposed action">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-text-3">Proposed action</h3>
      {a ? (
        <div className="mt-2 space-y-3">
          <div>
            <div className="text-[13px] font-medium capitalize text-text-2">{a.type === "allocate" ? "Deposit" : a.type}</div>
            <Money value={a.amountUsd} className="text-2xl font-medium tracking-tight text-text" tabular={false} />
            {decimals !== undefined && symbol && (
              <div className="text-xs text-text-3">
                <TokenAmount raw={a.assetAmountRaw} decimals={decimals} symbol={symbol} maxFractionDigits={decimals > 6 ? 6 : decimals} /> at no more than $1 per token
              </div>
            )}
          </div>
          <dl className="space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-text-2">From</dt>
              <dd className="min-w-0 truncate text-right text-text">{a.type === "withdraw" ? (position?.venueName ?? "Position") : (account?.label ?? "Treasury account")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-2">To</dt>
              <dd className="min-w-0 truncate text-right text-text">
                {a.type === "allocate" ? (
                  opp ? (
                    <Link href={`/app/opportunities?venue=${encodeURIComponent(opp.id)}`} className="hover:underline">
                      {opp.name}
                    </Link>
                  ) : (
                    "Venue"
                  )
                ) : (
                  (account?.label ?? "Treasury account")
                )}
              </dd>
            </div>
            {(opp?.chain ?? account?.chain) && (
              <div className="flex justify-between gap-3">
                <dt className="text-text-2">Network</dt>
                <dd className="text-right text-text">{opp?.chain ?? account?.chain}</dd>
              </div>
            )}
          </dl>

          {v && (
            <div className="rounded-[var(--radius-control)] border border-hairline bg-surface px-3 py-2">
              <div className="text-xs font-medium text-text-2">After this action</div>
              <dl className="mt-1 space-y-1 text-[13px]">
                <AfterRow label="Reserve-eligible capital" value={<Money value={v.after.reserveEligible} />} />
                <AfterRow label="Coverage of requirement" value={v.after.coverageBps === null ? "No requirement" : pct(v.after.coverageBps, 0)} />
                <AfterRow label="Surplus above the reserve" value={<Money value={v.after.deployable} />} />
                <AfterRow label="Deployed share of treasury" value={pct(v.after.deployedShareBps, 1)} />
                {v.after.protocolShareBps !== null && <AfterRow label="Protocol share" value={pct(v.after.protocolShareBps, 1)} />}
                {v.after.venueShareBps !== null && <AfterRow label="Venue share" value={pct(v.after.venueShareBps, 1)} />}
              </dl>
            </div>
          )}

          {needs && (
            <p className="flex gap-1.5 text-xs text-text-2">
              <FileCheck2 className="mt-0.5 size-3.5 shrink-0 text-text-3" aria-hidden="true" />
              <span>
                Needs {needs}.{" "}
                <Link href="/app/help#approvals" className="text-accent hover:underline">
                  How approvals work
                </Link>
              </span>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-text-2">No transaction is proposed. This needs a decision from your team, for example a policy change, new funding or rescheduling obligations.</p>
      )}

      <RecommendationActions rec={rec} ctx={ctx} />
    </aside>
  );
}

function AfterRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-2">{label}</dt>
      <dd className="num text-right font-medium text-text">{value}</dd>
    </div>
  );
}

function RecommendationActions({ rec, ctx }: { rec: RecommendationDto; ctx: RecommendationContext }) {
  const { orgId } = useOrg();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const canPropose = useCan("proposals.create");
  const canDismiss = useCan("recommendations.manage");
  const idempotencyKey = useRef<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "org" && q.queryKey[1] === orgId && typeof q.queryKey[2] === "string" && (q.queryKey[2].startsWith("/recommendations") || q.queryKey[2].startsWith("/proposals")) });

  const propose = useMutation({
    mutationFn: () => {
      // One key per submission attempt; reused if the same submission is retried.
      idempotencyKey.current ??= crypto.randomUUID();
      return api<{ id: string; status: string; duplicate?: boolean }>(orgPath(orgId, "/proposals"), { method: "POST", body: { recommendationId: rec.id, idempotencyKey: idempotencyKey.current }, idempotencyKey: idempotencyKey.current });
    },
    onSuccess: (res) => {
      idempotencyKey.current = null;
      toast({ id: `proposal-${rec.id}`, tone: "success", title: res.duplicate ? "Proposal already exists" : "Proposal created", description: "It now needs internal approvals, then Safe signatures. Nothing has moved yet." });
      invalidate();
      router.push(res?.id ? `/app/approvals/${encodeURIComponent(res.id)}` : "/app/approvals");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 404 && /route not found/i.test(err.message)) {
        idempotencyKey.current = null;
        setUnavailable(true);
        toast({ id: `proposal-${rec.id}`, tone: "info", title: "Proposals are being enabled", description: "Turning recommendations into proposals is being switched on. Nothing was created." });
        return;
      }
      if (err instanceof ApiError && (err.status === 404 || err.code === "recommendation_not_open")) {
        idempotencyKey.current = null;
        toast({ id: `proposal-${rec.id}`, tone: "warning", title: "This recommendation is no longer open", description: "Conditions changed since it was raised. The list has been refreshed." });
        invalidate();
        return;
      }
      toast({ id: `proposal-${rec.id}`, tone: "danger", title: "Couldn't create the proposal", description: errorMessage(err) });
    },
  });

  const dismiss = useMutation({
    mutationFn: (r: string) => api(orgPath(orgId, `/recommendations/${encodeURIComponent(rec.id)}/dismiss`), { method: "POST", body: { reason: r } }),
    onSuccess: () => {
      setDismissOpen(false);
      setReason("");
      toast({ id: `dismiss-${rec.id}`, tone: "success", title: "Recommendation dismissed", description: "Your reason is recorded in the activity log." });
      invalidate();
      qc.invalidateQueries({ queryKey: ["org", orgId, "/activity"] });
    },
    onError: (err) => {
      const f = fieldErrors(err);
      if (f.reason) return setReasonError(f.reason);
      if (err instanceof ApiError && err.status === 404) {
        setDismissOpen(false);
        toast({ id: `dismiss-${rec.id}`, tone: "warning", title: "Already resolved", description: "This recommendation is no longer open." });
        invalidate();
        return;
      }
      setReasonError(errorMessage(err));
    },
  });

  if (rec.status !== "open") return null;
  const executable = !!rec.action && !!rec.validation?.valid;

  return (
    <div className="mt-4 space-y-2 border-t border-hairline pt-4">
      {ctx.isSample && (
        <p className="text-xs text-warning">
          <strong className="font-medium">Sample workspace.</strong> You can create a proposal to see the approval flow, but nothing can be signed or executed.
        </p>
      )}
      {unavailable && (
        <Callout tone="info" title="Proposals are being enabled">
          Creating proposals from recommendations is being switched on. Nothing was created.
        </Callout>
      )}
      {rec.action && !rec.validation?.valid && (
        <p className="text-xs text-danger">At least one policy check fails, so this cannot become a proposal until the failing checks pass.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
        {rec.action && canPropose && (
          <Button className="max-sm:h-11" onClick={() => propose.mutate()} loading={propose.isPending} loadingLabel="Creating proposal" disabled={!executable || unavailable}>
            Create proposal
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )}
        {canDismiss && (
          <Button variant="secondary" className="max-sm:h-11" onClick={() => setDismissOpen(true)}>
            Dismiss
          </Button>
        )}
      </div>
      {!canPropose && !canDismiss && <p className="text-xs text-text-3">Your role can review recommendations. Finance, admin and owner members can turn them into proposals or dismiss them.</p>}
      {rec.action && !canPropose && canDismiss && <p className="text-xs text-text-3">Your role cannot create proposals.</p>}

      <ConfirmDialog
        open={dismissOpen}
        onOpenChange={(v) => {
          setDismissOpen(v);
          if (!v) setReasonError(null);
        }}
        title="Dismiss this recommendation?"
        description={rec.title}
        confirmLabel="Dismiss recommendation"
        loading={dismiss.isPending}
        onConfirm={() => {
          const r = reason.trim();
          if (r.length < 3) return setReasonError("Say why in a few words (at least 3 characters). Your team will see it in the activity log.");
          setReasonError(null);
          dismiss.mutate(r);
        }}
        consequences={
          <div className="space-y-3">
            <p>It leaves the open list. If the same situation is detected again with the same figures it stays dismissed; a materially different situation produces a new recommendation.</p>
            <Field label="Reason" hint="Recorded with your name in the activity log." error={reasonError}>
              {(p) => <Textarea {...p} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="For example: waiting for the Q3 budget before deploying more" />}
            </Field>
          </div>
        }
      />
    </div>
  );
}
