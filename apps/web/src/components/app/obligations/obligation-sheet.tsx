"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, compareIso, isIsoDate, parseDecimal } from "@tokeniq/core";
import { CalendarDays, ChevronDown, CircleDashed, Handshake, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { Collapsible } from "radix-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AddressInput, AmountInput, Field, Input, isValidAddress, Textarea } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { RadioCards } from "@/components/ui/radio-cards";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, fieldErrors, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateLabel } from "@/lib/format";
import { useOrg } from "@/lib/org";
import type { ObligationDto, ObligationInputDto, RecurrenceDto } from "@/lib/types";
import { useMeta } from "../treasury/meta";
import { CATEGORIES, CERTAINTY, categoryLabel, currencyAmount, lastDueDate, monthlyEquivalent, previewDueDates, PRIORITY, recurrenceLabel, todayIso } from "./format";

type Freq = "once" | "weekly" | "monthly" | "quarterly" | "yearly";
type Ends = "never" | "until" | "count";

interface Draft {
  title: string;
  direction: "outflow" | "inflow";
  amount: string;
  currency: "USD" | "EUR";
  category: string;
  priority: ObligationDto["priority"];
  certainty: ObligationDto["certainty"] | "";
  firstDueDate: string;
  freq: Freq;
  interval: string;
  ends: Ends;
  until: string;
  count: string;
  counterparty: string;
  invoiceNumber: string;
  recipientAddress: string;
  recipientChainId: string;
  paymentAsset: string;
  notes: string;
}

const EMPTY: Draft = {
  title: "",
  direction: "outflow",
  amount: "",
  currency: "USD",
  category: "",
  priority: "normal",
  certainty: "",
  firstDueDate: "",
  freq: "monthly",
  interval: "1",
  ends: "never",
  until: "",
  count: "",
  counterparty: "",
  invoiceNumber: "",
  recipientAddress: "",
  recipientChainId: "",
  paymentAsset: "",
  notes: "",
};

function fromObligation(o: ObligationDto): Draft {
  const r = o.recurrence;
  return {
    title: o.title,
    direction: o.direction,
    amount: o.amount,
    currency: o.currency,
    category: o.category,
    priority: o.priority,
    certainty: o.certainty,
    firstDueDate: o.firstDueDate,
    freq: r.freq,
    interval: r.freq === "once" ? "1" : String(r.interval),
    ends: r.freq === "once" ? "never" : r.count ? "count" : r.until ? "until" : "never",
    until: r.freq !== "once" && r.until ? r.until : "",
    count: r.freq !== "once" && r.count ? String(r.count) : "",
    counterparty: o.counterparty ?? "",
    invoiceNumber: o.invoiceNumber ?? "",
    recipientAddress: o.recipientAddress ?? "",
    recipientChainId: o.recipientChainId ? String(o.recipientChainId) : "",
    paymentAsset: o.paymentAsset ?? "",
    notes: o.notes ?? "",
  };
}

function recurrenceOf(d: Draft): RecurrenceDto {
  if (d.freq === "once") return { freq: "once" };
  const interval = Number.parseInt(d.interval, 10);
  return {
    freq: d.freq,
    interval: Number.isFinite(interval) ? interval : 1,
    until: d.ends === "until" && d.until ? d.until : null,
    count: d.ends === "count" && d.count ? Number.parseInt(d.count, 10) : null,
  };
}

function toInput(d: Draft): ObligationInputDto {
  const opt = (v: string) => (v.trim() === "" ? null : v.trim());
  return {
    title: d.title.trim(),
    category: d.category,
    direction: d.direction,
    amount: d.amount,
    currency: d.currency,
    firstDueDate: d.firstDueDate,
    recurrence: recurrenceOf(d),
    certainty: (d.certainty || "committed") as ObligationDto["certainty"],
    priority: d.priority,
    counterparty: opt(d.counterparty),
    invoiceNumber: opt(d.invoiceNumber),
    recipientAddress: opt(d.recipientAddress),
    recipientChainId: d.recipientChainId ? Number(d.recipientChainId) : null,
    paymentAsset: opt(d.paymentAsset),
    notes: opt(d.notes),
  };
}

/** Client-side checks that mirror the API schema, keyed by the same field paths the API returns. */
function validate(d: Draft): Record<string, string> {
  const e: Record<string, string> = {};
  const title = d.title.trim();
  if (title.length < 2) e.title = "Enter a title of at least 2 characters.";
  else if (title.length > 120) e.title = "Keep the title under 120 characters.";
  if (!d.category) e.category = "Choose a category.";
  if (!d.amount) e.amount = "Enter the amount of each payment.";
  else {
    try {
      if (parseDecimal(d.amount) <= 0n) e.amount = "The amount must be greater than zero.";
    } catch {
      e.amount = "Enter a plain number, like 12500 or 12500.50.";
    }
  }
  if (!d.certainty) e.certainty = "Choose how certain this obligation is.";
  if (!d.firstDueDate) e.firstDueDate = "Choose the first due date.";
  else if (!isIsoDate(d.firstDueDate)) e.firstDueDate = "Enter a real calendar date.";
  if (d.freq !== "once") {
    const n = Number(d.interval);
    if (!Number.isInteger(n) || n < 1 || n > 12) e["recurrence.interval"] = "Choose a whole number from 1 to 12.";
    if (d.ends === "until") {
      if (!d.until || !isIsoDate(d.until)) e["recurrence.until"] = "Choose the last date payments can fall on.";
      else if (d.firstDueDate && isIsoDate(d.firstDueDate) && compareIso(d.until, d.firstDueDate) < 0) e["recurrence.until"] = "The end date must be on or after the first due date.";
    }
    if (d.ends === "count") {
      const c = Number(d.count);
      if (!Number.isInteger(c) || c < 1 || c > 500) e["recurrence.count"] = "Enter a number of payments from 1 to 500.";
    }
  }
  if (d.counterparty.trim().length > 120) e.counterparty = "Keep this under 120 characters.";
  if (d.invoiceNumber.trim().length > 64) e.invoiceNumber = "Keep this under 64 characters.";
  if (d.notes.trim().length > 2000) e.notes = `Notes are limited to 2,000 characters (${d.notes.trim().length} now).`;
  if (d.recipientAddress.trim() && !isValidAddress(d.recipientAddress)) e.recipientAddress = "Enter a valid 0x address, or leave this empty.";
  return e;
}

const FREQ_UNIT: Record<Exclude<Freq, "once">, [string, string]> = { weekly: ["week", "weeks"], monthly: ["month", "months"], quarterly: ["quarter", "quarters"], yearly: ["year", "years"] };

export function ObligationSheet({ open, onOpenChange, obligation, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; obligation?: ObligationDto | null; onSaved?: (o: ObligationDto) => void }) {
  const editing = !!obligation;
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const meta = useMeta();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => (obligation ? fromObligation(obligation) : EMPTY));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const idem = useRef<{ key: string; body: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form when it is opened for a different obligation (or for a new one after a save).
  const identity = obligation ? `${obligation.id}:${obligation.updatedAt}` : "new";
  const lastIdentity = useRef(identity);
  useEffect(() => {
    if (!open) return;
    if (lastIdentity.current !== identity) {
      lastIdentity.current = identity;
      setDraft(obligation ? fromObligation(obligation) : EMPTY);
      setErrors({});
      setFormError(null);
    }
  }, [open, identity, obligation]);

  useEffect(() => {
    if (open && obligation && (obligation.counterparty || obligation.invoiceNumber || obligation.recipientAddress || obligation.notes || obligation.paymentAsset)) setDetailsOpen(true);
  }, [open, obligation]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => {
      const path = k === "interval" || k === "until" || k === "count" ? `recurrence.${k}` : k;
      if (!e[path]) return e;
      const { [path]: _, ...rest } = e;
      return rest;
    });
  };

  const save = useMutation({
    mutationFn: async (input: ObligationInputDto) => {
      if (editing) return api<ObligationDto>(orgPath(orgId, `/obligations/${obligation!.id}`), { method: "PATCH", body: input });
      const body = JSON.stringify(input);
      if (!idem.current || idem.current.body !== body) idem.current = { key: crypto.randomUUID(), body };
      return api<ObligationDto>(orgPath(orgId, "/obligations"), { method: "POST", body: input, idempotencyKey: idem.current.key });
    },
    onSuccess: (o) => {
      idem.current = null;
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "org" && q.queryKey[1] === orgId && typeof q.queryKey[2] === "string" && /^\/(obligations|treasury|alerts|recommendations)/.test(q.queryKey[2]) });
      toast({
        id: `obligation-${o.id}`,
        tone: "success",
        title: editing ? "Obligation updated" : "Obligation recorded",
        description: editing ? `${o.title} now uses the new details. Reserve figures were recalculated.` : `${o.title} now counts toward the reserve requirement${o.certainty === "estimate" ? " (as an estimate)" : ""}.`,
        action: editing ? undefined : { label: "Open obligation", onClick: () => router.push(`/app/obligations/${o.id}`) },
      });
      if (!editing) {
        setDraft(EMPTY);
        setDetailsOpen(false);
      }
      onOpenChange(false);
      onSaved?.(o);
    },
    onError: (err) => {
      const fe = fieldErrors(err);
      if (err instanceof ApiError && err.code === "invalid_recurrence") fe["recurrence.until"] = err.message;
      setErrors(fe);
      if (Object.keys(fe).length === 0) {
        setFormError(err instanceof ApiError && err.status === 403 ? "Your role can't record or change obligations. Ask an owner, admin or finance member." : (err as Error).message);
      } else {
        setFormError("Some fields need attention. Nothing was saved; your entries are kept.");
      }
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs = validate(draft);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Some fields need attention.");
      if (errs.recipientAddress || errs.counterparty || errs.invoiceNumber || errs.notes) setDetailsOpen(true);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    save.mutate(toInput(draft));
  };

  const recurrence = recurrenceOf(draft);
  const today = todayIso();
  const validStart = isIsoDate(draft.firstDueDate);
  const previewFrom = !validStart ? today : editing ? (compareIso(draft.firstDueDate, today) > 0 ? draft.firstDueDate : today) : compareIso(draft.firstDueDate, today) >= 0 ? draft.firstDueDate : maxIso(draft.firstDueDate, addDays(today, -30));
  const recurrenceValid = !errors["recurrence.interval"] && (draft.freq === "once" || (Number(draft.interval) >= 1 && Number(draft.interval) <= 12));
  const preview = useMemo(() => (validStart && recurrenceValid ? previewDueDates(draft.firstDueDate, recurrence, previewFrom, 5) : []), [validStart, recurrenceValid, draft.firstDueDate, JSON.stringify(recurrence), previewFrom]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = validStart && recurrenceValid ? lastDueDate(draft.firstDueDate, recurrence) : null;
  const monthly = draft.amount ? monthlyEquivalent(draft.amount, recurrence) : null;
  const pastStart = !editing && validStart && compareIso(draft.firstDueDate, today) < 0;

  const chains = (meta.data?.chains ?? []).filter((c) => !c.testnet || c.id === Number(draft.recipientChainId));
  const assets = [...new Set((meta.data?.tokens ?? []).filter((t) => t.assetClass === "stablecoin" && (!draft.recipientChainId || t.chainId === Number(draft.recipientChainId))).map((t) => t.symbol))];

  const unit = draft.freq !== "once" ? FREQ_UNIT[draft.freq] : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setFormError(null);
          if (editing && obligation) {
            setDraft(fromObligation(obligation));
            setErrors({});
          }
        }
        onOpenChange(v);
      }}
      width="lg"
      title={editing ? `Edit ${obligation!.title}` : "Record an obligation"}
      description={editing ? "Changes apply to future reserve calculations. Recorded payments are kept." : "Something the organization must pay (or expects to receive). It counts toward the reserve requirement as soon as it is saved."}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="obligation-form" loading={save.isPending} loadingLabel="Saving">
            {editing ? "Save changes" : "Record obligation"}
          </Button>
        </>
      }
    >
      <form id="obligation-form" ref={formRef} onSubmit={submit} noValidate className="space-y-6">
        {formError && (
          <Callout tone="danger" title={formError}>
            {Object.keys(errors).length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-xs">
                {Object.entries(errors)
                  .slice(0, 5)
                  .map(([k, v]) => (
                    <li key={k}>{v}</li>
                  ))}
              </ul>
            )}
          </Callout>
        )}

        <section aria-labelledby="ob-what" className="space-y-4">
          <h3 id="ob-what" className="text-xs font-semibold uppercase tracking-wide text-text-3">
            What it is
          </h3>
          <Field label="Title" error={errors.title} hint="As your team would say it, e.g. “Core contributors payroll”.">
            {(p) => <Input {...p} value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={140} autoComplete="off" autoFocus={!editing} />}
          </Field>
          <Field label="Direction" hint={draft.direction === "inflow" ? "Expected inflows are shown for planning only. They never reduce the reserve requirement." : "Money the organization must pay out."}>
            {() => (
              <Segmented
                label="Direction"
                value={draft.direction}
                onValueChange={(v) => set("direction", v)}
                options={[
                  { value: "outflow", label: "We pay" },
                  { value: "inflow", label: "We expect to receive" },
                ]}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field label="Amount per payment" error={errors.amount} hint={draft.currency === "EUR" ? "Converted to USD at the current EUR/USD rate for reserve maths." : undefined}>
              {(p) => <AmountInput {...p} value={draft.amount} onChange={(v) => set("amount", v)} unit={draft.currency} maxDecimals={2} placeholder="0.00" />}
            </Field>
            <Field label="Currency" error={errors.currency}>
              {(p) => (
                <Select
                  {...p}
                  value={draft.currency}
                  onValueChange={(v) => set("currency", v)}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                  ]}
                />
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category}>
              {(p) => <Select {...p} value={draft.category} onValueChange={(v) => set("category", v)} placeholder="Choose a category" options={CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) }))} />}
            </Field>
            <Field label="Priority" error={errors.priority} hint={PRIORITY[draft.priority].description}>
              {(p) => <Select {...p} value={draft.priority} onValueChange={(v) => set("priority", v)} options={(Object.keys(PRIORITY) as Array<keyof typeof PRIORITY>).map((k) => ({ value: k, label: PRIORITY[k].label }))} />}
            </Field>
          </div>
          <Field label="How certain is it?" error={errors.certainty} hint="Estimates can be excluded from the reserve by policy; committed and invoiced amounts always count.">
            {(p) => (
              <RadioCards
                {...p}
                label="Certainty"
                columns={3}
                value={draft.certainty as ObligationDto["certainty"]}
                onValueChange={(v) => set("certainty", v)}
                options={[
                  { value: "estimate", label: CERTAINTY.estimate.label, description: CERTAINTY.estimate.description, icon: CircleDashed },
                  { value: "committed", label: CERTAINTY.committed.label, description: CERTAINTY.committed.description, icon: Handshake },
                  { value: "invoiced", label: CERTAINTY.invoiced.label, description: CERTAINTY.invoiced.description, icon: Receipt },
                ]}
              />
            )}
          </Field>
        </section>

        <section aria-labelledby="ob-when" className="space-y-4 border-t border-hairline pt-5">
          <h3 id="ob-when" className="text-xs font-semibold uppercase tracking-wide text-text-3">
            When it is due
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={draft.freq === "once" ? "Due date" : "First due date"} error={errors.firstDueDate}>
              {(p) => <Input {...p} type="date" value={draft.firstDueDate} onChange={(e) => set("firstDueDate", e.target.value)} className="num" />}
            </Field>
          </div>
          <Field label="Repeats">
            {() => (
              <Segmented
                label="Repeats"
                value={draft.freq}
                onValueChange={(v) => set("freq", v)}
                className="flex w-full flex-wrap sm:inline-flex sm:w-auto"
                options={[
                  { value: "once", label: "Once" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "quarterly", label: "Quarterly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
            )}
          </Field>
          {unit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Every" error={errors["recurrence.interval"]}>
                {(p) => (
                  <div className="flex items-center gap-2">
                    <Input {...p} type="number" inputMode="numeric" min={1} max={12} step={1} value={draft.interval} onChange={(e) => set("interval", e.target.value)} className="num w-20" />
                    <span className="text-sm text-text-2">{Number(draft.interval) === 1 ? unit[0] : unit[1]}</span>
                  </div>
                )}
              </Field>
              <Field label="Ends">
                {() => (
                  <Segmented
                    label="Ends"
                    size="sm"
                    value={draft.ends}
                    onValueChange={(v) => set("ends", v)}
                    options={[
                      { value: "never", label: "Never" },
                      { value: "until", label: "On a date" },
                      { value: "count", label: "After N payments" },
                    ]}
                  />
                )}
              </Field>
              {draft.ends === "until" && (
                <Field label="Last possible date" error={errors["recurrence.until"]} hint="No payment falls after this date." className="sm:col-start-2">
                  {(p) => <Input {...p} type="date" min={draft.firstDueDate || undefined} value={draft.until} onChange={(e) => set("until", e.target.value)} className="num" />}
                </Field>
              )}
              {draft.ends === "count" && (
                <Field label="Number of payments" error={errors["recurrence.count"]} hint="Including the first one." className="sm:col-start-2">
                  {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={500} value={draft.count} onChange={(e) => set("count", e.target.value)} className="num w-28" />}
                </Field>
              )}
            </div>
          )}

          <SchedulePreview
            dates={preview}
            today={today}
            label={validStart && recurrenceValid ? recurrenceLabel(recurrence, draft.firstDueDate, { withOnceDate: true }) : null}
            last={last}
            monthly={monthly}
            currency={draft.currency}
            pastStart={pastStart}
            editing={editing}
          />
        </section>

        <Collapsible.Root open={detailsOpen} onOpenChange={setDetailsOpen} className="border-t border-hairline pt-5">
          <Collapsible.Trigger className="flex w-full items-center justify-between text-left">
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wide text-text-3">Payment details</span>
              <span className="mt-0.5 block text-[13px] text-text-2">Counterparty, invoice, recipient and notes. Optional, but they make payments easier to verify.</span>
            </span>
            <ChevronDown className={cn("size-4 shrink-0 text-text-3 transition-transform duration-[var(--dur-fast)]", detailsOpen && "rotate-180")} aria-hidden="true" />
          </Collapsible.Trigger>
          <Collapsible.Content className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Counterparty" optional error={errors.counterparty}>
                {(p) => <Input {...p} value={draft.counterparty} onChange={(e) => set("counterparty", e.target.value)} maxLength={120} placeholder="Who is paid" />}
              </Field>
              <Field label="Invoice number" optional error={errors.invoiceNumber}>
                {(p) => <Input {...p} value={draft.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} maxLength={64} />}
              </Field>
            </div>
            <Field label="Recipient address" optional error={errors.recipientAddress} hint="Used to match on-chain transfers to this obligation when payments are verified.">
              {(p) => <AddressInput {...p} value={draft.recipientAddress} onChange={(v) => set("recipientAddress", v)} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Network" optional error={errors.recipientChainId}>
                {(p) => (
                  <Select
                    {...p}
                    value={draft.recipientChainId}
                    onValueChange={(v) => set("recipientChainId", v)}
                    placeholder={meta.isLoading ? "Loading networks…" : "Any network"}
                    options={chains.map((c) => ({ value: String(c.id), label: c.name, hint: c.testnet ? "Testnet" : undefined }))}
                  />
                )}
              </Field>
              <Field label="Paid in" optional error={errors.paymentAsset}>
                {(p) => <Select {...p} value={draft.paymentAsset} onValueChange={(v) => set("paymentAsset", v)} placeholder="Any stablecoin" options={assets.map((s) => ({ value: s, label: s }))} />}
              </Field>
            </div>
            {(draft.recipientChainId || draft.paymentAsset) && (
              <button
                type="button"
                className="text-xs font-medium text-accent hover:underline"
                onClick={() => {
                  set("recipientChainId", "");
                  set("paymentAsset", "");
                }}
              >
                Clear network and asset
              </button>
            )}
            <Field label="Notes" optional error={errors.notes} hint={`${draft.notes.length}/2000. Visible to everyone in the organization.`}>
              {(p) => <Textarea {...p} value={draft.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />}
            </Field>
          </Collapsible.Content>
        </Collapsible.Root>
      </form>
    </Sheet>
  );
}

function maxIso(a: string, b: string) {
  return a > b ? a : b;
}

function SchedulePreview({ dates, today, label, last, monthly, currency, pastStart, editing }: { dates: string[]; today: string; label: string | null; last: string | null; monthly: string | null; currency: "USD" | "EUR"; pastStart: boolean; editing: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-sunken p-3.5" aria-live="polite">
      <div className="flex items-center gap-1.5 text-xs font-medium text-text-2">
        <CalendarDays className="size-3.5" aria-hidden="true" />
        {editing ? "Next due dates" : "Due dates"} <span className="font-normal text-text-3">· preview, calculated the same way as the reserve</span>
      </div>
      {label === null ? (
        <p className="mt-2 text-[13px] text-text-3">Choose a due date to see the schedule.</p>
      ) : (
        <>
          <p className="mt-1.5 text-sm font-medium text-text">{label}</p>
          {dates.length === 0 ? (
            <p className="mt-2 text-[13px] text-text-2">No due dates remain on or after {dateLabel(today)}. This schedule has ended.</p>
          ) : (
            <ol className="mt-2 grid gap-1 text-[13px] sm:grid-cols-2">
              {dates.map((d, i) => {
                const past = d < today;
                return (
                  <li key={d} className="flex items-baseline gap-2">
                    <span className="num w-4 text-right text-xs text-text-3">{i + 1}</span>
                    <span className={cn("num", past ? "text-warning" : "text-text")}>{dateLabel(d, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    {past && <span className="text-xs text-warning">overdue unless recorded</span>}
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-2 space-y-0.5 text-xs text-text-3">
            {last && dates.length > 0 && label && !label.startsWith("Once") && <p>Last payment {dateLabel(last)}.</p>}
            {monthly && (
              <p>
                Counts as {currency === "USD" ? <Money value={monthly} /> : currencyAmount(monthly, currency)} per month in the itemized burn (weekly schedules use 52 weeks ÷ 12).
              </p>
            )}
            {pastStart && <p className="text-warning">The first due date is in the past. Unpaid dates from the last 30 days will show as overdue until you record them as paid or skipped.</p>}
          </div>
        </>
      )}
    </div>
  );
}
