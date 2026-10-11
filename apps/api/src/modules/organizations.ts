import { createRoute, z } from "@hono/zod-openapi";
import { DEFAULT_APPROVAL_POLICY, DEFAULT_TREASURY_POLICY, POLICY_PRESETS, type MemberRole } from "@tokeniq/core";
import { and, asc, count, eq, gt, schema, sql } from "@tokeniq/db";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan, canAssignRole, isRole, ROLES } from "../lib/authz.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { body, clientInfo, errors, Id, json, orgParams, requireUser } from "../lib/route.js";
import { writePolicy } from "../services/policies.js";

const tags = ["Organizations"];
const RoleEnum = z.enum(ROLES as [MemberRole, ...MemberRole[]]);
const ONBOARDING_STEPS = ["organization", "treasury", "obligations", "policy"] as const;

const OrgSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    role: RoleEnum,
    purpose: z.string().nullable(),
    reportingCurrency: z.string(),
    isSample: z.boolean(),
    onboardingSteps: z.array(z.string()),
    onboardingCompletedAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("Organization");

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "org"}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function createOrganization(deps: Deps, input: { userId: string; name: string; purpose: string | null; isSample?: boolean; preset?: keyof typeof POLICY_PRESETS }, info: { ip: string | null; userAgent: string | null }) {
  const orgId = crypto.randomUUID();
  await deps.db.transaction(async (tx) => {
    await tx.insert(schema.organizations).values({ id: orgId, name: input.name, slug: slugify(input.name) });
    await tx.insert(schema.members).values({ id: crypto.randomUUID(), organizationId: orgId, userId: input.userId, role: "owner" });
    await tx.insert(schema.orgProfiles).values({ organizationId: orgId, purpose: input.purpose, isSample: input.isSample ?? false, onboardingSteps: ["organization"] });
    const treasuryPolicy = input.preset ? POLICY_PRESETS[input.preset].policy : DEFAULT_TREASURY_POLICY;
    await writePolicy(tx, { orgId, kind: "treasury", body: treasuryPolicy, reason: "Initial policy", userId: input.userId });
    await writePolicy(tx, { orgId, kind: "approval", body: DEFAULT_APPROVAL_POLICY, reason: "Initial policy", userId: input.userId });
    await audit(tx, { organizationId: orgId, actorUserId: input.userId, action: "organization.created", targetType: "organization", targetId: orgId, data: { name: input.name, isSample: !!input.isSample }, ...info });
  });
  return orgId;
}

async function loadOrg(deps: Deps, orgId: string, role: MemberRole) {
  const [row] = await deps.db
    .select({ org: schema.organizations, profile: schema.orgProfiles })
    .from(schema.organizations)
    .leftJoin(schema.orgProfiles, eq(schema.orgProfiles.organizationId, schema.organizations.id))
    .where(eq(schema.organizations.id, orgId))
    .limit(1);
  if (!row) throw notFound("Organization");
  return {
    id: row.org.id,
    name: row.org.name,
    slug: row.org.slug,
    role,
    purpose: row.profile?.purpose ?? null,
    reportingCurrency: row.profile?.reportingCurrency ?? "USD",
    isSample: row.profile?.isSample ?? false,
    onboardingSteps: row.profile?.onboardingSteps ?? [],
    onboardingCompletedAt: row.profile?.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: row.org.createdAt.toISOString(),
  };
}

/**
 * Owners of the organization, row-locked for the rest of the transaction. Concurrent demotions or
 * removals of owners serialize on these locks, so two owners cannot remove each other at the same time
 * and leave the organization without an owner.
 */
async function lockOwners(tx: Pick<Deps["db"], "select">, orgId: string) {
  return tx
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(and(eq(schema.members.organizationId, orgId), eq(schema.members.role, "owner")))
    .for("update");
}

export function registerOrganizations(app: App, deps: Deps) {
  const { db } = deps;

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/me",
      tags,
      summary: "Current user, memberships and sign-in methods",
      responses: {
        200: json(
          z.object({
            user: z.object({ id: z.string(), email: z.string(), name: z.string(), emailVerified: z.boolean(), hasRealEmail: z.boolean() }),
            organizations: z.array(OrgSchema),
            passkeys: z.number(),
            wallets: z.array(z.object({ address: z.string(), chainId: z.number() })),
          }),
        ),
        ...errors,
      },
    }),
    async (c) => {
      const user = requireUser(c);
      const memberships = await db
        .select({ orgId: schema.members.organizationId, role: schema.members.role })
        .from(schema.members)
        .where(eq(schema.members.userId, user.id))
        .orderBy(asc(schema.members.createdAt));
      const organizations = [];
      for (const m of memberships) if (isRole(m.role)) organizations.push(await loadOrg(deps, m.orgId, m.role));
      const [pk] = await db.select({ n: count() }).from(schema.passkeys).where(eq(schema.passkeys.userId, user.id));
      const wallets = await db.select({ address: schema.walletAddresses.address, chainId: schema.walletAddresses.chainId }).from(schema.walletAddresses).where(eq(schema.walletAddresses.userId, user.id));
      return c.json({ user: { ...user, hasRealEmail: !user.email.endsWith("@wallet.tokeniq.invalid") }, organizations, passkeys: Number(pk?.n ?? 0), wallets }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "patch",
      path: "/api/v1/me",
      tags,
      summary: "Update your display name",
      request: body(z.object({ name: z.string().trim().min(1).max(80) })),
      responses: { 200: json(z.object({ ok: z.boolean() })), ...errors },
    }),
    async (c) => {
      const user = requireUser(c);
      const { name } = c.req.valid("json");
      await db.update(schema.users).set({ name }).where(eq(schema.users.id, user.id));
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs",
      tags,
      summary: "Create an organization (you become its owner)",
      request: body(
        z.object({
          name: z.string().trim().min(2).max(80),
          purpose: z.string().trim().max(280).nullable().default(null),
          preset: z.enum(["conservative", "balanced", "growth"]).default("balanced"),
        }),
      ),
      responses: { 201: json(OrgSchema), ...errors },
    }),
    async (c) => {
      const user = requireUser(c);
      const input = c.req.valid("json");
      const orgId = await createOrganization(deps, { userId: user.id, name: input.name, purpose: input.purpose, preset: input.preset }, clientInfo(c));
      return c.json(await loadOrg(deps, orgId, "owner"), 201);
    },
  );

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/orgs/{orgId}", tags, summary: "Organization details", request: { params: orgParams }, responses: { 200: json(OrgSchema), ...errors } }),
    async (c) => {
      const m = c.get("member");
      return c.json(await loadOrg(deps, m.organizationId, m.role), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "patch",
      path: "/api/v1/orgs/{orgId}",
      tags,
      summary: "Update organization name or purpose",
      request: { params: orgParams, ...body(z.object({ name: z.string().trim().min(2).max(80).optional(), purpose: z.string().trim().max(280).nullable().optional() })) },
      responses: { 200: json(OrgSchema), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      assertCan(m.role, "org.manage");
      const user = requireUser(c);
      const input = c.req.valid("json");
      await db.transaction(async (tx) => {
        if (input.name) await tx.update(schema.organizations).set({ name: input.name }).where(eq(schema.organizations.id, m.organizationId));
        if (input.purpose !== undefined) await tx.update(schema.orgProfiles).set({ purpose: input.purpose }).where(eq(schema.orgProfiles.organizationId, m.organizationId));
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "organization.updated", targetType: "organization", targetId: m.organizationId, data: input, ...clientInfo(c) });
      });
      return c.json(await loadOrg(deps, m.organizationId, m.role), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/onboarding",
      tags,
      summary: "Record onboarding progress so people can leave and return",
      request: { params: orgParams, ...body(z.object({ step: z.enum(ONBOARDING_STEPS).optional(), complete: z.boolean().optional() })) },
      responses: { 200: json(OrgSchema), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const { step, complete } = c.req.valid("json");
      if (step) {
        await db
          .update(schema.orgProfiles)
          .set({ onboardingSteps: sql`(select array_agg(distinct s) from unnest(array_append(${schema.orgProfiles.onboardingSteps}, ${step})) s)` })
          .where(eq(schema.orgProfiles.organizationId, m.organizationId));
      }
      if (complete) {
        await db.update(schema.orgProfiles).set({ onboardingCompletedAt: deps.now() }).where(eq(schema.orgProfiles.organizationId, m.organizationId));
        await audit(db, { organizationId: m.organizationId, actorUserId: user.id, action: "onboarding.completed", ...clientInfo(c) });
      }
      return c.json(await loadOrg(deps, m.organizationId, m.role), 200);
    },
  );

  // --- Members --------------------------------------------------------------

  const MemberSchema = z.object({ id: z.string(), userId: z.string(), name: z.string(), email: z.string(), role: RoleEnum, joinedAt: z.string(), isYou: z.boolean() }).openapi("Member");

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/orgs/{orgId}/members", tags, summary: "List members", request: { params: orgParams }, responses: { 200: json(z.object({ members: z.array(MemberSchema) })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const rows = await db
        .select({ id: schema.members.id, userId: schema.members.userId, role: schema.members.role, createdAt: schema.members.createdAt, name: schema.users.name, email: schema.users.email })
        .from(schema.members)
        .innerJoin(schema.users, eq(schema.users.id, schema.members.userId))
        .where(eq(schema.members.organizationId, m.organizationId))
        .orderBy(asc(schema.members.createdAt));
      return c.json(
        { members: rows.filter((r) => isRole(r.role)).map((r) => ({ id: r.id, userId: r.userId, name: r.name, email: r.email, role: r.role as MemberRole, joinedAt: r.createdAt.toISOString(), isYou: r.userId === user.id })) },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "patch",
      path: "/api/v1/orgs/{orgId}/members/{memberId}",
      tags,
      summary: "Change a member's role",
      request: { params: orgParams.extend({ memberId: Id }), ...body(z.object({ role: RoleEnum })) },
      responses: { 200: json(z.object({ ok: z.boolean() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "members.manage");
      const { memberId } = c.req.valid("param");
      const { role } = c.req.valid("json");
      const [target] = await db.select().from(schema.members).where(and(eq(schema.members.id, memberId), eq(schema.members.organizationId, m.organizationId))).limit(1);
      if (!target || !isRole(target.role)) throw notFound("Member");
      if (!canAssignRole(m.role, role) || !canAssignRole(m.role, target.role)) throw forbidden("Only owners can grant or change the owner role");
      await db.transaction(async (tx) => {
        if (target.role === "owner" && role !== "owner" && (await lockOwners(tx, m.organizationId)).length <= 1)
          throw conflict("last_owner", "An organization must keep at least one owner");
        await tx.update(schema.members).set({ role }).where(eq(schema.members.id, memberId));
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "member.role_changed", targetType: "member", targetId: memberId, data: { from: target.role, to: role }, ...clientInfo(c) });
      });
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/api/v1/orgs/{orgId}/members/{memberId}",
      tags,
      summary: "Remove a member (or leave the organization)",
      request: { params: orgParams.extend({ memberId: Id }) },
      responses: { 200: json(z.object({ ok: z.boolean() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const { memberId } = c.req.valid("param");
      const [target] = await db.select().from(schema.members).where(and(eq(schema.members.id, memberId), eq(schema.members.organizationId, m.organizationId))).limit(1);
      if (!target || !isRole(target.role)) throw notFound("Member");
      const self = target.userId === user.id;
      if (!self) {
        assertCan(m.role, "members.manage");
        if (!canAssignRole(m.role, target.role)) throw forbidden("Only owners can remove an owner");
      }
      await db.transaction(async (tx) => {
        if (target.role === "owner" && (await lockOwners(tx, m.organizationId)).length <= 1)
          throw conflict("last_owner", "An organization must keep at least one owner. Transfer ownership first.");
        await tx.delete(schema.members).where(eq(schema.members.id, memberId));
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: self ? "member.left" : "member.removed", targetType: "member", targetId: memberId, data: { userId: target.userId, role: target.role }, ...clientInfo(c) });
      });
      return c.json({ ok: true }, 200);
    },
  );

  // --- Invitations ------------------------------------------------------------

  const InvitationSchema = z.object({ id: z.string(), email: z.string(), role: RoleEnum, status: z.string(), expiresAt: z.string(), createdAt: z.string() }).openapi("Invitation");

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/orgs/{orgId}/invitations", tags, summary: "Pending invitations", request: { params: orgParams }, responses: { 200: json(z.object({ invitations: z.array(InvitationSchema) })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const rows = await db
        .select()
        .from(schema.invitations)
        .where(and(eq(schema.invitations.organizationId, m.organizationId), eq(schema.invitations.status, "pending"), gt(schema.invitations.expiresAt, deps.now())));
      return c.json({ invitations: rows.map((r) => ({ id: r.id, email: r.email, role: (isRole(r.role ?? "") ? r.role : "viewer") as MemberRole, status: r.status, expiresAt: r.expiresAt.toISOString(), createdAt: r.createdAt.toISOString() })) }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/invitations",
      tags,
      summary: "Invite someone by email",
      request: { params: orgParams, ...body(z.object({ email: z.email().max(254), role: RoleEnum })) },
      responses: { 201: json(InvitationSchema), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "members.manage");
      const { email, role } = c.req.valid("json");
      if (!canAssignRole(m.role, role)) throw forbidden("Only owners can invite owners");
      const existing = await db
        .select({ id: schema.members.id })
        .from(schema.members)
        .innerJoin(schema.users, eq(schema.users.id, schema.members.userId))
        .where(and(eq(schema.members.organizationId, m.organizationId), sql`lower(${schema.users.email}) = lower(${email})`))
        .limit(1);
      if (existing.length) throw conflict("already_member", "That person is already a member");
      const id = crypto.randomUUID();
      const expiresAt = new Date(deps.now().getTime() + 7 * 24 * 3600 * 1000);
      const [org] = await db.select({ name: schema.organizations.name }).from(schema.organizations).where(eq(schema.organizations.id, m.organizationId));
      await db.transaction(async (tx) => {
        await tx
          .update(schema.invitations)
          .set({ status: "superseded" })
          .where(and(eq(schema.invitations.organizationId, m.organizationId), sql`lower(${schema.invitations.email}) = lower(${email})`, eq(schema.invitations.status, "pending")));
        await tx.insert(schema.invitations).values({ id, organizationId: m.organizationId, email, role, status: "pending", expiresAt, inviterId: user.id });
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "invitation.created", targetType: "invitation", targetId: id, data: { email, role }, ...clientInfo(c) });
      });
      await deps.mailer
        .send({
          to: email,
          subject: `${user.name || user.email} invited you to ${org?.name ?? "an organization"} on TokenIQ`,
          text: `You have been invited to join ${org?.name} on TokenIQ as ${role}.\n\nAccept the invitation: ${deps.env.APP_URL}/invite/${id}\n\nThe invitation expires on ${expiresAt.toUTCString()}. Sign in with this email address (${email}) to accept it.`,
        })
        .catch((err) => deps.logger.warn({ err }, "invitation email failed"));
      return c.json({ id, email, role, status: "pending", expiresAt: expiresAt.toISOString(), createdAt: deps.now().toISOString() }, 201);
    },
  );

  app.openapi(
    createRoute({ method: "delete", path: "/api/v1/orgs/{orgId}/invitations/{invitationId}", tags, summary: "Revoke an invitation", request: { params: orgParams.extend({ invitationId: Id }) }, responses: { 200: json(z.object({ ok: z.boolean() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "members.manage");
      const { invitationId } = c.req.valid("param");
      const res = await db
        .update(schema.invitations)
        .set({ status: "revoked" })
        .where(and(eq(schema.invitations.id, invitationId), eq(schema.invitations.organizationId, m.organizationId), eq(schema.invitations.status, "pending")))
        .returning({ id: schema.invitations.id });
      if (!res.length) throw notFound("Invitation");
      await audit(db, { organizationId: m.organizationId, actorUserId: user.id, action: "invitation.revoked", targetType: "invitation", targetId: invitationId, ...clientInfo(c) });
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/invitations/{invitationId}",
      tags,
      summary: "View an invitation addressed to you",
      request: { params: z.object({ invitationId: Id }) },
      responses: { 200: json(z.object({ id: z.string(), organizationName: z.string(), role: RoleEnum, inviterName: z.string(), email: z.string(), status: z.string(), expiresAt: z.string(), emailMatches: z.boolean() })), ...errors },
    }),
    async (c) => {
      const user = requireUser(c);
      const { invitationId } = c.req.valid("param");
      const [row] = await db
        .select({ inv: schema.invitations, orgName: schema.organizations.name, inviterName: schema.users.name })
        .from(schema.invitations)
        .innerJoin(schema.organizations, eq(schema.organizations.id, schema.invitations.organizationId))
        .innerJoin(schema.users, eq(schema.users.id, schema.invitations.inviterId))
        .where(eq(schema.invitations.id, invitationId))
        .limit(1);
      if (!row) throw notFound("Invitation");
      const emailMatches = row.inv.email.toLowerCase() === user.email.toLowerCase();
      // Only the addressee learns the organization name.
      if (!emailMatches) throw notFound("Invitation");
      const expired = row.inv.expiresAt <= deps.now();
      return c.json(
        {
          id: row.inv.id,
          organizationName: row.orgName,
          role: (isRole(row.inv.role ?? "") ? row.inv.role : "viewer") as MemberRole,
          inviterName: row.inviterName,
          email: row.inv.email,
          status: expired && row.inv.status === "pending" ? "expired" : row.inv.status,
          expiresAt: row.inv.expiresAt.toISOString(),
          emailMatches,
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/invitations/{invitationId}/accept",
      tags,
      summary: "Accept an invitation",
      request: { params: z.object({ invitationId: Id }) },
      responses: { 200: json(z.object({ organizationId: z.string() })), ...errors },
    }),
    async (c) => {
      const user = requireUser(c);
      const { invitationId } = c.req.valid("param");
      const [inv] = await db.select().from(schema.invitations).where(eq(schema.invitations.id, invitationId)).limit(1);
      if (!inv || inv.email.toLowerCase() !== user.email.toLowerCase()) throw notFound("Invitation");
      if (inv.status !== "pending") throw conflict("invitation_not_pending", `This invitation is ${inv.status}`);
      if (inv.expiresAt <= deps.now()) throw conflict("invitation_expired", "This invitation has expired. Ask for a new one.");
      if (!user.emailVerified) throw badRequest("email_unverified", "Verify your email address before accepting invitations");
      const role = isRole(inv.role ?? "") ? (inv.role as MemberRole) : "viewer";
      await db.transaction(async (tx) => {
        await tx.insert(schema.members).values({ id: crypto.randomUUID(), organizationId: inv.organizationId, userId: user.id, role }).onConflictDoNothing();
        await tx.update(schema.invitations).set({ status: "accepted" }).where(eq(schema.invitations.id, inv.id));
        await audit(tx, { organizationId: inv.organizationId, actorUserId: user.id, action: "invitation.accepted", targetType: "invitation", targetId: inv.id, data: { role }, ...clientInfo(c) });
      });
      return c.json({ organizationId: inv.organizationId }, 200);
    },
  );
}
