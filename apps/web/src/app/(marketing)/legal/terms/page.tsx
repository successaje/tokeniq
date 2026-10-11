import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({ title: "Terms of use (draft)", description: "The terms for using TokenIQ during early access. Draft pending legal review.", path: "/legal/terms" });

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="11 October 2026" current="/legal/terms" intro="These terms govern your use of TokenIQ’s website and application. By creating an account or using the service you agree to them on behalf of yourself and the organization you represent.">
      <h2>1. The service</h2>
      <p>
        TokenIQ is software that helps organizations track stablecoin treasuries, record obligations, apply a reserve policy, review allocation proposals and coordinate approvals and Safe signatures. TokenIQ is <strong>non-custodial</strong>: it never holds your funds, private keys or seed phrases and cannot move funds on its own.
      </p>
      <h2>2. Early access</h2>
      <p>The service is provided free of charge during early access. Features may change, be limited or be withdrawn. Pricing, if introduced, will be published before any charge applies.</p>
      <h2>3. Your responsibilities</h2>
      <ul>
        <li>Keep your sign-in methods, wallets and keys secure. You are responsible for everything you and your organization’s members sign.</li>
        <li>Review every transaction in your own wallet before signing it. TokenIQ’s description of a transaction does not replace your own check.</li>
        <li>Make sure the obligations, policies and other data you enter are accurate. The figures TokenIQ shows depend on them.</li>
        <li>Use the service lawfully, and only for organizations you are authorised to act for.</li>
      </ul>
      <h2>4. No advice</h2>
      <p>
        TokenIQ does not provide investment, financial, legal, tax or accounting advice. Recommendations are the output of rules your organization configures; the copilot explains your own data and can be wrong. Decisions, and their consequences, are yours. Read the{" "}
        <Link href="/legal/risks">risk disclosure</Link>.
      </p>
      <h2>5. Third-party protocols and data</h2>
      <p>TokenIQ shows and prepares interactions with protocols, networks and data sources it does not control, including Safe, Morpho, Aave, Chainlink and RPC providers. Their availability, accuracy and security are not guaranteed by TokenIQ.</p>
      <h2>6. Acceptable use</h2>
      <p>Do not attempt to access other organizations’ data, disrupt the service, reverse-engineer it to circumvent security, or use it to break the law, including sanctions law.</p>
      <h2>7. Availability</h2>
      <p>We aim to keep the service available but do not promise uninterrupted operation. Current status is published on the <Link href="/status">status page</Link>.</p>
      <h2>8. Disclaimers and liability</h2>
      <p>[To be completed by counsel.] The service is provided “as is” during early access, without warranties of any kind to the extent permitted by law. [Limitation of liability, indemnities and caps to be added.]</p>
      <h2>9. Changes and termination</h2>
      <p>We may update these terms and will post the new version here with its date. You may stop using the service at any time. [Notice periods and data export on termination to be specified.]</p>
      <h2>10. Governing law</h2>
      <p>[Governing law and venue to be determined.]</p>
      <h2>Contact</h2>
      <p>
        See the <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
