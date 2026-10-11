import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({ title: "Privacy notice (draft)", description: "What personal data TokenIQ collects, why, who processes it and your rights. Draft pending legal review.", path: "/legal/privacy" });

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice" updated="11 October 2026" current="/legal/privacy" intro="This notice explains what personal data TokenIQ collects when you use the website and the application, why, and what you can do about it.">
      <h2>Who is responsible</h2>
      <p>TokenIQ is operated by [legal entity name, registered address and company number to be added]. That entity is the controller of the personal data described here.</p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong>: your email address, name, the organizations you belong to and your role. If you add a passkey or sign in with a wallet, we store the public credential or the wallet address, never a private key.
        </li>
        <li>
          <strong>Treasury data you enter</strong>: account addresses, labels, obligations, payments, policies, proposals, approvals and comments.
        </li>
        <li>
          <strong>Public blockchain data</strong>: balances, positions and transactions of the addresses you add, read from public networks.
        </li>
        <li>
          <strong>Copilot conversations</strong>, if your organization uses the copilot.
        </li>
        <li>
          <strong>Technical data</strong>: IP address, browser type and request logs, used to secure and operate the service.
        </li>
      </ul>
      <h2>Cookies and local storage</h2>
      <p>We use a session cookie to keep you signed in, and your browser’s local storage to remember preferences such as light or dark appearance. We do not use advertising cookies or third-party analytics.</p>
      <h2>Why we use it</h2>
      <ul>
        <li>To provide the service you asked for (performance of a contract).</li>
        <li>To keep it secure, prevent abuse and keep an audit trail your organization relies on (legitimate interests).</li>
        <li>To send sign-in codes, team invitations and critical risk alerts by email, and to show in-app notifications such as approval requests.</li>
        <li>To meet legal obligations.</li>
      </ul>
      <p>We do not sell personal data and do not use it for advertising.</p>
      <h2>Who processes it for us</h2>
      <p>
        Service providers that host the application and database, deliver email, provide blockchain RPC access and, when the copilot is enabled, run the language model. When you ask the copilot a question, the question and the records it needs are sent to that model provider. [A list of
        sub-processors, their locations and safeguards for international transfers is to be published.]
      </p>
      <h2>Retention</h2>
      <p>[Retention periods to be defined.] Audit-log entries are kept for as long as the organization exists because they record financial decisions. Data written to public blockchains cannot be deleted by anyone.</p>
      <h2>Your rights</h2>
      <p>Depending on where you live, you may have the right to access, correct, export or delete your personal data, to object to or restrict processing, and to complain to a data-protection authority. Contact us to exercise them.</p>
      <h2>Contact</h2>
      <p>
        Use the addresses on the <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
