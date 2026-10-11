"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays } from "@tokeniq/core";
import { ArrowDownLeft, ArrowLeft, Ban, CircleCheck, ExternalLink, History, MoreHorizontal, Pause, Pencil, Play, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CertaintyBadge, ObligationStatusBadge, PaymentStatusBadge, PriorityLabel } from "@/components/app/obligations/badges";
import { ObligationDocuments } from "@/components/app/obligations/documents";
import { categoryLabel, CERTAINTY, currencyAmount, dueInLabel, monthlyEquivalent, PRIORITY, recurrenceLabel, usdByObligation } from "@/components/app/obligations/format";
import { ObligationSheet } from "@/components/app/obligations/obligation-sheet";
import { RecordPaymentSheet } from "@/components/app/obligations/record-payment-sheet";
import { explorerAddressUrl, explorerTxUrl, useMetaIndex } from "@/components/app/treasury/meta";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { AddressText } from "@/components/ui/identity";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Money, TokenAmount } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateLabel, dateTimeLabel, pct, relativeTime, shortAddress } from "@/lib/format";
import { useCan, useOrg, useOrgQuery } from "@/lib/org";
import type { ObligationDetailDto, ObligationDto, ObligationScheduleDto, OverviewDto } from "@/lib/types";

type StatusAction = "pause" | "resume" | "cancel" | "complete" | "reactivate";

const ACTIONS: Record<StatusAction, { to: ObligationDto["status"]; title: (t: string) => string; confirm: string; body: ReactNode; tone: "primary" | "danger"; done: string }> = {
  pause: {
    to: "paused",
    title: (t) => `Pause “${t}”?`,
    confirm: "Pause obligation",
    tone: "primary",
    body: "While paused, it is left out of the schedule and the reserve requirement, so more capital may show as deployable. Nothing is deleted, and you can resume it at any time.",
    done: "Paused. It no longer counts toward the reserve.",
  },
  resume: { to: "active", title: (t) => `Resume “${t}”?`, confirm: "Resume", tone: "primary", body: "Its unpaid due dates count toward the reserve again.", done: "Resumed. Its due dates count toward the reserve again." },
  cancel: {
    to: "cancelled",
    title: (t) => `Cancel “${t}”?`,
    confirm: "Cancel obligation",
    tone: "danger",
    body: "It stops counting toward the reserve and disappears from the schedule. Payment history and documents are kept, and the change is recorded in Activity. You can reactivate it later.",
    done: "Cancelled. Payment history and documents are kept.",
  },
  complete: {
    to: "completed",
    title: (t) => `Mark “${t}” as completed?`,
    confirm: "Mark completed",
    tone: "primary",
    body: "Use this when no further payments are expected. Remaining due dates stop counting toward the reserve.",
    done: "Marked completed.",
  },
  reactivate: { to: "active", title: (t) => `Reactivate “${t}”?`, confirm: "Reactivate", tone: "primary", body: "Its unpaid due dates count toward the reserve again, starting from today.", done: "Reactivated." },
};

export default function ObligationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const canWrite = useCan("obligations.write");
  const canRecord = useCan("payments.record");
  const q = useOrgQuery<ObligationDetailDto>(`/obligations/${id}`, { retry: (n, err) => !(err instanceof ApiError && err.status === 404) && n < 2 });
  const schedule = useOrgQuery<ObligationScheduleDto>("/obligations/schedule?days=366");
  const overview = useOrgQuery<OverviewDto>("/treasury");
  const meta = useMetaIndex();
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<{ dueDate: string | null } | null>(null);
  const [confirm, setConfirm] = useState<StatusAction | null>(null);
  const title = q.data?.obligation.title;
  useEffect(() => {
    if (title) document.title = `${title} · Obligations · TokenIQ`;
  }, [title]);

  const setStatus = useMutation({
    mutationFn: (status: ObligationDto["status"]) => api<ObligationDto>(orgPath(orgId, `/obligations/${id}`), { method: "PATCH", body: { status } }),
    onSuccess: (_o, status) => {
      const action = confirm ?? (status === "active" ? "resume" : status === "paused" ? "pause" : status === "cancelled" ? "cancel" : "complete");
      toast({ id: `obligation-status-${id}`, tone: "success", title: ACTIONS[action].done });
      qc.invalidateQueries({ predicate: (k) => k.queryKey[0] === "org" && k.queryKey[1] === orgId && typeof k.queryKey[2] === "string" && /^\/(obligations|treasury|alerts|recommendations)/.test(k.queryKey[2]) });
      setConfirm(null);
    },
    onError: (err) => {
      toast({ id: `obligation-status-${id}`, tone: "danger", title: "Status not changed", description: err instanceof ApiError && err.status === 403 ? "Your role can't change obligations." : (err as Error).message });
    },
  });

  if (q.isLoading) return <DetailSkeleton />;
  if (q.isError || !q.data) {
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return (
      <div>
        <BackLink />
        {notFound ? (
          <EmptyState title="Obligation not found" description="It may belong to another organization, or the link is wrong. Obligations are never deleted, so check the organization switcher." actions={<Button size="sm" variant="secondary" asChild><Link href="/app/obligations">All obligations</Link></Button>} />
        ) : (
          <Callout tone="danger" title="Couldn't load this obligation" action={<Button variant="secondary" size="sm" onClick={() => q.refetch()}>Try again</Button>}>
            {(q.error as Error)?.message ?? "Unknown error"}. Nothing was changed.
          </Callout>
        )}
      </div>
    );
  }

  const { obligation: o, upcoming, payments, documents } = q.data;
  const usdValue = usdByObligation(schedule.data?.occurrences ?? []).get(o.id) ?? null;
  const asOf = schedule.data?.asOf ?? new Date().toISOString().slice(0, 10);
  const policy = overview.data?.policy;
  const monthly = monthlyEquivalent(o.amount, o.recurrence);
  const chain = o.recipientChainId ? meta.chains.get(o.recipientChainId) : undefined;
  const unpaid = upcoming.map((u) => ({ ...u }));
  const overdueCount = upcoming.filter((u) => u.overdue).length;

  const menuItems: Array<{ a: StatusAction; icon: typeof Pause; danger?: boolean }> =
    o.status === "active"
      ? [
          { a: "pause", icon: Pause },
          { a: "complete", icon: CircleCheck },
          { a: "cancel", icon: Ban, danger: true },
        ]
      : o.status === "paused"
        ? [
            { a: "resume", icon: Play },
            { a: "cancel", icon: Ban, danger: true },
          ]
        : [{ a: "reactivate", icon: RotateCcw }];

  return (
    <div>
      <BackLink />
      <PageHeader
        title={o.title}
        description={
          <>
            {o.direction === "inflow" ? "Expected inflow" : "Payment"} · {categoryLabel(o.category)}
            {o.counterparty ? ` · ${o.counterparty}` : ""}
          </>
        }
        meta={
          <>
            <ObligationStatusBadge status={o.status} />
            <CertaintyBadge certainty={o.certainty} />
            <PriorityLabel priority={o.priority} />
            <span>Updated {relativeTime(o.updatedAt)}</span>
          </>
        }
        actions={
          <>
            {canWrite && (
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" aria-hidden="true" /> Edit
              </Button>
            )}
            {canRecord && o.status === "active" && o.direction === "outflow" && (
              <Button size="sm" onClick={() => setPayOpen({ dueDate: null })}>
                <Plus className="size-4" aria-hidden="true" /> Record payment
              </Button>
            )}
            {canWrite && (
              <Menu>
                <MenuTrigger asChild>
                  <Button variant="secondary" size="sm" aria-label="More status actions">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                    <span className="sm:sr-only">Status</span>
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  {menuItems.map((m, i) => (
                    <div key={m.a}>
                      {m.danger && i > 0 && <MenuSeparator />}
                      <MenuItem tone={m.danger ? "danger" : undefined} onSelect={() => setConfirm(m.a)}>
                        <m.icon className="size-4" aria-hidden="true" />
                        {ACTIONS[m.a].confirm}
                      </MenuItem>
                    </div>
                  ))}
                </MenuContent>
              </Menu>
            )}
          </>
        }
      />

      {o.status !== "active" && (
        <Callout
          tone={o.status === "paused" ? "warning" : "neutral"}
          className="mb-4"
          title={o.status === "paused" ? "Paused: not counted in the reserve" : o.status === "cancelled" ? "Cancelled: not counted in the reserve" : "Completed: no further payments expected"}
          action={
            canWrite ? (
              <Button variant="secondary" size="sm" onClick={() => setConfirm(o.status === "paused" ? "resume" : "reactivate")}>
                {o.status === "paused" ? "Resume" : "Reactivate"}
              </Button>
            ) : undefined
          }
        >
          Its due dates are hidden from the schedule and excluded from the reserve requirement. History and documents are kept.
        </Callout>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-3.5 text-[13px] sm:grid-cols-2">
                <Fact label="Amount per payment">
                  <span className="num text-base font-medium text-text">
                    {o.direction === "inflow" ? "+" : ""}
                    {currencyAmount(o.amount, o.currency)}
                  </span>
                  {o.currency !== "USD" && (usdValue ? <Money value={usdValue} approximate className="ml-2 text-xs text-text-3" source="engine EUR/USD rate" /> : <span className="ml-2 text-xs text-text-3">USD value shown for upcoming dates only</span>)}
                </Fact>
                <Fact label="Schedule">
                  {recurrenceLabel(o.recurrence, o.firstDueDate, { withOnceDate: true })}
                  {monthly && <span className="block text-xs text-text-3">≈ {currencyAmount(monthly, o.currency)} per month in the itemized burn</span>}
                </Fact>
                <Fact label="First due">{dateLabel(o.firstDueDate)}</Fact>
                <Fact label="Next due">
                  {o.nextDueDate ? (
                    <>
                      {dateLabel(o.nextDueDate, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} <span className="text-xs text-text-3">· {dueInLabel(o.nextDueDate, asOf)}</span>
                    </>
                  ) : o.status === "active" ? (
                    "No further dates"
                  ) : (
                    "—"
                  )}
                  {overdueCount > 0 && (
                    <span className="block text-xs font-medium text-danger">
                      {overdueCount} earlier date{overdueCount === 1 ? "" : "s"} overdue
                    </span>
                  )}
                </Fact>
                <Fact label="Certainty">
                  <CertaintyBadge certainty={o.certainty} />
                  <span className="mt-0.5 block text-xs text-text-3">{CERTAINTY[o.certainty].description}</span>
                </Fact>
                <Fact label="Priority">
                  <PriorityLabel priority={o.priority} />
                  <span className="mt-0.5 block text-xs text-text-3">{PRIORITY[o.priority].description}</span>
                </Fact>
                <Fact label="Category">{categoryLabel(o.category)}</Fact>
                <Fact label="Counterparty">{o.counterparty ?? <Muted>Not set</Muted>}</Fact>
                <Fact label="Invoice number">{o.invoiceNumber ? <span className="font-mono text-[12.5px]">{o.invoiceNumber}</span> : <Muted>Not set</Muted>}</Fact>
                <Fact label="Recipient">
                  {o.recipientAddress ? (
                    <>
                      <AddressText address={o.recipientAddress} explorer={explorerAddressUrl(chain?.explorer, o.recipientAddress)} />
                      <span className="block text-xs text-text-3">
                        {chain ? chain.name : "Any network"}
                        {o.paymentAsset ? ` · paid in ${o.paymentAsset}` : ""}
                      </span>
                    </>
                  ) : (
                    <Muted>{o.paymentAsset ? `Paid in ${o.paymentAsset}; no address set` : "No address set. Add one so payments can be matched on-chain."}</Muted>
                  )}
                </Fact>
                <Fact label="Recorded">
                  {dateTimeLabel(o.createdAt)}
                  {o.updatedAt !== o.createdAt && <span className="block text-xs text-text-3">Last changed {dateTimeLabel(o.updatedAt)}</span>}
                </Fact>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Upcoming due dates"
              description={o.status === "active" ? "Unpaid dates over the next year, including overdue ones from the last 30 days." : "Not scheduled while the obligation is not active."}
            />
            <CardBody className="pt-2">
              {upcoming.length === 0 ? (
                <p className="text-[13px] text-text-2">{o.status === "active" ? "No unpaid due dates in the next year." : "Resume or reactivate it to schedule due dates again."}</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {upcoming.map((u) => (
                    <li key={u.dueDate} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className={cn("num text-[13px] font-medium", u.overdue ? "text-danger" : "text-text")}>{dateLabel(u.dueDate, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className={cn("text-xs", u.overdue ? "font-medium text-danger" : "text-text-3")}>{u.overdue ? `Overdue · ${dueInLabel(u.dueDate, asOf)}` : dueInLabel(u.dueDate, asOf)}</div>
                      </div>
                      <div className="text-right">
                        <div className="num text-[13px] text-text">{currencyAmount(u.amount, u.currency)}</div>
                        {u.currency !== "USD" && usdValue && <Money value={usdValue} approximate className="block text-xs text-text-3" />}
                      </div>
                      {canRecord && o.direction === "outflow" && (
                        <Button variant="ghost" size="sm" onClick={() => setPayOpen({ dueDate: u.dueDate })} aria-label={`Record payment for ${dateLabel(u.dueDate)}`}>
                          Record
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {upcoming.length >= 12 && <p className="mt-2 text-xs text-text-3">Showing the next 12 dates.</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payment history" description="Each due date is settled once. Marked paid is not the same as verified on-chain." />
            <CardBody className="pt-2">
              {payments.length === 0 ? (
                <p className="text-[13px] text-text-2">No payments recorded yet. {canRecord ? "Record a payment with its transaction so TokenIQ can verify it on-chain." : ""}</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {payments.map((p) => {
                    const pc = p.chainId ? meta.chains.get(p.chainId) : undefined;
                    const txUrl = p.txHash ? explorerTxUrl(pc?.explorer, p.txHash) : null;
                    const token = p.tokenAmountRaw && p.assetSymbol && p.chainId ? [...meta.tokens.values()].find((t) => t.chainId === p.chainId && t.symbol === p.assetSymbol) : undefined;
                    return (
                      <li key={p.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="num text-[13px] font-medium text-text">Due {dateLabel(p.dueDate)}</span>
                            <PaymentStatusBadge status={p.status} />
                          </div>
                          <div className="text-right text-[13px]">
                            {p.amount && <Money value={p.amount} className="font-medium" />}
                            {token && p.tokenAmountRaw && <TokenAmount raw={p.tokenAmountRaw} decimals={token.decimals} symbol={token.symbol} className="block text-xs text-text-3" />}
                          </div>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-3">
                          {p.txHash ? (
                            txUrl ? (
                              <a href={txUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-mono text-accent hover:underline">
                                {shortAddress(p.txHash, 6)} <ExternalLink className="size-3" aria-hidden="true" />
                                <span className="sr-only">(opens block explorer)</span>
                              </a>
                            ) : (
                              <span className="font-mono">{shortAddress(p.txHash, 6)}</span>
                            )
                          ) : (
                            p.status !== "skipped" && <span>No transaction recorded</span>
                          )}
                          {pc && <span>{pc.name}</span>}
                          {p.status === "paid_verified" && p.verifiedAt && <span>Verified {dateTimeLabel(p.verifiedAt)}</span>}
                          {p.status === "paid_unverified" && <span>{p.txHash ? "Not matched on-chain yet" : "Recorded by a member without a transaction"}</span>}
                          <span>Recorded {dateTimeLabel(p.createdAt)}</span>
                        </div>
                        {p.status === "paid_unverified" && p.txHash && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-2">
                            {verificationReason(p.verification) && <span>Last check: {verificationReason(p.verification)}</span>}
                            {canRecord && <RecheckButton paymentId={p.id} obligationId={o.id} />}
                          </div>
                        )}
                        {p.note && <p className="mt-1 text-xs text-text-2">“{p.note}”</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Documents" description="Invoices, contracts and quotes that support the amount." />
            <CardBody className="pt-2">
              <ObligationDocuments obligationId={o.id} documents={documents} canUpload={canWrite} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card>
            <CardHeader title="How it counts" />
            <CardBody className="space-y-2 pt-2 text-[13px] text-text-2">
              {o.direction === "inflow" ? (
                <p>Expected inflows appear in the projection for planning, but never reduce the reserve requirement.</p>
              ) : o.status !== "active" ? (
                <p>Not counted while {o.status}.</p>
              ) : policy ? (
                <>
                  <p>
                    Unpaid dates due in the next <strong className="font-medium text-text">{policy.obligationHorizonDays} days</strong> (and overdue ones) count toward the upcoming-obligations rule, plus a {pct(policy.obligationBufferBps, 0)} buffer.
                  </p>
                  {o.certainty === "estimate" && (
                    <p className={policy.includeEstimatedObligations ? "" : "text-warning"}>
                      {policy.includeEstimatedObligations ? "Estimates are included by the current policy." : "Estimates are currently excluded by policy, so this obligation does not raise the requirement."}
                    </p>
                  )}
                  {o.recurrence.freq !== "once" && <p>As a recurring payment it also feeds the itemized monthly burn used by the runway rule.</p>}
                  {o.currency === "EUR" && <p>EUR amounts are converted at the current rate; paying them needs EUR stablecoins or a conversion.</p>}
                  {upcoming.some((u) => !u.overdue && u.dueDate <= addDays(asOf, policy.obligationHorizonDays)) ? (
                    <p className="text-text">
                      {upcoming.filter((u) => u.overdue || u.dueDate <= addDays(asOf, policy.obligationHorizonDays)).length} date(s) are inside the horizon now.
                    </p>
                  ) : (
                    <p>No dates fall inside the horizon right now.</p>
                  )}
                  <Link href="/app/reserves" className="inline-block text-xs font-medium text-accent hover:underline">
                    See the reserve requirement
                  </Link>
                </>
              ) : (
                <Skeleton className="h-16" />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <CardBody className="pt-2">{o.notes ? <p className="whitespace-pre-wrap text-[13px] text-text">{o.notes}</p> : <p className="text-[13px] text-text-3">No notes.{canWrite ? " Add context for reviewers from Edit." : ""}</p>}</CardBody>
          </Card>

          <div className="flex gap-2 rounded-[var(--radius-card)] border border-dashed border-hairline px-4 py-3 text-xs text-text-2">
            <History className="mt-0.5 size-3.5 shrink-0 text-text-3" aria-hidden="true" />
            <p>
              Every change to this obligation, its status and its documents is recorded with who made it and when.{" "}
              <Link href="/app/activity" className="font-medium text-accent hover:underline">
                View activity
              </Link>
            </p>
          </div>
          {o.direction === "inflow" && (
            <p className="flex items-center gap-1.5 text-xs text-text-3">
              <ArrowDownLeft className="size-3.5" aria-hidden="true" /> Inflows are not recorded as payments.
            </p>
          )}
        </div>
      </div>

      {canWrite && <ObligationSheet open={editOpen} onOpenChange={setEditOpen} obligation={o} />}
      {canRecord && payOpen && <RecordPaymentSheet open={!!payOpen} onOpenChange={(v) => !v && setPayOpen(null)} obligation={o} dueDates={unpaid} initialDueDate={payOpen.dueDate} />}
      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onOpenChange={(v) => !v && setConfirm(null)}
          title={ACTIONS[confirm].title(o.title)}
          description={ACTIONS[confirm].body}
          confirmLabel={ACTIONS[confirm].confirm}
          tone={ACTIONS[confirm].tone}
          loading={setStatus.isPending}
          onConfirm={() => setStatus.mutate(ACTIONS[confirm].to)}
        />
      )}
    </div>
  );
}

function verificationReason(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const r = (v as { reason?: unknown }).reason;
  return typeof r === "string" && r ? r : null;
}

/** Ask the API to look for the transfer again (e.g. after more confirmations). Never retried automatically. */
function RecheckButton({ paymentId, obligationId }: { paymentId: string; obligationId: string }) {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const m = useMutation({
    mutationFn: () => api<{ payment: { status: string; verification?: unknown } }>(orgPath(orgId, `/payments/${paymentId}/verify`), { method: "POST", body: {} }),
    onSuccess: (r) => {
      const ok = r.payment.status === "paid_verified";
      toast({ id: `recheck-${paymentId}`, tone: ok ? "success" : "info", title: ok ? "Verified on-chain" : "Not verified yet", description: ok ? "The transfer matched the recipient and amount." : (verificationReason(r.payment.verification) ?? "Try again after more confirmations.") });
      qc.invalidateQueries({ queryKey: ["org", orgId, `/obligations/${obligationId}`] });
    },
    onError: (err) => toast({ id: `recheck-${paymentId}`, tone: "danger", title: "Couldn't check the transaction", description: (err as Error).message }),
  });
  return (
    <Button variant="link" size="sm" className="text-xs" loading={m.isPending} loadingLabel="Checking" onClick={() => m.mutate()}>
      Re-check on-chain
    </Button>
  );
}

function BackLink() {
  return (
    <Link href="/app/obligations" className="mb-3 inline-flex items-center gap-1 text-[13px] text-text-2 hover:text-text">
      <ArrowLeft className="size-3.5" aria-hidden="true" /> Obligations
    </Link>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-text-2">{label}</dt>
      <dd className="mt-0.5 text-text">{children}</dd>
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-text-3">{children}</span>;
}

function DetailSkeleton() {
  return (
    <LoadingRegion label="Loading obligation…">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-72 max-w-full" />
      <Skeleton className="mb-5 mt-2 h-4 w-56" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </LoadingRegion>
  );
}
