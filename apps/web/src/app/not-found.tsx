import type { Metadata } from "next";
import Link from "next/link";
import { ErrorScreen, errorButton } from "@/components/marketing/error-screen";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <ErrorScreen
      code="404 · Not found"
      title="This page isn’t on the ledger."
      description="The address may be mistyped, or the page may have moved. Nothing about your treasury has changed."
      actions={
        <>
          <Link href="/" className={errorButton.primary}>
            Go to the home page
          </Link>
          <Link href="/app" className={errorButton.secondary}>
            Open TokenIQ
          </Link>
        </>
      }
    >
      <nav aria-label="Useful pages" className="mt-10 border-t border-hairline pt-5">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
          {[
            ["/docs", "Documentation"],
            ["/how-it-works", "How it works"],
            ["/status", "System status"],
            ["/contact", "Contact"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href!} className="text-accent underline-offset-4 hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </ErrorScreen>
  );
}
