"use client";

import { ArrowRight, CheckCircle2, Circle, ExternalLink, Lock, Mail } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { useOrg, useOrgQuery } from "@/lib/org";
import type { MemberDto } from "@/lib/types";

const SECTIONS = [
  { id: "getting-started", label: "Getting started" },
  { id: "calculations", label: "How calculations work" },
  { id: "approvals", label: "Approvals, signatures, execution" },
  { id: "autonomy", label: "Autonomy levels" },
  { id: "glossary", label: "Glossary" },
  { id: "shortcuts", label: "Keyboard shortcuts" },
  { id: "contact", label: "Contact and security" },
];

function Section({ id, title, children, description }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <Card>
        <CardHeader id={`${id}-title`} title={title} description={description} />
        <CardBody className="pt-3">{children}</CardBody>
      </Card>
    </section>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2">
      <span className="num mt-0.5 flex size-6 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-text-2" aria-hidden="true">
        {n}
      </span>
      <div>
        <h3 className="text-[13px] font-semibold text-text">{title}</h3>
        <div className="mt-0.5 space-y-1 text-[13px] text-text-2">{children}</div>
      </div>
    </li>
  );
}

const GLOSSARY: Array<[string, string]> = [
  ["Reserve-eligible capital", "Liquid stablecoins in verified accounts that count toward the protected reserve, valued at no more than $1 per token and after haircuts."],
  ["Protected reserve (requirement)", "The amount your policy says must stay liquid: the strictest of the floor, runway and obligations rules."],
  ["Binding rule", "The reserve rule that produced the largest requirement, and so sets it."],
  ["Coverage", "Reserve-eligible capital divided by the requirement. Below 100% is a shortfall; below your comfort threshold is thin."],
  ["Deployable surplus", "What could be put to work without touching the reserve or exceeding the maximum-deployed limit."],
  ["Obligation horizon", "How many days ahead unpaid obligations are counted in the reserve (for example 90 days)."],
  ["Certainty", "Estimate, committed or invoiced. Your policy decides whether estimates count toward the reserve."],
  ["Haircut", "A percentage your policy deducts from an asset's value for reserve purposes, to allow for depeg or redemption risk."],
  ["Verified account", "An account where a member proved control by signing a message or through the Safe. Unverified balances are tracked but excluded from the reserve by default."],
  ["Venue", "A lending market or ERC-4626 vault where capital could be deployed, such as an Aave v3 market or a Morpho vault."],
  ["Listed for execution", "A venue that passed TokenIQ's integration review. Only listed venues can become proposals; others are reference only."],
  ["Net APY and measurement", "Native yield after fees plus rewards, as measured by the named source. “Instantaneous” means the current rate, which can change within minutes."],
  ["Recommendation", "An action the deterministic policy engine suggests from current data. It becomes a proposal only when a member creates one."],
  ["Proposal", "A specific transaction awaiting internal approval, Safe signatures and execution."],
  ["Policy version", "Every saved policy change creates a new, numbered version with its author and reason. Old versions are never edited."],
  ["Alert fingerprint", "The identity of an alert's exact condition. The same condition updates one alert instead of creating duplicates."],
];

export function HelpView() {
  const { org } = useOrg();
  const members = useOrgQuery<{ members: MemberDto[] }>("/members", { staleTime: 60_000 });
  const steps = [
    { done: org.onboardingSteps.includes("organization"), label: "Create your organization", detail: "Name and purpose", href: "/app/settings?tab=organization" },
    { done: org.onboardingSteps.includes("treasury"), label: "Add treasury accounts", detail: "Safes and wallets TokenIQ reads balances from", href: "/app/accounts" },
    { done: org.onboardingSteps.includes("obligations"), label: "Record obligations", detail: "Payroll, vendors and invoices you expect to pay", href: "/app/obligations" },
    { done: org.onboardingSteps.includes("policy"), label: "Review your reserve policy", detail: "What must stay protected and what may be deployed", href: "/app/reserves" },
    { done: (members.data?.members.length ?? 0) > 1, label: "Invite your team", detail: "Finance, approvers and viewers", href: "/app/team" },
    { done: false, label: "Review recommendations", detail: "See what the policy engine suggests and why", href: "/app/recommendations", neutral: true },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <div>
      <PageHeader title="Help" description="How TokenIQ works, how every number is calculated, and where to get help." />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Help sections" className="min-w-0 lg:sticky lg:top-20 lg:h-fit">
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="block rounded-[var(--radius-control)] px-2.5 py-1.5 text-[13px] text-text-2 hover:bg-sunken hover:text-text">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          <Section id="getting-started" title="Getting started" description={`${done} of ${steps.length - 1} setup steps done for ${org.name}.`}>
            <ol className="space-y-1">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="flex items-start gap-3 rounded-[var(--radius-control)] px-2 py-2 hover:bg-sunken">
                    {s.done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Done" /> : <Circle className="mt-0.5 size-5 shrink-0 text-text-3" aria-label={s.neutral ? "Ongoing" : "Not done"} />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-medium", s.done ? "text-text-2" : "text-text")}>{s.label}</span>
                      <span className="block text-xs text-text-2">{s.detail}</span>
                    </span>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="calculations" title="How calculations work" description="Every figure is computed by a deterministic engine with exact decimal arithmetic. No figure comes from a language model.">
            <ol className="space-y-4">
              <Step n="1" title="Reserve-eligible capital">
                <p>Only liquid stablecoins in verified accounts that your policy includes count. Each token is valued at its oracle price but <strong className="font-medium text-text">never above $1</strong> (EUR stablecoins use the EUR/USD price), then your policy&apos;s haircut for that asset is deducted.</p>
                <p>Balances in unverified accounts are excluded unless your policy says otherwise. Volatile assets and deployed positions never count toward the reserve.</p>
              </Step>
              <Step n="2" title="Requirement = the strictest rule">
                <p>Three rules each produce an amount, and the largest one applies:</p>
                <ul className="ml-4 list-disc space-y-0.5">
                  <li>
                    <strong className="font-medium text-text">Floor:</strong> a fixed minimum you set.
                  </li>
                  <li>
                    <strong className="font-medium text-text">Runway:</strong> months to protect × monthly burn (the larger of your declared burn and your recurring obligations).
                  </li>
                  <li>
                    <strong className="font-medium text-text">Obligations:</strong> unpaid obligations due within the horizon, plus overdue ones, plus a buffer (for example +10%). Expected inflows are shown but never reduce the requirement.
                  </li>
                </ul>
              </Step>
              <Step n="3" title="Coverage and shortfall">
                <p>Coverage is reserve-eligible capital divided by the requirement. Pending proposals that would spend money are counted as already spent.</p>
              </Step>
              <Step n="4" title="Deployable surplus">
                <p>Deployable = the smaller of (reserve-eligible − requirement − pending outflows) and the room under your maximum-deployed limit (that share of the total treasury minus what is already deployed). It is never negative.</p>
                <p>A recommendation then sizes a deposit as the smallest of: deployable surplus, the per-venue and per-protocol limits, your maximum share of the venue&apos;s available liquidity and the source account&apos;s balance, rounded down to $1,000.</p>
              </Step>
              <Step n="5" title="Fresh data or no recommendation">
                <p>If any balance or price is missing or older than your policy allows, totals are flagged as incomplete and recommendations pause until data is complete. Stale figures are always labelled as stale.</p>
              </Step>
            </ol>
            <p className="mt-4 text-xs text-text-3">
              See your own numbers step by step under “How this is calculated” on the{" "}
              <Link href="/app" className="text-accent underline underline-offset-2">
                Overview
              </Link>{" "}
              and on{" "}
              <Link href="/app/reserves" className="text-accent underline underline-offset-2">
                Reserves
              </Link>
              .
            </p>
          </Section>

          <Section id="approvals" title="Approvals, signatures and execution" description="Three separate steps. Each one is shown separately, and none implies the next.">
            <ol className="grid gap-3 md:grid-cols-3">
              <li className="rounded-[var(--radius-control)] border border-hairline p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-text-3">1 · Internal approval</div>
                <p className="mt-1 text-[13px] text-text-2">Members approve or reject the proposal in TokenIQ. Your approval policy sets how many approvals each amount needs, whether an owner must be among them, and whether the proposer may approve. This is a recorded decision; it moves nothing.</p>
              </li>
              <li className="rounded-[var(--radius-control)] border border-hairline p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-text-3">2 · Safe signatures</div>
                <p className="mt-1 text-[13px] text-text-2">TokenIQ prepares the exact Safe transaction and re-checks policy. Safe owners review and sign it in their own wallets until the Safe&apos;s threshold is met. TokenIQ never holds keys.</p>
              </li>
              <li className="rounded-[var(--radius-control)] border border-hairline p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-text-3">3 · On-chain execution</div>
                <p className="mt-1 text-[13px] text-text-2">Someone submits the signed transaction. TokenIQ tracks it and only marks it executed once it is confirmed on-chain. “Submitted” is not “succeeded”.</p>
              </li>
            </ol>
            <p className="mt-3 text-xs text-text-3">
              Change the approval tiers in{" "}
              <Link href="/app/settings?tab=approvals" className="text-accent underline underline-offset-2">
                Settings → Approvals
              </Link>
              .
            </p>
          </Section>

          <Section id="autonomy" title="Autonomy levels" description="Set in the treasury policy. It controls what TokenIQ may do on its own.">
            <dl className="space-y-3 text-[13px]">
              <div>
                <dt className="font-semibold text-text">Observe only</dt>
                <dd className="text-text-2">TokenIQ tracks balances, obligations and risks, and sends alerts. It proposes no actions.</dd>
              </div>
              <div>
                <dt className="font-semibold text-text">Approval required (default)</dt>
                <dd className="text-text-2">TokenIQ recommends actions. A member turns one into a proposal, it needs internal approvals, then Safe signatures, then execution.</dd>
              </div>
              <div>
                <dt className="font-semibold text-text">Bounded automation</dt>
                <dd className="text-text-2">Small, pre-approved actions within strict limits, enforced on-chain by a reserve guard and roles module on your Safe. It cannot be switched on from settings; it requires that on-chain setup.</dd>
              </div>
            </dl>
          </Section>

          <Section id="glossary" title="Glossary">
            <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2">
              {GLOSSARY.map(([term, def]) => (
                <div key={term}>
                  <dt className="text-[13px] font-semibold text-text">{term}</dt>
                  <dd className="text-[13px] text-text-2">{def}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="shortcuts" title="Keyboard shortcuts">
            <dl className="divide-y divide-hairline text-[13px]">
              {(
                [
                  [["⌘", "K"], "Search or jump to any page or action (Ctrl K on Windows and Linux)"],
                  [["Esc"], "Close a dialog, panel or menu"],
                  [["Tab"], "Move to the next control; Shift Tab moves back"],
                  [["←", "→"], "Move between options in tabs and segmented controls"],
                  [["↑", "↓"], "Move through menus, lists and the command palette"],
                  [["Enter"], "Activate the focused button or link"],
                ] as Array<[string[], string]>
              ).map(([keys, what]) => (
                <div key={what} className="flex items-center justify-between gap-4 py-2">
                  <dt className="flex shrink-0 gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="min-w-6 rounded border border-hairline bg-sunken px-1.5 py-0.5 text-center font-mono text-[11px] text-text">
                        {k}
                      </kbd>
                    ))}
                  </dt>
                  <dd className="text-right text-text-2">{what}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="contact" title="Contact and security">
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/contact" className="group rounded-[var(--radius-control)] border border-hairline p-3 hover:bg-sunken">
                <Mail className="size-4 text-text-3" aria-hidden="true" />
                <div className="mt-2 text-[13px] font-semibold text-text">Contact us</div>
                <p className="text-xs text-text-2">Questions, feedback or help with your workspace.</p>
              </Link>
              <Link href="/security" className="group rounded-[var(--radius-control)] border border-hairline p-3 hover:bg-sunken">
                <Lock className="size-4 text-text-3" aria-hidden="true" />
                <div className="mt-2 text-[13px] font-semibold text-text">Security</div>
                <p className="text-xs text-text-2">How TokenIQ protects your data, and how to report a vulnerability.</p>
              </Link>
              <a href="/status" className="group rounded-[var(--radius-control)] border border-hairline p-3 hover:bg-sunken">
                <ExternalLink className="size-4 text-text-3" aria-hidden="true" />
                <div className="mt-2 text-[13px] font-semibold text-text">Service status</div>
                <p className="text-xs text-text-2">Data providers, networks and sync health.</p>
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
