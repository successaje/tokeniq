import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInFlow } from "@/components/auth/sign-in-flow";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <Suspense>
      <SignInFlow mode="signup" />
    </Suspense>
  );
}
