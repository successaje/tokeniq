import { parseDecimal, wadToString } from "@tokeniq/core";

export type BucketKey = "obligations" | "reserve" | "deployable" | "held" | "shortfall";

export interface Bucket {
  key: BucketKey;
  label: string;
  /** USD decimal string. */
  value: string;
  description: string;
}

export interface ReserveLike {
  required: string;
  available: string;
  pendingOutflows: string;
  shortfall: string;
  rules: Array<{ id: string; amount: string; enabled: boolean }>;
  surplus: { deployable: string };
}

const w = (v: string) => parseDecimal(v, 18, "down");
const min = (a: bigint, b: bigint) => (a < b ? a : b);
const max0 = (a: bigint) => (a < 0n ? 0n : a);

/**
 * Split reserve-eligible capital into additive buckets that sum exactly to it:
 *   upcoming obligations (the obligation rule, capped at the requirement)
 * + protected reserve     (the rest of the requirement)
 * + deployable surplus
 * + held liquid           (not required, but above the deployment cap or pending)
 * A shortfall is returned separately (it is money that is missing, not held).
 */
export function bucketsFromReserve(r: ReserveLike): { buckets: Bucket[]; total: string; shortfall: string } {
  const required = w(r.required);
  const available = w(r.available);
  const pending = w(r.pendingOutflows);
  const deployable = w(r.surplus.deployable);
  const obligationsRule = w(r.rules.find((x) => x.id === "obligations")?.amount ?? "0");
  const coveredRequirement = min(required, available);
  const obligations = min(obligationsRule, coveredRequirement);
  const reserve = coveredRequirement - obligations;
  const held = max0(available - coveredRequirement - deployable);
  const buckets: Bucket[] = [
    { key: "obligations", label: "Upcoming obligations + buffer", value: wadToString(obligations), description: "Payments due within the policy horizon, plus the safety buffer" },
    { key: "reserve", label: "Protected reserve", value: wadToString(reserve), description: "The rest of the policy requirement, such as operating runway or a fixed floor" },
    { key: "deployable", label: "Deployable surplus", value: wadToString(deployable), description: "May be allocated to vetted venues, with approval" },
    {
      key: "held",
      label: "Held liquid",
      value: wadToString(held),
      description: pending > 0n ? "Not required, but kept liquid by the deployment cap or reserved for pending proposals" : "Not required, but kept liquid by the maximum-deployed limit",
    },
  ];
  return { buckets: buckets.filter((b) => w(b.value) > 0n || b.key === "deployable"), total: wadToString(available), shortfall: r.shortfall };
}

/** Share of `part` in `total` as a number in [0, 100] for layout only (never for money). */
export function sharePct(part: string, total: string): number {
  const t = w(total);
  if (t === 0n) return 0;
  return Number((w(part) * 10_000n) / t) / 100;
}
