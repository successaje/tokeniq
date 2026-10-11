import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInFlow } from "@/components/auth/sign-in-flow";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense>
      <SignInFlow mode="login" />
    </Suspense>
  );
}
