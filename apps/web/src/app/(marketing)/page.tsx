import type { Metadata } from "next";
import {
  ApprovalsSection,
  CopilotSection,
  ExecutionSection,
  FinalCta,
  HomeHero,
  IntegrationsSection,
  ObligationsSection,
  OpportunitiesSection,
  PolicySection,
  ProblemSection,
  SecuritySection,
  WalkthroughSection,
} from "@/components/marketing/home-sections";
import { pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "TokenIQ: make every treasury decision count",
  description: "Know what your organization owes, protect what it cannot risk, and decide what the rest should do. Reserve-first treasury operations for on-chain organizations that hold stablecoins.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ProblemSection />
      <ObligationsSection />
      <PolicySection />
      <OpportunitiesSection />
      <ExecutionSection />
      <ApprovalsSection />
      <CopilotSection />
      <WalkthroughSection />
      <IntegrationsSection />
      <SecuritySection />
      <FinalCta />
    </>
  );
}
