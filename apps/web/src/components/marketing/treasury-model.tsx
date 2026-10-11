"use client";

import { Check, FlaskConical, Plus, TrendingDown } from "lucide-react";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { AllocationBar, BucketSwatch } from "@/components/charts/allocation-bar";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { StatusBadge } from "@/components/ui/status";
import { Stepper } from "@/components/ui/stepper";
import type { BucketKey } from "@/lib/buckets";
import { cn } from "@/lib/cn";
import { cmpUsd, isPositive, usd } from "@/lib/format";
import { DEFAULT_INPUTS, HORIZONS, MODEL_EVENTS, MODEL_LIMITS, runModel, type Horizon, type ModelEventId, type ModelInputs, type ModelResult } from "@/lib/marketing-model";
import { Crossfade } from "./crossfade";

const money = (v: string) => usd(v, { decimals: 2 });

/**
 * The hero instrument: an illustrative treasury run through the real
 * @tokeniq/core engine in the browser. Inputs are steppers, a segmented control
 * and toggle chips (no drag-only controls); the bar re-flows over 200ms and
 * figures crossfade. Server-rendered in its default state, then hydrated.
 */
export function TreasuryModel({ className }: { className?: string }) {
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULT_INPUTS);
  const [highlight, setHighlight] = useState<BucketKey | null>(null);
  const m = useMemo(() => runModel(inputs), [inputs]);
  const anyEvent = Object.values(inputs.events).some(Boolean);

  const toggle = (id: ModelEventId) => setInputs((p) => ({ ...p, events: { ...p.events, [id]: !p.events[id] } }));

  return (
    <section aria-labelledby="model-title" className={cn("overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface", className)}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-hairline px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h2 id="model-title" className="text-[13px] font-medium text-text">
            Illustrative treasury · $1,250,000 in USDC
          </h2>
          <p className="text-xs text-text-3">Two verified Safes on Base and Ethereum · $80,000 monthly burn · five recorded obligations</p>
        </div>
        <StatusBadge tone="neutral" icon={FlaskConical}>
          Example, not customer data
        </StatusBadge>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
        {/* Result: the answer first. */}
        <div className="px-4 pb-5 pt-5 sm:px-6 sm:pt-6 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[13px] font-medium text-text-2">
                <BucketSwatch k="deployable" />
                Deployable surplus
              </p>
              <p className="mt-2 text-[44px] font-medium leading-none tracking-[-0.025em] text-text sm:text-[60px]">
                <Crossfade value={m.deployable}>{(v) => <BigMoney value={v} />}</Crossfade>
              </p>
              <ChangeLine m={m} anyEvent={anyEvent} />
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:block sm:space-y-2 sm:text-right">
              <div>
                <dt className="text-xs text-text-3">Policy requirement</dt>
                <dd className="num text-[15px] font-medium text-text">
                  <Crossfade value={m.required} className="sm:justify-items-end">
                    {(v) => usd(v, { decimals: 0 })}
                  </Crossfade>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-3">Set by</dt>
                <dd className="text-[13px] text-text-2">
                  <Crossfade value={m.binding ?? "none"} className="sm:justify-items-end">
                    {(v) => ruleName(v)}
                  </Crossfade>
                </dd>
              </div>
            </dl>
          </div>

          <AllocationBar className="mt-6" size="lg" buckets={m.buckets} total={m.total} shortfall={m.shortfall} highlighted={highlight} onHighlight={setHighlight} showLegend={false} />

          <PositionSentence m={m} />
        </div>

        {/* Inputs. On large screens they sit in a right column spanning the result and the ledger. */}
        <div className="border-t border-hairline bg-canvas/40 px-4 py-5 sm:px-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-l lg:border-t-0 lg:py-6">
          <h3 className="text-xs font-medium text-text-2">Policy</h3>
          <div className="mt-3 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] text-text" aria-hidden="true">
                Runway to protect
              </span>
              <Stepper
                size="lg"
                label="Runway to protect"
                value={inputs.runwayMonths}
                min={MODEL_LIMITS.runwayMin}
                max={MODEL_LIMITS.runwayMax}
                format={(v) => `${v} months`}
                onValueChange={(v) => setInputs((p) => ({ ...p, runwayMonths: v }))}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] text-text" aria-hidden="true">
                Obligation horizon
              </span>
              <Segmented<`${Horizon}`>
                label="Obligation horizon"
                value={String(inputs.horizonDays) as `${Horizon}`}
                onValueChange={(v) => setInputs((p) => ({ ...p, horizonDays: Number(v) as Horizon }))}
                options={HORIZONS.map((h) => ({ value: String(h) as `${Horizon}`, label: `${h} days` }))}
              />
            </div>
          </div>

          <h3 className="mt-6 text-xs font-medium text-text-2" id="events-label">
            What if…
          </h3>
          <ul className="mt-3 flex flex-col gap-2" aria-labelledby="events-label">
            {MODEL_EVENTS.map((e) => {
              const on = inputs.events[e.id];
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(e.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-control)] border px-3 py-2 text-left text-[13px] transition-colors duration-[var(--dur-fast)] sm:min-h-10",
                      on ? "border-accent/50 bg-accent-subtle text-text" : "border-hairline bg-surface text-text-2 hover:border-border-strong/60 hover:text-text",
                    )}
                  >
                    <span aria-hidden="true" className={cn("flex size-5 shrink-0 items-center justify-center rounded-[4px] border", on ? "border-accent bg-accent text-on-accent" : "border-border-strong/60 text-text-3")}>
                      {on ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{e.label}</span>
                      <span className="block text-xs text-text-3">{e.detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <EventNotes m={m} />
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_INPUTS)}
            className={cn("mt-4 text-[13px] font-medium text-accent hover:underline", JSON.stringify(inputs) === JSON.stringify(DEFAULT_INPUTS) && "invisible")}
            tabIndex={JSON.stringify(inputs) === JSON.stringify(DEFAULT_INPUTS) ? -1 : undefined}
          >
            Reset the example
          </button>
        </div>

        {/* The arithmetic, line by line. */}
        <div className="border-t border-hairline px-4 py-5 sm:px-6 lg:col-start-1 lg:row-start-2">
          <h3 className="text-xs font-medium text-text-2">How this is calculated</h3>
          <Ledger m={m} highlight={highlight} />
          <Rules m={m} />
        </div>
      </div>

      <p className="border-t border-hairline px-4 py-3 text-xs text-text-3 sm:px-6">
        Calculated in your browser by <code className="font-mono text-[11px] text-text-2">@tokeniq/core</code>, the same deterministic engine the product uses. Amounts are illustrative; due dates are relative to the example’s as-of date.
      </p>

      <div role="status" aria-live="polite" className="sr-only">
        {`Deployable surplus ${money(m.deployable)}. Policy requirement ${money(m.required)}, set by the ${ruleName(m.binding ?? "none").toLowerCase()} rule.`}
      </div>
    </section>
  );
}

function BigMoney({ value }: { value: string }) {
  const full = usd(value, { decimals: 2 });
  const [whole, cents] = full.split(".");
  return (
    <span className="whitespace-nowrap">
      <span aria-hidden="true">{whole}</span>
      <span aria-hidden="true" className="text-text-3">
        .{cents}
      </span>
      <span className="sr-only">{full}</span>
    </span>
  );
}

function ruleName(id: string): string {
  return id === "runway" ? "Operating runway" : id === "obligations" ? "Obligations in horizon" : id === "floor" ? "Fixed floor" : "No rule";
}

function ChangeLine({ m, anyEvent }: { m: ModelResult; anyEvent: boolean }) {
  let content: ReactNode;
  let key: string;
  if (anyEvent && isPositive(m.deployableDelta.replace("-", "")) && m.deployableDelta.startsWith("-")) {
    key = `d${m.deployableDelta}`;
    content = (
      <span className="inline-flex items-center gap-1.5">
        <TrendingDown className="size-3.5 text-text-2" aria-hidden="true" />
        <span>
          <Money value={m.deployableDelta} decimals={0} className="font-medium text-text" /> compared with the same policy without these events
        </span>
      </span>
    );
  } else if (anyEvent && cmpUsd(m.deployableDelta, "0") === 0) {
    key = `unchanged-${m.limitedBy}-${m.binding}`;
    content =
      m.limitedBy === "deployment_cap" ? (
        <span>Unchanged: the 80% deployment cap is still the tighter limit.</span>
      ) : (
        <span>Unchanged: the {ruleName(m.binding ?? "none").toLowerCase()} rule already covers these events.</span>
      );
  } else if (anyEvent) {
    key = `u${m.deployableDelta}`;
    content = (
      <span>
        <Money value={m.deployableDelta} signed decimals={0} className="font-medium text-text" /> compared with the same policy without these events
      </span>
    );
  } else if (m.limitedBy === "deployment_cap") {
    key = `cap${m.held}`;
    content = (
      <span>
        Capped by the 80% maximum-deployed limit; <Money value={m.held} decimals={0} /> stays liquid.
      </span>
    );
  } else if (m.limitedBy === "nothing_available") {
    key = "none";
    content = <span>Nothing is deployable: the policy needs all of it.</span>;
  } else {
    key = `r${m.required}`;
    content = (
      <span>
        What remains after the <Money value={m.required} decimals={0} /> the policy protects.
      </span>
    );
  }
  return <ChangeLineText changeKey={key}>{content}</ChangeLineText>;
}

/** Fades the line in when it changes, but never on first render (no intro animation). */
function ChangeLineText({ changeKey, children }: { changeKey: string; children: ReactNode }) {
  const [initial] = useState(changeKey);
  return (
    <p className="mt-3 min-h-5 text-[13px] text-text-2">
      <span key={changeKey} className={cn(changeKey !== initial && "mk-fade-in")}>
        {children}
      </span>
    </p>
  );
}

function Fig({ value, k }: { value: string; k: BucketKey }) {
  return <Money value={value} decimals={0} className={cn("mk-figure font-medium text-text", `mk-figure-${k}`)} />;
}

/** The position sentence: the whole answer in one plain line (from the "annual report" direction). */
function PositionSentence({ m }: { m: ModelResult }) {
  const get = (k: BucketKey) => m.buckets.find((b) => b.key === k)?.value ?? "0";
  const obligations = get("obligations");
  const reserve = get("reserve");
  const held = get("held");
  const h = m.inputs.horizonDays;
  const parts: ReactNode[] = [];
  if (isPositive(m.shortfall)) {
    parts.push(
      <>
        The policy requires <Money value={m.required} decimals={0} className="font-medium text-text" />, which is <Money value={m.shortfall} decimals={0} className="font-medium text-text" /> more than this treasury holds. Nothing can be deployed until that gap closes.
      </>,
    );
  } else {
    parts.push(
      <>
        Of <Money value={m.available} decimals={0} className="font-medium text-text" />
        {m.inputs.events.depeg ? " (USDC valued at $0.97)" : ""}, <Fig value={obligations} k="obligations" /> covers payments due in the next {h} days
      </>,
    );
    if (isPositive(reserve)) {
      parts.push(
        <>
          , <Fig value={reserve} k="reserve" /> more is protected runway
        </>,
      );
    } else {
      parts.push(<> and is the strictest rule</>);
    }
    parts.push(
      <>
        {isPositive(held) ? ", " : ", and "}
        <Fig value={m.deployable} k="deployable" /> can be put to work with approval
      </>,
    );
    if (isPositive(held)) {
      parts.push(
        <>
          , while <Fig value={held} k="held" /> stays liquid under the deployment cap
        </>,
      );
    }
    parts.push(<>.</>);
  }
  return (
    <p className="mt-6 max-w-[62ch] text-[15px] leading-7 text-text-2 text-pretty">
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </p>
  );
}

function EventNotes({ m }: { m: ModelResult }) {
  const e = m.inputs.events;
  if (!e.audit && !e.contractors && !e.depeg) return null;
  return (
    <ul className="mt-4 space-y-2 border-l-2 border-hairline pl-3 text-xs leading-5 text-text-2" aria-label="What changed">
      {e.audit && (
        <li className="mk-fade-in">
          The invoice adds $66,000 (with the 10% buffer) to obligations.
          {m.binding !== "obligations"
            ? " The runway rule already covers it, so it moves money from protected runway into obligations. Set runway to 3 months to see it bite."
            : m.limitedBy === "deployment_cap"
              ? " The 80% deployment cap is still the tighter limit, so it reduces what is held liquid, not what is deployable."
              : " Obligations are now the strictest rule, so it comes straight out of deployable."}
        </li>
      )}
      {e.contractors && <li className="mk-fade-in">Recurring spend rises to $85,000 a month, above the declared $80,000 burn. The engine uses the higher figure.</li>}
      {e.depeg && <li className="mk-fade-in">USDC is valued at $0.97, so the treasury counts as $1,212,500. TokenIQ never values a stablecoin above $1.</li>}
    </ul>
  );
}

function Ledger({ m, highlight }: { m: ModelResult; highlight: BucketKey | null }) {
  const get = (k: BucketKey) => m.buckets.find((b) => b.key === k)?.value ?? "0";
  const ob = m.rules.find((r) => r.id === "obligations");
  const rows: Array<{ k: BucketKey | "total"; sign: string; label: string; note: string; value: string; strong?: boolean }> = [
    {
      k: "total",
      sign: "",
      label: "Reserve-eligible USDC",
      note: m.inputs.events.depeg ? "Valued at the $0.97 market price, in verified accounts only" : "Valued at no more than $1, in verified accounts only",
      value: m.available,
    },
    { k: "obligations", sign: "−", label: "Upcoming obligations", note: ob?.basis ?? "", value: get("obligations") },
  ];
  if (isPositive(get("reserve"))) rows.push({ k: "reserve", sign: "−", label: "Protected reserve", note: `The rest of the ${usd(m.required, { decimals: 0 })} requirement`, value: get("reserve") });
  if (isPositive(get("held"))) rows.push({ k: "held", sign: "−", label: "Held liquid", note: "Above the 80% maximum-deployed limit", value: get("held") });
  rows.push({ k: "deployable", sign: "=", label: "Deployable surplus", note: "May be allocated to vetted venues, with approval", value: m.deployable, strong: true });

  return (
    <div className="mt-3 text-[13px]">
      {rows.map((r) => (
        <div
          key={r.k}
          className={cn(
            "-mx-2 grid grid-cols-[1rem_minmax(0,1fr)_auto] items-baseline gap-x-2 rounded-[var(--radius-chip)] px-2 py-1.5 transition-colors duration-[var(--dur-fast)]",
            r.strong && "mt-1 border-t border-hairline pt-2.5",
            highlight && r.k === highlight && "bg-sunken",
          )}
        >
          <span className="text-text-3" aria-hidden="true">
            {r.sign}
          </span>
          <span className="min-w-0">
            <span className={cn("flex items-center gap-2", r.strong ? "font-medium text-text" : "text-text")}>
              {r.k !== "total" && <BucketSwatch k={r.k} className="size-2.5" />}
              {r.sign === "−" && <span className="sr-only">minus </span>}
              {r.sign === "=" && <span className="sr-only">equals </span>}
              {r.label}
            </span>
            <span className="block truncate text-xs text-text-3">{r.note}</span>
          </span>
          <span className={cn("num text-right", r.strong ? "font-medium text-text" : "text-text-2")}>
            <Crossfade value={r.value} className="justify-items-end">
              {(v) => money(v)}
            </Crossfade>
          </span>
        </div>
      ))}
    </div>
  );
}

function Rules({ m }: { m: ModelResult }) {
  return (
    <div className="mt-4 rounded-[var(--radius-control)] bg-sunken px-3 py-2.5">
      <p className="text-xs text-text-2">
        The requirement is the <strong className="font-medium text-text">strictest</strong> of three rules:
      </p>
      <ul className="mt-1.5 space-y-1 text-xs">
        {m.rules.map((r) => (
          <li key={r.id} className="flex items-baseline gap-2">
            <span className={cn("min-w-0 shrink", r.binding ? "font-medium text-text" : "text-text-2")}>
              {r.label}
              <span className="text-text-3"> · {r.basis}</span>
            </span>
            <span className="mk-leader" aria-hidden="true" />
            <span className={cn("num shrink-0", r.binding ? "font-medium text-text" : "text-text-2")}>
              <Crossfade value={r.amount} className="justify-items-end">
                {(v) => usd(v, { decimals: 0 })}
              </Crossfade>
            </span>
            <span className="w-14 shrink-0 text-right">{r.binding ? <span className="font-medium text-accent">Binding</span> : <span className="sr-only">Not binding</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
