"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";
import { shortAddress } from "@/lib/format";
import type { AccountPurpose, MetaDto, TreasuryAccountDto } from "@/lib/types";

export const PURPOSES: Array<{ value: AccountPurpose; label: string; hint: string }> = [
  { value: "operating", label: "Operating", hint: "Day-to-day payments" },
  { value: "reserve", label: "Reserve", hint: "Held back for runway" },
  { value: "grants", label: "Grants", hint: "Earmarked for grants" },
  { value: "other", label: "Other", hint: "Anything else" },
];

export const PURPOSE_LABEL: Record<AccountPurpose, string> = { operating: "Operating", reserve: "Reserve", grants: "Grants", other: "Other" };

export const purposeLabel = (p: string) => PURPOSE_LABEL[p as AccountPurpose] ?? p;

/** Supported networks and tokens. Same cache key as the rest of the app. */
export function useMeta() {
  return useQuery({ queryKey: ["meta"], queryFn: ({ signal }) => api<MetaDto>("/api/v1/meta", { signal }), staleTime: 60 * 60_000 });
}

/** Network options split into mainnets and testnets for a GroupedSelect. */
export function useNetworkGroups() {
  const meta = useMeta();
  const groups = useMemo(() => {
    const chains = meta.data?.chains ?? [];
    return [
      { label: "Networks", options: chains.filter((c) => !c.testnet).map((c) => ({ value: String(c.id), label: c.name })) },
      { label: "Testnets (no market value)", options: chains.filter((c) => c.testnet).map((c) => ({ value: String(c.id), label: c.name, hint: "Testnet" })) },
    ];
  }, [meta.data]);
  return { meta, groups };
}

/** "1.4.1" → [1, 4, 1]; unknown parts are 0. */
function parseVersion(v: string): number[] {
  return v.split(".").map((p) => Number.parseInt(p, 10) || 0);
}

export function compareVersion(a: string, b: string): number {
  const x = parseVersion(a);
  const y = parseVersion(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export type SafeVersionNote = { tone: "danger" | "info"; title: string; body: string } | null;

/**
 * What the Safe's contract version means for TokenIQ. Versions before 1.3.0 can be
 * tracked but TokenIQ does not build transactions for them; 1.4.1 has no module
 * guard hook, so an on-chain reserve guard can only check owner transactions.
 */
export function safeVersionNote(version: string | null | undefined): SafeVersionNote {
  if (!version) return { tone: "info", title: "Version unknown", body: "TokenIQ couldn't read the Safe's contract version. Sync again to retry." };
  if (compareVersion(version, "1.3.0") < 0)
    return {
      tone: "danger",
      title: `Safe v${version} is not supported for transactions`,
      body: "TokenIQ can track balances and verify owners, but it only prepares transactions for Safe v1.3.0 and later. Upgrade the Safe in Safe{Wallet} to propose payments or allocations from it.",
    };
  if (compareVersion(version, "1.4.1") === 0)
    return {
      tone: "info",
      title: "Safe v1.4.1: no module guard support",
      body: "A transaction guard checks transactions signed by owners, but this version cannot guard transactions sent by modules. Safe v1.5.0 adds module guards.",
    };
  return null;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function hasGuard(guard: string | null | undefined) {
  return !!guard && guard.toLowerCase() !== ZERO_ADDRESS;
}

/** "2 of 3 · v1.4.1", "Wallet", "Contract". */
export function kindLabel(a: Pick<TreasuryAccountDto, "kind" | "safe">): string {
  if (a.kind === "safe") {
    const owners = a.safe?.owners.length ?? 0;
    const t = a.safe?.threshold;
    const sig = t && owners ? `${t} of ${owners}` : t ? `${t} signatures` : "Safe";
    return a.safe?.version ? `Safe ${sig} · v${a.safe.version}` : `Safe ${sig}`;
  }
  return a.kind === "eoa" ? "Wallet" : "Contract";
}

export function verificationLabel(a: TreasuryAccountDto): string {
  if (a.verificationMethod === "sample") return "Sample account";
  if (!a.verified) return "Unverified";
  return a.verificationSigner ? `Verified by ${shortAddress(a.verificationSigner)}` : "Verified";
}

export const isSampleAccount = (a: Pick<TreasuryAccountDto, "verificationMethod">) => a.verificationMethod === "sample";
