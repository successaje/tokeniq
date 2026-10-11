import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "TokenIQ — Treasury intelligence for on-chain organizations", template: "%s · TokenIQ" },
  description: "Know what your organization owes, protect what it cannot risk, and decide what the rest should do. Reserve-first treasury operations for teams that hold stablecoins.",
  applicationName: "TokenIQ",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TokenIQ", statusBarStyle: "default" },
  formatDetection: { telephone: false, address: false, email: false },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  openGraph: { type: "website", siteName: "TokenIQ", title: "TokenIQ — Treasury intelligence for on-chain organizations", description: "Reserve-first treasury operations: obligations, protected liquidity, and policy-controlled allocation with human approval." },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f10" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-[var(--radius-control)] focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-[var(--shadow-float)]">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
