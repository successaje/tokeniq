import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marketing-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app$", "/app/", "/api/", "/onboarding", "/login", "/signup", "/offline", "/forbidden"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
