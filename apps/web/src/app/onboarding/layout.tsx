import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Set up your treasury", robots: { index: false } };

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex h-16 items-center justify-between px-5 pt-safe sm:px-8">
        <Link href="/" aria-label="TokenIQ home">
          <Logo />
        </Link>
        <Link href="/app" className="text-[13px] text-text-2 hover:text-text">
          Save and exit
        </Link>
      </header>
      <main id="main" className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6 sm:pt-10">
        {children}
      </main>
    </div>
  );
}
