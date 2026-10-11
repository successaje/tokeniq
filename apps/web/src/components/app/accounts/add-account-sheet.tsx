"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { TreasuryAccountDto } from "@/lib/types";
import { AddAccountForm, AddAccountResult, useAddAccount } from "./add-account-form";

/** Add a Safe or wallet (watch-only), see what was detected and read, then verify. */
export function AddAccountSheet({
  open,
  onOpenChange,
  orgId,
  canVerify,
  onVerify,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgId: string;
  canVerify: boolean;
  onVerify: (account: TreasuryAccountDto) => void;
}) {
  const add = useAddAccount(orgId);
  const result = add.data;

  useEffect(() => {
    if (!open) add.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const verifiable = result && result.account.verificationMethod !== "sample";

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={result ? "Account added" : "Add account"}
      description={result ? undefined : "TokenIQ reads balances from the chain. It never asks for keys and can't move funds."}
      footer={
        result ? (
          <>
            <Button variant="secondary" onClick={() => add.reset()}>
              Add another
            </Button>
            {canVerify && verifiable ? (
              <>
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Verify later
                </Button>
                <Button onClick={() => onVerify(result.account)}>Verify control now</Button>
              </>
            ) : (
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            )}
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-account-form" loading={add.isPending} loadingLabel="Reading the address on-chain">
              {add.isPending ? "Reading on-chain…" : "Add account"}
            </Button>
          </>
        )
      }
    >
      {result ? <AddAccountResult orgId={orgId} result={result} /> : <AddAccountForm id="add-account-form" mutation={add} autoFocus />}
    </Sheet>
  );
}
