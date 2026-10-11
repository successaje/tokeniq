import type { Metadata } from "next";
import { ObligationsStep } from "@/components/onboarding/obligations-step";

export const metadata: Metadata = { title: "Spending and obligations" };

export default function ObligationsOnboardingPage() {
  return <ObligationsStep />;
}
