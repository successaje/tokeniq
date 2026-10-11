"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleDashed, ExternalLink, Loader2, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PROPOSAL_STATUS, ProposalStatusBadge } from "@/components/app/approvals/status";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { AddressText } from "@/components/ui/identity";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateTimeLabel, pct, relativeTime, shortAddress } from "@/lib/format";
import { useCan, useOrg, useOrgQuery } from "@/lib/org";
import type { PolicyCheck, ProposalDetail } from "@/lib/types";

const SignPanel = dynamic(() => import("@/components/app/approvals/wallet-actions").then((m) => m.SignPanel), { ssr: false, loading: () => <Skeleton className="h-24" /> });
const ExecutePanel = dynamic(() => import("@/components/app/approvals/wallet-actions").then((m) => m.ExecutePanel), { ssr: false, loading: () => <Skeleton className="h-24" /> });

type StepState = "done" | "current" | "blocked" | "todo" | "failed";

function Step({ n, title, state, children, aside }: { n: number; title: string; state: StepState; children?: React.ReactNode; aside?: React.ReactNode }) {
  const icon =
    state === "done" ? <Check className="size-3.5" aria-hidden="true" /> : state === "failed" ? <X className="size-3.5" aria-hidden="true" /> : state === "current" ? <Loader2 className="size-3.5" aria-hidden="true" /> : <CircleDashed className="size-3.5" aria-hidden="true" />;
  const label = { done: "Complete", current: "In progress", blocked: "Blocked", todo: "Not started", failed: "Failed" }[state];
  return (
    <li className="relative pl-10">
      <span
        className={cn(
          "absolute left-0 top-0.5 flex size-7 items-center justify-center rounded-full border text-xs",
          state === "done" && "border-success bg-success-subtle text-success",
          state === "current" && "border-accent bg-accent-subtle text-accent",
          state === "failed" && "border-danger bg-danger-subtle text-danger",
          (state === "todo" || state === "blocked") && "border-hairline bg-surface text-text-3",
        )}
      >
        {icon}
      </span>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">
          <span className="sr-only">Step {n}: </span>
          {title}
          <span className="sr-only"> — {label}</span>
        </h3>
        {aside}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </li>
  );
}

function Checks({ checks }: { checks: PolicyCheck[] }) {
  return (
    <ul className="space-y-1.5">
      {checks.map((c) => (
        <li key={c.id} className="flex gap-2 text-[13px]">
          {c.status === "pass" ? <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-label="Pass" /> : c.status === "fail" ? <X className="mt-0.5 size-3.5 shrink-0 text-danger" aria-label="Fail" /> : <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-warning" aria-label="Warning" />}
          <span>
            <span className="text-text">{c.label}</span>
            <span className="block text-xs text-text-3">{c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ProposalPage() {
  const { id } = useParams<{ id: string }>();
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const canSign = useCan("proposals.sign");
  const q = useOrgQuery<ProposalDetail>(`/proposals/${id}`, { refetchInterval: (query) => (query.state.data?.status === "submitted" ? 10_000 : false) });
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["org", orgId] });
  };

  const decide = useMutation({
    mutationFn: (d: "approve" | "reject") => api<{ state: string; needs: string }>(orgPath(orgId, `/proposals/${id}/decision`), { method: "POST", body: { decision: d, comment: comment.trim() || undefined } }),
    onSuccess: (r) => {
      setDecision(null);
      setComment("");
      toast({ tone: r.state === "rejected" ? "warning" : "success", title: r.state === "approved" ? "Internal approval complete" : r.state === "rejected" ? "Proposal rejected" : "Decision recorded", description: r.needs });
      refresh();
    },
  });
  const prepare = useMutation({
    mutationFn: () => api<{ safeTxHash: string }>(orgPath(orgId, `/proposals/${id}/prepare`), { method: "POST", body: {} }),
    onSuccess: () => {
      toast({ tone: "success", title: "Transaction prepared", description: "Simulation passed. Safe owners can now sign." });
      refresh();
    },
    onError: () => refresh(),
  });
  const cancel = useMutation({
    mutationFn: () => api(orgPath(orgId, `/proposals/${id}/cancel`), { method: "POST", body: { reason: comment.trim() || "Cancelled by proposer" } }),
    onSuccess: () => {
      setCancelOpen(false);
      toast({ tone: "info", title: "Proposal cancelled" });
      refresh();
    },
  });
  const addComment = useMutation({
    mutationFn: () => api(orgPath(orgId, `/proposals/${id}/comments`), { method: "POST", body: { body: newComment.trim() } }),
    onSuccess: () => {
      setNewComment("");
      refresh();
    },
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <span className="sr-only">Loading proposal…</span>
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <Callout tone="danger" title="Couldn't load this proposal" action={<Button size="sm" variant="secondary" onClick={() => q.refetch()}>Try again</Button>}>
        {(q.error as Error)?.message}
      </Callout>
    );
  }
  const p = q.data;
  const s = p.status;
  const threshold = p.safeTx?.threshold ?? p.account?.safeThreshold ?? null;
  const policyState: StepState = p.validationNow.valid ? "done" : ["executed", "cancelled", "rejected", "expired"].includes(s) ? "todo" : "failed";
  const approvalState: StepState = s === "pending_approval" ? "current" : s === "rejected" ? "failed" : s === "expired" || s === "cancelled" ? (p.approval.remaining > 0 ? "todo" : "done") : "done";
  const signState: StepState = ["awaiting_signatures", "stale"].includes(s) ? "current" : ["ready_to_execute", "submitted", "executed", "failed"].includes(s) ? "done" : s === "approved" ? "current" : "todo";
  const execState: StepState = s === "executed" ? "done" : s === "failed" ? "failed" : s === "submitted" || s === "ready_to_execute" ? "current" : "todo";
  const closed = ["executed", "cancelled", "rejected", "expired"].includes(s);

  return (
    <div>
      <Link href="/app/approvals" className="mb-3 inline-flex items-center gap-1 text-[13px] text-text-2 hover:text-text">
        <ArrowLeft className="size-3.5" aria-hidden="true" /> Approvals
      </Link>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{p.title}</h1>
            <ProposalStatusBadge status={s} />
          </div>
          <p className="mt-1 text-sm text-text-2">{PROPOSAL_STATUS[s].description}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-text-3">
            <span>Proposed by {p.proposer.isYou ? "you" : p.proposer.name}</span>
            <span>{dateTimeLabel(p.createdAt)}</span>
            {s === "pending_approval" && <span>Approval deadline {relativeTime(p.expiresAt)}</span>}
          </div>
        </div>
        <div className="text-right">
          <Money value={p.amountUsd} tabular={false} className="text-3xl font-medium tracking-tight" />
          <div className="text-xs text-text-3">USD equivalent</div>
        </div>
      </div>

      {p.isSample && <Callout tone="warning" className="mb-4" title="Sample workspace">This proposal uses simulated accounts. You can review and approve it to see the flow, but nothing can be prepared, signed or executed.</Callout>}
      {!p.validationNow.valid && !closed && (
        <Callout tone="danger" className="mb-4" title="Do not sign or execute: this no longer passes policy">
          Conditions have changed since the proposal was created. The failing checks are listed below. Cancel and create a new proposal from current figures.
        </Callout>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader title="Path to execution" description="Each gate is independent. Internal approval is not a Safe signature, and a signature is not an executed transaction." />
          <CardBody>
            <ol className="space-y-6">
              <Step n={1} title="Policy check" state={policyState} aside={<span className="text-xs text-text-3">Re-checked just now</span>}>
                <Checks checks={p.validationNow.checks} />
                <p className="mt-2 text-xs text-text-3">
                  After this action, reserve coverage would be {pct(p.validationNow.after.coverageBps, 0)} and deployed share {pct(p.validationNow.after.deployedShareBps, 1)}.
                </p>
              </Step>

              <Step n={2} title="Internal approval" state={approvalState} aside={<span className="num text-xs text-text-2">{p.approval.approvals} of {p.approval.requiredApprovals}{p.approval.requiredRole ? ` incl. ${p.approval.requiredRole}` : ""}</span>}>
                <p className="text-[13px] text-text-2">{p.approval.needs}</p>
                {p.approvals.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {p.approvals.map((a) => (
                      <li key={a.id} className="text-[13px]">
                        <StatusBadge tone={a.decision === "approve" ? "success" : "danger"}>{a.decision === "approve" ? "Approved" : "Rejected"}</StatusBadge> <span className="font-medium">{a.user}</span> <span className="text-text-3">({a.role}) · {relativeTime(a.at)}</span>
                        {a.comment && <span className="mt-0.5 block text-text-2">“{a.comment}”</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {s === "pending_approval" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.you.canApprove ? (
                      <>
                        <Button size="sm" onClick={() => setDecision("approve")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setDecision("reject")}>
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-text-3">{p.you.reason}</span>
                    )}
                  </div>
                )}
              </Step>

              <Step n={3} title="Safe owner signatures" state={signState} aside={threshold ? <span className="num text-xs text-text-2">{p.signatures.length} of {threshold}</span> : undefined}>
                {!p.safeTx ? (
                  <div className="space-y-2">
                    <p className="text-[13px] text-text-2">After internal approval, TokenIQ builds the exact Safe transaction from its allowlisted addresses, reads the Safe live and simulates it. Owners then sign in their own wallets.</p>
                    {(s === "approved" || s === "stale") && canSign && (
                      <Button size="sm" onClick={() => prepare.mutate()} loading={prepare.isPending} loadingLabel="Building and simulating">
                        Prepare Safe transaction
                      </Button>
                    )}
                    {prepare.error && <Callout tone="danger">{(prepare.error as ApiError).message}</Callout>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-[var(--radius-card)] bg-sunken p-3 text-[13px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-text-2">Safe</span>
                        <AddressText address={p.safeTx.safeAddress} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-text-2">Nonce</span>
                        <span className="num font-mono text-[12.5px]">{p.safeTx.nonce}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-text-2">Safe transaction hash</span>
                        <span className="font-mono text-[12.5px]" title={p.safeTxHash ?? ""}>{p.safeTxHash ? shortAddress(p.safeTxHash, 8) : "—"}</span>
                      </div>
                      <div className="mt-3 text-xs font-medium text-text-2">What the Safe will do</div>
                      <ol className="mt-1 list-decimal space-y-1 pl-5 text-text">
                        {p.safeTx.calls.map((c, i) => (
                          <li key={i}>
                            {c.description} <span className="font-mono text-xs text-text-3">→ {shortAddress(c.to)}</span>
                          </li>
                        ))}
                      </ol>
                      {p.simulation && (
                        <div className="mt-3">
                          {p.simulation.success ? <StatusBadge tone="success">Simulation passed at block {p.simulation.blockNumber}</StatusBadge> : <StatusBadge tone="danger">Simulation failed: {p.simulation.error}</StatusBadge>}
                        </div>
                      )}
                    </div>
                    <ul className="space-y-1 text-[13px]">
                      {p.safeTx.owners.map((o) => {
                        const signed = p.signatures.find((x) => x.signer.toLowerCase() === o.toLowerCase());
                        return (
                          <li key={o} className="flex items-center justify-between gap-2">
                            <AddressText address={o} />
                            {signed ? <StatusBadge tone="success">Signed {relativeTime(signed.at)}</StatusBadge> : <span className="text-xs text-text-3">Not signed</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {s === "awaiting_signatures" && !p.isSample && canSign && <SignPanel orgId={orgId} p={p} onDone={refresh} />}
                    {s === "stale" && canSign && (
                      <Button size="sm" onClick={() => prepare.mutate()} loading={prepare.isPending}>
                        Prepare again with the new nonce
                      </Button>
                    )}
                  </div>
                )}
              </Step>

              <Step n={4} title="On-chain execution" state={execState}>
                {p.executions.length > 0 && (
                  <ul className="space-y-1.5 text-[13px]">
                    {p.executions.map((e) => (
                      <li key={e.txHash} className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={e.status === "confirmed" ? "success" : e.status === "reverted" ? "danger" : "info"}>{e.status === "confirmed" ? "Confirmed" : e.status === "reverted" ? "Reverted" : "Submitted — confirming"}</StatusBadge>
                        <span className="font-mono text-xs">{shortAddress(e.txHash, 8)}</span>
                        {e.explorer && (
                          <a href={e.explorer} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                            View on explorer <ExternalLink className="size-3" aria-hidden="true" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {s === "ready_to_execute" && !p.isSample && <ExecutePanel orgId={orgId} p={p} onDone={refresh} />}
                {s === "submitted" && <p className="mt-2 text-[13px] text-text-2">TokenIQ checks the receipt and the Safe's execution event every minute and waits for enough confirmations before marking this executed.</p>}
                {s === "executed" && <p className="text-[13px] text-text-2">Balances were re-read after confirmation. See the account and allocations pages for the reconciled position.</p>}
              </Step>
            </ol>
          </CardBody>
        </Card>

        <div className="space-y-4 xl:col-span-4">
          <Card>
            <CardHeader title="Details" />
            <CardBody className="space-y-2 pt-3 text-[13px]">
              <Row label="Type" value={p.kind === "allocate" ? "Allocate to venue" : p.kind === "withdraw" ? "Withdraw from position" : "Payment"} />
              {p.account && <Row label="From" value={<span className="text-right">{p.account.label}<AddressText address={p.account.address} className="block" /></span>} />}
              <Row label="Token amount" value={<span className="num font-mono text-xs">{p.action.assetAmountRaw} base units</span>} />
              {p.recommendationId && <Row label="Source" value={<Link className="text-accent hover:underline" href={`/app/recommendations#${p.recommendationId}`}>Recommendation</Link>} />}
              <Row label="Created" value={dateTimeLabel(p.createdAt)} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Discussion" />
            <CardBody className="pt-3">
              {p.comments.length === 0 ? <p className="text-[13px] text-text-3">No comments yet.</p> : (
                <ul className="space-y-3">
                  {p.comments.map((c) => (
                    <li key={c.id} className="text-[13px]">
                      <span className="font-medium">{c.user}</span> <span className="text-xs text-text-3">{relativeTime(c.at)}</span>
                      <p className="mt-0.5 whitespace-pre-wrap text-text-2">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="mt-3 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newComment.trim()) addComment.mutate();
                }}
              >
                <label className="sr-only" htmlFor="new-comment">
                  Add a comment
                </label>
                <Textarea id="new-comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add context for reviewers…" maxLength={2000} />
                <Button size="sm" variant="secondary" type="submit" loading={addComment.isPending} disabled={!newComment.trim()}>
                  Comment
                </Button>
              </form>
            </CardBody>
          </Card>
          {!closed && s !== "submitted" && (p.proposer.isYou || p.you.canCreate) && (
            <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)}>
              Cancel proposal
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(v) => !v && setDecision(null)}
        title={decision === "approve" ? "Approve this proposal?" : "Reject this proposal?"}
        description={decision === "approve" ? "This records your internal approval. It does not sign or move anything; Safe owners still sign in their wallets." : "The proposer will see your reason. The proposal closes."}
        consequences={
          <div className="space-y-3">
            <p>
              <span className="font-medium text-text">{p.title}</span> · <Money value={p.amountUsd} />
            </p>
            <Field label={decision === "reject" ? "Reason (required)" : "Comment"} optional={decision === "approve"}>
              {(f) => <Textarea {...f} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />}
            </Field>
            {decide.error && <Callout tone="danger">{(decide.error as ApiError).message}</Callout>}
          </div>
        }
        confirmLabel={decision === "approve" ? "Approve" : "Reject"}
        tone={decision === "reject" ? "danger" : "primary"}
        loading={decide.isPending}
        onConfirm={() => decision && (decision === "approve" || comment.trim()) && decide.mutate(decision)}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this proposal?"
        description="It stops here. Collected signatures become unusable through TokenIQ."
        confirmLabel="Cancel proposal"
        tone="danger"
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-text-2">{label}</span>
      <span className="text-right text-text">{value}</span>
    </div>
  );
}
