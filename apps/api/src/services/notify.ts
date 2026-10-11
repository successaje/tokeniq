import type { Alert } from "@tokeniq/core";
import { and, eq, inArray, schema } from "@tokeniq/db";
import type { Deps } from "../context.js";

/**
 * In-app notifications for every member; email only for critical alerts and
 * only to roles that can act. De-duplicated per user by alert fingerprint.
 */
export async function notifyNewAlerts(deps: Deps, orgId: string, alerts: Alert[]) {
  const members = await deps.db
    .select({ userId: schema.members.userId, role: schema.members.role, email: schema.users.email })
    .from(schema.members)
    .innerJoin(schema.users, eq(schema.users.id, schema.members.userId))
    .where(eq(schema.members.organizationId, orgId));
  // Emails are read outside the app, where the active organization may be another one: name it in the link.
  const link = `${deps.env.APP_URL}/app/risk?org=${encodeURIComponent(orgId)}`;
  for (const a of alerts) {
    if (a.severity === "info") continue;
    for (const m of members) {
      const inserted = await deps.db
        .insert(schema.notifications)
        .values({ organizationId: orgId, userId: m.userId, kind: `alert.${a.kind}`, title: a.title, body: a.condition, link: `/app/risk`, dedupeKey: `alert:${a.fingerprint}` })
        .onConflictDoNothing()
        .returning({ id: schema.notifications.id });
      if (inserted.length && a.severity === "critical" && ["owner", "admin", "finance"].includes(m.role) && !m.email.endsWith(".invalid")) {
        await deps.mailer
          .send({ to: m.email, subject: `TokenIQ alert: ${a.title}`, text: `${a.condition}\n\nRecommended: ${a.recommendedAction}\n\nOpen TokenIQ: ${link}` })
          .catch((err) => deps.logger.warn({ err }, "alert email failed"));
      }
    }
  }
}

/** Notify specific roles about a proposal event (in-app, de-duplicated). */
export async function notifyRoles(deps: Deps, orgId: string, roles: string[], n: { kind: string; title: string; body: string; link: string; dedupeKey: string }, excludeUserId?: string) {
  const members = await deps.db
    .select({ userId: schema.members.userId })
    .from(schema.members)
    .where(and(eq(schema.members.organizationId, orgId), inArray(schema.members.role, roles)));
  for (const m of members) {
    if (m.userId === excludeUserId) continue;
    await deps.db
      .insert(schema.notifications)
      .values({ organizationId: orgId, userId: m.userId, ...n, dedupeKey: `${n.dedupeKey}:${m.userId}` })
      .onConflictDoNothing();
  }
}
