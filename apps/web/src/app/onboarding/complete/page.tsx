import type { Metadata } from "next";
import { CompleteStep } from "@/components/onboarding/complete-step";

export const metadata: Metadata = { title: "Setup complete" };

export default function CompleteOnboardingPage() {
  return <CompleteStep />;
}
