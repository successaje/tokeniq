"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { AmountInput, Field, Input, Textarea } from "@/components/ui/field";
import { errorMessage, QueryError } from "@/components/ui/query-error";
import { Select } from "@/components/ui/select";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, fieldErrors, orgPath } from "@/lib/api";
import { cmpUsd, isPositive } from "@/lib/format";
import { ROLE_LABEL, useCan, useOrg, useOrgQuery } from "@/lib/org";
import type { ApprovalPolicyDto, ApproverRole, MemberDto, PoliciesDto } from "@/lib/types";
import { boundLabel, describeTiers } from "./approval-text";

const MAX_TIERS = 6;
const APPROVER_ROLES: ApproverRole[] = ["owner", "admin", "finance", "approver"];
const ANY = "any";

interface DraftTier {
  key: string;
  /** Empty only while typing; every tier except the last needs a bound. */
  upToUsd: string;
  requiredApprovals: string;
  requiredRole: ApproverRole | null;
}

interface Draft {
  tiers: DraftTier[];
  allowSelfApproval: boolean;
  proposalTtlHours: string;
}

let seq = 0;
const key = () => `t${++seq}`;

function toDraft(p: ApprovalPolicyDto): Draft {
  const sorted = [...p.tiers].sort((a, b) => (a.upToUsd === null ? 1 : b.upToUsd === null ? -1 : cmpUsd(a.upToUsd, b.upToUsd)));
  return {
    tiers: sorted.map((t) => ({ key: key(), upToUsd: t.upToUsd ?? "", requiredApprovals: String(t.requiredApprovals), requiredRole: t.requiredRole })),
    allowSelfApproval: p.allowSelfApproval,
    proposalTtlHours: String(p.proposalTtlHours),
  };
}

function toPolicy(d: Draft): ApprovalPolicyDto {
  return {
    tiers: d.tiers.map((t, i) => ({ upToUsd: i === d.tiers.length - 1 ? null : t.upToUsd.trim(), requiredApprovals: Number(t.requiredApprovals), requiredRole: t.requiredRole })),
    allowSelfApproval: d.allowSelfApproval,
    proposalTtlHours: Number(d.proposalTtlHours),
  };
}

function normalize(p: ApprovalPolicyDto) {
  return JSON.stringify(toPolicy(toDraft(p)));
}

/** Client-side mirror of the API schema plus ordering rules, so mistakes are caught before saving. */
function validate(d: Draft): Record<string, string> {
  const e: Record<string, string> = {};
  let prev: string | null = null;
  d.tiers.forEach((t, i) => {
    const last = i === d.tiers.length - 1;
    if (!last) {
      if (!t.upToUsd.trim() || !isPositive(t.upToUsd)) e[`tiers.${i}.upToUsd`] = "Enter an amount above $0";
      else if (prev !== null && cmpUsd(t.upToUsd, prev) <= 0) e[`tiers.${i}.upToUsd`] = `Must be higher than the previous tier (${boundLabel(prev)})`;
      else prev = t.upToUsd;
    }
    const n = Number(t.requiredApprovals);
    if (!/^\d+$/.test(t.requiredApprovals) || n < 1 || n > 10) e[`tiers.${i}.requiredApprovals`] = "Between 1 and 10";
  });
  const ttl = Number(d.proposalTtlHours);
  if (!/^\d+$/.test(d.proposalTtlHours) || ttl < 1 || ttl > 720) e.proposalTtlHours = "Between 1 and 720 hours (30 days)";
  return e;
}

export function ApprovalsTab() {
  const { orgId } = useOrg();
  const canEdit = useCan("policy.write");
  const q = useOrgQuery<PoliciesDto>("/policies");
  const members = useOrgQuery<{ members: MemberDto[] }>("/members", { staleTime: 60_000 });
  const qc = useQueryClient();
  const { toast } = useToast();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const initialized = useRef(false);

  const server = q.data ? (q.data.approval as ApprovalPolicyDto) : null;
  useEffect(() => {
    if (!q.data || initialized.current) return;
    initialized.current = true;
    setDraft(toDraft(q.data.approval as ApprovalPolicyDto));
    setBaseVersion(q.data.approvalVersion);
  }, [q.data]);

  const live = useMemo(() => (draft ? validate(draft) : {}), [draft]);
  // Before the first save attempt, only show problems with values already typed (not empty fields).
  const typed = (k: string) => {
    if (!draft) return false;
    const m = /^tiers\.(\d+)\.(\w+)$/.exec(k);
    if (m) return String((draft.tiers[Number(m[1])] as unknown as Record<string, unknown>)?.[m[2]!] ?? "") !== "";
    return k === "proposalTtlHours" ? draft.proposalTtlHours !== "" : false;
  };
  const shownErrors = submitted ? { ...live, ...errors } : { ...Object.fromEntries(Object.entries(live).filter(([k]) => typed(k))), ...errors };
  const dirty = !!draft && !!server && JSON.stringify(toPolicy(draft)) !== normalize(server);
  const preview = draft && Object.keys(live).length === 0 ? describeTiers(toPolicy(draft).tiers) : null;

  const warnings = useMemo(() => {
    if (!draft) return [];
    const out: string[] = [];
    const p = toPolicy(draft);
    for (let i = 1; i < p.tiers.length; i++) {
      if (p.tiers[i]!.requiredApprovals < p.tiers[i - 1]!.requiredApprovals) out.push(`Tier ${i + 1} needs fewer approvals than tier ${i}, so larger amounts would be easier to approve.`);
    }
    const eligible = members.data?.members.filter((m) => APPROVER_ROLES.includes(m.role as ApproverRole)) ?? null;
    if (eligible) {
      const max = Math.max(...p.tiers.map((t) => t.requiredApprovals));
      const available = draft.allowSelfApproval ? eligible.length : eligible.length - 1;
      if (max > available)
        out.push(`${eligible.length} member${eligible.length === 1 ? " can" : "s can"} approve today${draft.allowSelfApproval ? "" : ", and the proposer cannot approve their own proposal"}, so a tier needing ${max} approvals could not be completed until you invite more approvers.`);
      for (const r of APPROVER_ROLES) {
        if (!p.tiers.some((t) => t.requiredRole === r)) continue;
        const ok = eligible.some((m) => m.role === "owner" || m.role === r || (m.role === "admin" && r !== "owner"));
        if (!ok) out.push(`No member can satisfy the “${r === "owner" ? "an owner" : `${ROLE_LABEL[r]} or higher`}” requirement yet.`);
      }
    }
    return out;
  }, [draft, members.data]);

  const save = useMutation({
    mutationFn: (body: { policy: ApprovalPolicyDto; reason: string; expectedVersion: number }) => api<{ version: number; changes: unknown[] }>(orgPath(orgId, "/policies/approval"), { method: "PUT", body }),
    onSuccess: (res) => {
      toast({ id: "approval-policy", tone: "success", title: `Approval policy saved as version ${res.version}`, description: "New proposals use it immediately. Proposals already created keep the tier they were created with." });
      setBaseVersion(res.version);
      setReason("");
      setSubmitted(false);
      setConflict(false);
      qc.invalidateQueries({ predicate: (x) => x.queryKey[0] === "org" && x.queryKey[1] === orgId && typeof x.queryKey[2] === "string" && x.queryKey[2].startsWith("/policies") });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "policy_version_conflict") {
        setConflict(true);
        q.refetch();
        return;
      }
      const f = fieldErrors(err);
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(f)) mapped[k.replace(/^policy\./, "")] = v;
      if (Object.keys(mapped).length) return setErrors(mapped);
      setFormError(err instanceof ApiError && err.status === 403 ? `${err.message}. Only owners and admins can change policies.` : errorMessage(err));
    },
  });

  if (q.isLoading || (q.data && !draft)) {
    return (
      <LoadingRegion label="Loading the approval policy…" className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </LoadingRegion>
    );
  }
  if (q.isError || !q.data || !draft || !server) return <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't load the approval policy" />;

  const update = (i: number, patch: Partial<DraftTier>) => setDraft({ ...draft, tiers: draft.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const addTier = () => {
    const tiers = [...draft.tiers];
    const last = tiers[tiers.length - 1]!;
    tiers.splice(tiers.length - 1, 0, { key: key(), upToUsd: "", requiredApprovals: last.requiredApprovals, requiredRole: null });
    setDraft({ ...draft, tiers });
  };
  const removeTier = (i: number) => setDraft({ ...draft, tiers: draft.tiers.filter((_, j) => j !== i) });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    setErrors({});
    const errs = validate(draft);
    if (reason.trim().length < 3) errs.reason = "Say why you are changing it (at least 3 characters). It is kept in the policy history.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    save.mutate({ policy: toPolicy(draft), reason: reason.trim(), expectedVersion: baseVersion ?? q.data!.approvalVersion });
  };

  const latestVersion = q.data.approvalVersion;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit} noValidate className="min-w-0">
        <Card>
          <CardHeader
            title="Approval policy"
            description={`How many internal approvals a proposal needs, by amount. Version ${baseVersion ?? latestVersion}.`}
          />
          <CardBody className="space-y-5">
            {conflict && (
              <Callout
                tone="warning"
                title={`Someone saved version ${latestVersion} while you were editing`}
                action={
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setDraft(toDraft(server));
                        setBaseVersion(latestVersion);
                        setConflict(false);
                        setErrors({});
                      }}
                    >
                      Discard my edits
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setBaseVersion(latestVersion);
                        setConflict(false);
                      }}
                    >
                      Keep my edits
                    </Button>
                  </div>
                }
              >
                The latest saved version reads: “{describeTiers(server.tiers)}” Your edits are still here. Keep them to save over version {latestVersion}, or discard them to start from it.
              </Callout>
            )}
            {!canEdit && <Callout tone="neutral">Only owners and admins can change the approval policy. This is the policy in force.</Callout>}

            <fieldset disabled={!canEdit} className="space-y-2">
              <legend className="mb-2 text-[13px] font-medium text-text">Tiers</legend>
              <ol className="space-y-2">
                {draft.tiers.map((t, i) => {
                  const last = i === draft.tiers.length - 1;
                  const prev = draft.tiers[i - 1]?.upToUsd;
                  return (
                    <li key={t.key} className="rounded-[var(--radius-control)] border border-hairline p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-text-3">Tier {i + 1}</span>
                        {!last && canEdit && draft.tiers.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeTier(i)} aria-label={`Remove tier ${i + 1}`}>
                            <Trash2 className="size-3.5" aria-hidden="true" /> Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {last ? (
                          <div className="space-y-1.5">
                            <div className="text-[13px] font-medium text-text">Applies to</div>
                            <p className="flex h-9 items-center text-sm text-text-2">{draft.tiers.length === 1 ? "Every amount" : `Above ${prev && isPositive(prev) ? boundLabel(prev) : "the previous tier"}`}</p>
                          </div>
                        ) : (
                          <Field label="Up to (inclusive)" error={shownErrors[`tiers.${i}.upToUsd`]}>
                            {(p) => <AmountInput {...p} value={t.upToUsd} onChange={(v) => update(i, { upToUsd: v })} placeholder="25000" />}
                          </Field>
                        )}
                        <Field label="Approvals needed" error={shownErrors[`tiers.${i}.requiredApprovals`]}>
                          {(p) => <Input {...p} inputMode="numeric" value={t.requiredApprovals} onChange={(e) => update(i, { requiredApprovals: e.target.value.replace(/\D/g, "").slice(0, 2) })} />}
                        </Field>
                        <Field label="Must include">
                          {(p) => (
                            <Select<string>
                              {...p}
                              disabled={!canEdit}
                              value={t.requiredRole ?? ANY}
                              onValueChange={(v) => update(i, { requiredRole: v === ANY ? null : (v as ApproverRole) })}
                              options={[{ value: ANY, label: "Any approver" }, ...APPROVER_ROLES.map((r) => ({ value: r, label: r === "owner" ? "An owner" : `${ROLE_LABEL[r]} or higher` }))]}
                            />
                          )}
                        </Field>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {canEdit && (
                <Button type="button" variant="secondary" size="sm" onClick={addTier} disabled={draft.tiers.length >= MAX_TIERS}>
                  <Plus className="size-4" aria-hidden="true" /> Add tier
                </Button>
              )}
              <p className="text-xs text-text-3">The last tier has no upper limit, so every amount is covered. Up to {MAX_TIERS} tiers.</p>
            </fieldset>

            <fieldset disabled={!canEdit} className="grid gap-4 sm:grid-cols-2">
              <legend className="sr-only">Rules for every tier</legend>
              <div className="flex items-start justify-between gap-3 rounded-[var(--radius-control)] border border-hairline p-3">
                <div>
                  <label htmlFor="self-approval" className="text-[13px] font-medium text-text">
                    Proposer may approve
                  </label>
                  <p id="self-approval-hint" className="text-xs text-text-2">
                    Off means a different person must approve every proposal.
                  </p>
                </div>
                <Switch id="self-approval" aria-describedby="self-approval-hint" checked={draft.allowSelfApproval} onCheckedChange={(v) => setDraft({ ...draft, allowSelfApproval: v })} disabled={!canEdit} />
              </div>
              <Field label="Proposals expire after" hint="Hours without full approval before a proposal expires (max 720)." error={shownErrors.proposalTtlHours}>
                {(p) => (
                  <div className="relative">
                    <Input {...p} inputMode="numeric" className="pr-14" value={draft.proposalTtlHours} onChange={(e) => setDraft({ ...draft, proposalTtlHours: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-text-3">hours</span>
                  </div>
                )}
              </Field>
            </fieldset>

            {canEdit && (
              <Field label="Reason for the change" hint="Kept with this version in the policy history and the activity log." error={shownErrors.reason}>
                {(p) => <Textarea {...p} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="For example: require an owner above $250k after the Q3 review" />}
              </Field>
            )}
            {formError && <Callout tone="danger">{formError}</Callout>}
          </CardBody>
          {canEdit && (
            <CardFooter className="justify-end">
              {dirty && <span className="mr-auto text-xs text-text-3">Unsaved changes</span>}
              <Button type="button" variant="secondary" disabled={!dirty || save.isPending} onClick={() => (setDraft(toDraft(server)), setSubmitted(false), setErrors({}))}>
                Reset
              </Button>
              <Button type="submit" disabled={!dirty} loading={save.isPending} loadingLabel="Saving policy">
                Save as version {(baseVersion ?? latestVersion) + 1}
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>

      <div className="space-y-4">
        <Card>
          <CardHeader title="In plain language" description={dirty ? "Preview of your edits" : "The policy in force"} />
          <CardBody className="pt-2">
            {preview ? <p className="text-sm text-text">{preview}</p> : <p className="text-sm text-text-3">Fix the highlighted fields to see the preview.</p>}
            <p className="mt-2 text-xs text-text-2">
              {draft.allowSelfApproval ? "The proposer's own approval counts." : "The proposer's own approval does not count."} Proposals expire after {draft.proposalTtlHours || "—"} hours without full approval.
            </p>
            {warnings.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {warnings.map((w, i) => (
                  <li key={i}>
                    <Callout tone="warning">{w}</Callout>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Approvals are not signatures" />
          <CardBody className="space-y-2 pt-2 text-[13px] text-text-2">
            <p>Internal approval is a recorded decision inside TokenIQ. It never moves funds.</p>
            <p>After approval, the Safe owners still sign the transaction in their own wallets, up to your Safe&apos;s threshold, and someone executes it on-chain.</p>
            <Link href="/app/help#approvals" className="inline-flex items-center gap-1 text-accent hover:underline">
              How approvals, signatures and execution fit together <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-[13px] text-text-2">
            Reserve rules, exposure limits and autonomy are part of the treasury policy, edited on{" "}
            <Link href="/app/reserves" className="font-medium text-accent hover:underline">
              Reserves
            </Link>
            .
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
