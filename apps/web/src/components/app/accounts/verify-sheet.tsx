"use client";

import dynamic from "next/dynamic";
import { Sheet } from "@/components/ui/sheet";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import type { TreasuryAccountDto } from "@/lib/types";

// Wallet libraries (wagmi, connectors) load only when someone opens this flow.
const VerifyFlow = dynamic(() => import("./verify-flow").then((m) => m.VerifyFlow), {
  ssr: false,
  loading: () => (
    <LoadingRegion label="Loading wallet connection…" className="space-y-3">
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </LoadingRegion>
  ),
});

export function VerifySheet({ open, onOpenChange, orgId, account, explorerBase }: { open: boolean; onOpenChange: (v: boolean) => void; orgId: string; account: TreasuryAccountDto | null; explorerBase: string | null }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={account ? `Verify control of ${account.label}` : "Verify control"}
      description={account ? `${account.kind === "safe" ? "Safe" : account.kind === "eoa" ? "Wallet" : "Contract"} on ${account.chain}. Until verified, its balance is excluded from reserve maths.` : undefined}
    >
      {open && account && <VerifyFlow orgId={orgId} account={account} explorerBase={explorerBase} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}
