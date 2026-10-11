import type { MetadataRoute } from "next";
import { DOC_PAGES } from "@/components/marketing/docs-content";
import { PUBLIC_ROUTES, SITE_URL } from "@/lib/marketing-site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-11T00:00:00Z");
  return [
    ...PUBLIC_ROUTES.map((r) => ({ url: `${SITE_URL}${r.path === "/" ? "" : r.path}`, lastModified, changeFrequency: r.changeFrequency, priority: r.priority })),
    ...DOC_PAGES.map((d) => ({ url: `${SITE_URL}/docs/${d.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
