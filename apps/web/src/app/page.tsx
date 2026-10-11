import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function Home() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-6">
      <Logo />
      <h1 className="text-4xl font-medium tracking-[-0.02em]">Make every treasury decision count.</h1>
      <div className="flex gap-3">
        <Link className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent" href="/login">
          Open TokenIQ
        </Link>
      </div>
    </main>
  );
}
