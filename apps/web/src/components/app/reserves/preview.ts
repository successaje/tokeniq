import { applyBps, clampZero, maxOf, minOf, mulDiv, parseDecimal, ratioBps, reserveValue, wadToString, type AssetRef, type PriceQuote } from "@tokeniq/core";
import type { MetaTokenDto, OccurrenceDto, OverviewDto, PolicyDto, ReserveDto } from "@/lib/types";
import { tokenKey } from "../treasury/meta";

export interface ReservePreview {
  required: string;
  bindingRule: ReserveDto["bindingRule"];
  rules: Array<{ id: "floor" | "runway" | "obligations"; enabled: boolean; amount: string }>;
  available: string;
  /** False when reserve-eligible capital had to be recomputed in the browser (valuation settings changed). */
  availableFromEngine: boolean;
  deployable: string;
  afterReserve: string;
  capRemaining: string;
  limitedBy: ReserveDto["surplus"]["limitedBy"];
  coverageBps: string | null;
  status: ReserveDto["status"];
  shortfall: string;
  runwayCoveredMonths: string | null;
  burnUsed: string;
  counted: string;
  /** Holdings that could not be revalued (missing token metadata); their reserve value is left out. */
  skippedHoldings: number;
}

const w = (v: string) => parseDecimal(v, 18, "down");

export function valuationChanged(a: PolicyDto, b: PolicyDto) {
  const norm = (p: PolicyDto) =>
    JSON.stringify([
      Object.fromEntries(Object.entries(p.haircutsBps).filter(([, v]) => v > 0).sort(([x], [y]) => x.localeCompare(y))),
      p.includeUnverifiedInReserve,
      [...p.reserveAssets].sort(),
    ]);
  return norm(a) !== norm(b);
}

/**
 * Re-run the policy-dependent part of the engine's assessReserve (packages/core/src/reserve.ts)
 * in the browser for a draft policy. Policy-independent inputs come straight from the engine's
 * last result: itemized burn, pending outflows, gross treasury and deployed capital. Obligations
 * in the horizon come from the schedule endpoint (the same expansion the engine uses).
 * Reserve-eligible capital is recomputed with the engine's own reserveValue() only when a
 * valuation setting changed. Everything is exact bigint maths.
 */
export function previewReserve(input: {
  policy: PolicyDto;
  overview: OverviewDto;
  /** Outflow occurrences for the draft horizon; pass null to use the engine's current list (same horizon). */
  horizonOccurrences: OccurrenceDto[] | null;
  tokens: Map<string, MetaTokenDto>;
}): ReservePreview {
  const { policy, overview } = input;
  const reserve = overview.reserve;

  // Burn: max of declared and itemized, as in the engine.
  const declared = policy.monthlyBurnUsd === null || policy.monthlyBurnUsd === "" ? null : w(policy.monthlyBurnUsd);
  const itemized = w(reserve.burn.itemized);
  const burnUsed = declared === null ? itemized : itemized > declared ? itemized : declared;

  // Obligations in the horizon (overdue included), estimates excluded when the policy says so.
  const occ = (input.horizonOccurrences ?? reserve.obligations.occurrences).filter((o) => o.direction === "outflow" && o.usd !== null);
  let counted = 0n;
  for (const o of occ) {
    if (o.certainty === "estimate" && !policy.includeEstimatedObligations) continue;
    counted += w(o.usd!);
  }

  const floor = w(policy.minimumReserveUsd || "0");
  const runway = burnUsed * BigInt(policy.runwayMonths);
  const obligations = counted + applyBps(counted, policy.obligationBufferBps, "up");
  const rules = [
    { id: "floor" as const, enabled: floor > 0n, amount: floor },
    { id: "runway" as const, enabled: policy.runwayMonths > 0, amount: runway },
    { id: "obligations" as const, enabled: true, amount: obligations },
  ];
  const enabled = rules.filter((r) => r.enabled);
  const required = enabled.length ? maxOf(...enabled.map((r) => r.amount)) : 0n;
  const bindingRule = required > 0n ? (enabled.find((r) => r.amount === required)?.id ?? null) : null;

  // Reserve-eligible capital.
  let available = w(reserve.available);
  let availableFromEngine = true;
  let skippedHoldings = 0;
  if (valuationChanged(policy, overview.policy)) {
    availableFromEngine = false;
    available = 0n;
    const accounts = new Map(overview.accounts.map((a) => [a.id, a]));
    const allowed = new Set(policy.reserveAssets);
    for (const h of overview.holdings) {
      const account = accounts.get(h.accountId);
      if (!account || !account.includeInTreasury || h.raw === "0" || !h.price) continue;
      if (!(account.verified || policy.includeUnverifiedInReserve)) continue;
      if (h.assetClass !== "stablecoin") continue;
      if (allowed.size > 0 && !allowed.has(h.symbol)) continue;
      const token = input.tokens.get(tokenKey(h.chainId, h.assetAddress));
      if (!token) {
        skippedHoldings++;
        continue;
      }
      const asset: AssetRef = { symbol: h.symbol, chainId: h.chainId, address: h.assetAddress, decimals: h.decimals, assetClass: h.assetClass, pegCurrency: token.pegCurrency ?? undefined };
      const quote: PriceQuote = { price: BigInt(h.price.value), decimals: h.price.decimals, updatedAt: 0, source: h.price.source, stale: h.price.stale };
      const rv = reserveValue(BigInt(h.raw), asset, quote, policy.haircutsBps[h.symbol] ?? 0);
      if (rv !== null) available += rv;
    }
  }

  const pending = w(reserve.pendingOutflows);
  const pendingAllocations = w(reserve.pendingAllocations);
  const availableAfterPending = clampZero(available - pending);
  const coverage = ratioBps(availableAfterPending, required);
  let status: ReserveDto["status"];
  if (required === 0n) status = "no_requirement";
  else if (availableAfterPending < required) status = "shortfall";
  else if (coverage !== null && coverage < BigInt(policy.thinCoverageBps)) status = "thin";
  else status = "covered";

  const afterReserve = clampZero(available - required - pending);
  const cap = applyBps(w(overview.treasury.gross), policy.maxDeployedBps, "down");
  const capRemaining = clampZero(cap - w(overview.treasury.allocated.total) - pendingAllocations);
  const deployable = minOf(afterReserve, capRemaining);
  const limitedBy: ReserveDto["surplus"]["limitedBy"] = deployable === 0n && afterReserve === 0n ? "nothing_available" : capRemaining < afterReserve ? "deployment_cap" : "reserve";
  const tenths = burnUsed > 0n ? mulDiv(availableAfterPending, 10n, burnUsed, "down") : null;

  return {
    required: wadToString(required),
    bindingRule,
    rules: rules.map((r) => ({ id: r.id, enabled: r.enabled, amount: wadToString(r.amount) })),
    available: wadToString(available),
    availableFromEngine,
    deployable: wadToString(deployable),
    afterReserve: wadToString(afterReserve),
    capRemaining: wadToString(capRemaining),
    limitedBy,
    coverageBps: coverage === null ? null : coverage.toString(),
    status,
    shortfall: wadToString(clampZero(required - availableAfterPending)),
    runwayCoveredMonths: tenths === null ? null : `${tenths / 10n}.${tenths % 10n}`,
    burnUsed: wadToString(burnUsed),
    counted: wadToString(counted),
    skippedHoldings,
  };
}
