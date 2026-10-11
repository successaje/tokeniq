"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseDecimal } from "@tokeniq/core";
import { ArrowRight, Eye, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CoverageBadge } from "@/components/app/coverage-badge";
import { Button } from "@/components/ui/button";
import { CheckboxChips } from "@/components/ui/checkbox-chips";
import { AmountInput, Field, Input, Textarea } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { RadioCards } from "@/components/ui/radio-cards";
import { Sheet } from "@/components/ui/sheet";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { useOrg, useOrgQuery } from "@/lib/org";
import type { ObligationScheduleDto, OverviewDto, PoliciesDto, PolicyDto } from "@/lib/types";
import { useMetaIndex } from "../treasury/meta";
import { bpsToPercent, formatPolicyValue, percentToBps, policyChanges, POLICY_FIELDS, PROTOCOL_LABEL } from "./policy-fields";
import { previewReserve, type ReservePreview } from "./preview";

const HAIRCUT_SYMBOLS = ["USDC", "USDT", "DAI", "USDS", "EURC"];
const PROTOCOLS = ["morpho", "aave-v3"] as const;
const RULE_LABEL = { floor: "Minimum reserve", runway: "Operating runway", obligations: "Upcoming obligations" } as const;

/** Fields a preset sets. Burn estimate, valuation, networks, assets and autonomy are the organization's own. */
const PRESET_FIELDS = ["runwayMonths", "minimumReserveUsd", "obligationHorizonDays", "obligationBufferBps", "includeEstimatedObligations", "thinCoverageBps", "maxDeployedBps", "maxPerProtocolBps", "maxPerVenueBps", "maxShareOfVenueLiquidityBps", "minVenueTvlUsd", "maxVenueFeeBps", "minActionUsd"] as const;

interface Form {
  monthlyBurnUsd: string;
  runwayMonths: string;
  minimumReserveUsd: string;
  obligationHorizonDays: string;
  obligationBufferBps: string;
  includeEstimatedObligations: boolean;
  thinCoverageBps: string;
  haircutsBps: Record<string, string>;
  includeUnverifiedInReserve: boolean;
  reserveAssets: string[];
  maxDataAgeMinutes: string;
  maxDeployedBps: string;
  maxPerProtocolBps: string;
  maxPerVenueBps: string;
  maxShareOfVenueLiquidityBps: string;
  minVenueTvlUsd: string;
  maxVenueFeeBps: string;
  allowedChains: number[];
  allowedAssets: string[];
  allowedProtocols: Array<"morpho" | "aave-v3">;
  minActionUsd: string;
  autonomy: PolicyDto["autonomy"];
}

function toForm(p: PolicyDto): Form {
  const haircuts: Record<string, string> = {};
  for (const s of new Set([...HAIRCUT_SYMBOLS, ...Object.keys(p.haircutsBps)])) haircuts[s] = bpsToPercent(p.haircutsBps[s] ?? 0);
  return {
    monthlyBurnUsd: p.monthlyBurnUsd ?? "",
    runwayMonths: String(p.runwayMonths),
    minimumReserveUsd: p.minimumReserveUsd,
    obligationHorizonDays: String(p.obligationHorizonDays),
    obligationBufferBps: bpsToPercent(p.obligationBufferBps),
    includeEstimatedObligations: p.includeEstimatedObligations,
    thinCoverageBps: bpsToPercent(p.thinCoverageBps),
    haircutsBps: haircuts,
    includeUnverifiedInReserve: p.includeUnverifiedInReserve,
    reserveAssets: p.reserveAssets,
    maxDataAgeMinutes: String(p.maxDataAgeMinutes),
    maxDeployedBps: bpsToPercent(p.maxDeployedBps),
    maxPerProtocolBps: bpsToPercent(p.maxPerProtocolBps),
    maxPerVenueBps: bpsToPercent(p.maxPerVenueBps),
    maxShareOfVenueLiquidityBps: bpsToPercent(p.maxShareOfVenueLiquidityBps),
    minVenueTvlUsd: p.minVenueTvlUsd,
    maxVenueFeeBps: bpsToPercent(p.maxVenueFeeBps),
    allowedChains: p.allowedChains,
    allowedAssets: p.allowedAssets,
    allowedProtocols: p.allowedProtocols,
    minActionUsd: p.minActionUsd,
    autonomy: p.autonomy,
  };
}

/** Parse the form into a policy, mirroring treasuryPolicySchema bounds. Errors are keyed by policy field. */
function toPolicy(f: Form): { policy: PolicyDto | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const int = (k: keyof Form, v: string, min: number, max: number, unit: string) => {
    const n = Number(v);
    if (v.trim() === "" || !Number.isInteger(n) || n < min || n > max) {
      errors[k] = `Enter a whole number of ${unit} from ${min} to ${max}.`;
      return min;
    }
    return n;
  };
  const bps = (k: string, v: string, min: number, max: number) => {
    try {
      if (v.trim() === "") throw new Error();
      const b = percentToBps(v);
      if (b < min || b > max) throw new Error();
      return b;
    } catch {
      errors[k] = `Enter a percentage from ${bpsToPercent(min)}% to ${bpsToPercent(max)}%.`;
      return min;
    }
  };
  const dec = (k: string, v: string, label: string) => {
    try {
      parseDecimal(v.trim());
      return v.trim();
    } catch {
      errors[k] = `Enter ${label} as a plain number (0 or more).`;
      return "0";
    }
  };
  const haircutsBps: Record<string, number> = {};
  for (const [s, v] of Object.entries(f.haircutsBps)) {
    const b = bps(`haircutsBps.${s}`, v === "" ? "0" : v, 0, 10_000);
    if (b > 0) haircutsBps[s] = b;
  }
  const policy: PolicyDto = {
    monthlyBurnUsd: f.monthlyBurnUsd.trim() === "" ? null : dec("monthlyBurnUsd", f.monthlyBurnUsd, "the monthly burn"),
    runwayMonths: int("runwayMonths", f.runwayMonths, 0, 36, "months"),
    minimumReserveUsd: dec("minimumReserveUsd", f.minimumReserveUsd || "0", "the minimum reserve"),
    obligationHorizonDays: int("obligationHorizonDays", f.obligationHorizonDays, 7, 365, "days"),
    obligationBufferBps: bps("obligationBufferBps", f.obligationBufferBps, 0, 10_000),
    includeEstimatedObligations: f.includeEstimatedObligations,
    thinCoverageBps: bps("thinCoverageBps", f.thinCoverageBps, 10_000, 30_000),
    haircutsBps,
    includeUnverifiedInReserve: f.includeUnverifiedInReserve,
    reserveAssets: f.reserveAssets,
    maxDataAgeMinutes: int("maxDataAgeMinutes", f.maxDataAgeMinutes, 5, 1440, "minutes"),
    maxDeployedBps: bps("maxDeployedBps", f.maxDeployedBps, 0, 10_000),
    maxPerProtocolBps: bps("maxPerProtocolBps", f.maxPerProtocolBps, 0, 10_000),
    maxPerVenueBps: bps("maxPerVenueBps", f.maxPerVenueBps, 0, 10_000),
    maxShareOfVenueLiquidityBps: bps("maxShareOfVenueLiquidityBps", f.maxShareOfVenueLiquidityBps, 1, 10_000),
    minVenueTvlUsd: dec("minVenueTvlUsd", f.minVenueTvlUsd || "0", "the minimum TVL"),
    maxVenueFeeBps: bps("maxVenueFeeBps", f.maxVenueFeeBps, 0, 10_000),
    allowedChains: f.allowedChains,
    allowedAssets: f.allowedAssets,
    allowedProtocols: f.allowedProtocols,
    minActionUsd: dec("minActionUsd", f.minActionUsd || "0", "the minimum action size"),
    autonomy: f.autonomy,
  };
  return { policy: Object.keys(errors).length ? null : policy, errors };
}

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function PolicyEditor({ open, onOpenChange, policies, overview }: { open: boolean; onOpenChange: (v: boolean) => void; policies: PoliciesDto; overview: OverviewDto }) {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { tokens, chains, query: metaQuery } = useMetaIndex();
  const [base, setBase] = useState<{ policy: PolicyDto; version: number }>({ policy: policies.treasury, version: policies.treasuryVersion });
  const [form, setForm] = useState<Form>(() => toForm(policies.treasury));
  const [reason, setReason] = useState("");
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<{ latest: PolicyDto; version: number } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Start from the latest saved policy each time the editor opens.
  useEffect(() => {
    if (open) {
      setBase({ policy: policies.treasury, version: policies.treasuryVersion });
      setForm(toForm(policies.treasury));
      setReason("");
      setServerErrors({});
      setConflict(null);
      setShowErrors(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setServerErrors((e) => {
      if (!e[k as string]) return e;
      const { [k as string]: _, ...rest } = e;
      return rest;
    });
  };

  const parsed = useMemo(() => toPolicy(form), [form]);
  // Saved values are always valid, so errors only appear once a field is edited; they update as you type.
  const errors = { ...parsed.errors, ...serverErrors };
  const changes = parsed.policy ? policyChanges(base.policy, parsed.policy) : [];

  // Obligations for a different horizon come from the schedule (same expansion the engine uses).
  const horizon = useDebounced(parsed.policy?.obligationHorizonDays ?? overview.policy.obligationHorizonDays);
  const needSchedule = horizon !== overview.policy.obligationHorizonDays;
  const schedule = useOrgQuery<ObligationScheduleDto>(`/obligations/schedule?days=${horizon}`, { enabled: open && needSchedule, placeholderData: (prev) => prev });
  const preview: ReservePreview | null = useMemo(() => {
    if (!parsed.policy) return null;
    if (needSchedule && !schedule.data) return null;
    return previewReserve({ policy: parsed.policy, overview, horizonOccurrences: needSchedule ? schedule.data!.occurrences : null, tokens });
  }, [parsed.policy, overview, needSchedule, schedule.data, tokens]);

  const save = useMutation({
    mutationFn: (body: { policy: PolicyDto; reason: string; expectedVersion: number }) => api<{ version: number; changes: unknown[] }>(orgPath(orgId, "/policies/treasury"), { method: "PUT", body }),
    onSuccess: (r) => {
      toast({ id: "policy-saved", tone: "success", title: `Policy saved as version ${r.version}`, description: `${r.changes.length} change${r.changes.length === 1 ? "" : "s"} recorded with your reason. Reserve figures were recalculated.` });
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "org" && q.queryKey[1] === orgId });
      onOpenChange(false);
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.code === "policy_version_conflict") {
        const latest = await qc.fetchQuery({ queryKey: ["org", orgId, "/policies"], queryFn: () => api<PoliciesDto>(orgPath(orgId, "/policies")), staleTime: 0 });
        setConflict({ latest: latest.treasury, version: latest.treasuryVersion });
        qc.invalidateQueries({ queryKey: ["org", orgId, "/policies/history"] });
        return;
      }
      if (err instanceof ApiError && err.code === "automation_not_enabled") {
        setServerErrors({ autonomy: err.message });
        return;
      }
      if (err instanceof ApiError && err.code === "validation_error" && Array.isArray(err.details)) {
        const fe: Record<string, string> = {};
        for (const d of err.details as Array<{ path: string; message: string }>) fe[d.path.replace(/^(body\.)?policy\./, "")] = d.message;
        setServerErrors(fe);
      }
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (!parsed.policy) return;
    const r = reason.trim();
    if (r.length < 3) {
      setServerErrors((s) => ({ ...s, reason: "Explain the change in a few words (at least 3 characters). It is stored with this version." }));
      return;
    }
    if (parsed.policy.autonomy === "bounded_automation") {
      setServerErrors((s) => ({ ...s, autonomy: "Bounded automation can't be switched on here." }));
      return;
    }
    save.mutate({ policy: parsed.policy, reason: r, expectedVersion: base.version });
  };

  const reapply = () => {
    if (!conflict || !parsed.policy) return;
    const mine = policyChanges(base.policy, parsed.policy);
    const next = { ...conflict.latest } as Record<string, unknown>;
    for (const c of mine) next[c.field] = c.to;
    setBase({ policy: conflict.latest, version: conflict.version });
    setForm(toForm(next as unknown as PolicyDto));
    setConflict(null);
    save.reset();
  };
  const discardMine = () => {
    if (!conflict) return;
    setBase({ policy: conflict.latest, version: conflict.version });
    setForm(toForm(conflict.latest));
    setConflict(null);
    save.reset();
  };

  const generalError = save.error && !(save.error instanceof ApiError && ["policy_version_conflict", "automation_not_enabled", "validation_error"].includes(save.error.code)) ? (save.error instanceof ApiError && save.error.status === 403 ? "Only owners and admins can change the treasury policy." : (save.error as Error).message) : null;
  const chainName = (id: number) => chains.get(id)?.name ?? `Chain ${id}`;
  const mainnets = (metaQuery.data?.chains ?? []).filter((c) => !c.testnet);
  const stableSymbols = [...new Set((metaQuery.data?.tokens ?? []).filter((t) => t.assetClass === "stablecoin").map((t) => t.symbol))];
  const order = <T,>(all: T[], picked: T[]) => [...all.filter((x) => picked.includes(x)), ...picked.filter((x) => !all.includes(x))];
  const presetMatch = (Object.entries(policies.presets) as Array<[keyof PoliciesDto["presets"], PoliciesDto["presets"]["balanced"]]>).find(([, p]) => parsed.policy && PRESET_FIELDS.every((k) => JSON.stringify(p.policy[k]) === JSON.stringify(parsed.policy![k])))?.[0];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      width="lg"
      title="Edit treasury policy"
      description={`Editing version ${base.version}. Saving creates version ${base.version + 1}; earlier versions are kept and every change is attributed to you.`}
      footer={
        <>
          <span className="mr-auto hidden self-center text-xs text-text-3 sm:block">{changes.length === 0 ? "No changes yet" : `${changes.length} change${changes.length === 1 ? "" : "s"}`}</span>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="policy-form" loading={save.isPending} loadingLabel="Saving policy" disabled={changes.length === 0 || !!conflict}>
            Save version {base.version + 1}
          </Button>
        </>
      }
    >
      <form id="policy-form" onSubmit={submit} noValidate className="space-y-6">
        <PreviewPanel preview={preview} overview={overview} invalid={!parsed.policy} loading={needSchedule && schedule.isFetching} version={overview.policyVersion} />

        {conflict && (
          <Callout tone="warning" title={`Someone saved version ${conflict.version} while you were editing`}>
            <p>Nothing was saved. Their changes compared with the version you started from:</p>
            <ChangeList changes={policyChanges(base.policy, conflict.latest)} chainName={chainName} empty="No field differences (only the version number changed)." />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={reapply}>
                Re-apply my {changes.length} change{changes.length === 1 ? "" : "s"} on version {conflict.version}
              </Button>
              <Button size="sm" variant="secondary" onClick={discardMine}>
                Start over from version {conflict.version}
              </Button>
            </div>
          </Callout>
        )}
        {generalError && <Callout tone="danger" title="The policy was not saved">{generalError}</Callout>}
        {showErrors && Object.keys(parsed.errors).length > 0 && <Callout tone="danger" title="Some fields need attention">Nothing was saved. Fix the highlighted fields.</Callout>}

        <Section title="Start from a preset" description="Presets set the reserve rules and allocation limits. Your burn estimate, haircuts, networks, assets and autonomy are kept.">
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.entries(policies.presets) as Array<[string, PoliciesDto["presets"]["balanced"]]>).map(([key, p]) => (
              <button
                key={key}
                type="button"
                aria-pressed={presetMatch === key}
                onClick={() => setForm((f) => ({ ...f, ...pick(toForm(p.policy), PRESET_FIELDS) }))}
                className={cn(
                  "rounded-[var(--radius-control)] border p-3 text-left transition-colors duration-[var(--dur-fast)]",
                  presetMatch === key ? "border-accent bg-accent-subtle/40 shadow-[inset_0_0_0_1px_var(--accent)]" : "border-hairline bg-surface hover:border-border-strong/60",
                )}
              >
                <span className="flex items-center justify-between text-[13px] font-medium text-text">
                  {p.label}
                  {presetMatch === key && <span className="text-xs font-normal text-accent">Matches</span>}
                </span>
                <span className="mt-1 block text-xs text-text-2">{p.description}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Reserve rules" description="The requirement is the largest of the enabled rules.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Declared monthly burn" optional error={errors.monthlyBurnUsd} hint="Leave empty to use recurring obligations only. If recurring obligations are higher, they are used.">
              {(p) => <AmountInput {...p} value={form.monthlyBurnUsd} onChange={(v) => set("monthlyBurnUsd", v)} placeholder="Not declared" />}
            </Field>
            <Field label="Runway to protect" error={errors.runwayMonths} hint="Months of burn kept in reserve. 0 turns the rule off.">
              {(p) => <Suffixed {...p} suffix="months" value={form.runwayMonths} onChange={(v) => set("runwayMonths", v)} />}
            </Field>
            <Field label="Minimum reserve" error={errors.minimumReserveUsd} hint="A fixed floor. 0 turns the rule off.">
              {(p) => <AmountInput {...p} value={form.minimumReserveUsd} onChange={(v) => set("minimumReserveUsd", v)} />}
            </Field>
            <Field label="Obligation horizon" error={errors.obligationHorizonDays} hint="Unpaid obligations due within this many days (and overdue ones) are covered.">
              {(p) => <Suffixed {...p} suffix="days" value={form.obligationHorizonDays} onChange={(v) => set("obligationHorizonDays", v)} />}
            </Field>
            <Field label="Buffer on obligations" error={errors.obligationBufferBps} hint="Extra cover on top of obligations in the horizon.">
              {(p) => <AmountInput {...p} unit="%" value={form.obligationBufferBps} onChange={(v) => set("obligationBufferBps", v)} />}
            </Field>
            <Field label="Coverage is “thin” below" error={errors.thinCoverageBps} hint="Of the requirement, from 100% to 300%.">
              {(p) => <AmountInput {...p} unit="%" value={form.thinCoverageBps} onChange={(v) => set("thinCoverageBps", v)} />}
            </Field>
          </div>
          <ToggleRow
            label="Count estimated obligations"
            description="When off, obligations marked as estimates are left out of the requirement (committed and invoiced always count)."
            checked={form.includeEstimatedObligations}
            onChange={(v) => set("includeEstimatedObligations", v)}
          />
        </Section>

        <Section title="Valuation" description="How stablecoins are counted toward the reserve. Stablecoins are never valued above $1.">
          <Field label="Haircuts" hint="Deducted from each stablecoin's value before it counts toward the reserve.">
            {() => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {Object.keys(form.haircutsBps).map((s) => (
                  <label key={s} className="block">
                    <span className="mb-1 block text-xs font-medium text-text-2">{s}</span>
                    <AmountInput
                      unit="%"
                      value={form.haircutsBps[s] ?? "0"}
                      onChange={(v) => set("haircutsBps", { ...form.haircutsBps, [s]: v })}
                      aria-invalid={errors[`haircutsBps.${s}`] ? true : undefined}
                      aria-label={`${s} haircut`}
                    />
                    {errors[`haircutsBps.${s}`] && <span className="mt-1 block text-xs text-danger">0–100%</span>}
                  </label>
                ))}
              </div>
            )}
          </Field>
          <Field label="Stablecoins that count toward the reserve" hint="None selected means every stablecoin counts.">
            {(p) => <CheckboxChips {...p} label="Stablecoins that count toward the reserve" value={form.reserveAssets} onChange={(v) => set("reserveAssets", order(stableSymbols, v))} options={stableSymbols.map((s) => ({ value: s, label: s }))} />}
          </Field>
          <ToggleRow
            label="Count unverified accounts"
            description="Include balances in accounts whose control nobody has proven."
            checked={form.includeUnverifiedInReserve}
            onChange={(v) => set("includeUnverifiedInReserve", v)}
            warning={form.includeUnverifiedInReserve ? "Unverified accounts may not be controlled by your organization. Counting them can overstate the reserve and make capital look deployable when it is not." : undefined}
          />
          <Field label="Balances are stale after" error={errors.maxDataAgeMinutes} hint="Accounts not synced within this time are flagged and pause recommendations." className="sm:w-1/2">
            {(p) => <Suffixed {...p} suffix="minutes" value={form.maxDataAgeMinutes} onChange={(v) => set("maxDataAgeMinutes", v)} />}
          </Field>
        </Section>

        <Section title="Allocation limits" description="Limits on what may be deployed. Venue limits are checked for every recommendation and proposal.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Maximum deployed" error={errors.maxDeployedBps} hint="Share of the total treasury that may sit in protocols.">
              {(p) => <AmountInput {...p} unit="%" value={form.maxDeployedBps} onChange={(v) => set("maxDeployedBps", v)} />}
            </Field>
            <Field label="Maximum per protocol" error={errors.maxPerProtocolBps} hint="Share of the total treasury.">
              {(p) => <AmountInput {...p} unit="%" value={form.maxPerProtocolBps} onChange={(v) => set("maxPerProtocolBps", v)} />}
            </Field>
            <Field label="Maximum per venue" error={errors.maxPerVenueBps} hint="Share of the total treasury in one vault or market.">
              {(p) => <AmountInput {...p} unit="%" value={form.maxPerVenueBps} onChange={(v) => set("maxPerVenueBps", v)} />}
            </Field>
            <Field label="Maximum share of a venue's liquidity" error={errors.maxShareOfVenueLiquidityBps} hint="So a withdrawal never depends on draining the venue.">
              {(p) => <AmountInput {...p} unit="%" value={form.maxShareOfVenueLiquidityBps} onChange={(v) => set("maxShareOfVenueLiquidityBps", v)} />}
            </Field>
            <Field label="Minimum venue TVL" error={errors.minVenueTvlUsd}>
              {(p) => <AmountInput {...p} value={form.minVenueTvlUsd} onChange={(v) => set("minVenueTvlUsd", v)} maxDecimals={0} />}
            </Field>
            <Field label="Maximum venue fee" error={errors.maxVenueFeeBps} hint="Performance or curator fee, as a share of yield.">
              {(p) => <AmountInput {...p} unit="%" value={form.maxVenueFeeBps} onChange={(v) => set("maxVenueFeeBps", v)} />}
            </Field>
            <Field label="Minimum action size" error={errors.minActionUsd} hint="Smaller moves are not recommended (gas and attention cost).">
              {(p) => <AmountInput {...p} value={form.minActionUsd} onChange={(v) => set("minActionUsd", v)} maxDecimals={0} />}
            </Field>
          </div>
          <Field label="Allowed networks" error={errors.allowedChains} hint={form.allowedChains.length === 0 ? "No network selected: nothing can be deployed." : undefined}>
            {(p) => <CheckboxChips {...p} label="Allowed networks" value={form.allowedChains} onChange={(v) => set("allowedChains", order(mainnets.map((c) => c.id), v))} options={mainnets.map((c) => ({ value: c.id, label: c.name }))} />}
          </Field>
          <Field label="Allowed assets" error={errors.allowedAssets} hint={form.allowedAssets.length === 0 ? "No asset selected: nothing can be deployed." : undefined}>
            {(p) => <CheckboxChips {...p} label="Allowed assets" value={form.allowedAssets} onChange={(v) => set("allowedAssets", order(stableSymbols, v))} options={stableSymbols.map((s) => ({ value: s, label: s }))} />}
          </Field>
          <Field label="Allowed protocols" error={errors.allowedProtocols}>
            {(p) => <CheckboxChips {...p} label="Allowed protocols" value={form.allowedProtocols} onChange={(v) => set("allowedProtocols", order([...PROTOCOLS], v))} options={PROTOCOLS.map((s) => ({ value: s, label: PROTOCOL_LABEL[s] ?? s }))} />}
          </Field>
        </Section>

        <Section title="Autonomy" description="What TokenIQ may do on its own.">
          <Field label="Autonomy level" error={errors.autonomy}>
            {(p) => (
              <RadioCards
                {...p}
                label="Autonomy level"
                value={form.autonomy}
                onValueChange={(v) => set("autonomy", v)}
                options={[
                  { value: "observe", label: "Observe only", description: "Read balances and explain. No proposals are created.", icon: Eye },
                  { value: "approval_required", label: "Approval required", description: "Recommendations become proposals that need approvals and Safe signatures.", icon: ShieldCheck },
                  {
                    value: "bounded_automation",
                    label: "Bounded automation",
                    description: "Small actions inside policy limits run without a vote.",
                    icon: Lock,
                    disabled: true,
                    disabledReason: "Requires the on-chain reserve guard and a Roles module on your Safe, so the limits are enforced by the chain rather than by TokenIQ. It can't be switched on from settings.",
                  },
                ]}
              />
            )}
          </Field>
        </Section>

        <Section title="Why are you changing it?" description="Stored with the new version and shown in the policy history.">
          {changes.length > 0 && (
            <div className="rounded-[var(--radius-card)] bg-sunken px-3.5 py-3">
              <div className="text-xs font-medium text-text-2">Changes in version {base.version + 1}</div>
              <ChangeList changes={changes} chainName={chainName} />
            </div>
          )}
          <Field label="Reason" error={errors.reason} hint={`${reason.trim().length}/500`}>
            {(p) => <Textarea {...p} value={reason} onChange={(e) => (setReason(e.target.value), setServerErrors(({ reason: _, ...rest }) => rest))} maxLength={500} rows={2} placeholder="e.g. Board approved a 9-month runway after the Q3 review" />}
          </Field>
        </Section>
      </form>
    </Sheet>
  );
}

function pick<T extends object, K extends readonly (keyof T)[]>(obj: T, keys: K): Pick<T, K[number]> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]])) as Pick<T, K[number]>;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-hairline pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-[13px] font-semibold text-text">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-text-2">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Suffixed({ value, onChange, suffix, ...rest }: { value: string; onChange: (v: string) => void; suffix: string; id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) {
  return (
    <div className="relative">
      <Input {...rest} value={value} inputMode="numeric" onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))} className="num pr-20 text-right" />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-text-3">{suffix}</span>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, warning }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void; warning?: string }) {
  const id = `toggle-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <label htmlFor={id} className="min-w-0">
          <span className="block text-[13px] font-medium text-text">{label}</span>
          <span className="block text-xs text-text-2">{description}</span>
        </label>
        <Switch id={id} checked={checked} onCheckedChange={onChange} />
      </div>
      {warning && (
        <p className="mt-2 flex gap-1.5 text-xs font-medium text-warning" role="status">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {warning}
        </p>
      )}
    </div>
  );
}

export function ChangeList({ changes, chainName, empty }: { changes: Array<{ field: string; from: unknown; to: unknown }>; chainName: (id: number) => string; empty?: string }) {
  if (changes.length === 0) return empty ? <p className="mt-1 text-xs text-text-3">{empty}</p> : null;
  return (
    <ul className="mt-1.5 space-y-1">
      {changes.map((c) => (
        <li key={c.field} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs sm:grid-cols-[12rem_minmax(0,1fr)]">
          <span className="text-text-2">{POLICY_FIELDS[c.field as keyof PolicyDto]?.label ?? c.field}</span>
          <span className="flex flex-wrap items-center gap-1.5 text-text">
            <span className="text-text-3 line-through decoration-text-3/60">{formatPolicyValue(c.field, c.from, chainName)}</span>
            <ArrowRight className="size-3 text-text-3" aria-label="changed to" />
            <span className="font-medium">{formatPolicyValue(c.field, c.to, chainName)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function PreviewPanel({ preview, overview, invalid, loading, version }: { preview: ReservePreview | null; overview: OverviewDto; invalid: boolean; loading: boolean; version: number }) {
  const r = overview.reserve;
  const rows: Array<{ label: string; now: ReactNode; next: ReactNode; changed: boolean }> = preview
    ? [
        { label: "Requirement", now: <Money value={r.required} />, next: <Money value={preview.required} />, changed: preview.required !== r.required },
        { label: "Set by", now: r.bindingRule ? RULE_LABEL[r.bindingRule] : "—", next: preview.bindingRule ? RULE_LABEL[preview.bindingRule] : "—", changed: preview.bindingRule !== r.bindingRule },
        { label: "Reserve-eligible", now: <Money value={r.available} />, next: <Money value={preview.available} />, changed: preview.available !== r.available },
        { label: "Deployable surplus", now: <Money value={r.surplus.deployable} />, next: <Money value={preview.deployable} />, changed: preview.deployable !== r.surplus.deployable },
        { label: "Coverage", now: <CoverageBadge reserve={r} />, next: <CoverageBadge reserve={{ status: preview.status, coverageBps: preview.coverageBps }} />, changed: preview.status !== r.status || preview.coverageBps !== r.coverageBps },
        { label: "Runway covered", now: r.runwayCoveredMonths ? `${r.runwayCoveredMonths} mo` : "—", next: preview.runwayCoveredMonths ? `${preview.runwayCoveredMonths} mo` : "—", changed: preview.runwayCoveredMonths !== r.runwayCoveredMonths },
      ]
    : [];
  return (
    <div className="sticky -top-4 z-10 -mx-5 -mt-4 border-b border-hairline bg-raised px-5 pb-3 pt-4" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-text">
          <StatusBadge tone="info" icon={Eye}>
            Preview
          </StatusBadge>
          <span className="font-normal text-text-3">Same rules as the engine, computed in your browser. Nothing is saved.</span>
        </span>
        {loading && <span className="text-xs text-text-3">Updating…</span>}
      </div>
      {invalid ? (
        <p className="mt-2 text-[13px] text-text-2">Fix the highlighted fields to see the effect.</p>
      ) : !preview ? (
        <p className="mt-2 text-[13px] text-text-3">Loading obligations for the new horizon…</p>
      ) : (
        <table className="mt-2 w-full text-[13px]">
          <thead>
            <tr className="text-[11px] text-text-3">
              <th scope="col" className="pb-0.5 text-left font-normal">
                <span className="sr-only">Figure</span>
              </th>
              <th scope="col" className="pb-0.5 pr-2 text-right font-normal">
                Now (v{version})
              </th>
              <th scope="col" className="pb-0.5 text-right font-medium text-text-2">
                With your changes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={cn(row.label === "Set by" && "hidden sm:table-row")}>
                <th scope="row" className="py-0.5 pr-2 text-left text-xs font-normal text-text-2">
                  {row.label}
                </th>
                <td className="num py-0.5 pr-2 text-right text-text-3">{row.now}</td>
                <td className={cn("num py-0.5 text-right", row.changed ? "font-medium text-text" : "text-text-3")}>
                  {row.changed && <span className="sr-only">changes to </span>}
                  {row.next}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {preview && !preview.availableFromEngine && <p className="mt-1 text-xs text-text-3">Reserve-eligible was revalued with your haircut and account settings{preview.skippedHoldings ? `; ${preview.skippedHoldings} holding(s) without token data were left out` : ""}.</p>}
      {preview && preview.limitedBy === "deployment_cap" && <p className="mt-1 text-xs text-text-3">Deployable is limited by the maximum-deployed share ({usd(preview.capRemaining, { compact: true })} of room).</p>}
    </div>
  );
}
