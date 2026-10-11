import type { MetadataRoute } from "next";

/** Installable PWA. Colours are the canvas token values for light (theme) and the app's dark canvas (splash). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "TokenIQ",
    short_name: "TokenIQ",
    description: "Reserve-first treasury operations: obligations, protected liquidity and policy-controlled allocation with human approval.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fafaf9",
    theme_color: "#fafaf9",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Overview", url: "/app", description: "What you control, owe, must protect, and can deploy" },
      { name: "Approvals", url: "/app/approvals", description: "Proposals waiting for review, signatures or execution" },
    ],
  };
}
