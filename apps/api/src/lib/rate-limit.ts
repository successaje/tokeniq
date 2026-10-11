import type { Context, MiddlewareHandler } from "hono";
import type { ErrorBody } from "./errors.js";

/**
 * Fixed-window, in-memory counters. Suitable for a single API instance. Multi-instance deployments should
 * move this to a shared store (documented in docs/OPERATIONS.md).
 */
export function windowCounter(windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string, max: number) => {
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
      if (hits.size > 50_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    entry.count++;
    return { limited: entry.count > max, remaining: Math.max(0, max - entry.count), retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  };
}

/** Rate limit keyed by `key(c)` (the signed-in user where known, otherwise the client IP). */
export function rateLimit(opts: { windowMs: number; max: number; key: (c: Context) => string }): MiddlewareHandler {
  const hit = windowCounter(opts.windowMs);
  return async (c, next) => {
    const r = hit(opts.key(c), opts.max);
    c.header("x-ratelimit-limit", String(opts.max));
    c.header("x-ratelimit-remaining", String(r.remaining));
    if (r.limited) {
      c.header("retry-after", String(r.retryAfterSec));
      return c.json<ErrorBody>({ error: { code: "rate_limited", message: "Too many requests. Wait a moment and try again." } }, 429);
    }
    await next();
  };
}

/** Header the API sets (overwriting any client value) to pass the resolved client IP to Better Auth. */
export const CLIENT_IP_HEADER = "x-tokeniq-client-ip";

/**
 * Client IP from X-Forwarded-For. Each reverse proxy appends the address it received the request from, so
 * with `trustedHops` proxies in front of the API the client's address is the entry the outermost trusted
 * proxy appended (counting from the right); entries to its left are client-controlled. Without
 * `trustedHops` the leftmost entry is used, which a client can spoof (set TRUSTED_PROXY_COUNT in production).
 */
export function clientIp(headers: Headers, trustedHops?: number): string | null {
  const list = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (trustedHops && trustedHops > 0 && list.length >= trustedHops) return list[list.length - trustedHops]!;
  return list[0] ?? headers.get("x-real-ip") ?? null;
}
