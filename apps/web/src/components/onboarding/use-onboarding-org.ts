"use client";

import { useEffect, useMemo, useState } from "react";
import { rememberOrg, useMe } from "@/lib/org";
import type { MeDto, OrgDto, Role } from "@/lib/types";

const KEY = "tokeniq-active-org";

/**
 * The organization being set up. Onboarding sits outside the app shell, so it
 * resolves the org itself: the remembered org if it is a real one, otherwise the
 * most recently created non-sample org.
 */
export function pickOnboardingOrg(me: MeDto | undefined, stored: string | null): OrgDto | null {
  if (!me) return null;
  const real = me.organizations.filter((o) => !o.isSample);
  const remembered = real.find((o) => o.id === stored);
  if (remembered) return remembered;
  return [...real].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function useOnboardingOrg() {
  const me = useMe();
  const [stored, setStored] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    try {
      setStored(localStorage.getItem(KEY));
    } catch {
      setStored(null);
    }
  }, []);
  const org = useMemo(() => (stored === undefined ? null : pickOnboardingOrg(me.data, stored)), [me.data, stored]);
  // Remember the org once so /app opens it afterwards; later refetches of /me must not
  // override a deliberate switch (e.g. opening the sample workspace).
  useEffect(() => {
    if (org && org.id !== stored) {
      rememberOrg(org.id);
      setStored(org.id);
    }
  }, [org, stored]);
  return { me, org, resolving: me.isLoading || stored === undefined };
}

/** Mirrors the server permission matrix (lib/org CAN) for hiding controls; the API still enforces it. */
const ROLES: Record<"accounts.manage" | "obligations.write" | "policy.write" | "org.manage", Role[]> = {
  "accounts.manage": ["owner", "admin", "finance"],
  "obligations.write": ["owner", "admin", "finance"],
  "policy.write": ["owner", "admin"],
  "org.manage": ["owner", "admin"],
};

export function can(role: Role, permission: keyof typeof ROLES) {
  return ROLES[permission].includes(role);
}
