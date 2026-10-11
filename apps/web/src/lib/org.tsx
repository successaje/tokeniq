"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, orgPath } from "./api";
import type { MeDto, OrgDto, Role } from "./types";

const KEY = "tokeniq-active-org";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api<MeDto>("/api/v1/me"), staleTime: 60_000 });
}

interface OrgContextValue {
  me: MeDto;
  org: OrgDto;
  orgId: string;
  role: Role;
  switchOrg: (id: string) => void;
}

const Ctx = createContext<OrgContextValue | null>(null);

/**
 * Active organization for /app. Stored per browser; falls back to the first
 * membership. Every query key starts with the org id, so switching never mixes data.
 */
export function OrgProvider({ me, children }: { me: MeDto; children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    try {
      setSelected(localStorage.getItem(KEY));
    } catch {}
  }, []);
  const org = me.organizations.find((o) => o.id === selected) ?? me.organizations[0]!;
  const switchOrg = useCallback((id: string) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {}
    setSelected(id);
  }, []);
  const value = useMemo(() => ({ me, org, orgId: org.id, role: org.role, switchOrg }), [me, org, switchOrg]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrg() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrg must be used inside OrgProvider");
  return ctx;
}

export function rememberOrg(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {}
}

/** GET an organization-scoped endpoint; the key includes the org id and path. */
export function useOrgQuery<T>(path: string, opts: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> = {}) {
  const { orgId } = useOrg();
  return useQuery<T>({ queryKey: ["org", orgId, path], queryFn: ({ signal }) => api<T>(orgPath(orgId, path), { signal }), ...opts });
}

/** Client-side mirror of the server permission matrix, for hiding controls only. The API enforces it. */
const CAN: Record<string, Role[]> = {
  "org.manage": ["owner", "admin"],
  "members.manage": ["owner", "admin"],
  "accounts.manage": ["owner", "admin", "finance"],
  "accounts.verify": ["owner", "admin", "finance", "approver"],
  "obligations.write": ["owner", "admin", "finance"],
  "payments.record": ["owner", "admin", "finance"],
  "policy.write": ["owner", "admin"],
  "recommendations.manage": ["owner", "admin", "finance"],
  "proposals.create": ["owner", "admin", "finance"],
  "proposals.approve": ["owner", "admin", "finance", "approver"],
  "proposals.sign": ["owner", "admin", "finance", "approver"],
  "alerts.manage": ["owner", "admin", "finance", "approver"],
};

export function useCan(permission: keyof typeof CAN) {
  const { role } = useOrg();
  return CAN[permission]!.includes(role);
}

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", finance: "Finance", approver: "Approver", viewer: "Viewer" };
export const ROLE_DESCRIPTION: Record<Role, string> = {
  owner: "Full control, including other owners, policies and members",
  admin: "Manages members, policies, accounts and settings",
  finance: "Records obligations and payments, manages accounts, creates proposals",
  approver: "Reviews and approves proposals, signs as a Safe owner",
  viewer: "Read-only access to the treasury and reports",
};
