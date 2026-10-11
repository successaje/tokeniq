"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Info, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { RadioCards } from "@/components/ui/radio-cards";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, fieldErrors, orgPath } from "@/lib/api";
import { dateLabel } from "@/lib/format";
import { useOrg } from "@/lib/org";
import type { ObligationDto } from "@/lib/types";
import { useMeta } from "../treasury/meta";
import { currencyAmount } from "./format";

const TX_RE = /^0x[0-9a-fA-F]{64}$/;

/** True when the API answered that the route itself does not exist (payments not deployed yet). */
function isMissingRoute(err: unknown) {
  return err instanceof ApiError && err.status === 404 && (err.message === "Route not found" || err.code === "http_404");
}

export function RecordPaymentSheet({
  open,
  onOpenChange,
  obligation,
  dueDates,
  initialDueDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  obligation: ObligationDto;
  /** Unsettled occurrences, oldest first (overdue ones included). */
  dueDates: Array<{ dueDate: string; overdue: boolean; amount: string; currency: string }>;
  initialDueDate?: string | null;
}) {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const meta = useMeta();
  const [dueDate, setDueDate] = useState(initialDueDate ?? dueDates[0]?.dueDate ?? "");
  const [status, setStatus] = useState<"paid" | "skipped">("paid");
  const [txHash, setTxHash] = useState("");
  const [chainId, setChainId] = useState(obligation.recipientChainId ? String(obligation.recipientChainId) : "");
  const [assetSymbol, setAssetSymbol] = useState(obligation.paymentAsset ?? (obligation.currency === "EUR" ? "EURC" : "USDC"));
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unavailable, setUnavailable] = useState(false);
  const idem = useRef<{ key: string; body: string } | null>(null);

  useEffect(() => {
    if (open) {
      setDueDate(initialDueDate ?? dueDates[0]?.dueDate ?? "");
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialDueDate]);

  const record = useMutation({
    mutationFn: (body: Record<string, unknown>) => {
      const s = JSON.stringify(body);
      if (!idem.current || idem.current.body !== s) idem.current = { key: crypto.randomUUID(), body: s };
      return api<unknown>(orgPath(orgId, "/payments"), { method: "POST", body, idempotencyKey: idem.current.key });
    },
    onSuccess: () => {
      idem.current = null;
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "org" && q.queryKey[1] === orgId && typeof q.queryKey[2] === "string" && /^\/(obligations|treasury|payments|alerts)/.test(q.queryKey[2]) });
      toast({
        id: `payment-${obligation.id}-${dueDate}`,
        tone: "success",
        title: status === "skipped" ? "Occurrence skipped" : txHash ? "Payment recorded" : "Marked as paid",
        description:
          status === "skipped"
            ? `${dateLabel(dueDate)} no longer counts toward the reserve.`
            : txHash
              ? "TokenIQ will check the transaction on-chain. Until it matches, it shows as not verified."
              : "Recorded without a transaction, so it shows as “Marked paid, not verified”.",
      });
      setTxHash("");
      setNote("");
      onOpenChange(false);
    },
    onError: (err) => {
      if (isMissingRoute(err)) {
        setUnavailable(true);
        return;
      }
      setErrors(fieldErrors(err));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!dueDate) errs.dueDate = "Choose which due date this settles.";
    if (status === "paid" && txHash.trim() && !TX_RE.test(txHash.trim())) errs.txHash = "Enter a 0x transaction hash with 64 hexadecimal characters.";
    if (status === "paid" && txHash.trim() && !chainId) errs.chainId = "Choose the network the transaction is on.";
    if (note.length > 1000) errs.note = "Keep the note under 1,000 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body: Record<string, unknown> = { obligationId: obligation.id, dueDate, status };
    if (status === "paid" && txHash.trim()) {
      body.txHash = txHash.trim();
      body.chainId = Number(chainId);
      if (assetSymbol) body.assetSymbol = assetSymbol;
    }
    if (note.trim()) body.note = note.trim();
    record.mutate(body);
  };

  const err = record.error;
  const generalError = err && !isMissingRoute(err) && Object.keys(fieldErrors(err)).length === 0 ? (err instanceof ApiError && err.status === 403 ? "Your role can't record payments. Ask an owner, admin or finance member." : (err as Error).message) : null;
  const chains = (meta.data?.chains ?? []).filter((c) => !c.testnet || String(c.id) === chainId);
  const assets = [...new Set((meta.data?.tokens ?? []).filter((t) => t.assetClass === "stablecoin" && (!chainId || t.chainId === Number(chainId))).map((t) => t.symbol))];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Record payment"
      description={`${obligation.title} · ${currencyAmount(obligation.amount, obligation.currency)} per payment`}
      footer={
        unavailable ? (
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="record-payment-form" loading={record.isPending} loadingLabel="Recording" disabled={dueDates.length === 0}>
              {status === "skipped" ? "Skip this occurrence" : "Record payment"}
            </Button>
          </>
        )
      }
    >
      {unavailable ? (
        <Callout tone="info" title="Payment recording is not available yet">
          This workspace can't record payments yet. Nothing was saved. The obligation and its schedule are unchanged, and you can try again later.
        </Callout>
      ) : dueDates.length === 0 ? (
        <Callout tone="neutral" title="Nothing to record">
          There are no unpaid due dates for this obligation in the next year.
        </Callout>
      ) : (
        <form id="record-payment-form" onSubmit={submit} noValidate className="space-y-5">
          {generalError && <Callout tone="danger" title="Nothing was recorded">{generalError}</Callout>}
          <Field label="Due date" error={errors.dueDate} hint="Each due date is settled once: paid or skipped.">
            {(p) => (
              <Select
                {...p}
                value={dueDate}
                onValueChange={setDueDate}
                options={dueDates.map((d) => ({ value: d.dueDate, label: dateLabel(d.dueDate, { weekday: "short", month: "short", day: "numeric", year: "numeric" }), hint: d.overdue ? "Overdue" : currencyAmount(d.amount, d.currency) }))}
              />
            )}
          </Field>
          <Field label="Outcome" error={errors.status}>
            {(p) => (
              <RadioCards
                {...p}
                label="Outcome"
                value={status}
                onValueChange={setStatus}
                columns={2}
                options={[
                  { value: "paid", label: "Paid", description: "It has been paid. Add the transaction so TokenIQ can verify it.", icon: CircleCheck },
                  { value: "skipped", label: "Skipped", description: "It will not be paid. It stops counting toward the reserve.", icon: SkipForward },
                ]}
              />
            )}
          </Field>
          {status === "paid" && (
            <>
              <Field label="Transaction hash" optional error={errors.txHash} hint="Without a transaction, the payment is recorded as “Marked paid, not verified”.">
                {(p) => <Input {...p} value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x…" spellCheck={false} autoComplete="off" className="font-mono text-[13px]" />}
              </Field>
              {txHash.trim() && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Network" error={errors.chainId}>
                    {(p) => <Select {...p} value={chainId} onValueChange={setChainId} placeholder="Choose a network" options={chains.map((c) => ({ value: String(c.id), label: c.name, hint: c.testnet ? "Testnet" : undefined }))} />}
                  </Field>
                  <Field label="Asset sent" error={errors.assetSymbol}>
                    {(p) => <Select {...p} value={assetSymbol} onValueChange={setAssetSymbol} options={assets.map((a) => ({ value: a, label: a }))} />}
                  </Field>
                </div>
              )}
              {txHash.trim() && !obligation.recipientAddress && (
                <Callout tone="warning" title="No recipient address on this obligation">
                  TokenIQ can only verify a transfer to a known recipient. Add the recipient address (Edit) for this payment to be verified.
                </Callout>
              )}
              <p className="flex gap-1.5 text-xs text-text-3">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Verified on-chain means TokenIQ matched a confirmed transfer to the recipient for the expected amount. Recording here does not move any funds.
              </p>
            </>
          )}
          <Field label="Note" optional error={errors.note}>
            {(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />}
          </Field>
        </form>
      )}
    </Sheet>
  );
}
