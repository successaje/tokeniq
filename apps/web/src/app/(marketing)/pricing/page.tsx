import { Check } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink, PageIntro, Section, SectionHeading, Split } from "@/components/marketing/primitives";
import { CTA, pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description: "TokenIQ is free during early access. Pricing has not been set; it will be announced on this page before any charge applies.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <PageIntro eyebrow="Pricing" title="Free during early access." lead="Pricing has not been set yet. We would rather say that than invent tiers. There is no paid plan today, and TokenIQ does not ask for payment details.">
        <ButtonLink href={CTA.primary.href} size="lg">
          {CTA.primary.label}
        </ButtonLink>
      </PageIntro>
      <Section id="included" index="01" label="What early access includes">
        <Split aside={<SectionHeading id="included-title" title="The whole product, as it exists today." lead="Early access is not a trial with features held back." />}>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {[
              "Tracking for your Safes and wallets on supported networks",
              "Obligations, payments and reserve policy",
              "Opportunities, recommendations and stress tests",
              "Approvals, Safe signing and execution tracking",
              "Team members and roles",
              "Copilot, where the deployment has configured it",
              "Reports and CSV exports",
              "The sample workspace for evaluation",
            ].map((t) => (
              <li key={t} className="flex gap-2.5 border-t border-hairline py-3 text-[14px] leading-6 text-text">
                <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </Split>
      </Section>
      <Section id="later" index="02" label="Questions" tone="surface">
        <Split aside={<SectionHeading id="later-title" title="About paying later." />}>
          <dl className="divide-y divide-hairline border-y border-hairline">
            {[
              ["Will it stay free?", "Not necessarily. Pricing will be announced on this page before any charge applies."],
              ["Can we take our data with us?", "Yes. Reports and CSV exports are available today."],
              ["Does TokenIQ take a fee on deployed funds or yield?", "No. TokenIQ takes no fee from your funds, deposits or returns. Venues charge their own fees, which TokenIQ shows."],
            ].map(([q, a]) => (
              <div key={q} className="grid gap-2 py-5 sm:grid-cols-[16rem_minmax(0,1fr)] sm:gap-6">
                <dt className="text-[15px] font-semibold text-text">{q}</dt>
                <dd className="text-[14px] leading-6 text-text-2">{a}</dd>
              </div>
            ))}
          </dl>
        </Split>
      </Section>
    </>
  );
}
