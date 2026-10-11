"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Callout } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, fieldErrors, orgPath } from "@/lib/api";
import { shortAddress } from "@/lib/format";
import type { AccountPurpose, TreasuryAccountDto } from "@/lib/types";
import { PURPOSES } from "./labels";

export function EditAccountSheet({ open, onOpenChange, orgId, account }: { open: boolean; onOpenChange: (v: boolean) => void; orgId: string; account: TreasuryAccountDto | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const switchId = useId();
  const [label, setLabel] = useState("");
  const [purpose, setPurpose] = useState<AccountPurpose>("operating");
  const [included, setIncluded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && account) {
      setLabel(account.label);
      setPurpose(account.purpose);
      setIncluded(account.includeInTreasury);
      setError(null);
    }
  }, [open, account]);

  const save = useMutation({
    mutationFn: (body: Partial<Pick<TreasuryAccountDto, "label" | "purpose" | "includeInTreasury">>) => api<{ account: TreasuryAccountDto }>(orgPath(orgId, `/accounts/${account!.id}`), { method: "PATCH", body }),
    onSuccess: ({ account: a }) => {
      qc.invalidateQueries({ queryKey: ["org", orgId, "/accounts"] });
      qc.invalidateQueries({ queryKey: ["org", orgId, "/treasury"] });
      toast({ id: `account-edit-${a.id}`, tone: "success", title: "Account updated", description: a.label });
      onOpenChange(false);
    },
  });
  const server = fieldErrors(save.error);
  const general = save.error && !Object.keys(server).length ? (save.error instanceof ApiError && save.error.status === 403 ? "Your role can't edit accounts. Nothing was changed." : save.error.message) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!label.trim()) return setError("Give the account a name.");
    setError(null);
    const body: Record<string, unknown> = {};
    if (label.trim() !== account.label) body.label = label.trim();
    if (purpose !== account.purpose) body.purpose = purpose;
    if (included !== account.includeInTreasury) body.includeInTreasury = included;
    if (!Object.keys(body).length) return onOpenChange(false);
    save.mutate(body);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit account"
      description={account ? `${account.chain} · ${shortAddress(account.address)}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-account-form" loading={save.isPending} loadingLabel="Saving">
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-account-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Name" error={error ?? server.label}>
          {(p) => <Input {...p} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />}
        </Field>
        <Field label="Purpose" error={server.purpose}>
          {(p) => <Select {...p} value={purpose} onValueChange={setPurpose} options={PURPOSES.map((o) => ({ value: o.value, label: o.label, hint: o.hint }))} />}
        </Field>
        <div className="flex items-start justify-between gap-4 rounded-[var(--radius-control)] border border-hairline p-3">
          <label htmlFor={switchId} className="min-w-0">
            <span className="block text-[13px] font-medium text-text">Count in treasury</span>
            <span className="mt-0.5 block text-xs text-text-2">
              When off, TokenIQ keeps reading the account but leaves it out of totals, reserve and deployable figures. Use it for accounts you track but don&apos;t manage.
            </span>
          </label>
          <Switch id={switchId} checked={included} onCheckedChange={setIncluded} />
        </div>
        {general && <Callout tone="danger">{general}</Callout>}
      </form>
    </Sheet>
  );
}
