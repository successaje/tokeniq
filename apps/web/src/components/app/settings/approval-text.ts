import { usd } from "@/lib/format";
import type { ApprovalTierDto, ApproverRole } from "@/lib/types";

const ROLE_PHRASE: Record<ApproverRole, string> = {
  owner: "an owner",
  admin: "an admin or owner",
  finance: "a finance member, admin or owner",
  approver: "an approver, admin or owner",
};

/** Whole-dollar bounds print without cents; fractional bounds keep them (never rounded away). */
export function boundLabel(v: string): string {
  return /\.\d*[1-9]/.test(v) ? usd(v) : usd(v, { decimals: 0 });
}

/** "2 approvals including an owner" */
export function tierRequirement(t: Pick<ApprovalTierDto, "requiredApprovals" | "requiredRole">): string {
  return `${t.requiredApprovals} approval${t.requiredApprovals === 1 ? "" : "s"}${t.requiredRole ? ` including ${ROLE_PHRASE[t.requiredRole]}` : ""}`;
}

/**
 * Plain-language approval policy, e.g. "Up to $25,000: 1 approval. Up to
 * $250,000: 2 approvals. Above $250,000: 3 approvals including an owner."
 * Tiers are expected in ascending order with the unbounded tier last.
 */
export function describeTiers(tiers: ApprovalTierDto[]): string {
  if (tiers.length === 0) return "No approval tiers.";
  if (tiers.length === 1 && tiers[0]!.upToUsd === null) return `Any amount: ${tierRequirement(tiers[0]!)}.`;
  let lastBound: string | null = null;
  return tiers
    .map((t) => {
      if (t.upToUsd === null) return `Above ${lastBound ? boundLabel(lastBound) : "that"}: ${tierRequirement(t)}.`;
      lastBound = t.upToUsd;
      return `Up to ${boundLabel(t.upToUsd)}: ${tierRequirement(t)}.`;
    })
    .join(" ");
}
