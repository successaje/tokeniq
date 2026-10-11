import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

/**
 * Content Security Policy. Wallet reads go to RPC endpoints from the browser, and
 * TokenIQ can run as a Safe App inside Safe{Wallet}, which frames it.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.base.org https://*.publicnode.com https://*.llamarpc.com https://*.arbitrum.io https://*.optimism.io https://rpc.walletconnect.com https://rpc.walletconnect.org wss://relay.walletconnect.com wss://relay.walletconnect.org https://pulse.walletconnect.org https://api.web3modal.org https://explorer-api.walletconnect.com",
  "frame-src https://verify.walletconnect.com https://verify.walletconnect.org",
  "frame-ancestors 'self' https://app.safe.global",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const config: NextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
  outputFileTracingRoot: process.env.NEXT_STANDALONE === "1" ? new URL("../../", import.meta.url).pathname : undefined,
  poweredByHeader: false,
  transpilePackages: ["@tokeniq/core"],
  typedRoutes: false,
  // Development: allow per-tester hostnames (cookies are host-scoped, so sessions stay separate).
  allowedDevOrigins: ["127.0.0.1", "*.localhost"],
  async rewrites() {
    // The browser only ever talks to the web origin; /api is proxied to the API service.
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), publickey-credentials-get=(self), publickey-credentials-create=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Access-Control-Allow-Origin", value: "https://app.safe.global" }],
      },
    ];
  },
};

export default config;
