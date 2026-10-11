import {
  approvalPolicySchema,
  DEFAULT_APPROVAL_POLICY,
  DEFAULT_TREASURY_POLICY,
  treasuryPolicySchema,
  type ApprovalPolicy,
  type TreasuryPolicy,
} from "@tokeniq/core";
import { and, desc, eq, schema, type Database } from "@tokeniq/db";

export type PolicyKind = "treasury" | "approval";

export interface CurrentPolicies {
  treasury: TreasuryPolicy;
  treasuryVersion: number;
  approval: ApprovalPolicy;
  approvalVersion: number;
}

type Reader = Pick<Database, "select">;

async function latest(db: Reader, orgId: string, kind: PolicyKind) {
  const [row] = await db
    .select()
    .from(schema.policyVersions)
    .where(and(eq(schema.policyVersions.organizationId, orgId), eq(schema.policyVersions.kind, kind)))
    .orderBy(desc(schema.policyVersions.version))
    .limit(1);
  return row;
}

/** Current policies; stored bodies are re-validated so a malformed row can never reach the engine. */
export async function getPolicies(db: Reader, orgId: string): Promise<CurrentPolicies> {
  const [t, a] = await Promise.all([latest(db, orgId, "treasury"), latest(db, orgId, "approval")]);
  const treasury = t ? treasuryPolicySchema.parse({ ...DEFAULT_TREASURY_POLICY, ...(t.body as object) }) : DEFAULT_TREASURY_POLICY;
  const approval = a ? approvalPolicySchema.parse(a.body) : DEFAULT_APPROVAL_POLICY;
  return { treasury, treasuryVersion: t?.version ?? 0, approval, approvalVersion: a?.version ?? 0 };
}

/** Append a new policy version. Versions are never edited (enforced by a database trigger). */
export async function writePolicy(
  db: Pick<Database, "select" | "insert">,
  input: { orgId: string; kind: PolicyKind; body: TreasuryPolicy | ApprovalPolicy; reason: string | null; userId: string | null },
): Promise<number> {
  const prev = await latest(db, input.orgId, input.kind);
  const version = (prev?.version ?? 0) + 1;
  await db.insert(schema.policyVersions).values({
    organizationId: input.orgId,
    kind: input.kind,
    version,
    body: input.body,
    reason: input.reason,
    createdBy: input.userId,
  });
  return version;
}

/** Field-level differences between two policy bodies, for history and audit display. */
export function diffPolicy(before: Record<string, unknown>, after: Record<string, unknown>) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changes: Array<{ field: string; from: any; to: any }> = [];
  for (const k of keys) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changes.push({ field: k, from: before[k] ?? null, to: after[k] ?? null });
  }
  return changes;
}
