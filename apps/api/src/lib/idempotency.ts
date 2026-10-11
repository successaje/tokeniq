import { and, eq, lt, schema, type Database } from "@tokeniq/db";
import type { MiddlewareHandler } from "hono";
import { createHash } from "node:crypto";
import type { AppEnv } from "../context.js";
import { ApiError, conflict } from "./errors.js";

const KEY_RE = /^[A-Za-z0-9._:-]{8,100}$/;
/** A key can be replayed for this long; afterwards it may be reused for a new request. */
export const IDEMPOTENCY_TTL_MS = 24 * 3600_000;

/**
 * `Idempotency-Key` for organization-scoped JSON POSTs. The first request with a key runs and its response is
 * stored; a retry with the same key and the same body replays that response instead of creating a duplicate
 * (for example a second obligation after a lost response). The same key with a different body is refused, and
 * a retry while the first request is still running gets 409. Only successful responses are stored; errors
 * release the key so the client can retry. Requests without the header are unaffected.
 */
export function idempotency(db: Database, now: () => Date): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const key = c.req.header("idempotency-key");
    if (c.req.method !== "POST" || !key || !(c.req.header("content-type") ?? "").includes("application/json")) return next();
    if (!KEY_RE.test(key)) throw new ApiError(400, "invalid_idempotency_key", "Idempotency-Key must be 8–100 characters: letters, digits, '.', '_', ':' or '-'.");
    const user = c.get("user");
    const member = c.get("member");
    if (!user || !member) return next();

    const route = `POST ${c.req.path}`;
    // Reading the body here is safe: Hono caches it for the route's validator.
    const requestHash = createHash("sha256").update(route).update("\n").update(await c.req.text()).digest("hex");
    const scope = and(eq(schema.idempotencyKeys.organizationId, member.organizationId), eq(schema.idempotencyKeys.userId, user.id), eq(schema.idempotencyKeys.key, key));
    await db.delete(schema.idempotencyKeys).where(and(scope, lt(schema.idempotencyKeys.createdAt, new Date(now().getTime() - IDEMPOTENCY_TTL_MS))));
    const claimed = await db
      .insert(schema.idempotencyKeys)
      .values({ key, organizationId: member.organizationId, userId: user.id, route, requestHash, createdAt: now() })
      .onConflictDoNothing()
      .returning({ key: schema.idempotencyKeys.key });

    if (!claimed.length) {
      const [prior] = await db.select().from(schema.idempotencyKeys).where(scope).limit(1);
      if (!prior) throw conflict("idempotency_in_progress", "A request with this Idempotency-Key is being processed. Retry shortly.");
      if (prior.requestHash !== requestHash) throw new ApiError(422, "idempotency_key_reused", "This Idempotency-Key was already used for a different request. Use a new key.");
      if (prior.statusCode === null) throw conflict("idempotency_in_progress", "A request with this Idempotency-Key is being processed. Retry shortly.");
      c.header("idempotent-replayed", "true");
      return c.json(prior.response as object, prior.statusCode as 200);
    }

    try {
      await next();
    } finally {
      // Only successful results are replayed. Anything else releases the key, so a retry runs again
      // (for example after stale prices refresh, or after a server error).
      const res = c.res;
      if (res.status >= 200 && res.status < 300 && (res.headers.get("content-type") ?? "").includes("application/json")) {
        await db.update(schema.idempotencyKeys).set({ statusCode: res.status, response: await res.clone().json() }).where(scope);
      } else {
        await db.delete(schema.idempotencyKeys).where(scope);
      }
    }
  };
}
