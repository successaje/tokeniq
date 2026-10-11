"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

/**
 * Last-resort boundary: replaces the root layout, so it brings its own
 * document, styles, fonts and theme. Kept dependency-free on purpose.
 */
export default function GlobalError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const again = retry ?? reset;
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <title>Something went wrong · TokenIQ</title>
        <meta name="robots" content="noindex" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-canvas text-text antialiased">
        <main id="main" className="mx-auto flex min-h-dvh max-w-[720px] flex-col justify-center px-4 py-16 sm:px-6">
          <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
            <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--text)" />
            <rect x="5.5" y="15.5" width="13" height="2.5" rx="1.25" fill="var(--canvas)" />
            <rect x="5.5" y="10.75" width="9" height="2.5" rx="1.25" fill="var(--canvas)" opacity="0.7" />
            <rect x="5.5" y="6" width="5" height="2.5" rx="1.25" fill="none" stroke="var(--canvas)" strokeWidth="0.6" strokeDasharray="1 0.8" />
          </svg>
          <p className="mt-8 font-mono text-xs text-text-3">Error · Application failure</p>
          <h1 className="mt-4 text-[36px] font-medium leading-[42px] tracking-[-0.025em]">TokenIQ couldn’t start.</h1>
          <p className="mt-4 text-[16px] leading-7 text-text-2">A problem stopped the application from loading. No action was taken on your treasury. Try again, or come back in a few minutes.</p>
          <dl className="mt-8 divide-y divide-hairline border-y border-hairline text-[13px]">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-text-2">Reference</dt>
              <dd className="font-mono text-xs">{error.digest ?? "Not available"}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            {again && (
              <button type="button" onClick={() => again()} className="inline-flex h-11 items-center rounded-[6px] bg-accent px-5 text-[15px] font-medium text-on-accent hover:bg-accent-hover">
                Try again
              </button>
            )}
            {/* A full page load, in case client-side navigation is what failed. */}
            <a href="/" className="inline-flex h-11 items-center rounded-[6px] border border-border-strong/60 bg-surface px-5 text-[15px] font-medium text-text hover:bg-sunken">
              Go to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
