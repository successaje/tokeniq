import type { Metadata } from "next";
import { WorkedExample } from "@/components/marketing/docs-content";
import { ExecutionStages, ProposalTracks } from "@/components/marketing/execution-flow";
import { FinalCta } from "@/components/marketing/home-sections";
import { ButtonLink, PageIntro, Section, SectionHeading, Split } from "@/components/marketing/primitives";
import { TreasuryModel } from "@/components/marketing/treasury-model";
import { DEFAULT_INPUTS } from "@/lib/marketing-model";
import { CTA, pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "How it works",
  description: "From a Safe address to a policy-checked, approved and signed allocation: the TokenIQ workflow and the exact calculation behind the deployable surplus, with a worked example.",
  path: "/how-it-works",
});

const STEPS: Array<{ title: string; you: string; tokeniq: string; never: string }> = [
  {
    title: "Connect accounts, read-only",
    you: "Paste the address of each Safe or wallet and pick its network.",
    tokeniq: "Reads balances and positions, prices them with Chainlink feeds, and flags anything stale.",
    never: "Asks for a key, a seed phrase or a signature to read.",
  },
  {
    title: "Verify control",
    you: "Sign a message with an owner’s wallet.",
    tokeniq: "Counts the account toward the reserve and deployable maths once control is proven.",
    never: "Counts an unverified account by default.",
  },
  {
    title: "Record obligations",
    you: "Add payroll, vendors, grants and invoices with amounts, dates and certainty.",
    tokeniq: "Expands them into dated payments and works out your monthly burn from recurring costs.",
    never: "Treats an estimate as an invoice, or an invoice as paid.",
  },
  {
    title: "Agree a policy",
    you: "Pick a preset and adjust runway, floor, horizon, buffer and limits.",
    tokeniq: "Versions every change and applies the strictest rule.",
    never: "Lets a language model interpret or change the policy.",
  },
  {
    title: "Read the answer",
    you: "Open the Overview.",
    tokeniq: "Shows what is protected, owed and deployable, the arithmetic behind each, and the confidence of the inputs.",
    never: "Presents stale or incomplete data as current.",
  },
  {
    title: "Review a recommendation",
    you: "Read the proposal, its checks and the venue’s risk context.",
    tokeniq: "Proposes allocations within the deployable surplus and every cap, into vetted Morpho and Aave v3 venues only.",
    never: "Recommends more than the policy allows.",
  },
  {
    title: "Approve, sign, execute",
    you: "Approvers approve in TokenIQ; Safe owners sign in their wallets; a signer submits.",
    tokeniq: "Prepares and simulates the exact transaction, checks signatures, then tracks the receipt and execution event.",
    never: "Signs, submits, or calls a submitted transaction a success.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="How it works"
        title="From an address to a decision you can defend."
        lead="TokenIQ follows the order a careful finance team would: know what you hold, know what you owe, protect what you cannot risk, and only then decide what the rest should do."
      />

      <Section id="workflow" index="01" label="The workflow">
        <ol className="border-t border-hairline">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid gap-4 border-b border-hairline py-6 lg:grid-cols-12 lg:gap-8">
              <div className="flex items-baseline gap-3 lg:col-span-4">
                <span className="font-mono text-[11px] text-text-3" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[18px] font-medium tracking-[-0.01em] text-text">{s.title}</h2>
              </div>
              <dl className="grid gap-4 text-[13px] leading-5 sm:grid-cols-3 lg:col-span-8">
                <div>
                  <dt className="text-xs font-medium text-text-2">You</dt>
                  <dd className="mt-1 text-text">{s.you}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-accent">TokenIQ</dt>
                  <dd className="mt-1 text-text">{s.tokeniq}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-text-3">Never</dt>
                  <dd className="mt-1 text-text-2">{s.never}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="calculation" index="02" label="The calculation" tone="surface">
        <Split
          aside={
            <>
              <SectionHeading
                id="calculation-title"
                title="The deployable surplus, line by line."
                lead="The protected reserve is the strictest of three rules. Deployable is what remains of reserve-eligible stablecoins after it, limited by the maximum share of the treasury you allow in protocols."
              />
              <ol className="mt-8 space-y-3 border-t border-hairline pt-4 text-[13px] leading-5 text-text-2">
                <li>
                  <span className="font-medium text-text">Reserve-eligible</span> = liquid stablecoins in verified accounts, valued at the oracle price but never above $1, minus haircuts.
                </li>
                <li>
                  <span className="font-medium text-text">Requirement</span> = max(fixed floor, runway months × monthly burn, obligations due in the horizon × (1 + buffer)).
                </li>
                <li>
                  <span className="font-medium text-text">Deployable</span> = min(reserve-eligible − requirement − pending, gross × max deployed − already deployed), never below zero.
                </li>
              </ol>
              <ButtonLink href="/docs/calculation-reference" variant="quiet" arrow className="mt-6">
                Full calculation reference
              </ButtonLink>
            </>
          }
        >
          <TreasuryModel />
          <div className="mk-prose mt-10">
            <h3>Worked example</h3>
            <p>The same illustrative treasury at its starting settings, as a statement. Every amount is computed by the engine when this page is built.</p>
            <WorkedExample inputs={DEFAULT_INPUTS} caption="6 months of runway, 90-day horizon, no events" />
          </div>
        </Split>
      </Section>

      <Section id="execution" index="03" label="From proposal to execution">
        <SectionHeading id="execution-title" title="Five steps, three separate tracks." lead="Deterministic checks, internal approval, Safe signatures, on-chain execution and confirmation. No step can stand in for another, and each leaves its own record." className="max-w-3xl" />
        <ExecutionStages className="mt-10" />
        <ProposalTracks className="mt-10" />
      </Section>

      <Section id="limits" index="04" label="What TokenIQ will not do" tone="surface">
        <Split aside={<SectionHeading id="limits-title" title="Constraints are the product." lead="These are design decisions, not settings." />}>
          <ul className="grid gap-x-8 gap-y-4 text-[14px] leading-6 sm:grid-cols-2">
            {[
              "Hold private keys or seed phrases, or become a Safe owner.",
              "Move funds without your team’s approval and your Safe owners’ signatures.",
              "Value a USD stablecoin above $1 for the reserve.",
              "Reduce the reserve because income is expected.",
              "Let the copilot create proposals, approve, sign or execute.",
              "Show a rate without its measurement window and source.",
              "Call a submitted transaction a success before it is confirmed.",
              "Give investment advice.",
            ].map((t) => (
              <li key={t} className="border-t border-hairline pt-3 text-text">
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ButtonLink href={CTA.primary.href}>{CTA.primary.label}</ButtonLink>
          </div>
        </Split>
      </Section>
      <FinalCta />
    </>
  );
}
