import { parseDecimal, type Wad } from "./money";
import type { ApprovalPolicy, ApprovalTier } from "./policy";

export type MemberRole = "owner" | "admin" | "finance" | "approver" | "viewer";

export interface ApprovalRecord {
  memberId: string;
  role: MemberRole;
  decision: "approve" | "reject";
  at: number;
}

export type InternalApprovalState = "pending" | "approved" | "rejected" | "expired" | "cancelled";

export interface ApprovalEvaluation {
  state: InternalApprovalState;
  tier: ApprovalTier;
  requiredApprovals: number;
  approvals: number;
  remaining: number;
  roleRequirementMet: boolean;
  expiresAt: number;
  /** Human-readable explanation of what is still needed. */
  needs: string;
}

/** Roles that may approve proposals at all. Viewers never can. */
export const APPROVER_ROLES: MemberRole[] = ["owner", "admin", "finance", "approver"];

/** Pick the tier for an amount: the first tier whose upper bound covers it. */
export function tierFor(policy: ApprovalPolicy, amountUsd: Wad): ApprovalTier {
  const sorted = [...policy.tiers].sort((a, b) => {
    if (a.upToUsd === null) return 1;
    if (b.upToUsd === null) return -1;
    const da = parseDecimal(a.upToUsd);
    const db = parseDecimal(b.upToUsd);
    return da < db ? -1 : da > db ? 1 : 0;
  });
  for (const tier of sorted) {
    if (tier.upToUsd === null || amountUsd <= parseDecimal(tier.upToUsd)) return tier;
  }
  // Policies always end with an unbounded tier; fall back to the strictest one.
  return sorted[sorted.length - 1]!;
}

/**
 * Evaluate internal approvals for a proposal. Internal approval is a decision
 * record inside TokenIQ; it never replaces the Safe signatures that authorize
 * the on-chain transaction.
 */
export function evaluateApprovals(input: {
  policy: ApprovalPolicy;
  amountUsd: Wad;
  proposerId: string;
  createdAt: number;
  nowSec: number;
  records: ApprovalRecord[];
  cancelled?: boolean;
  /** The deadline fixed when the proposal was created. Defaults to createdAt + the policy's TTL. */
  expiresAt?: number;
  /**
   * Current members and roles. When given, decisions from people who have left stop counting, and an
   * approval satisfies a role requirement only if both the role at the time and the current role do.
   */
  currentRoles?: ReadonlyMap<string, MemberRole>;
}): ApprovalEvaluation {
  const tier = tierFor(input.policy, input.amountUsd);
  const expiresAt = input.expiresAt ?? input.createdAt + input.policy.proposalTtlHours * 3600;
  const current = input.currentRoles;
  // Latest decision per member wins; ineligible decisions are ignored.
  const latest = new Map<string, ApprovalRecord>();
  for (const r of [...input.records].sort((a, b) => a.at - b.at)) {
    if (r.at >= expiresAt) continue;
    if (!APPROVER_ROLES.includes(r.role)) continue;
    if (current && !APPROVER_ROLES.includes(current.get(r.memberId) ?? "viewer")) continue;
    if (!input.policy.allowSelfApproval && r.memberId === input.proposerId) continue;
    latest.set(r.memberId, r);
  }
  const decisions = [...latest.values()];
  const approvals = decisions.filter((d) => d.decision === "approve");
  const rejected = decisions.some((d) => d.decision === "reject");
  const roleRequirementMet =
    tier.requiredRole === null || approvals.some((a) => roleSatisfies(a.role, tier.requiredRole!) && (!current || roleSatisfies(current.get(a.memberId)!, tier.requiredRole!)));
  const remaining = Math.max(0, tier.requiredApprovals - approvals.length);

  let state: InternalApprovalState;
  if (input.cancelled) state = "cancelled";
  else if (rejected) state = "rejected";
  else if (remaining === 0 && roleRequirementMet) state = "approved";
  else if (input.nowSec >= expiresAt) state = "expired";
  else state = "pending";

  const parts: string[] = [];
  if (remaining > 0) parts.push(`${remaining} more approval${remaining === 1 ? "" : "s"}`);
  if (!roleRequirementMet) parts.push(`an approval from a member with the ${tier.requiredRole} role`);
  const needs =
    state === "approved"
      ? "Internal approval complete. Safe signers must still sign the transaction."
      : state === "rejected"
        ? "Rejected by an approver."
        : state === "expired"
          ? "Expired before it was fully approved."
          : state === "cancelled"
            ? "Cancelled."
            : `Needs ${parts.join(" and ")}${input.policy.allowSelfApproval ? "" : " (the proposer cannot approve their own proposal)"}.`;

  return { state, tier, requiredApprovals: tier.requiredApprovals, approvals: approvals.length, remaining, roleRequirementMet, expiresAt, needs };
}

/**
 * Evaluate against several approval policies (typically the one in force when the proposal was created
 * and the current one) and return the least satisfied result. Loosening a policy therefore never speeds
 * up a proposal already in flight; tightening it applies immediately.
 */
export function evaluateApprovalsStrictest(policies: ApprovalPolicy[], input: Omit<Parameters<typeof evaluateApprovals>[0], "policy">): ApprovalEvaluation {
  const rank = (e: ApprovalEvaluation) => ({ cancelled: 0, rejected: 1, expired: 2, pending: 3, approved: 4 })[e.state];
  const evals = policies.map((policy) => evaluateApprovals({ ...input, policy }));
  return evals.sort((a, b) => rank(a) - rank(b) || b.remaining - a.remaining || Number(a.roleRequirementMet) - Number(b.roleRequirementMet))[0]!;
}

/** Owners satisfy any role requirement; admins satisfy admin/finance/approver; otherwise exact match. */
export function roleSatisfies(role: MemberRole, required: Exclude<MemberRole, "viewer">): boolean {
  if (role === required) return true;
  if (role === "owner") return true;
  if (role === "admin") return required !== "owner";
  return false;
}

export function canApprove(input: { role: MemberRole; memberId: string; proposerId: string; policy: ApprovalPolicy }): { allowed: boolean; reason: string } {
  if (!APPROVER_ROLES.includes(input.role)) return { allowed: false, reason: "Viewers cannot approve proposals" };
  if (!input.policy.allowSelfApproval && input.memberId === input.proposerId) return { allowed: false, reason: "You proposed this action, and policy requires a different approver" };
  return { allowed: true, reason: "You can approve or reject this proposal" };
}
