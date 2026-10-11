import { StatusBadge, type Tone } from "@/components/ui/status";
import type { ProposalStatus } from "@/lib/types";

export const PROPOSAL_STATUS: Record<ProposalStatus, { label: string; tone: Tone; description: string }> = {
  pending_approval: { label: "Awaiting approval", tone: "warning", description: "Internal approvers must review this proposal." },
  approved: { label: "Approved internally", tone: "info", description: "Approved inside TokenIQ. The Safe transaction still needs to be prepared and signed by owners." },
  awaiting_signatures: { label: "Collecting signatures", tone: "info", description: "Safe owners sign the prepared transaction in their own wallets." },
  ready_to_execute: { label: "Ready to execute", tone: "accent", description: "Enough owner signatures. Anyone can submit the transaction; it pays gas." },
  submitted: { label: "Submitted on-chain", tone: "info", description: "Submitted. Waiting for the transaction to be mined and confirmed." },
  executed: { label: "Executed", tone: "success", description: "Confirmed on-chain and reconciled with balances." },
  failed: { label: "Execution failed", tone: "danger", description: "The transaction reverted or the Safe reported a failure. No funds moved by the call; gas was spent." },
  rejected: { label: "Rejected", tone: "danger", description: "An approver rejected this proposal." },
  expired: { label: "Expired", tone: "neutral", description: "It was not fully approved before its deadline." },
  cancelled: { label: "Cancelled", tone: "neutral", description: "Cancelled before execution." },
  stale: { label: "Needs re-signing", tone: "warning", description: "Another transaction used this Safe nonce first. Prepare and sign again." },
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const s = PROPOSAL_STATUS[status];
  return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
}
