"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Info, ShieldCheck, SkipForward } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAddress } from "viem";
import { useMeta, useNetworkGroups } from "@/components/app/accounts/labels";
import { Button } from "@/components/ui/button";
import { AddressInput, Field, Input, isValidAddress, Textarea } from "@/components/ui/field";
import { GroupedSelect } from "@/components/ui/grouped-select";
import { RadioCards } from "@/components/ui/radio-cards";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, fieldErrors, orgPath } from "@/lib/api";
import { dateLabel, shortAddress } from "@/lib/format";
import { useCan, useOrg } from "@/lib/org";
import type { ObligationDto, OccurrenceDto, PaymentDto } from "@/lib/types";
import { amountLabel, humanizeReason } from "./amount";
import { OccurrencePicker, occurrenceKey } from "./occurrence-picker";

const TX_RE = /^0x[0-9a-fA-F]{64}$/;

type Problem = { title: string; body: React.ReactNode; field?: "txHash" | "chainId" | "assetSymbol" };

/** Refresh everything a payment record changes: payments, schedules, obligations, reserve. */
export function invalidatePayments(qc: ReturnType<typeof useQueryClient>, orgId: string) {
  qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "org" && q.queryKey[1] === orgId && typeof q.queryKey[2] === "string" && /^\/(payments|obligations|treasury|alerts|recommendations)/.test(q.queryKey[2]) });
}

export function RecordPaymentSheet({
  open,
  onOpenChange,
  occurrences,
  obligations,
  initialKey,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Unpaid outflow occurrences, overdue first. */
  occurrences: OccurrenceDto[];
  obligations: Map<string, ObligationDto>;
  initialKey?: string | null;
}) {
  const { orgId } = useOrg();
  const canEditObligation = useCan("obligations.write");
  const qc = useQueryClient();
  const { toast } = useToast();
  const meta = useMeta();
  const { groups } = useNetworkGroups();

  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"paid" | "skipped">("paid");
  const [txHash, setTxHash] = useState("");
  const [chainId, setChainId] = useState("");
  const [asset, setAsset] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const idem = useRef<{ key: string; body: string } | null>(null);

  const occ = occurrences.find((o) => occurrenceKey(o) === key) ?? null;
  const ob = occ ? (obligations.get(occ.obligationId) ?? null) : null;

  useEffect(() => {
    if (!open) return;
    setKey(initialKey ?? "");
    setStatus("paid");
    setTxHash("");
    setNote("");
    setErrors({});
    setProblem(null);
    idem.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialKey]);

  // Defaults follow the chosen obligation: its recipient network and payment asset (else Base and USDC).
  useEffect(() => {
    setChainId(ob?.recipientChainId ? String(ob.recipientChainId) : "8453");
    setProblem(null);
  }, [ob?.id, ob?.recipientChainId]);

  const tokens = useMemo(() => (meta.data?.tokens ?? []).filter((t) => String(t.chainId) === chainId && t.address !== "native"), [meta.data, chainId]);
  useEffect(() => {
    const wanted = ob?.paymentAsset ?? "USDC";
    setAsset(tokens.find((t) => t.symbol === wanted)?.symbol ?? tokens.find((t) => t.symbol === "USDC")?.symbol ?? tokens[0]?.symbol ?? "");
  }, [tokens, ob?.paymentAsset]);

  const token = tokens.find((t) => t.symbol === asset);
  const chain = meta.data?.chains.find((c) => String(c.id) === chainId);
  const amountChecked = ob?.currency === "USD" && token?.pegCurrency === "USD";
  const hasHash = status === "paid" && txHash.trim() !== "";
  const missingRecipient = !!ob && !ob.recipientAddress;

  const record = useMutation({
    mutationFn: (body: Record<string, unknown>) => {
      const s = JSON.stringify(body);
      if (!idem.current || idem.current.body !== s) idem.current = { key: crypto.randomUUID(), body: s };
      return api<{ payment: PaymentDto }>(orgPath(orgId, "/payments"), { method: "POST", body, idempotencyKey: idem.current.key });
    },
    onMutate: () => setProblem(null),
    onSuccess: ({ payment }) => {
      idem.current = null;
      invalidatePayments(qc, orgId);
      const v = payment.verification;
      const title = payment.title ?? occ?.title ?? "Payment";
      if (payment.status === "skipped") toast({ id: `pay-${payment.id}`, tone: "success", title: `Skipped: ${title}`, description: `${dateLabel(payment.dueDate)} no longer counts as owed.` });
      else if (payment.status === "paid_verified") toast({ id: `pay-${payment.id}`, tone: "success", title: "Payment verified on-chain", description: `${title} · ${v?.confirmations ?? 0} confirmations · ${v?.amountChecked ? "recipient and amount match" : "recipient matches"}.` });
      else if (payment.txHash && v?.status === "pending") toast({ id: `pay-${payment.id}`, tone: "info", title: "Recorded, waiting for confirmations", description: `${v.reason ?? ""}. Use Re-check in a minute to finish verification.` });
      else toast({ id: `pay-${payment.id}`, tone: "warning", title: "Marked paid — not verified", description: `${title} stops counting as owed. Without a transaction it can't be checked on-chain.` });
      onOpenChange(false);
    },
    onError: (err) => {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) return setErrors(fe);
      setProblem(describe(err, { chainName: chain?.name ?? "this network", asset, decimals: token?.decimals, obligationId: ob?.id ?? null }));
      if (err instanceof ApiError && err.code === "already_settled") invalidatePayments(qc, orgId);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!occ) next.occurrence = "Choose which due date this settles.";
    if (hasHash) {
      if (!TX_RE.test(txHash.trim())) next.txHash = "Enter a 0x transaction hash with 64 hexadecimal characters.";
      if (!chainId) next.chainId = "Choose the network the transaction is on.";
      if (!asset) next.assetSymbol = "Choose the asset that was sent.";
      if (missingRecipient) next.txHash = "This obligation has no recipient address to check against. Add it below, or clear the hash to record without verification.";
    }
    if (note.length > 1000) next.note = "Keep the note under 1,000 characters.";
    setErrors(next);
    if (Object.keys(next).length || !occ) return;
    const body: Record<string, unknown> = { obligationId: occ.obligationId, dueDate: occ.dueDate, status };
    if (hasHash) Object.assign(body, { txHash: txHash.trim(), chainId: Number(chainId), assetSymbol: asset });
    if (note.trim()) body.note = note.trim();
    record.mutate(body);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Record payment"
      description="For payments made outside TokenIQ. Payments executed through TokenIQ proposals settle automatically."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="record-payment-form" loading={record.isPending} loadingLabel={hasHash ? "Checking the transaction on-chain" : "Recording"} disabled={occurrences.length === 0}>
            {record.isPending && hasHash ? "Checking on-chain…" : status === "skipped" ? "Skip this payment" : hasHash ? "Record and verify" : "Mark as paid"}
          </Button>
        </>
      }
    >
      <form id="record-payment-form" onSubmit={submit} noValidate className="space-y-5">
        <Field label="Which payment" error={errors.occurrence} hint={occ ? `${occ.title} · due ${dateLabel(occ.dueDate)} · ${amountLabel(occ.amount, occ.currency)}` : "Unpaid occurrences in the next 120 days, overdue first."}>
          {(p) => <OccurrencePicker {...p} occurrences={occurrences} value={key} onChange={setKey} />}
        </Field>

        <Field label="Outcome">
          {(p) => (
            <RadioCards
              {...p}
              label="Outcome"
              value={status}
              onValueChange={setStatus}
              columns={2}
              options={[
                { value: "paid", label: "Paid", description: "It was paid outside TokenIQ.", icon: CircleCheck },
                { value: "skipped", label: "Skipped", description: "It won't be paid. It stops counting as owed.", icon: SkipForward },
              ]}
            />
          )}
        </Field>

        {status === "paid" && (
          <div className="space-y-4 rounded-[var(--radius-card)] border border-hairline p-4">
            <div className="flex gap-2 text-[13px] text-text-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
              <p>
                Add the transaction hash and TokenIQ checks it on-chain: a {asset || "token"} transfer to the obligation&apos;s recipient
                {ob?.recipientAddress ? <span className="font-mono"> {shortAddress(ob.recipientAddress)}</span> : ""}
                {amountChecked && occ ? ` for at least ${amountLabel(occ.amount, occ.currency)}` : ""}, with enough confirmations.
                {ob && !amountChecked && token ? " The amount isn't compared because the obligation isn't in USD or the asset isn't a USD stablecoin." : ""}
              </p>
            </div>
            <Field label="Transaction hash" optional error={errors.txHash} hint="Without a hash, the record shows as “Marked paid — not verified”.">
              {(p) => <Input {...p} value={txHash} onChange={(e) => setTxHash(e.target.value.trim())} placeholder="0x…" spellCheck={false} autoComplete="off" className="font-mono text-[12.5px]" />}
            </Field>
            {hasHash && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Network" error={errors.chainId}>
                  {(p) => <GroupedSelect {...p} value={chainId} onValueChange={setChainId} groups={groups} placeholder="Choose a network" />}
                </Field>
                <Field label="Asset sent" error={errors.assetSymbol} hint={ob?.paymentAsset ? `Obligation asset: ${ob.paymentAsset}` : "Defaults to USDC"}>
                  {(p) => <Select {...p} value={asset} onValueChange={setAsset} options={tokens.map((t) => ({ value: t.symbol, label: t.symbol, hint: t.name }))} placeholder="Choose an asset" />}
                </Field>
              </div>
            )}
            {missingRecipient && ob && <RecipientFix obligation={ob} chainId={chainId} canEdit={canEditObligation} />}
          </div>
        )}

        <Field label="Note" optional error={errors.note} hint="Visible to your team and in Activity.">
          {(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} placeholder={status === "skipped" ? "Why it won't be paid" : "Invoice reference, payer, anything reviewers should know"} />}
        </Field>

        {problem && (
          <Callout tone="danger" title={problem.title}>
            {problem.body}
          </Callout>
        )}
      </form>
    </Sheet>
  );
}

function describe(err: unknown, ctx: { chainName: string; asset: string; decimals: number | undefined; obligationId: string | null }): Problem {
  if (!(err instanceof ApiError)) return { title: "Nothing was recorded", body: (err as Error)?.message ?? "Unknown error" };
  const reason = (err.details as { reason?: string } | undefined)?.reason;
  const obligationLink = ctx.obligationId ? (
    <Link href={`/app/obligations/${ctx.obligationId}`} className="font-medium text-accent hover:underline">
      Open the obligation
    </Link>
  ) : null;
  switch (err.code) {
    case "transfer_not_found":
      return { field: "txHash", title: `Transaction not found on ${ctx.chainName}`, body: "Check that the hash is complete and that you chose the network it was sent on. Nothing was recorded." };
    case "transfer_reverted":
      return { field: "txHash", title: "That transaction reverted", body: "A reverted transaction moves no funds, so it can't settle this payment. Nothing was recorded." };
    case "transfer_mismatch":
      return {
        field: "txHash",
        title: "The transaction doesn't match this payment",
        body: (
          <>
            <span className="block">{reason ? `TokenIQ found: ${humanizeReason(reason, ctx.decimals, ctx.asset)}.` : err.message}</span>
            <span className="mt-1 block">Check the asset ({ctx.asset}), the recipient on the obligation and the amount. Nothing was recorded.</span>
          </>
        ),
      };
    case "no_recipient":
      return { title: "The obligation has no recipient address", body: <>Add the recipient so TokenIQ can check the transfer, or clear the hash to mark it paid without verification. {obligationLink}</> };
    case "already_settled":
      return { title: "Already recorded", body: `${err.message} The list has been refreshed.` };
    case "no_such_occurrence":
      return { title: "That due date no longer exists", body: `${err.message} The obligation's schedule may have changed; pick the occurrence again.` };
    case "unsupported_asset":
      return { field: "assetSymbol", title: "Asset not supported for verification", body: err.message };
    case "chain_unavailable":
      return { field: "chainId", title: `Can't reach ${ctx.chainName}`, body: `${err.message} Try again shortly, or record without a hash.` };
    default:
      if (err.status === 403) return { title: "Your role can't record payments", body: "Owners, admins and finance members can record payments. Nothing was recorded." };
      return { title: "Nothing was recorded", body: err.message };
  }
}

/** Inline fix when the obligation lacks a recipient address (PATCH /obligations/{id}). */
function RecipientFix({ obligation, chainId, canEdit }: { obligation: ObligationDto; chainId: string; canEdit: boolean }) {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const [addr, setAddr] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => api<ObligationDto>(orgPath(orgId, `/obligations/${obligation.id}`), { method: "PATCH", body: { recipientAddress: getAddress(addr.trim()), recipientChainId: chainId ? Number(chainId) : null } }),
    onSuccess: () => invalidatePayments(qc, orgId),
    onError: (e) => setErr(e instanceof ApiError && e.status === 403 ? "Your role can't edit obligations." : e.message),
  });
  return (
    <div className="rounded-[var(--radius-control)] border border-warning/35 bg-warning-subtle/40 p-3">
      <div className="flex gap-2 text-[13px]">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text">This obligation has no recipient address</p>
          <p className="mt-0.5 text-text-2">TokenIQ needs it to check a transaction. You can still mark it paid without a hash.</p>
          {canEdit ? (
            <div className="mt-2 space-y-2">
              <AddressInput value={addr} onChange={setAddr} aria-label="Recipient address" placeholder="Recipient 0x…" />
              <Button
                size="sm"
                variant="secondary"
                loading={save.isPending}
                disabled={!isValidAddress(addr)}
                onClick={() => {
                  setErr(null);
                  save.mutate();
                }}
              >
                Save recipient on the obligation
              </Button>
              {err && <p className="text-xs font-medium text-danger" role="alert">{err}</p>}
            </div>
          ) : (
            <p className="mt-1 text-xs text-text-3">
              Ask a finance member to add it on{" "}
              <Link href={`/app/obligations/${obligation.id}`} className="font-medium text-accent hover:underline">
                the obligation
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
