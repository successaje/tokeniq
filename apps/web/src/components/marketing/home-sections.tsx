import { DEFAULT_APPROVAL_POLICY } from "@tokeniq/core";
import { BadgeCheck, BookOpenCheck, CircleSlash, Code, EyeOff, FileClock, KeyRound, Link2, Quote, ScrollText, ShieldCheck, Unplug } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AllocationBar, BucketSwatch } from "@/components/charts/allocation-bar";
import { Callout, StatusBadge } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { DEFAULT_INPUTS, MODEL_FACTS, runModel, runProjection } from "@/lib/marketing-model";
import { CTA } from "@/lib/marketing-site";
import { ExampleVenueCard } from "./example-venue";
import { ExecutionStages, ProposalTracks } from "./execution-flow";
import { INTEGRATIONS, STATUS_LABEL, type IntegrationStatus } from "./integrations-data";
import { LevelChart } from "./level-chart";
import { ButtonLink, Container, IllustrationLabel, Section, SectionHeading, Split } from "./primitives";
import { TreasuryModel } from "./treasury-model";
import { Walkthrough } from "./walkthrough";

const whole = (v: string) => usd(v, { decimals: 0 });

export function HomeHero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-hairline">
      <Container className="pb-14 sm:pb-20">
        <div className="relative pb-10 pt-12 sm:pb-14 sm:pt-16 lg:pt-20">
          {/* Margin rules: the page is set on a ledger, and the rules run into the model's edges. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden border-x border-hairline sm:block" />
          <div className="relative grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
            <div className="sm:px-6 lg:col-span-7 lg:px-8">
              <p className="text-[13px] font-medium text-text-2">Treasury operations for on-chain organizations</p>
              <h1 id="hero-title" className="mt-4 text-[40px] font-medium leading-[44px] tracking-[-0.03em] text-text text-balance sm:text-[56px] sm:leading-[60px] lg:text-[64px] lg:leading-[66px]">
                Make every treasury decision count.
              </h1>
            </div>
            <div className="sm:px-6 lg:col-span-5 lg:pl-0 lg:pr-8">
              <p className="text-[17px] leading-7 text-text-2 text-pretty">
                Know what your organization owes, protect what it cannot risk, and decide what the rest should do. TokenIQ turns balances, obligations and your policy into one answer, with the arithmetic shown.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href={CTA.primary.href} size="lg">
                  {CTA.primary.label}
                </ButtonLink>
                <ButtonLink href={CTA.explore.href} size="lg" variant="secondary">
                  {CTA.explore.label}
                </ButtonLink>
              </div>
              <p className="mt-4 text-xs text-text-3">Free during early access · Read-only to start · Never holds your keys</p>
            </div>
          </div>
        </div>
        <TreasuryModel />
      </Container>
    </section>
  );
}

/* 01 ------------------------------------------------------------------ */

export function ProblemSection() {
  const m = runModel(DEFAULT_INPUTS);
  return (
    <Section id="problem" index="01" label="The problem">
      <Split aside={<SectionHeading id="problem-title" title="A balance is not a budget." lead="A wallet dashboard can tell you that you hold $1.25M. It cannot tell you that $256,000 is already owed this quarter, that your policy keeps $480,000 liquid, or how much is genuinely free." />}>
        <div className="grid gap-4 md:grid-cols-2">
          <figure className="flex flex-col rounded-[var(--radius-card)] border border-hairline bg-surface">
            <figcaption className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
              <span className="text-[13px] font-medium text-text">A wallet dashboard</span>
              <IllustrationLabel>Schematic</IllustrationLabel>
            </figcaption>
            <div className="flex-1 px-4 py-5">
              <p className="text-xs text-text-2">Total balance</p>
              <p className="num mt-1 text-[32px] font-medium leading-none tracking-[-0.02em] text-text">$1,250,000.00</p>
              <ul className="mt-5 divide-y divide-hairline border-y border-hairline text-[13px]">
                {MODEL_FACTS.accounts.map((a) => (
                  <li key={a.label} className="flex justify-between gap-3 py-2">
                    <span className="text-text-2">
                      USDC · {a.network} · {a.label}
                    </span>
                    <span className="num text-text">{Number(a.usdc).toLocaleString("en-US")}.00</span>
                  </li>
                ))}
              </ul>
              <ul className="mt-5 space-y-2 text-[13px] text-text-2">
                {["Can we pay the grant tranche in November?", "How much could we safely put to work?", "What if USDC slips to $0.97?"].map((q) => (
                  <li key={q} className="flex items-start justify-between gap-3">
                    <span>{q}</span>
                    <span className="shrink-0 text-xs text-text-3">No answer</span>
                  </li>
                ))}
              </ul>
            </div>
          </figure>
          <figure className="flex flex-col rounded-[var(--radius-card)] border border-accent/40 bg-surface">
            <figcaption className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
              <span className="text-[13px] font-medium text-text">TokenIQ</span>
              <IllustrationLabel>Schematic</IllustrationLabel>
            </figcaption>
            <div className="flex-1 px-4 py-5">
              <p className="flex items-center gap-2 text-xs text-text-2">
                <BucketSwatch k="deployable" className="size-2.5" />
                Deployable surplus
              </p>
              <p className="num mt-1 text-[32px] font-medium leading-none tracking-[-0.02em] text-text">{usd(m.deployable)}</p>
              <AllocationBar className="mt-5" buckets={m.buckets} total={m.total} shortfall={m.shortfall} showLegend={false} />
              <ul className="mt-5 space-y-2 text-[13px]">
                <Answer q="Grant tranche, due in 45 days" a="Covered" />
                <Answer q="Safe to put to work, with approval" a={whole(m.deployable)} />
                <Answer q="If USDC trades at $0.97" a="−$37,500 deployable" />
              </ul>
            </div>
          </figure>
        </div>
      </Split>
    </Section>
  );
}

function Answer({ q, a }: { q: string; a: string }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span className="text-text-2">{q}</span>
      <span className="num shrink-0 font-medium text-text">{a}</span>
    </li>
  );
}

/* 02 ------------------------------------------------------------------ */

export function ObligationsSection() {
  const p = runProjection(DEFAULT_INPUTS);
  return (
    <Section id="obligations" index="02" label="Obligations" tone="surface">
      <Split
        aside={
          <>
            <SectionHeading
              id="obligations-title"
              title="Your treasury should know what tomorrow costs before investing today’s money."
              lead="Record payroll, vendors, grants and invoices once. TokenIQ turns them into dated payments and counts everything due in your horizon before anything is called deployable."
            />
            <dl className="mt-8 space-y-3 text-[13px]">
              <Certainty term="Estimate" text="An expected cost nobody has agreed yet. Counted only if your policy says so." />
              <Certainty term="Committed" text="Agreed with the counterparty: payroll, a contract, a signed quote." />
              <Certainty term="Invoiced" text="A received invoice that someone has checked." />
              <Certainty term="Paid" text="Matched to an on-chain transfer. Until then, it is still owed." />
            </dl>
          </>
        }
      >
        <div className="rounded-[var(--radius-card)] border border-hairline bg-canvas p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-lg">
              <h3 className="text-[15px] font-semibold text-text">If the {whole(p.deployed)} surplus were deployed today</h3>
              <p className="mt-1 text-[13px] text-text-2">
                The {whole(p.start)} left liquid pays all {p.events.length} obligations due in the next 90 days and its lowest point, {whole(p.lowest.balance)}, stays above the {whole(p.floor)} floor.
              </p>
            </div>
            <IllustrationLabel>Illustrative treasury</IllustrationLabel>
          </div>
          <LevelChart title="Projected liquid balance over 90 days" points={p.points} floor={p.floor} floorLabel="Policy floor" events={p.events} days={90} />
        </div>
      </Split>
    </Section>
  );
}

function Certainty({ term, text }: { term: string; text: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-t border-hairline pt-3">
      <dt className="font-medium text-text">{term}</dt>
      <dd className="text-text-2">{text}</dd>
    </div>
  );
}

/* 03 ------------------------------------------------------------------ */

export function PolicySection() {
  const m = runModel(DEFAULT_INPUTS);
  const rule = (id: string) => m.rules.find((r) => r.id === id)!;
  const cards = [
    { id: "floor", title: "Fixed floor", text: "A minimum that always stays liquid, whatever else is true.", example: `${whole(rule("floor").amount)} floor` },
    { id: "runway", title: "Months of runway", text: "Months of operating spend × the higher of your declared burn and your recorded recurring costs.", example: `6 × ${whole(m.burnUsed)} = ${whole(rule("runway").amount)}` },
    { id: "obligations", title: "Obligations in the horizon", text: "Everything unpaid and due within 30, 60 or 90 days, plus a safety buffer.", example: `${whole(m.obligationsDue)} + 10% = ${whole(rule("obligations").amount)}` },
  ];
  return (
    <Section id="policy" index="03" label="Reserve-first policy">
      <Split aside={<SectionHeading id="policy-title" title="Reserve first. Then everything else." lead="Your policy is a short set of rules your team agrees on. The protected reserve is the strictest of them, so being generous on one rule never weakens another." />}>
        <ol className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-hairline md:grid-cols-3">
          {cards.map((c, i) => {
            const binding = m.binding === c.id;
            return (
              <li key={c.id} className="flex flex-col bg-surface p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-text-3" aria-hidden="true">
                    Rule {i + 1}
                  </span>
                  {binding && <StatusBadge tone="accent">Binding in the example</StatusBadge>}
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-text">{c.title}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-5 text-text-2">{c.text}</p>
                <p className="num mt-4 border-t border-hairline pt-3 text-[13px] font-medium text-text">{c.example}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-text-3">Example values from the illustrative treasury above. The requirement is {whole(m.required)}: the largest of the three.</p>

        <h3 className="mt-12 text-[15px] font-semibold text-text">How capital is counted</h3>
        <ul className="mt-4 grid gap-x-8 gap-y-4 text-[13px] leading-5 sm:grid-cols-2">
          <Rule title="Stablecoins never count above $1">Valued at the oracle price, capped at the peg. A USDC at $1.002 counts as $1.00; at $0.97 it counts as $0.97.</Rule>
          <Rule title="Haircuts, if you set them">A per-asset discount that lowers what counts toward the reserve further.</Rule>
          <Rule title="Unverified accounts are excluded">Until a member proves control of an account, it is tracked but left out of reserve and deployable maths.</Rule>
          <Rule title="Stale data is flagged">Old balances or prices lower the confidence of every figure that depends on them.</Rule>
          <Rule title="Expected income never reduces the reserve">Inflows are shown, but the requirement assumes they may not arrive.</Rule>
          <Rule title="Limits on what can leave">A maximum share of the treasury deployed, plus per-protocol and per-venue caps.</Rule>
          <Rule title="Versioned">Every change creates a new policy version. Recommendations and approvals record the version they were checked against.</Rule>
          <Rule title="Rounded conservatively">Requirements round up and availability rounds down, using exact decimal arithmetic.</Rule>
        </ul>
      </Split>
    </Section>
  );
}

function Rule({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="border-t border-hairline pt-3">
      <p className="font-medium text-text">{title}</p>
      <p className="mt-0.5 text-text-2">{children}</p>
    </li>
  );
}

/* 04 ------------------------------------------------------------------ */

export function OpportunitiesSection() {
  const shown = [
    ["Net and gross rate", "After every fee, and before, side by side."],
    ["Measurement window", "Instantaneous or averaged, with the source and the time."],
    ["Curator", "Who decides where a vault lends."],
    ["Liquidity", "What could be withdrawn now, and your limit as a share of it."],
    ["Fees", "Performance and management fees as line items."],
    ["Warnings", "What could go wrong, in plain words."],
  ];
  return (
    <Section id="opportunities" index="04" label="Opportunities" tone="surface">
      <Split
        aside={
          <>
            <SectionHeading id="opportunities-title" title="Every rate arrives with its context." lead="A yield figure on its own is a headline. For each vetted venue, TokenIQ shows what you would actually earn, how it was measured, and what you would be exposed to." />
            <dl className="mt-8 divide-y divide-hairline border-y border-hairline text-[13px]">
              {shown.map(([t, d]) => (
                <div key={t} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-2.5">
                  <dt className="font-medium text-text">{t}</dt>
                  <dd className="text-text-2">{d}</dd>
                </div>
              ))}
            </dl>
          </>
        }
      >
        <ExampleVenueCard />
        <p className="mt-4 max-w-2xl text-[13px] leading-5 text-text-2">
          Venues are limited to Morpho vaults and Aave v3 markets that meet your policy: allowed networks and assets, a minimum size, a maximum fee. Recommendations never exceed the deployable surplus or your caps.
        </p>
      </Split>
    </Section>
  );
}

/* 05 ------------------------------------------------------------------ */

export function ExecutionSection() {
  return (
    <Section id="execution" index="05" label="Policy-controlled execution">
      <SectionHeading
        id="execution-title"
        title="Checked, approved, signed and executed, each on its own record."
        lead="A recommendation is only a proposal. It must pass deterministic policy checks, your team’s approval and your Safe owners’ signatures before it can run on-chain, and TokenIQ reconciles the result afterwards. No step can stand in for another."
        className="max-w-3xl"
      />
      <ExecutionStages className="mt-10" />
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h3 className="text-[15px] font-semibold text-text">Three tracks, three states</h3>
          <p className="mt-2 text-[13px] leading-5 text-text-2">Approved is not signed, and signed is not executed. TokenIQ shows each separately so nobody mistakes a request for a result.</p>
        </div>
        <ProposalTracks className="lg:col-span-8" />
      </div>
    </Section>
  );
}

/* 06 ------------------------------------------------------------------ */

export function ApprovalsSection() {
  const tiers = DEFAULT_APPROVAL_POLICY.tiers;
  const roles = [
    ["Owner", "Full control, including policies and members"],
    ["Admin", "Members, policies, accounts and settings"],
    ["Finance", "Obligations, payments, accounts and proposals"],
    ["Approver", "Reviews and approves proposals; signs as a Safe owner"],
    ["Viewer", "Read-only access to the treasury and reports"],
  ];
  return (
    <Section id="approvals" index="06" label="Approvals for teams" tone="surface">
      <Split aside={<SectionHeading id="approvals-title" title="Approval rules that match how your team decides." lead="Tiers by amount, separation of duties and expiry are part of the policy, so the rules are written down before anyone needs them." />}>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium text-text-2">Default approval tiers</h3>
            <ol className="mt-3 divide-y divide-hairline border-y border-hairline text-[13px]">
              {tiers.map((t, i) => {
                const lower = i === 0 ? null : tiers[i - 1]!.upToUsd;
                const range = t.upToUsd === null ? `Above ${whole(lower ?? "0")}` : `Up to ${whole(t.upToUsd)}`;
                return (
                  <li key={i} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="num text-text">{range}</span>
                    <span className="text-right text-text-2">
                      {t.requiredApprovals} {t.requiredApprovals === 1 ? "approver" : "approvers"}
                      {t.requiredRole ? `, including an ${t.requiredRole}` : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
            <ul className="mt-5 space-y-2 text-[13px] text-text-2">
              <li className="flex gap-2">
                <CircleSlash className="mt-0.5 size-3.5 shrink-0 text-text-3" aria-hidden="true" />
                {DEFAULT_APPROVAL_POLICY.allowSelfApproval ? "Proposers may approve their own proposals." : "Proposers cannot approve their own proposals."}
              </li>
              <li className="flex gap-2">
                <FileClock className="mt-0.5 size-3.5 shrink-0 text-text-3" aria-hidden="true" />
                Proposals expire after {DEFAULT_APPROVAL_POLICY.proposalTtlHours} hours without full approval.
              </li>
              <li className="flex gap-2">
                <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-text-3" aria-hidden="true" />
                Every tier, threshold and role is editable, and every edit is versioned.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-medium text-text-2">Roles</h3>
            <dl className="mt-3 divide-y divide-hairline border-y border-hairline text-[13px]">
              {roles.map(([r, d]) => (
                <div key={r} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3">
                  <dt className="font-medium text-text">{r}</dt>
                  <dd className="text-text-2">{d}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-text-3">Internal approvals happen in TokenIQ. Safe signatures still come from your Safe owners, with the threshold the Safe enforces.</p>
          </div>
        </div>
      </Split>
    </Section>
  );
}

/* 07 ------------------------------------------------------------------ */

export function CopilotSection() {
  return (
    <Section id="copilot" index="07" label="Copilot">
      <Split
        aside={
          <>
            <SectionHeading id="copilot-title" title="A copilot that explains, cites, and cannot move funds." lead="Ask why a figure changed or what a policy rule means. Answers point to the records they came from. The numbers come from the deterministic engine, never from the model." />
            <ul className="mt-8 space-y-4 text-[13px] leading-5">
              <Prop icon={Quote} title="Cites its sources">Each answer links the policy version, obligations and balances it used. Without a source, it says it does not know.</Prop>
              <Prop icon={Unplug} title="Cannot act">It cannot create proposals, approve, sign, execute or change your policy. Nothing it says moves funds.</Prop>
              <Prop icon={EyeOff} title="Treats outside text as data">Token names, transfer memos, documents and web pages are never followed as instructions.</Prop>
            </ul>
          </>
        }
      >
        <figure className="rounded-[var(--radius-card)] border border-hairline bg-surface">
          <figcaption className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
            <span className="text-[13px] font-medium text-text">Copilot</span>
            <IllustrationLabel />
          </figcaption>
          <div className="space-y-4 px-4 py-5 sm:px-5">
            <div className="ml-auto max-w-md rounded-[var(--radius-card)] bg-sunken px-3.5 py-2.5 text-[14px] text-text">Why is deployable $30,000 lower than last week?</div>
            <div className="max-w-xl text-[14px] leading-6 text-text">
              <p>
                Recurring costs rose to <span className="num font-medium">$85,000</span> a month after the two contractors were added<Cite n={1} />. That is above your declared <span className="num">$80,000</span> burn
                <Cite n={2} />, so the engine uses the higher figure. Your 6-month runway rule now requires <span className="num font-medium">$510,000</span> instead of <span className="num">$480,000</span>
                <Cite n={3} />.
              </p>
            </div>
            <ol className="space-y-1.5 border-t border-hairline pt-3 text-xs text-text-2">
              <li className="flex gap-2">
                <span className="font-mono text-text-3">[1]</span> Obligation · Two contractors · committed, monthly
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-text-3">[2]</span> Treasury policy v3 · monthly burn
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-text-3">[3]</span> Reserve calculation · runway rule
              </li>
            </ol>
          </div>
          <p className="border-t border-hairline px-4 py-2.5 text-xs text-text-3 sm:px-5">The copilot is off unless your deployment configures a model provider. It can be wrong; the cited records are the source of truth.</p>
        </figure>
      </Split>
    </Section>
  );
}

function Cite({ n }: { n: number }) {
  return (
    <sup className="ml-0.5 font-mono text-[10px] text-accent">
      [{n}]<span className="sr-only">, source {n}</span>
    </sup>
  );
}

function Prop({ icon: Icon, title, children }: { icon: typeof Quote; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 border-t border-hairline pt-4">
      <Icon className="mt-0.5 size-4 text-accent" aria-hidden="true" />
      <div>
        <p className="font-medium text-text">{title}</p>
        <p className="mt-0.5 text-text-2">{children}</p>
      </div>
    </li>
  );
}

/* 08 ------------------------------------------------------------------ */

export function WalkthroughSection() {
  return (
    <Section id="tour" index="08" label="Inside TokenIQ" tone="surface">
      <SectionHeading id="tour-title" title="A look inside." lead="Four screens a treasury team uses every week, drawn from the product’s own components. Use the arrow keys to move between them." className="mb-10" />
      <Walkthrough />
    </Section>
  );
}

/* 09 ------------------------------------------------------------------ */

const statusTone: Record<IntegrationStatus, "success" | "info" | "neutral"> = { available: "success", read_only: "info", planned: "neutral" };

export function IntegrationsSection() {
  const featured = ["Safe (smart accounts)", "Chainlink price feeds", "Morpho vaults", "Aave v3", "Browser wallets (EIP-6963) and WalletConnect", "Zodiac Roles (bounded automation)"];
  const rows = INTEGRATIONS.filter((i) => featured.includes(i.name));
  return (
    <Section id="integrations" index="09" label="Integrations and networks">
      <Split
        aside={
          <>
            <SectionHeading id="integrations-title" title="Works with the infrastructure you already use." lead="TokenIQ reads from your Safes and public data sources, and prepares transactions for your owners to sign. Support is stated plainly, including what is not built yet." />
            <ButtonLink href="/integrations" variant="quiet" arrow className="mt-6">
              All integrations and their status
            </ButtonLink>
          </>
        }
      >
        <div className="flex flex-wrap gap-2" aria-label="Supported networks">
          {["Ethereum", "Base", "Arbitrum One", "OP Mainnet"].map((n) => (
            <span key={n} className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] border border-hairline bg-surface px-3 text-[13px] font-medium text-text">
              <Link2 className="size-3.5 text-text-3" aria-hidden="true" />
              {n}
            </span>
          ))}
          <span className="inline-flex h-9 items-center rounded-[var(--radius-control)] border border-dashed border-hairline px-3 text-[13px] text-text-2">Testnets: Sepolia, Base Sepolia</span>
        </div>
        <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
          {rows.map((r) => (
            <li key={r.name} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[14rem_minmax(0,1fr)_auto]">
              <p className="text-[14px] font-medium text-text">{r.name}</p>
              <p className="text-[13px] leading-5 text-text-2">{r.does}</p>
              <div className="sm:justify-self-end">
                <StatusBadge tone={statusTone[r.status]}>{STATUS_LABEL[r.status]}</StatusBadge>
              </div>
            </li>
          ))}
        </ul>
      </Split>
    </Section>
  );
}

/* 10 ------------------------------------------------------------------ */

export function SecuritySection() {
  const facts: Array<{ icon: typeof KeyRound; title: string; text: string }> = [
    { icon: KeyRound, title: "No keys, ever", text: "TokenIQ never holds private keys or seed phrases and is never an owner of your Safe." },
    { icon: BookOpenCheck, title: "Read-only to start", text: "Tracking an account needs only its address. Nothing can move without your Safe owners’ signatures." },
    { icon: ShieldCheck, title: "Deterministic checks", text: "Policy checks are code, not a model. They block a proposal that would break your reserve or limits." },
    { icon: ScrollText, title: "Append-only audit log", text: "Policy changes, approvals, signatures and executions are recorded and cannot be edited afterwards." },
    { icon: Code, title: "Public source code", text: "The calculation engine and the application code are published for review, so the maths can be checked." },
  ];
  return (
    <Section id="security" index="10" label="Security and trust" tone="surface">
      <Split
        aside={
          <>
            <SectionHeading id="security-title" title="Non-custodial by design. Honest about what is verified." lead="Trust should rest on evidence you can check, not on badges. Here is what we can show, and what we cannot yet." />
            <ButtonLink href="/security" variant="quiet" arrow className="mt-6">
              Security model, threat summary and limitations
            </ButtonLink>
          </>
        }
      >
        <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-hairline sm:grid-cols-2">
          {facts.map((f) => (
            <li key={f.title} className="bg-surface p-4 sm:p-5">
              <f.icon className="size-4 text-accent" aria-hidden="true" />
              <p className="mt-3 text-[14px] font-medium text-text">{f.title}</p>
              <p className="mt-1 text-[13px] leading-5 text-text-2">{f.text}</p>
            </li>
          ))}
          <li className="bg-surface p-4 sm:p-5">
            <BadgeCheck className="size-4 text-warning" aria-hidden="true" />
            <p className="mt-3 text-[14px] font-medium text-text">Internal self-review only</p>
            <p className="mt-1 text-[13px] leading-5 text-text-2">The code has been reviewed by the team that wrote it. It has not had an independent security audit, and we hold no certifications.</p>
          </li>
        </ul>
      </Split>
    </Section>
  );
}

/* Final ---------------------------------------------------------------- */

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="border-t border-hairline bg-canvas">
      <Container className="py-20 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h2 id="final-cta-title" className="text-[32px] font-medium leading-[38px] tracking-[-0.025em] text-text text-balance sm:text-[44px] sm:leading-[50px]">
              Start read-only. Decide with evidence.
            </h2>
            <p className="mt-4 max-w-xl text-[16px] leading-7 text-text-2">Add a Safe address and record what you owe. TokenIQ needs no keys and no signatures to show you what is protected, what is owed and what is free.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
            <ButtonLink href={CTA.primary.href} size="lg">
              {CTA.primary.label}
            </ButtonLink>
            <ButtonLink href="/product" size="lg" variant="secondary">
              Explore the platform
            </ButtonLink>
          </div>
        </div>
        <Callout tone="neutral" className={cn("mt-12 max-w-3xl")}>
          TokenIQ is software for treasury operations, not an investment adviser. Deploying stablecoins into protocols carries smart contract, liquidity and depeg risk. Read the{" "}
          <Link href="/legal/risks" className="font-medium text-accent hover:underline">
            risk disclosure
          </Link>
          .
        </Callout>
      </Container>
    </section>
  );
}
