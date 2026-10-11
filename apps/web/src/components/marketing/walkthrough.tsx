"use client";

import { CalendarClock, CheckCircle2, CircleDashed, CircleDot, FileText, LayoutDashboard, Lightbulb, ShieldCheck } from "lucide-react";
import { Tabs } from "radix-ui";
import { useMemo, useState, type ReactNode } from "react";
import { AllocationBar } from "@/components/charts/allocation-bar";
import { Money } from "@/components/ui/money";
import { StatusBadge, type Tone } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { DEFAULT_INPUTS, MODEL_OBLIGATIONS, runModel } from "@/lib/marketing-model";
import { IllustrationLabel } from "./primitives";

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard, caption: "What you control, owe, must protect and can deploy, on one screen." },
  { value: "obligations", label: "Obligations", icon: CalendarClock, caption: "Every commitment, with its certainty: an estimate is not an invoice." },
  { value: "recommendation", label: "Recommendation", icon: Lightbulb, caption: "A proposal that shows its checks and its reasoning before anyone approves it." },
  { value: "approval", label: "Approval", icon: ShieldCheck, caption: "Approval, signatures and execution tracked separately, with an audit trail." },
] as const;

/**
 * A keyboard-accessible tour (arrow keys move between tabs) of four product
 * screens, drawn as lightweight schematics with the product's own components.
 * Every panel is labelled as an illustration.
 */
export function Walkthrough() {
  const m = useMemo(() => runModel(DEFAULT_INPUTS), []);
  const [touched, setTouched] = useState(false);
  return (
    <Tabs.Root defaultValue="overview" onValueChange={() => setTouched(true)} className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <Tabs.List aria-label="Product walkthrough" className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:col-span-4 lg:flex lg:flex-col">
        {TABS.map((t, i) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              "group flex min-h-11 shrink-0 items-start gap-3 rounded-[var(--radius-control)] border border-transparent px-3 py-2.5 text-left transition-colors duration-[var(--dur-fast)]",
              "text-text-2 hover:bg-sunken hover:text-text data-[state=active]:border-hairline data-[state=active]:bg-surface data-[state=active]:text-text",
            )}
          >
            <span className="mt-0.5 font-mono text-[11px] text-text-3" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[14px] font-medium">
                <t.icon className="size-4 text-text-3 group-data-[state=active]:text-accent" aria-hidden="true" />
                {t.label}
              </span>
              <span className="mt-1 hidden text-[13px] leading-5 text-text-2 lg:block">{t.caption}</span>
            </span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <div className="min-w-0 lg:col-span-8">
        {TABS.map((t) => (
          <Tabs.Content key={t.value} value={t.value} className={cn(touched && "mk-fade-in", "rounded-[var(--radius-card)] border border-hairline bg-canvas focus-visible:outline-offset-4")}>
            <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
              <span className="flex items-center gap-2 text-xs text-text-3">
                <span aria-hidden="true" className="flex gap-1">
                  <span className="size-2 rounded-full bg-hairline" />
                  <span className="size-2 rounded-full bg-hairline" />
                  <span className="size-2 rounded-full bg-hairline" />
                </span>
                Example DAO · {t.label}
              </span>
              <IllustrationLabel />
            </div>
            <p className="px-4 pt-3 text-[13px] text-text-2 lg:hidden">{t.caption}</p>
            <div className="mk-schematic p-3 sm:p-5">
              {t.value === "overview" && <OverviewPanel m={m} />}
              {t.value === "obligations" && <ObligationsPanel m={m} />}
              {t.value === "recommendation" && <RecommendationPanel />}
              {t.value === "approval" && <ApprovalPanel />}
            </div>
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[var(--radius-card)] border border-hairline bg-surface", className)}>{children}</div>;
}

function Kpi({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-xs text-text-2">{label}</p>
      <p className="num mt-0.5 text-[18px] font-medium tracking-tight text-text">{usd(value, { decimals: 0 })}</p>
      <p className="truncate text-xs text-text-3">{meta}</p>
    </div>
  );
}

function OverviewPanel({ m }: { m: ReturnType<typeof runModel> }) {
  return (
    <div className="space-y-3">
      <Frame>
        <div className="grid grid-cols-2 divide-hairline sm:grid-cols-4 sm:divide-x [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-hairline sm:[&>*:nth-child(n+3)]:border-t-0">
          <Kpi label="Total treasury" value={m.gross} meta="2 Safes · synced 1 min ago" />
          <Kpi label="Protected by policy" value={m.required} meta="6-month runway rule" />
          <Kpi label="Owed in 90 days" value={m.obligationsDue} meta={`${m.occurrences.length} payments`} />
          <Kpi label="Deployable" value={m.deployable} meta="With approval" />
        </div>
        <div className="border-t border-hairline px-4 py-4">
          <AllocationBar buckets={m.buckets} total={m.total} shortfall={m.shortfall} />
        </div>
      </Frame>
      <Frame className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-text">Needs your approval (1)</p>
          <p className="text-xs text-text-2">
            Deposit <span className="num">$250,000</span> USDC into Example USDC vault
          </p>
        </div>
        <StatusBadge tone="accent" icon={CircleDot}>
          1 of 2 signatures
        </StatusBadge>
      </Frame>
    </div>
  );
}

const CERTAINTY: Record<string, { label: string; tone: Tone; icon: typeof FileText }> = {
  invoiced: { label: "Invoiced", tone: "info", icon: FileText },
  committed: { label: "Committed", tone: "neutral", icon: CircleDot },
  estimate: { label: "Estimate", tone: "warning", icon: CircleDashed },
};

function ObligationsPanel({ m }: { m: ReturnType<typeof runModel> }) {
  const rows = MODEL_OBLIGATIONS.map((o) => {
    const next = m.occurrences.find((x) => x.key.startsWith(`${o.id}:`));
    const amount = m.occurrences.find((x) => x.key.startsWith(`${o.id}:`))?.usd ?? "0";
    return { id: o.id, title: o.title, category: o.category, repeats: o.recurrence.freq === "once" ? "Once" : "Monthly", inDays: next?.inDays ?? null, amount, certainty: o.certainty };
  });
  return (
    <Frame>
      <div className="flex items-baseline justify-between gap-3 border-b border-hairline px-4 py-3">
        <p className="text-[13px] font-medium text-text">Upcoming obligations · next 90 days</p>
        <p className="text-xs text-text-2">
          <Money value={m.obligationsDue} decimals={0} className="font-medium text-text" /> due
        </p>
      </div>
      <ul className="divide-y divide-hairline">
        {rows.map((r) => {
          const c = CERTAINTY[r.certainty]!;
          return (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-text">{r.title}</p>
                <p className="text-xs text-text-3">
                  {r.category} · {r.repeats} · {r.inDays === null ? "—" : `next in ${r.inDays} days`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="num text-[13px] font-medium text-text">{usd(r.amount, { decimals: 0 })}</span>
                <StatusBadge tone={c.tone} icon={c.icon}>
                  {c.label}
                </StatusBadge>
              </div>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

function RecommendationPanel() {
  const checks = [
    "Reserve stays fully covered after the deposit",
    "Within the 80% maximum-deployed limit",
    "Within the 20% per-venue limit ($250,000)",
    "Position is under 5% of the vault’s available liquidity",
    "Prices and balances synced within the last hour",
  ];
  return (
    <div className="space-y-3">
      <Frame className="px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-text-3">Recommendation · policy v3</p>
            <p className="mt-0.5 text-[15px] font-semibold text-text">
              Deposit <span className="num">$250,000</span> USDC into Example USDC vault
            </p>
          </div>
          <StatusBadge tone="success">All checks passed</StatusBadge>
        </div>
        <p className="mt-3 text-[13px] leading-5 text-text-2">
          Deployable surplus is <span className="num font-medium text-text">$770,000</span>. This uses the per-venue limit and leaves <span className="num font-medium text-text">$520,000</span> unallocated. Net rate shown is
          illustrative: 4.6%, 7-day average, after fees.
        </p>
      </Frame>
      <Frame className="px-4 py-3">
        <p className="text-xs font-medium text-text-2">Policy checks</p>
        <ul className="mt-2 space-y-1.5">
          {checks.map((c) => (
            <li key={c} className="flex gap-2 text-[13px] text-text">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              <span>
                <span className="sr-only">Passed: </span>
                {c}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-hairline pt-2.5 text-xs text-text-3">Needs 2 internal approvals (tier up to $250,000), then 2 of 3 Safe signatures.</p>
      </Frame>
    </div>
  );
}

function ApprovalPanel() {
  const trail = [
    { who: "Finance lead", what: "Proposed the deposit", when: "09:12" },
    { who: "Policy engine", what: "Checks passed (policy v3)", when: "09:12" },
    { who: "Owner", what: "Approved", when: "10:40" },
    { who: "Approver", what: "Approved · 2 of 2", when: "11:05" },
    { who: "Safe owner 1", what: "Signed in their wallet · 1 of 2", when: "11:21" },
  ];
  return (
    <div className="space-y-3">
      <Frame>
        <ul className="divide-y divide-hairline">
          <TrackRow name="Internal approval" status="Approved · 2 of 2" tone="success" icon={CheckCircle2} />
          <TrackRow name="Safe signatures" status="1 of 2 signatures" tone="accent" icon={CircleDot} />
          <TrackRow name="On-chain execution" status="Not submitted" tone="neutral" icon={CircleDashed} />
        </ul>
      </Frame>
      <Frame className="px-4 py-3">
        <p className="text-xs font-medium text-text-2">Audit trail · append-only</p>
        <ol className="mt-2 space-y-1.5">
          {trail.map((e, i) => (
            <li key={i} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 text-[13px]">
              <span className="num font-mono text-xs leading-5 text-text-3">{e.when}</span>
              <span className="text-text">
                <span className="font-medium">{e.who}</span> <span className="text-text-2">{e.what}</span>
              </span>
            </li>
          ))}
        </ol>
      </Frame>
    </div>
  );
}

function TrackRow({ name, status, tone, icon }: { name: string; status: string; tone: Tone; icon: typeof CheckCircle2 }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-[13px] font-medium text-text">{name}</span>
      <StatusBadge tone={tone} icon={icon}>
        {status}
      </StatusBadge>
    </li>
  );
}
