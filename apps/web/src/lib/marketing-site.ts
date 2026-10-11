/**
 * Public-site configuration: navigation, footer, contact addresses and the list
 * of public routes (used by the sitemap). Every href here must resolve to a real route.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const CTA = {
  primary: { label: "Open TokenIQ", href: "/signup" },
  signIn: { label: "Sign in", href: "/login" },
  explore: { label: "See how it works", href: "/how-it-works" },
} as const;

export const MAIN_NAV: Array<{ label: string; href: string }> = [
  { label: "Product", href: "/product" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Security", href: "/security" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export const FOOTER_NAV: Array<{ index: string; label: string; links: Array<{ label: string; href: string }> }> = [
  {
    index: "01",
    label: "Product",
    links: [
      { label: "Overview", href: "/product" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    index: "02",
    label: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Getting started", href: "/docs/getting-started" },
      { label: "Calculation reference", href: "/docs/calculation-reference" },
      { label: "FAQ", href: "/docs/faq" },
    ],
  },
  {
    index: "03",
    label: "Trust",
    links: [
      { label: "Security", href: "/security" },
      { label: "Responsible disclosure", href: "/security#disclosure" },
      { label: "System status", href: "/status" },
      { label: "Risk disclosure", href: "/legal/risks" },
    ],
  },
  {
    index: "04",
    label: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  },
];

export const NETWORKS = ["Ethereum", "Base", "Arbitrum One", "OP Mainnet"] as const;
export const TESTNETS = ["Sepolia", "Base Sepolia"] as const;

/** Contact addresses come from the deployment; the site says so plainly when they are missing. */
export function contactEmails() {
  const clean = (v: string | undefined) => (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? v.trim() : null);
  return {
    contact: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
    security: clean(process.env.NEXT_PUBLIC_SECURITY_EMAIL),
  };
}

/** Public source repository, if the deployment has published one. */
export function sourceUrl(): string | null {
  const v = process.env.NEXT_PUBLIC_SOURCE_URL?.trim();
  return v && /^https:\/\//.test(v) ? v : null;
}

export const PUBLIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" },
  { path: "/security", priority: 0.8, changeFrequency: "monthly" },
  { path: "/integrations", priority: 0.7, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.6, changeFrequency: "monthly" },
  { path: "/docs", priority: 0.7, changeFrequency: "weekly" },
  { path: "/status", priority: 0.3, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/risks", priority: 0.3, changeFrequency: "yearly" },
];

/** Per-page metadata with canonical URL and a complete OpenGraph block (child openGraph replaces the parent's). */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }) {
  const ogTitle = path === "/" ? title : `${title} · TokenIQ`;
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website" as const,
      siteName: "TokenIQ",
      url: path,
      title: ogTitle,
      description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "TokenIQ: make every treasury decision count." }],
    },
    twitter: { card: "summary_large_image" as const, title: ogTitle, description, images: ["/og.png"] },
  };
}
