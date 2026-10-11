"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, parseDecimal, toIsoDate, wadToString } from "@tokeniq/core";
import { ArrowRight, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AmountInput, Field, Input } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { ApiError, api, fieldErrors, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateLabel, usd } from "@/lib/format";
import type { ObligationDto, ObligationInputDto, OrgDto, PoliciesDto } from "@/lib/types";
import { amountLabel } from "@/components/app/payments/amount";
import { BackLink, OnboardingStep, recordOnboarding, StepActions } from "./onboarding-step";
import { can } from "./use-onboarding-org";

const CATEGORIES = [
  ["payroll", "Payroll"],
  ["contractors", "Contractors"],
  ["vendors", "Vendors"],
  ["infrastructure", "Infrastructure"],
  ["marketing", "Marketing"],
  ["legal", "Legal"],
  ["grants", "Grants"],
  ["taxes", "Taxes"],
  ["debt", "Debt"],
  ["operations", "Operations"],
  ["other", "Other"],
] as const;
type Category = (typeof CATEGORIES)[number][0];

const CERTAINTY = [
  { value: "estimate", label: "Estimate", hint: "Expected, not agreed" },
  { value: "committed", label: "Committed", hint: "Contract or payroll" },
  { value: "invoiced", label: "Invoiced", hint: "Invoice received" },
] as const;

/** A first guess at the category from the title, until the person picks one. */
function guessCategory(title: string): Category {
  const t = title.toLowerCase();
  if (/payroll|salar|wage|contributor|team pay/.test(t)) return "payroll";
  if (/contractor|freelanc/.test(t)) return "contractors";
  if (/audit|vendor|saas|subscription|software|licen/.test(t)) return "vendors";
  if (/rpc|infra|hosting|server|cloud|aws|node/.test(t)) return "infrastructure";
  if (/market|sponsor|conference|ads|event/.test(t)) return "marketing";
  if (/legal|counsel|lawyer|attorney/.test(t)) return "legal";
  if (/grant/.test(t)) return "grants";
  if (/tax|vat/.test(t)) return "taxes";
  if (/loan|debt|interest|repay/.test(t)) return "debt";
  return "operations";
}

interface Row {
  key: string;
  title: string;
  amount: string;
  currency: "USD" | "EUR";
  firstDueDate: string;
  repeat: "monthly" | "once";
  certainty: "estimate" | "committed" | "invoiced";
  category: Category;
  categoryTouched: boolean;
  savedId?: string;
  errors?: Record<string, string>;
}

const firstOfNextMonth = () => addMonths(`${toIsoDate(new Date()).slice(0, 8)}01`, 1);

const newRow = (): Row => ({ key: crypto.randomUUID(), title: "", amount: "", currency: "USD", firstDueDate: firstOfNextMonth(), repeat: "monthly", certainty: "committed", category: "operations", categoryTouched: false });

const isBlank = (r: Row) => !r.title.trim() && !r.amount.trim();

function positive(v: string) {
  try {
    return parseDecimal(v) > 0n;
  } catch {
    return false;
  }
}

const MAX_NEW = 5;

export function ObligationsStep() {
  return (
    <OnboardingStep
      step={3}
      title="What does the treasury pay for?"
      description="A rough monthly spend and your main commitments are enough to start. TokenIQ protects what's due before anything is deployed."
    >
      {({ org, orgId }) => <ObligationsBody org={org} orgId={orgId} />}
    </OnboardingStep>
  );
}

function ObligationsBody({ org, orgId }: { org: OrgDto; orgId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const policies = useQuery({ queryKey: ["org", orgId, "/policies"], queryFn: ({ signal }) => api<PoliciesDto>(orgPath(orgId, "/policies"), { signal }) });
  const existing = useQuery({ queryKey: ["org", orgId, "/obligations?status=active"], queryFn: ({ signal }) => api<{ obligations: ObligationDto[] }>(orgPath(orgId, "/obligations?status=active"), { signal }) });
  const [burn, setBurn] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const initialised = useRef(false);
  const canPolicy = can(org.role, "policy.write");
  const canWrite = can(org.role, "obligations.write");

  // Prefill once from current data so revisiting the step shows what was saved.
  useEffect(() => {
    if (initialised.current || !policies.data || !existing.data) return;
    initialised.current = true;
    setBurn(policies.data.treasury.monthlyBurnUsd ?? "");
    setRows(existing.data.obligations.length === 0 && canWrite ? [newRow()] : []);
  }, [policies.data, existing.data, canWrite]);

  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch, errors: undefined };
        if (patch.title !== undefined && !r.categoryTouched) next.category = guessCategory(patch.title);
        return next;
      }),
    );

  const unsaved = rows.filter((r) => !r.savedId);
  const monthlyNew = useMemo(() => {
    let t = 0n;
    for (const r of rows) if (r.repeat === "monthly" && r.currency === "USD" && positive(r.amount)) t += parseDecimal(r.amount);
    return wadToString(t);
  }, [rows]);

  const save = useMutation({
    mutationFn: async () => {
      let policyNote: string | null = null;
      const current = policies.data!;
      const nextBurn = burn.trim() === "" || !positive(burn) ? null : burn.trim();
      if (nextBurn !== current.treasury.monthlyBurnUsd && canPolicy) {
        try {
          await api(orgPath(orgId, "/policies/treasury"), { method: "PUT", body: { policy: { ...current.treasury, monthlyBurnUsd: nextBurn }, reason: "Onboarding: monthly burn estimate", expectedVersion: current.treasuryVersion } });
        } catch (e) {
          if (e instanceof ApiError && e.status === 403) policyNote = "Your role can't change the treasury policy, so the monthly spend wasn't saved. An owner or admin can add it in Reserves.";
          else if (e instanceof ApiError && e.code === "policy_version_conflict") {
            await qc.refetchQueries({ queryKey: ["org", orgId, "/policies"] });
            throw Object.assign(e, { burn: true });
          } else throw Object.assign(e as Error, { burn: true });
        }
      }
      for (const r of unsaved) {
        if (isBlank(r)) continue;
        const body: ObligationInputDto = {
          title: r.title.trim(),
          category: r.category,
          direction: "outflow",
          amount: r.amount,
          currency: r.currency,
          firstDueDate: r.firstDueDate,
          recurrence: r.repeat === "monthly" ? { freq: "monthly", interval: 1 } : { freq: "once" },
          certainty: r.certainty,
          priority: r.category === "payroll" || r.category === "taxes" ? "critical" : "normal",
        };
        try {
          const created = await api<ObligationDto>(orgPath(orgId, "/obligations"), { method: "POST", body, idempotencyKey: r.key });
          setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, savedId: created.id } : x)));
        } catch (e) {
          throw Object.assign(e as Error, { rowKey: r.key });
        }
      }
      await recordOnboarding(org, { step: "obligations" });
      return policyNote;
    },
    onSuccess: (policyNote) => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "org" && q.queryKey[1] === orgId });
      if (policyNote) setNotice(policyNote);
      else router.push("/onboarding/policy");
    },
    onError: (e) => {
      const rowKey = (e as { rowKey?: string }).rowKey;
      if (rowKey) {
        const fe = fieldErrors(e);
        setRows((rs) => rs.map((r) => (r.key === rowKey ? { ...r, errors: Object.keys(fe).length ? fe : { _: e.message } } : r)));
      } else if ((e as { burn?: boolean }).burn) {
        setBurnError(e instanceof ApiError && e.code === "policy_version_conflict" ? "The policy changed while you were editing. Your estimate is kept; save again to apply it to the latest version." : e.message);
      }
    },
  });

  const submit = () => {
    setBurnError(null);
    setNotice(null);
    let ok = true;
    if (burn.trim() && !positive(burn)) {
      setBurnError("Enter an amount greater than zero, or leave it empty.");
      ok = false;
    }
    const validated = rows.map((r) => {
      if (r.savedId || isBlank(r)) return r;
      const errors: Record<string, string> = {};
      if (r.title.trim().length < 2) errors.title = "Add a short title.";
      if (!positive(r.amount)) errors.amount = "Enter an amount greater than zero.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.firstDueDate)) errors.firstDueDate = "Choose a due date.";
      if (Object.keys(errors).length) ok = false;
      return { ...r, errors };
    });
    setRows(validated);
    if (ok) save.mutate();
  };

  if (policies.isLoading || existing.isLoading) return <Skeleton className="h-96 w-full" />;
  if (policies.isError || existing.isError) {
    return (
      <Callout tone="danger" title="Couldn't load your current settings" action={<Button size="sm" variant="secondary" onClick={() => (policies.isError ? policies.refetch() : existing.refetch())}>Try again</Button>}>
        {((policies.error ?? existing.error) as Error).message}. Nothing was changed.
      </Callout>
    );
  }

  const list = existing.data?.obligations ?? [];
  const failed = save.error && !(save.error as { rowKey?: string }).rowKey && !(save.error as { burn?: boolean }).burn;

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <Field
            label="Approximate monthly operating spend"
            optional
            error={burnError}
            hint={
              canPolicy
                ? "Salaries, contractors, tools: everything you spend in a normal month. The runway rule protects a number of these months. TokenIQ uses whichever is larger: this estimate or your recurring obligations."
                : "Only owners and admins can set this. It's shown for reference."
            }
          >
            {(p) => <AmountInput {...p} value={burn} onChange={setBurn} unit="USD / mo" placeholder="85000" disabled={!canPolicy} className="sm:max-w-xs" />}
          </Field>
        </CardBody>
      </Card>

      {list.length > 0 && (
        <Card>
          <CardBody>
            <h2 className="text-[13px] font-medium text-text-2">Already recorded ({list.length})</h2>
            <ul className="mt-2 divide-y divide-hairline">
              {list.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2 text-[13px]">
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-text">{o.title}</span>
                  <span className="text-xs text-text-3">{o.recurrence.freq === "once" ? `Once · ${dateLabel(o.firstDueDate)}` : o.recurrence.freq === "monthly" ? "Monthly" : o.recurrence.freq}</span>
                  <span className="num text-text">{amountLabel(o.amount, o.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-text-3">Edit or remove these later in Obligations.</p>
          </CardBody>
        </Card>
      )}

      {canWrite ? (
        <section aria-labelledby="new-obligations" className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="new-obligations" className="text-[15px] font-semibold text-text">
              {list.length ? "Add more commitments" : "Your main commitments"}
            </h2>
            <span className="text-xs text-text-3">
              {rows.length} of {MAX_NEW}
            </span>
          </div>
          <ol className="space-y-3">
            {rows.map((r, i) => (
              <li key={r.key}>
                <ObligationRow row={r} index={i} onChange={(patch) => update(r.key, patch)} onRemove={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} />
              </li>
            ))}
          </ol>
          {rows.length < MAX_NEW && (
            <Button variant="secondary" size="sm" onClick={() => setRows((rs) => [...rs, newRow()])}>
              <Plus className="size-4" aria-hidden="true" /> {rows.length ? "Add another" : "Add a commitment"}
            </Button>
          )}
          {monthlyNew !== "0" && (
            <p className="text-xs text-text-3">
              Monthly items above add up to <Money value={monthlyNew} /> per month{burn && positive(burn) ? ` (your estimate: ${usd(burn)})` : ""}.
            </p>
          )}
        </section>
      ) : (
        <Callout tone="neutral">Owners, admins and finance members record obligations. You can continue and they can add them later.</Callout>
      )}

      {notice && (
        <Callout tone="warning" title="Obligations saved, monthly spend not saved" action={<Button size="sm" onClick={() => router.push("/onboarding/policy")}>Continue</Button>}>
          {notice}
        </Callout>
      )}
      {failed && <Callout tone="danger">Couldn&apos;t save: {save.error!.message}. Anything marked saved is stored; save again to finish.</Callout>}

      <StepActions
        back={<BackLink href="/onboarding/treasury" />}
        secondary={
          <Button variant="ghost" className="h-11 sm:h-9" onClick={() => router.push("/onboarding/policy")}>
            Skip for now
          </Button>
        }
        primary={
          <Button className="h-11 sm:h-9" loading={save.isPending} loadingLabel="Saving" onClick={submit}>
            Save and continue <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        }
      />
    </div>
  );
}

function ObligationRow({ row: r, index, onChange, onRemove }: { row: Row; index: number; onChange: (patch: Partial<Row>) => void; onRemove: () => void }) {
  const e = r.errors ?? {};
  const locked = !!r.savedId;
  return (
    <fieldset className={cn("rounded-[var(--radius-card)] border bg-surface p-4", locked ? "border-success/30" : "border-hairline")} disabled={locked}>
      <legend className="sr-only">Commitment {index + 1}</legend>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-2">Commitment {index + 1}</span>
        {locked ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> Saved
          </span>
        ) : (
          <Button variant="ghost" size="sm" className="-mr-2 h-8" onClick={onRemove} aria-label={`Remove commitment ${index + 1}`}>
            <Trash2 className="size-3.5" aria-hidden="true" /> Remove
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-6">
        <Field label="Title" error={e.title} className="sm:col-span-6">
          {(p) => <Input {...p} value={r.title} onChange={(ev) => onChange({ title: ev.target.value })} placeholder="Core team payroll" maxLength={120} />}
        </Field>
        <Field label="Amount" error={e.amount} className="sm:col-span-3">
          {(p) => <AmountInput {...p} value={r.amount} onChange={(v) => onChange({ amount: v })} unit={r.currency} placeholder="0.00" />}
        </Field>
        <Field label="Currency" className="sm:col-span-1">
          {(p) => <Select {...p} value={r.currency} onValueChange={(v) => onChange({ currency: v })} options={[{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }]} />}
        </Field>
        <Field label={r.repeat === "monthly" ? "First due" : "Due"} error={e.firstDueDate} className="sm:col-span-2">
          {(p) => <Input {...p} type="date" value={r.firstDueDate} onChange={(ev) => onChange({ firstDueDate: ev.target.value })} />}
        </Field>
        <div className="space-y-1.5 sm:col-span-2">
          <span className="block text-[13px] font-medium text-text" id={`${r.key}-repeat`}>
            Repeats
          </span>
          <Segmented label="Repeats" value={r.repeat} onValueChange={(v) => onChange({ repeat: v })} options={[{ value: "monthly", label: "Monthly" }, { value: "once", label: "Once" }]} />
        </div>
        <Field label="Certainty" className="sm:col-span-2">
          {(p) => <Select {...p} value={r.certainty} onValueChange={(v) => onChange({ certainty: v })} options={CERTAINTY.map((c) => ({ value: c.value, label: c.label, hint: c.hint }))} />}
        </Field>
        <Field label="Category" className="sm:col-span-2">
          {(p) => <Select {...p} value={r.category} onValueChange={(v) => onChange({ category: v, categoryTouched: true })} options={CATEGORIES.map(([value, label]) => ({ value, label }))} />}
        </Field>
      </div>
      {e._ && (
        <p className="mt-2 text-xs font-medium text-danger" role="alert">
          {e._}
        </p>
      )}
    </fieldset>
  );
}
