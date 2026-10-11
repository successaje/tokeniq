import type { MiddlewareHandler } from "hono";
import type { ErrorBody } from "./errors.js";

/**
 * Fixed-window, in-memory rate limiter keyed by client IP.
 * Suitable for a single API instance. Multi-instance deployments should move
 * this to a shared store (documented in docs/OPERATIONS.md).
 */
export function rateLimit(opts: { windowMs: number; max: number }): MiddlewareHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return async (c, next) => {
    const now = Date.now();
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "local";
    let entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(ip, entry);
      if (hits.size > 50_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    entry.count++;
    c.header("x-ratelimit-limit", String(opts.max));
    c.header("x-ratelimit-remaining", String(Math.max(0, opts.max - entry.count)));
    if (entry.count > opts.max) {
      c.header("retry-after", String(Math.ceil((entry.resetAt - now) / 1000)));
      return c.json<ErrorBody>({ error: { code: "rate_limited", message: "Too many requests. Wait a moment and try again." } }, 429);
    }
    await next();
  };
}
