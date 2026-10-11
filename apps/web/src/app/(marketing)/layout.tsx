import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { PwaClient } from "@/components/pwa/pwa-client";
import "@/components/marketing/marketing.css";

export const metadata: Metadata = {
  openGraph: { type: "website", siteName: "TokenIQ", images: [{ url: "/og.png", width: 1200, height: 630, alt: "TokenIQ: make every treasury decision count." }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-marketing="" className="flex min-h-dvh flex-col bg-canvas">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <PwaClient />
    </div>
  );
}
