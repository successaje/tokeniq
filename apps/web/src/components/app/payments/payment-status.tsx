import { CircleAlert, Hourglass, ShieldCheck, SkipForward } from "lucide-react";
import { StatusBadge } from "@/components/ui/status";
import type { PaymentDto } from "@/lib/types";
import { humanizeReason } from "./amount";

export type PaymentFilter = "all" | "paid_verified" | "paid_unverified" | "skipped";

export const FILTER_OPTIONS: Array<{ value: PaymentFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "paid_verified", label: "Verified" },
  { value: "paid_unverified", label: "Not verified" },
  { value: "skipped", label: "Skipped" },
];

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/**
 * Verified on-chain ≠ marked paid ≠ skipped. Waiting for confirmations is its own
 * wording so nobody reads a pending match as settled.
 */
export function PaymentBadge({ p }: { p: Pick<PaymentDto, "status" | "verification" | "txHash"> }) {
  const v = p.verification;
  if (p.status === "paid_verified") {
    return (
      <StatusBadge tone="success" icon={ShieldCheck}>
        Verified on-chain{v ? ` · ${plural(v.confirmations, "confirmation")}` : ""}
      </StatusBadge>
    );
  }
  if (p.status === "skipped") {
    return (
      <StatusBadge tone="neutral" icon={SkipForward}>
        Skipped
      </StatusBadge>
    );
  }
  if (p.txHash && v?.status === "pending") {
    return (
      <StatusBadge tone="info" icon={Hourglass}>
        Marked paid — {v.confirmations} of {v.requiredConfirmations} confirmations
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="warning" icon={CircleAlert}>
      Marked paid — not verified
    </StatusBadge>
  );
}

/** One line on what TokenIQ checked (or could not check) for this record. */
export function verificationDetail(p: PaymentDto, decimals?: number): string {
  const v = p.verification;
  if (p.status === "skipped") return "Not paid by decision. It no longer counts as owed.";
  if (!p.txHash) return "Recorded by a member without a transaction, so it can't be checked on-chain.";
  if (!v) return "Transaction recorded; not checked yet.";
  const amount = v.amountChecked ? "recipient and amount checked" : "recipient checked (amount not compared: currency differs)";
  switch (v.status) {
    case "verified":
      return `Matched a ${p.assetSymbol ?? "token"} transfer to the recipient · ${amount}.`;
    case "pending":
      return v.reason?.includes("not mined") ? "The transaction isn't mined yet. Re-check once it is." : `Matching transfer found; waiting for ${v.requiredConfirmations} confirmations (${v.confirmations} so far).`;
    case "mismatch":
      return `Last check found no matching transfer: ${v.reason ? humanizeReason(v.reason, decimals, p.assetSymbol) : "unknown reason"}.`;
    case "reverted":
      return "Last check: the transaction reverted, so no payment was made.";
    case "not_found":
      return "Last check: the transaction wasn't found on this network.";
    default:
      return v.reason ?? "";
  }
}
