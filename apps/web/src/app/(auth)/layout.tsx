import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 items-center px-5 pt-safe sm:px-8">
        <Link href="/" aria-label="TokenIQ home">
          <Logo />
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pb-16 pt-[6vh] sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
      <footer className="px-5 pb-6 text-center text-xs text-text-3 sm:px-8">
        <Link href="/legal/privacy" className="hover:text-text-2">Privacy</Link> · <Link href="/legal/terms" className="hover:text-text-2">Terms</Link> · <Link href="/security" className="hover:text-text-2">Security</Link>
      </footer>
    </div>
  );
}
