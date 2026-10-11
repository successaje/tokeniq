import { Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageIntro, Section, SectionHeading, Split } from "@/components/marketing/primitives";
import { Callout, StatusBadge } from "@/components/ui/status";
import { contactEmails, pageMetadata, sourceUrl } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "Security",
  description: "TokenIQ’s security model: non-custodial, no keys, deterministic policy checks, separate approval and signing, an append-only audit log, a threat model summary, data handling, responsible disclosure and known limitations.",
  path: "/security",
});

const MODEL: Array<{ title: string; text: string }> = [
  { title: "Custody", text: "TokenIQ never holds private keys or seed phrases and is never an owner of your Safe. Funds stay in accounts you control." },
  { title: "Authority", text: "Moving funds needs internal approval in TokenIQ and signatures from your Safe owners in their own wallets. The Safe enforces its threshold, not TokenIQ." },
  { title: "Determinism", text: "Reserve, limits and policy checks are plain code with exact decimal arithmetic. No language model computes or approves a figure." },
  { title: "Copilot boundary", text: "The copilot reads your records and explains them. It cannot create proposals, approve, sign, execute or change policy." },
  { title: "Data integrity", text: "Stale prices and balances are flagged; L2 prices are gated on the sequencer uptime feed; USD stablecoins are never valued above $1." },
];

const CONTROLS: string[] = [
  "Sign-in with one-time email codes, passkeys or a wallet signature",
  "Role-based permissions enforced by the API, not only hidden in the interface",
  "Approval tiers by amount, with no self-approval by default",
  "Proposals expire if not approved in time",
  "Account control proven by signature before it counts toward the reserve",
  "Exact-amount token approvals, never unlimited",
  "Transactions simulated before submission",
  "Signatures checked against the Safe’s current owners",
  "Idempotency keys on financial writes, so a retry never doubles an action",
  "Append-only audit log of policy changes, approvals, signatures and executions",
  "Content Security Policy and strict security headers",
  "Rate limits on the copilot",
];

const THREATS: Array<{ threat: string; mitigation: string; residual: string }> = [
  {
    threat: "TokenIQ’s servers or database are compromised",
    mitigation: "No keys exist to steal. An attacker could show wrong figures or prepare a bad transaction, but owners must still sign it in their wallets after reviewing it, and it is simulated first.",
    residual: "Owners must check what they sign.",
  },
  {
    threat: "A team member acts maliciously or makes a mistake",
    mitigation: "Roles, amount-based approval tiers, no self-approval, expiry, and an audit log that cannot be edited.",
    residual: "Enough colluding approvers and Safe signers can still move funds, as with any multisig.",
  },
  {
    threat: "Prompt injection through token names, memos or records",
    mitigation: "Outside text is passed to the copilot as data and never as instructions. The copilot has no tools that act.",
    residual: "It could still give a misleading explanation; the cited records and the engine’s figures are the source of truth.",
  },
  {
    threat: "A price feed fails or a stablecoin depegs",
    mitigation: "Chainlink feeds with heartbeat checks, sequencer gating on L2s, the $1 cap, haircuts, and depeg alerts.",
    residual: "A feed can be wrong without looking stale.",
  },
  {
    threat: "An RPC endpoint or data API is down or wrong",
    mitigation: "Freshness on every figure, provider health on the status page, and stale data blocks proposals.",
    residual: "Fresh but incorrect data from a provider may not be detected.",
  },
  {
    threat: "A lending venue is exploited or freezes withdrawals",
    mitigation: "Only vetted Morpho and Aave v3 venues, minimum size, fee limits, per-venue and per-protocol caps, a cap on your share of venue liquidity, and warnings.",
    residual: "Deployed funds can be lost. Caps limit exposure; they do not remove it.",
  },
  {
    threat: "Phishing and impersonation",
    mitigation: "Passkeys are supported, and TokenIQ never asks for a key or seed phrase.",
    residual: "A user can still be tricked into signing something elsewhere.",
  },
];

export default function SecurityPage() {
  const { security } = contactEmails();
  const source = sourceUrl();
  return (
    <>
      <PageIntro
        eyebrow="Security"
        title="Non-custodial by design. Honest about what is verified."
        lead="This page states what protects you, how we think about threats, what data we keep, and what has not been verified yet."
      >
        <Callout tone="warning" title="Internal self-review, not an independent audit" className="max-w-3xl">
          TokenIQ’s code has been reviewed by the team that wrote it. It has not been audited by an independent security firm, and TokenIQ holds no security certifications. We will update this page if that changes.
        </Callout>
      </PageIntro>

      <Section id="model" index="01" label="Security model">
        <Split aside={<SectionHeading id="model-title" title="Five properties we design around." lead="If any of these stops being true, it is a security bug." />}>
          <dl className="divide-y divide-hairline border-y border-hairline">
            {MODEL.map((m) => (
              <div key={m.title} className="grid gap-2 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
                <dt className="text-[15px] font-semibold text-text">{m.title}</dt>
                <dd className="text-[14px] leading-6 text-text-2">{m.text}</dd>
              </div>
            ))}
          </dl>
        </Split>
      </Section>

      <Section id="controls" index="02" label="Controls" tone="surface">
        <Split aside={<SectionHeading id="controls-title" title="Controls in the product today." lead="Each of these is implemented, not planned." />}>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {CONTROLS.map((c) => (
              <li key={c} className="border-t border-hairline py-3 text-[14px] leading-6 text-text">
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-[13px] text-text-2">
            <span className="font-medium text-text">Source code</span>
            {source ? (
              <a href={source} className="text-accent underline underline-offset-2" rel="noreferrer">
                {source.replace(/^https:\/\//, "")}
              </a>
            ) : (
              <>
                <StatusBadge tone="neutral">Repository link not configured</StatusBadge>
                <span className="text-text-3">Set NEXT_PUBLIC_SOURCE_URL to publish it here.</span>
              </>
            )}
          </div>
        </Split>
      </Section>

      <Section id="threats" index="03" label="Threat model summary">
        <SectionHeading id="threats-title" title="What could go wrong, and what stands in the way." lead="A summary, not an exhaustive analysis. Residual risk is the part no control removes." className="max-w-3xl" />
        <div className="mt-10 border-t border-hairline">
          {THREATS.map((t) => (
            <div key={t.threat} className="grid gap-3 border-b border-hairline py-5 lg:grid-cols-12 lg:gap-8">
              <h3 className="text-[15px] font-semibold leading-6 text-text lg:col-span-3">{t.threat}</h3>
              <div className="lg:col-span-6">
                <p className="text-xs font-medium text-text-2">Mitigation</p>
                <p className="mt-1 text-[14px] leading-6 text-text">{t.mitigation}</p>
              </div>
              <div className="lg:col-span-3">
                <p className="text-xs font-medium text-text-2">Residual risk</p>
                <p className="mt-1 text-[14px] leading-6 text-text-2">{t.residual}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="data" index="04" label="Data handling" tone="surface">
        <Split aside={<SectionHeading id="data-title" title="What we keep, and what we never see." />}>
          <div className="grid gap-8 md:grid-cols-2">
            <Block title="Stored">
              <li>Your email address, name and organization membership</li>
              <li>Account addresses you add, and balance and price snapshots</li>
              <li>Obligations, payments, policies and their versions</li>
              <li>Proposals, approvals, signatures, transaction hashes and the audit log</li>
              <li>Copilot conversations, if the copilot is enabled</li>
            </Block>
            <Block title="Never stored or requested">
              <li>Private keys, seed phrases or wallet passwords</li>
              <li>Bank or card details: early access is free</li>
              <li>Anything from your wallet beyond the signatures you choose to give</li>
            </Block>
          </div>
          <p className="mt-8 max-w-2xl text-[14px] leading-6 text-text-2">
            Balances are read from public blockchains through RPC providers, prices from Chainlink feeds, and vault data from Morpho’s public API. When the copilot is enabled, the question and the records it needs are sent to the configured model provider. See the{" "}
            <Link href="/legal/privacy" className="text-accent underline underline-offset-2">
              privacy notice
            </Link>{" "}
            (draft).
          </p>
        </Split>
      </Section>

      <Section id="disclosure" index="05" label="Responsible disclosure">
        <Split aside={<SectionHeading id="disclosure-title" title="Found a vulnerability? Tell us first." lead="Please report it privately and give us reasonable time to fix it before disclosing it publicly." />}>
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-5">
            <p className="text-xs font-medium text-text-2">Security contact</p>
            {security ? (
              <a href={`mailto:${security}`} className="mt-2 inline-flex items-center gap-2 text-[18px] font-medium text-accent underline-offset-4 hover:underline">
                <Mail className="size-4" aria-hidden="true" />
                {security}
              </a>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-mono text-[15px] text-text-2">security@</span>
                <StatusBadge tone="warning">To be configured</StatusBadge>
                <span className="text-[13px] text-text-3">This deployment has not set NEXT_PUBLIC_SECURITY_EMAIL.</span>
              </div>
            )}
            <ul className="mt-5 space-y-2 border-t border-hairline pt-4 text-[14px] leading-6 text-text-2">
              <li>Include steps to reproduce, the affected URL or component, and the impact you expect.</li>
              <li>Only test against accounts and data you own. Do not access other organizations’ data or disrupt the service.</li>
              <li>Never send keys or seed phrases. We will never ask for them.</li>
              <li>There is no bug bounty programme at this time.</li>
            </ul>
          </div>
        </Split>
      </Section>

      <Section id="limitations" index="06" label="Known limitations" tone="surface">
        <Split aside={<SectionHeading id="limitations-title" title="What is not done yet." lead="Stated plainly, so you can weigh it." />}>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {[
              "No independent security audit and no certifications (for example SOC 2).",
              "Early-access software: expect changes and occasional defects.",
              "Execution supports Safe 1.3.0 and later only.",
              "Morpho’s public API has no service-level agreement; vault data can be delayed.",
              "Correctness depends on RPC providers and price feeds that TokenIQ does not control.",
              "The copilot can be wrong. Its citations, not its prose, are the source of truth.",
              "Bounded automation is planned, not available: every action needs people.",
              "Legal documents on this site are drafts pending review by counsel.",
            ].map((t) => (
              <li key={t} className="border-t border-hairline py-3 text-[14px] leading-6 text-text">
                {t}
              </li>
            ))}
          </ul>
        </Split>
      </Section>
    </>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-text-2">{title}</h3>
      <ul className="mt-3 space-y-2 border-t border-hairline pt-3 text-[14px] leading-6 text-text [&>li]:pl-0">{children}</ul>
    </div>
  );
}
