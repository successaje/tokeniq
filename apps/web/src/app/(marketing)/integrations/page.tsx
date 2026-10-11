import type { Metadata } from "next";
import { INTEGRATIONS, STATUS_LABEL, type IntegrationStatus } from "@/components/marketing/integrations-data";
import { PageIntro, Section } from "@/components/marketing/primitives";
import { StatusBadge } from "@/components/ui/status";
import { pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "Integrations",
  description: "Safe, Ethereum, Base, Arbitrum One, OP Mainnet, Chainlink price feeds, Morpho, Aave v3 and EIP-6963 / WalletConnect wallets: what TokenIQ does with each, and its honest status.",
  path: "/integrations",
});

const tone: Record<IntegrationStatus, "success" | "info" | "neutral"> = { available: "success", read_only: "info", planned: "neutral" };

export default function IntegrationsPage() {
  const kinds = [...new Set(INTEGRATIONS.map((i) => i.kind))];
  return (
    <>
      <PageIntro
        eyebrow="Integrations"
        title="What TokenIQ connects to, and how far each connection goes."
        lead="Statuses are literal. Available works today. Read-only means TokenIQ reads from it and never writes or moves funds through it. Planned means not built."
      >
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
          {(["available", "read_only", "planned"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <dt>
                <StatusBadge tone={tone[s]}>{STATUS_LABEL[s]}</StatusBadge>
              </dt>
              <dd className="text-text-2">{s === "available" ? "Works today" : s === "read_only" ? "Reads only, never writes" : "Not built yet"}</dd>
            </div>
          ))}
        </dl>
      </PageIntro>
      <Section>
        <table className="w-full border-collapse text-left text-[13px]">
          <caption className="sr-only">TokenIQ integrations with what each does, its status and notes</caption>
          <thead className="hidden md:table-header-group">
            <tr className="text-xs text-text-2">
              <th scope="col" className="w-[22%] border-b border-hairline py-2 pr-4 font-medium">
                Integration
              </th>
              <th scope="col" className="w-[36%] border-b border-hairline py-2 pr-4 font-medium">
                What TokenIQ does
              </th>
              <th scope="col" className="w-[12%] border-b border-hairline py-2 pr-4 font-medium">
                Status
              </th>
              <th scope="col" className="border-b border-hairline py-2 font-medium">
                Notes
              </th>
            </tr>
          </thead>
          {kinds.map((k) => (
            <tbody key={k}>
              <tr>
                <th scope="rowgroup" colSpan={4} className="pb-2 pt-8 text-xs font-medium text-text-3">
                  {k}
                </th>
              </tr>
              {INTEGRATIONS.filter((i) => i.kind === k).map((i) => (
                <tr key={i.name} className="flex flex-col gap-1.5 border-t border-hairline py-4 md:table-row md:py-0">
                  <th scope="row" className="pr-4 align-top text-[14px] font-medium text-text md:py-4">
                    {i.name}
                  </th>
                  <td className="pr-4 align-top leading-5 text-text md:py-4">{i.does}</td>
                  <td className="pr-4 align-top md:py-4">
                    <StatusBadge tone={tone[i.status]}>{STATUS_LABEL[i.status]}</StatusBadge>
                  </td>
                  <td className="align-top leading-5 text-text-2 md:py-4">{i.notes}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
        <p className="mt-10 max-w-2xl text-[13px] leading-5 text-text-3">
          Names are used to describe compatibility only. TokenIQ is not affiliated with, endorsed by or a partner of Safe, Chainlink, Morpho, Aave, WalletConnect or any network listed here.
        </p>
      </Section>
    </>
  );
}
