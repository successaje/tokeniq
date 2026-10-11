import type { MemberRole } from "@tokeniq/core";
import { forbidden } from "./errors.js";

export const ROLES: MemberRole[] = ["owner", "admin", "finance", "approver", "viewer"];

/**
 * Server-side permission matrix. Every organization route declares the
 * permission it needs; the UI may hide controls, but this is the boundary.
 * Copilot tools run with the requesting member's role and are all read-only.
 */
export const PERMISSIONS = {
  "org.read": ["owner", "admin", "finance", "approver", "viewer"],
  // Organization details and onboarding progress.
  "org.manage": ["owner", "admin"],
  // Members, roles and invitations (including reading pending invitations: invitee emails and roles).
  "members.manage": ["owner", "admin"],
  "accounts.manage": ["owner", "admin", "finance"],
  // Manual "sync now": anyone who can see balances, rate-limited per account in the route.
  "accounts.sync": ["owner", "admin", "finance", "approver", "viewer"],
  "accounts.verify": ["owner", "admin", "finance", "approver"],
  "obligations.write": ["owner", "admin", "finance"],
  "payments.record": ["owner", "admin", "finance"],
  "policy.write": ["owner", "admin"],
  "recommendations.manage": ["owner", "admin", "finance"],
  "proposals.create": ["owner", "admin", "finance"],
  "proposals.approve": ["owner", "admin", "finance", "approver"],
  "proposals.sign": ["owner", "admin", "finance", "approver"],
  "proposals.execute": ["owner", "admin", "finance", "approver"],
  "alerts.manage": ["owner", "admin", "finance", "approver"],
  "reports.export": ["owner", "admin", "finance", "approver", "viewer"],
  "copilot.use": ["owner", "admin", "finance", "approver", "viewer"],
} as const satisfies Record<string, readonly MemberRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function isRole(value: string): value is MemberRole {
  return (ROLES as string[]).includes(value);
}

export function can(role: MemberRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly MemberRole[]).includes(role);
}

export function assertCan(role: MemberRole, permission: Permission) {
  if (!can(role, permission)) throw forbidden(`Your role (${role}) cannot perform this action`);
}

/** Roles a member may assign: owners can assign any role; admins any role except owner. */
export function canAssignRole(actor: MemberRole, target: MemberRole): boolean {
  if (actor === "owner") return true;
  if (actor === "admin") return target !== "owner";
  return false;
}
