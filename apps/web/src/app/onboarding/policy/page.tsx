import type { Metadata } from "next";
import { PolicyStep } from "@/components/onboarding/policy-step";

export const metadata: Metadata = { title: "Reserve policy" };

export default function PolicyOnboardingPage() {
  return <PolicyStep />;
}
