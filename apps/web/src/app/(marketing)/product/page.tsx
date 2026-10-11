import type { Metadata } from "next";
import { FinalCta } from "@/components/marketing/home-sections";
import { ButtonLink, PageIntro, Section, SectionHeading, Split } from "@/components/marketing/primitives";
import { Walkthrough } from "@/components/marketing/walkthrough";
import { CTA, pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "Product",
  description: "Balances, obligations, reserve policy, vetted opportunities, approvals and monitoring for on-chain treasuries, in one workspace. Non-custodial and read-only to start.",
  path: "/product",
});

const MODULES: Array<{ group: string; items: Array<{ name: string; text: string }> }> = [
  {
    group: "Know",
    items: [
      { name: "Overview", text: "What you control, owe, must protect and can deploy, with the arithmetic one click away." },
      { name: "Balances and accounts", text: "Holdings by asset, network and account. Accounts are added by address, verified by signature, and synced on a schedule." },
      { name: "Allocations", text: "Current positions in Morpho and Aave v3, with what could be withdrawn right now." },
    ],
  },
  {
    group: "Plan",
    items: [
      { name: "Obligations", text: "Payroll, vendors, grants and invoices, each with its certainty and schedule." },
      { name: "Payments", text: "What was paid, matched to on-chain transfers, so an obligation only counts as paid with evidence." },
      { name: "Reserves", text: "The policy requirement, coverage, a projected balance over the horizon, and stress tests such as a depeg or a new cost." },
    ],
  },
  {
    group: "Decide",
    items: [
      { name: "Opportunities", text: "Vetted venues with net and gross rates, measurement windows, liquidity, fees, curators and warnings, filtered by your policy." },
      { name: "Recommendations", text: "Policy-checked proposals with their reasoning. They never exceed the deployable surplus or your limits." },
      { name: "Approvals", text: "Internal approval, Safe signatures and on-chain execution, each tracked separately with its own state." },
      { name: "Copilot", text: "Questions about your treasury answered with citations to your own records. It cannot act." },
    ],
  },
  {
    group: "Monitor",
    items: [
      { name: "Risk alerts", text: "Reserve shortfalls, overdue or unfunded obligations, depegs, stale data, concentration, venue liquidity and L2 sequencer outages, each with evidence and a next step." },
      { name: "Activity", text: "An append-only audit trail of policy changes, approvals, signatures and executions." },
      { name: "Reports", text: "Snapshots and CSV exports for your board, accountant or community." },
    ],
  },
];

const AUDIENCES = [
  { who: "Web3 startups", job: "Pay the team and vendors on time from a stablecoin treasury, and know how much runway is really protected before anyone suggests earning yield on the rest." },
  { who: "DAO treasury teams", job: "Show token holders what is committed to grants and contributors, apply a policy the DAO agreed on, and keep every move behind multi-person approval and Safe signatures." },
  { who: "Protocol finance teams", job: "Run operating finances like a finance function: obligations, reserve rules, concentration limits and a record that survives audits and team changes." },
];

export default function ProductPage() {
  return (
    <>
      <PageIntro
        eyebrow="Product"
        title="One workspace for what you hold, what you owe, and what is free."
        lead="TokenIQ connects read-only to your Safes, records your obligations, applies your reserve policy, and routes every allocation through approval and signatures. Every figure shows how it was calculated."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={CTA.primary.href} size="lg">
            {CTA.primary.label}
          </ButtonLink>
          <ButtonLink href="/how-it-works" size="lg" variant="secondary">
            See how it works
          </ButtonLink>
        </div>
      </PageIntro>

      <Section id="modules" index="01" label="Capabilities">
        <div className="space-y-12">
          {MODULES.map((g) => (
            <Split key={g.group} aside={<h2 className="text-[22px] font-medium tracking-[-0.015em] text-text">{g.group}</h2>}>
              <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-hairline sm:grid-cols-2">
                {g.items.map((it) => (
                  <li key={it.name} className="bg-surface p-4 sm:p-5">
                    <h3 className="text-[15px] font-semibold text-text">{it.name}</h3>
                    <p className="mt-1 text-[13px] leading-5 text-text-2">{it.text}</p>
                  </li>
                ))}
              </ul>
            </Split>
          ))}
        </div>
      </Section>

      <Section id="tour" index="02" label="Inside TokenIQ" tone="surface">
        <SectionHeading id="tour-title" title="A look inside." lead="Four screens drawn from the product’s own components, with example data." className="mb-10" />
        <Walkthrough />
      </Section>

      <Section id="who" index="03" label="Who it is for">
        <Split aside={<SectionHeading id="who-title" title="Built for small teams that run real finances on-chain." lead="TokenIQ is for organizations holding stablecoins in Safes that have payroll, vendors and grants to pay, and a few people who must agree before money moves." />}>
          <dl className="divide-y divide-hairline border-y border-hairline">
            {AUDIENCES.map((a) => (
              <div key={a.who} className="grid gap-2 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
                <dt className="text-[15px] font-semibold text-text">{a.who}</dt>
                <dd className="text-[14px] leading-6 text-text-2">{a.job}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[13px] text-text-3">TokenIQ is in early access. We do not show customer names or logos because we have none to show yet.</p>
        </Split>
      </Section>
      <FinalCta />
    </>
  );
}
