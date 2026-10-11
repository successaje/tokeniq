import { formatDecimal, parseDecimal } from "@tokeniq/core";
import { pct, usd } from "@/lib/format";
import type { PolicyDto } from "@/lib/types";

type Kind = "usd" | "usd_nullable" | "bps" | "months" | "days" | "minutes" | "bool" | "chains" | "list" | "haircuts" | "autonomy" | "protocols";

export const POLICY_FIELDS: Record<keyof PolicyDto, { label: string; kind: Kind }> = {
  monthlyBurnUsd: { label: "Declared monthly burn", kind: "usd_nullable" },
  runwayMonths: { label: "Runway months", kind: "months" },
  minimumReserveUsd: { label: "Minimum reserve", kind: "usd" },
  obligationHorizonDays: { label: "Obligation horizon", kind: "days" },
  obligationBufferBps: { label: "Obligation buffer", kind: "bps" },
  includeEstimatedObligations: { label: "Include estimated obligations", kind: "bool" },
  thinCoverageBps: { label: "Thin coverage below", kind: "bps" },
  haircutsBps: { label: "Stablecoin haircuts", kind: "haircuts" },
  includeUnverifiedInReserve: { label: "Count unverified accounts", kind: "bool" },
  reserveAssets: { label: "Stablecoins that count toward the reserve", kind: "list" },
  maxDataAgeMinutes: { label: "Balances are stale after", kind: "minutes" },
  maxDeployedBps: { label: "Maximum deployed", kind: "bps" },
  maxPerProtocolBps: { label: "Maximum per protocol", kind: "bps" },
  maxPerVenueBps: { label: "Maximum per venue", kind: "bps" },
  maxShareOfVenueLiquidityBps: { label: "Maximum share of a venue's liquidity", kind: "bps" },
  minVenueTvlUsd: { label: "Minimum venue TVL", kind: "usd" },
  maxVenueFeeBps: { label: "Maximum venue fee", kind: "bps" },
  allowedChains: { label: "Allowed networks", kind: "chains" },
  allowedAssets: { label: "Allowed assets", kind: "list" },
  allowedProtocols: { label: "Allowed protocols", kind: "protocols" },
  minActionUsd: { label: "Minimum action size", kind: "usd" },
  autonomy: { label: "Autonomy", kind: "autonomy" },
};

export const AUTONOMY_LABEL: Record<PolicyDto["autonomy"], string> = {
  observe: "Observe only",
  approval_required: "Approval required",
  bounded_automation: "Bounded automation",
};

export const PROTOCOL_LABEL: Record<string, string> = { morpho: "Morpho", "aave-v3": "Aave v3" };

/** Human value of a policy field, e.g. bps as a percentage. Unknown fields fall back to JSON. */
export function formatPolicyValue(field: string, value: unknown, chainName: (id: number) => string = (id) => `Chain ${id}`): string {
  const meta = POLICY_FIELDS[field as keyof PolicyDto];
  if (value === null || value === undefined) return meta?.kind === "usd_nullable" ? "Not declared" : "Not set";
  if (!meta) return typeof value === "object" ? JSON.stringify(value) : String(value);
  switch (meta.kind) {
    case "usd":
    case "usd_nullable":
      return usd(String(value));
    case "bps":
      return pct(Number(value), 2).replace(/\.00%$/, "%");
    case "months":
      return Number(value) === 0 ? "Off" : `${value} month${Number(value) === 1 ? "" : "s"}`;
    case "days":
      return `${value} days`;
    case "minutes":
      return `${value} minutes`;
    case "bool":
      return value ? "Yes" : "No";
    case "chains":
      return Array.isArray(value) && value.length ? value.map((v) => chainName(Number(v))).join(", ") : "None";
    case "list":
      return Array.isArray(value) && value.length ? value.join(", ") : field === "reserveAssets" ? "All stablecoins" : "None";
    case "protocols":
      return Array.isArray(value) && value.length ? value.map((v) => PROTOCOL_LABEL[String(v)] ?? String(v)).join(", ") : "None";
    case "haircuts": {
      const entries = Object.entries((value as Record<string, number>) ?? {}).filter(([, v]) => Number(v) > 0);
      return entries.length ? entries.map(([k, v]) => `${k} ${pct(v, 2).replace(/\.00%$/, "%")}`).join(", ") : "None";
    }
    case "autonomy":
      return AUTONOMY_LABEL[value as PolicyDto["autonomy"]] ?? String(value);
  }
}

/** "12.5" -> 1250 bps, exactly. Throws on malformed input. */
export function percentToBps(v: string): number {
  return Number(parseDecimal(v.trim(), 2));
}

/** 1250 -> "12.5". */
export function bpsToPercent(bps: number): string {
  return formatDecimal(BigInt(bps), 2);
}

export function policyChanges(before: PolicyDto, after: PolicyDto): Array<{ field: keyof PolicyDto; from: unknown; to: unknown }> {
  const out: Array<{ field: keyof PolicyDto; from: unknown; to: unknown }> = [];
  for (const k of Object.keys(POLICY_FIELDS) as Array<keyof PolicyDto>) {
    if (JSON.stringify(normalise(k, before[k])) !== JSON.stringify(normalise(k, after[k]))) out.push({ field: k, from: before[k], to: after[k] });
  }
  return out;
}

function normalise(k: keyof PolicyDto, v: unknown) {
  if (k === "haircutsBps" && v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Record<string, number>).filter(([, x]) => x > 0).sort(([a], [b]) => a.localeCompare(b)));
  }
  if (Array.isArray(v)) return [...v].map(String).sort();
  return v;
}
