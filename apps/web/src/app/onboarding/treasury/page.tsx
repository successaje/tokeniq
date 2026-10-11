import type { Metadata } from "next";
import { Suspense } from "react";
import { TreasuryStep } from "@/components/onboarding/treasury-step";

export const metadata: Metadata = { title: "Add a treasury account" };

export default function TreasuryOnboardingPage() {
  return (
    <Suspense>
      <TreasuryStep />
    </Suspense>
  );
}
