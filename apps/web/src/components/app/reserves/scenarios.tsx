"use client";

import { useMutation } from "@tanstack/react-query";
import { addDays, parseDecimal, wadToString } from "@tokeniq/core";
import { FlaskConical, Play, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CoverageBadge } from "@/components/app/coverage-badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AmountInput, Field, Input } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { ApiError, api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateLabel, usd } from "@/lib/format";
import { useOrg } from "@/lib/org";
import type { OverviewDto, ReserveDto, ScenarioResultDto, ScenarioShockDto } from "@/lib/types";

const PRESETS: Array<{ label: string; shock: ScenarioShockDto }> = [
  { label: "USDC depegs to $0.97", shock: { type: "depeg", symbol: "USDC", price: "0.97" } },
  { label: "USDC depegs to $0.90", shock: { type: "depeg", symbol: "USDC", price: "0.90" } },
  { label: "USDT depegs to $0.95", shock: { type: "depeg", symbol: "USDT", price: "0.95" } },
];

const RULE_LABEL: Record<NonNullable<ReserveDto["bindingRule"]>, string> = { floor: "Minimum reserve", runway: "Operating runway", obligations: "Upcoming obligations" };

type Kind = "depeg" | "new_obligation" | "burn_change" | "runway_months" | "venue_frozen";

export function describeShock(s: ScenarioShockDto, venueName?: (id: string) => string): string {
  switch (s.type) {
    case "depeg":
      return `${s.symbol} trades at $${s.price}`;
    case "new_obligation":
      return `${s.title}: ${usd(s.amount)} ${s.monthly ? `monthly from ${dateLabel(s.dueDate)}` : `due ${dateLabel(s.dueDate)}`}`;
    case "burn_change":
      return `Monthly burn becomes ${usd(s.monthlyBurnUsd)}`;
    case "runway_months":
      return `Runway rule set to ${s.months} months`;
    case "venue_frozen":
      return `${venueName?.(s.venueId) ?? s.venueId} freezes withdrawals`;
  }
}

/**
 * Stress tests run by the engine on a copy of the current state (POST /treasury/scenario).
 * Nothing is stored and no policy changes.
 */
export function ScenariosPanel({ overview }: { overview: OverviewDto }) {
  const { orgId } = useOrg();
  const [shocks, setShocks] = useState<ScenarioShockDto[]>([]);
  const [kind, setKind] = useState<Kind>("new_obligation");
  const [err, setErr] = useState<string | null>(null);
  const today = overview.asOf;
  const held = [...new Set(overview.holdings.filter((h) => h.assetClass === "stablecoin" && h.raw !== "0").map((h) => h.symbol))];
  const venues = [...new Map(overview.positions.map((p) => [p.venueId, p.venueName])).entries()];
  const venueName = (id: string) => venues.find(([v]) => v === id)?.[1] ?? id;

  // Builder inputs
  const [depeg, setDepeg] = useState({ symbol: held[0] ?? "USDC", price: "0.95" });
  const [ob, setOb] = useState({ title: "Hypothetical obligation", amount: "", dueDate: addDays(today, 30), monthly: false });
  const [burn, setBurn] = useState(overview.reserve.burn.used !== "0" ? overview.reserve.burn.used.replace(/\.\d+$/, "") : "");
  const [months, setMonths] = useState(String(overview.policy.runwayMonths));
  const [venue, setVenue] = useState(venues[0]?.[0] ?? "");

  const run = useMutation({
    mutationFn: (list: ScenarioShockDto[]) => api<ScenarioResultDto>(orgPath(orgId, "/treasury/scenario"), { method: "POST", body: { shocks: list } }),
  });

  const runWith = (list: ScenarioShockDto[]) => {
    setShocks(list);
    run.mutate(list);
  };

  const add = () => {
    setErr(null);
    let shock: ScenarioShockDto | null = null;
    const isAmount = (v: string) => {
      try {
        return parseDecimal(v) > 0n;
      } catch {
        return false;
      }
    };
    switch (kind) {
      case "depeg": {
        let ok = false;
        try {
          const p = parseDecimal(depeg.price);
          ok = p >= 0n && p <= parseDecimal("2");
        } catch {}
        if (!ok) return setErr("Enter a price between 0 and 2, like 0.95.");
        shock = { type: "depeg", symbol: depeg.symbol, price: depeg.price };
        break;
      }
      case "new_obligation":
        if (!isAmount(ob.amount)) return setErr("Enter the obligation amount.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ob.dueDate)) return setErr("Choose a due date.");
        shock = { type: "new_obligation", title: ob.title.trim() || "Hypothetical obligation", amount: ob.amount, dueDate: ob.dueDate, monthly: ob.monthly };
        break;
      case "burn_change":
        if (!isAmount(burn)) return setErr("Enter the monthly burn to test.");
        shock = { type: "burn_change", monthlyBurnUsd: burn };
        break;
      case "runway_months": {
        const n = Number(months);
        if (!Number.isInteger(n) || n < 0 || n > 36) return setErr("Enter 0 to 36 months.");
        shock = { type: "runway_months", months: n };
        break;
      }
      case "venue_frozen":
        if (!venue) return setErr("Choose a venue.");
        shock = { type: "venue_frozen", venueId: venue };
        break;
    }
    if (!shock) return;
    if (shocks.length >= 8) return setErr("A scenario can combine up to 8 changes.");
    // One shock per kind and symbol/venue: replace rather than stack contradictory changes.
    const same = (s: ScenarioShockDto) => s.type === shock!.type && (s.type !== "depeg" || (shock as { symbol: string }).symbol === s.symbol) && s.type !== "new_obligation";
    setShocks((list) => [...list.filter((s) => !same(s)), shock!]);
  };

  const result = run.data;

  return (
    <Card id="scenarios" className="scroll-mt-20">
      <CardHeader
        title="Stress scenarios"
        description="See how the requirement, coverage and deployable surplus respond to a shock. The engine recalculates on a copy of today's data."
        action={
          <StatusBadge tone="info" icon={FlaskConical}>
            Hypothetical
          </StatusBadge>
        }
      />
      <CardBody className="space-y-5">
        <div>
          <div className="text-xs font-medium text-text-2">Quick tests</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} variant="secondary" size="sm" onClick={() => runWith([p.shock])} disabled={run.isPending}>
                {p.label}
                {p.shock.type === "depeg" && !held.includes(p.shock.symbol) && <span className="text-xs font-normal text-text-3">· not held</span>}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-hairline p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium text-text-2">Build a scenario</div>
            <div className="-mx-1 max-w-full overflow-x-auto px-1">
              <Segmented
                label="Kind of change"
                size="sm"
                value={kind}
                onValueChange={(v) => (setKind(v), setErr(null))}
                options={[
                  { value: "new_obligation", label: "New obligation" },
                  { value: "depeg", label: "Depeg" },
                  { value: "burn_change", label: "Burn" },
                  { value: "runway_months", label: "Runway" },
                  ...(venues.length ? [{ value: "venue_frozen" as const, label: "Frozen venue" }] : []),
                ]}
              />
            </div>
          </div>
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {kind === "depeg" && (
              <>
                <Field label="Stablecoin">{(p) => <Select {...p} value={depeg.symbol} onValueChange={(v) => setDepeg((d) => ({ ...d, symbol: v }))} options={[...new Set([...held, "USDC", "USDT", "DAI", "USDS", "EURC"])].map((s) => ({ value: s, label: s, hint: held.includes(s) ? undefined : "not held" }))} />}</Field>
                <Field label="Price (USD)">{(p) => <AmountInput {...p} unit="USD" maxDecimals={4} value={depeg.price} onChange={(v) => setDepeg((d) => ({ ...d, price: v }))} />}</Field>
              </>
            )}
            {kind === "new_obligation" && (
              <>
                <Field label="Title">{(p) => <Input {...p} value={ob.title} maxLength={120} onChange={(e) => setOb((o) => ({ ...o, title: e.target.value }))} />}</Field>
                <Field label="Amount">{(p) => <AmountInput {...p} value={ob.amount} onChange={(v) => setOb((o) => ({ ...o, amount: v }))} placeholder="0.00" />}</Field>
                <Field label="Due">{(p) => <Input {...p} type="date" value={ob.dueDate} onChange={(e) => setOb((o) => ({ ...o, dueDate: e.target.value }))} className="num" />}</Field>
                <label className="flex h-9 items-center gap-2 text-[13px] text-text">
                  <Switch checked={ob.monthly} onCheckedChange={(v) => setOb((o) => ({ ...o, monthly: v }))} aria-label="Repeats monthly" />
                  Repeats monthly
                </label>
              </>
            )}
            {kind === "burn_change" && <Field label="Monthly burn" hint={`Now ${usd(overview.reserve.burn.used)} (${overview.reserve.burn.basis.replace(/_/g, " ")})`}>{(p) => <AmountInput {...p} value={burn} onChange={setBurn} />}</Field>}
            {kind === "runway_months" && (
              <Field label="Runway months" hint={`Policy: ${overview.policy.runwayMonths}`}>
                {(p) => <Input {...p} inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/[^\d]/g, ""))} className="num" />}
              </Field>
            )}
            {kind === "venue_frozen" && <Field label="Venue">{(p) => <Select {...p} value={venue} onValueChange={setVenue} options={venues.map(([id, name]) => ({ value: id, label: name }))} />}</Field>}
            <Button variant="secondary" onClick={add} className="justify-center">
              <Plus className="size-4" aria-hidden="true" /> Add
            </Button>
          </div>
          {err && (
            <p className="mt-2 text-xs font-medium text-danger" role="alert">
              {err}
            </p>
          )}
          {shocks.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
              {shocks.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-[var(--radius-chip)] bg-sunken py-1 pl-2 pr-1 text-xs text-text">
                  {describeShock(s, venueName)}
                  <button type="button" onClick={() => setShocks((l) => l.filter((_, j) => j !== i))} className="-my-1 inline-flex size-6 items-center justify-center rounded text-text-3 hover:text-text" aria-label={`Remove: ${describeShock(s, venueName)}`}>
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => (setShocks([]), run.reset())}>
                  Clear
                </Button>
                <Button size="sm" onClick={() => run.mutate(shocks)} loading={run.isPending} loadingLabel="Running scenario">
                  {!run.isPending && <Play className="size-3.5" aria-hidden="true" />} Run scenario
                </Button>
              </div>
            </div>
          )}
        </div>

        {run.isError && (
          <Callout tone="danger" title="The scenario didn't run">
            {run.error instanceof ApiError && run.error.code === "validation_error" ? "One of the changes is not valid. Check the amounts and dates." : (run.error as Error).message} Nothing was changed.
          </Callout>
        )}
        {run.isPending && !result && <p className="text-[13px] text-text-3" role="status">Running the engine on a copy of your data…</p>}
        {result && <ScenarioResult result={result} venueName={venueName} stale={run.isPending} />}
      </CardBody>
    </Card>
  );
}

function ScenarioResult({ result, venueName, stale }: { result: ScenarioResultDto; venueName: (id: string) => string; stale: boolean }) {
  const b = result.base.reserve;
  const s = result.scenario.reserve;
  const delta = (a: string, z: string) => wadToString(parseDecimal(z, 18, "down") - parseDecimal(a, 18, "down"));
  const rows: Array<{ label: string; base: ReactNode; scen: ReactNode; change: ReactNode; worse?: boolean }> = [
    { label: "Requirement", base: <Money value={b.required} />, scen: <Money value={s.required} />, change: <Delta v={result.delta.required} invert />, worse: parseDecimal(result.delta.required) > 0n },
    { label: "Set by", base: b.bindingRule ? RULE_LABEL[b.bindingRule] : "—", scen: s.bindingRule ? RULE_LABEL[s.bindingRule] : "—", change: b.bindingRule === s.bindingRule ? <span className="text-text-3">Same</span> : <span className="font-medium">Changed</span> },
    { label: "Reserve-eligible", base: <Money value={b.available} />, scen: <Money value={s.available} />, change: <Delta v={result.delta.available} />, worse: parseDecimal(result.delta.available) < 0n },
    { label: "Deployable surplus", base: <Money value={b.surplus.deployable} />, scen: <Money value={s.surplus.deployable} />, change: <Delta v={result.delta.deployable} />, worse: parseDecimal(result.delta.deployable) < 0n },
    { label: "Coverage", base: <CoverageBadge reserve={b} />, scen: <CoverageBadge reserve={s} />, change: b.status === s.status ? <span className="text-text-3">Same status</span> : <span className="font-medium">{s.status === "shortfall" ? "Now short" : s.status === "thin" ? "Now thin" : "Improves"}</span>, worse: s.status !== b.status && (s.status === "shortfall" || s.status === "thin") },
    { label: "Shortfall", base: <Money value={b.shortfall} />, scen: <Money value={s.shortfall} />, change: <Delta v={delta(b.shortfall, s.shortfall)} invert />, worse: parseDecimal(s.shortfall) > parseDecimal(b.shortfall) },
    { label: "Runway covered", base: b.runwayCoveredMonths ? `${b.runwayCoveredMonths} mo` : "—", scen: s.runwayCoveredMonths ? `${s.runwayCoveredMonths} mo` : "—", change: <span className="text-text-3">{b.runwayCoveredMonths && s.runwayCoveredMonths ? monthsDelta(b.runwayCoveredMonths, s.runwayCoveredMonths) : "—"}</span>, worse: !!b.runwayCoveredMonths && !!s.runwayCoveredMonths && tenths(s.runwayCoveredMonths) < tenths(b.runwayCoveredMonths) },
  ];
  const newReasons = s.uncertainty.reasons.filter((r) => !b.uncertainty.reasons.some((x) => x.message === r.message));
  return (
    <div className={cn("transition-opacity", stale && "opacity-60")} aria-busy={stale}>
      <Callout tone="info" title="Hypothetical — nothing is changed">
        {result.shocks.map((sh) => describeShock(sh, venueName)).join(" · ")}. Your balances, obligations and policy are untouched.
      </Callout>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-[13px]">
          <caption className="sr-only">Current figures compared with the scenario</caption>
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-text-2">
              <th scope="col" className="py-2 pr-3 font-medium">
                Figure
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                Today
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                Scenario
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-hairline last:border-b-0">
                <th scope="row" className="py-2 pr-3 text-left font-normal text-text-2">
                  {r.label}
                </th>
                <td className="num py-2 pr-3 text-right text-text-2">{r.base}</td>
                <td className={cn("num py-2 pr-3 text-right", r.worse ? "font-medium text-text" : "text-text")}>{r.scen}</td>
                <td className={cn("num py-2 text-right", r.worse ? "text-danger" : "text-text-2")}>{r.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {newReasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-text-2">
          {newReasons.map((r, i) => (
            <li key={i}>· {r.message}</li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-text-3">{s.surplus.explanation}.</p>
    </div>
  );
}

/** Runway months arrive as "8.3" (one decimal): compare in tenths, exactly. */
function tenths(v: string) {
  const [a, b = "0"] = v.split(".");
  return Number(a) * 10 + Number(b.slice(0, 1));
}

function monthsDelta(a: string, b: string) {
  const d = tenths(b) - tenths(a);
  if (d === 0) return "No change";
  const abs = Math.abs(d);
  return `${d > 0 ? "+" : "−"}${Math.floor(abs / 10)}.${abs % 10} mo`;
}

function Delta({ v, invert }: { v: string; invert?: boolean }) {
  const n = parseDecimal(v, 18, "down");
  if (n === 0n) return <span className="text-text-3">No change</span>;
  const bad = invert ? n > 0n : n < 0n;
  return <Money value={v} signed className={bad ? "text-danger" : "text-text"} />;
}
