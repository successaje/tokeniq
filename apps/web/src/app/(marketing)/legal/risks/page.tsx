import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "Risk disclosure (draft)",
  description: "Financial and technical risks of holding and deploying stablecoins with on-chain protocols: smart contracts, depegs, oracles, liquidity, chain and RPC outages, and AI limitations. Not investment advice.",
  path: "/legal/risks",
});

const RISKS: Array<{ title: string; text: string }> = [
  { title: "Smart contract risk", text: "Lending protocols, vaults and Safe contracts are software. A bug, an exploit or a malicious upgrade can cause partial or total loss of deposited funds. Audits and track records reduce this risk; they do not remove it." },
  { title: "Stablecoin and depeg risk", text: "A stablecoin can trade below its peg for minutes or permanently. Issuers can freeze or block tokens at specific addresses. Bridged versions of a stablecoin carry the additional risk of the bridge." },
  { title: "Oracle and price risk", text: "Prices come from oracle feeds that can be delayed, wrong or manipulated. TokenIQ flags stale prices and caps USD stablecoins at $1 for the reserve, but cannot detect every incorrect price." },
  { title: "Liquidity risk", text: "Withdrawals from a lending venue depend on how much of it is borrowed. When utilization is high, you may be unable to withdraw when you need to, and the rate shown may change quickly." },
  { title: "Curator and governance risk", text: "Vault curators and protocol governance can change markets, parameters and fees. Those changes can increase risk after you deposit." },
  { title: "Network and RPC risk", text: "Blockchains, layer-2 sequencers and RPC providers can halt, degrade or return incorrect data. Transactions can fail, be delayed or be reordered. Figures may be out of date during an outage." },
  { title: "Operational risk", text: "Lost keys, compromised signers, colluding approvers or mistakes in what is signed can cause losses that no software can reverse. On-chain transactions are final." },
  { title: "Software and data risk", text: "TokenIQ can contain defects. Its figures depend on the data you enter and on third-party data. Always review a transaction in your own wallet before signing." },
  { title: "AI limitations", text: "The copilot can misunderstand questions or produce incorrect explanations, even with citations. It cannot act, and it is not a source of advice. Check the cited records." },
  { title: "Rates are not returns", text: "Rates shown are measurements over a stated period. They are variable, not guaranteed, and past rates do not predict future returns." },
  { title: "Regulatory and tax risk", text: "Laws on digital assets differ by jurisdiction and change. Holding or deploying stablecoins may have legal, accounting or tax consequences for your organization." },
];

export default function RisksPage() {
  return (
    <LegalPage
      title="Risk disclosure"
      updated="11 October 2026"
      current="/legal/risks"
      intro="Holding stablecoins and deploying them into on-chain protocols carries real risk, including the loss of all deployed funds. TokenIQ helps you apply a policy to those risks; it does not remove them. Nothing on this website or in the product is investment, financial, legal or tax advice."
    >
      {RISKS.map((r) => (
        <section key={r.title}>
          <h2>{r.title}</h2>
          <p>{r.text}</p>
        </section>
      ))}
      <h2>No investment advice</h2>
      <p>TokenIQ is not a broker, adviser, custodian or bank. Recommendations follow rules your organization configures. Consider professional advice before making financial decisions.</p>
    </LegalPage>
  );
}
