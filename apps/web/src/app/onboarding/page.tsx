import { redirect } from "next/navigation";

/** Onboarding starts with the organization step; each step saves progress so people can return. */
export default function OnboardingIndex() {
  redirect("/onboarding/organization");
}
