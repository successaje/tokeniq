import { schema, type Database } from "@tokeniq/db";

export interface AuditInput {
  organizationId: string | null;
  actorUserId: string | null;
  actorType?: "user" | "system" | "copilot";
  action: string;
  targetType?: string;
  targetId?: string;
  data?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

type Tx = Pick<Database, "insert">;

/** Record an audit event. Pass the transaction handle so the event commits atomically with the change. */
export async function audit(db: Tx, e: AuditInput) {
  await db.insert(schema.auditEvents).values({
    organizationId: e.organizationId,
    actorUserId: e.actorUserId,
    actorType: e.actorType ?? (e.actorUserId ? "user" : "system"),
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    data: e.data ?? null,
    ip: e.ip ?? null,
    userAgent: e.userAgent ?? null,
  });
}
