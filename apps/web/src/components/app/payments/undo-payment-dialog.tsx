"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, orgPath } from "@/lib/api";
import { dateLabel } from "@/lib/format";
import { useOrg } from "@/lib/org";
import type { PaymentDto } from "@/lib/types";
import { invalidatePayments } from "./record-payment-sheet";

/** Undo a record that isn't verified on-chain. A reason is required and kept in Activity. */
export function UndoPaymentDialog({ payment, onOpenChange }: { payment: PaymentDto | null; onOpenChange: (v: boolean) => void }) {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setReason("");
      setError(null);
    }
  }, [payment]);

  const undo = useMutation({
    mutationFn: (p: PaymentDto) => api<{ ok: boolean }>(orgPath(orgId, `/payments/${p.id}`), { method: "DELETE", body: { reason: reason.trim() } }),
    onSuccess: (_r, p) => {
      invalidatePayments(qc, orgId);
      toast({ id: `undo-${p.id}`, tone: "success", title: "Record undone", description: `${p.title ?? "The payment"} due ${dateLabel(p.dueDate)} counts as owed again.` });
      onOpenChange(false);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "verified_payment") setError("This payment was verified on-chain, so it can't be undone.");
      else if (e instanceof ApiError && e.status === 403) setError("Your role can't change payment records.");
      else setError(e.message);
    },
  });

  const ready = reason.trim().length >= 3;
  const isSkip = payment?.status === "skipped";

  return (
    <Dialog open={!!payment} onOpenChange={onOpenChange}>
      {payment && (
        <DialogContent
          title={isSkip ? "Undo skip?" : "Undo “marked paid”?"}
          description={`${payment.title ?? "Payment"} · due ${dateLabel(payment.dueDate)}`}
          size="sm"
          footer={
            <>
              <DialogClose asChild>
                <Button variant="secondary">Keep record</Button>
              </DialogClose>
              <Button variant="danger" disabled={!ready} loading={undo.isPending} onClick={() => undo.mutate(payment)}>
                Undo record
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-text-2">The due date becomes unpaid again and counts toward the reserve. The undo, who did it and your reason are kept in Activity.</p>
            <Field label="Reason" hint="At least 3 characters, e.g. “Recorded against the wrong month”.">
              {(p) => <Textarea {...p} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} autoFocus />}
            </Field>
            {error && <Callout tone="danger">{error}</Callout>}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
