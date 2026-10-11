import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { and, eq, schema } from "@tokeniq/db";
import type { MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import { csrf } from "hono/csrf";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { ZodError } from "zod";
import type { AppEnv, Deps } from "./context.js";
import { isRole } from "./lib/authz.js";
import { ApiError, notFound, unauthorized, type ErrorBody } from "./lib/errors.js";
import { CLIENT_IP_HEADER, clientIp, rateLimit, windowCounter } from "./lib/rate-limit.js";
import { registerModules } from "./modules/index.js";

export function createApp(deps: Deps) {
  const { env, auth, logger, db } = deps;
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) throw result.error;
    },
  });

  app.use("*", async (c, next) => {
    const requestId = c.req.header("x-request-id")?.slice(0, 64) || crypto.randomUUID();
    c.set("requestId", requestId);
    c.set("clientIp", clientIp(c.req.raw.headers, env.TRUSTED_PROXY_COUNT));
    c.header("x-request-id", requestId);
    const started = performance.now();
    await next();
    const ms = Math.round(performance.now() - started);
    if (!c.req.path.startsWith("/api/health")) {
      logger.info({ requestId, method: c.req.method, path: c.req.path, status: c.res.status, ms }, "request");
    }
  });

  app.use("*", secureHeaders({ crossOriginResourcePolicy: "same-site", referrerPolicy: "no-referrer" }));
  // State-changing requests must come from the web app's origin (defence in depth with SameSite=Lax cookies).
  // Hono's csrf() only inspects form content types, so JSON requests are checked here too.
  const allowedOrigins = new Set([new URL(env.APP_URL).origin, new URL(env.API_PUBLIC_URL).origin, ...env.extraOrigins]);
  app.use("/api/*", csrf({ origin: [...allowedOrigins] }));
  // Also applied to Better Auth's endpoints (sign-out, OTP, SIWE, passkeys), whatever the content type.
  const sameOrigin: MiddlewareHandler<AppEnv> = async (c, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      const origin = c.req.header("origin") ?? (c.req.header("referer") ? new URL(c.req.header("referer")!).origin : null);
      if (!origin || !allowedOrigins.has(origin)) {
        return c.json<ErrorBody>({ error: { code: "bad_origin", message: "This request did not come from the TokenIQ app", requestId: c.get("requestId") } }, 403);
      }
    }
    await next();
  };
  app.use("/api/v1/*", sameOrigin);
  app.use("/api/auth/*", sameOrigin);
  app.use(
    "/api/v1/*",
    bodyLimit({ maxSize: 6 * 1024 * 1024, onError: (c) => c.json<ErrorBody>({ error: { code: "payload_too_large", message: "Request is too large" } }, 413) }),
  );

  // Better Auth owns /api/auth/*. It receives the client IP the API resolved (any client-sent value of the
  // header is overwritten), so its per-IP limits neither trust a spoofable header nor collapse into one
  // shared bucket behind proxies. One-time codes are also limited per email address, whatever the IP.
  const otpCounter = windowCounter(15 * 60_000);
  const OTP_LIMITS: Record<string, number> = {
    "/api/auth/email-otp/send-verification-otp": 5,
    "/api/auth/sign-in/email-otp": 10,
    "/api/auth/email-otp/verify-email": 10,
    "/api/auth/email-otp/check-verification-otp": 10,
  };
  app.on(["GET", "POST"], "/api/auth/*", async (c) => {
    const headers = new Headers(c.req.raw.headers);
    headers.delete(CLIENT_IP_HEADER);
    const ip = c.get("clientIp");
    if (ip) headers.set(CLIENT_IP_HEADER, ip);
    const max = c.req.method === "POST" ? OTP_LIMITS[c.req.path] : undefined;
    if (max !== undefined) {
      const email = await c.req.raw
        .clone()
        .json()
        .then((b: { email?: unknown }) => (typeof b?.email === "string" ? b.email.trim().toLowerCase() : null))
        .catch(() => null);
      if (email) {
        const r = otpCounter(`${c.req.path}|${email}`, max);
        if (r.limited) {
          c.header("retry-after", String(r.retryAfterSec));
          return c.json({ code: "TOO_MANY_REQUESTS", message: "Too many attempts for this email address. Wait a few minutes and try again." }, 429);
        }
      }
    }
    return auth.handler(new Request(c.req.raw, { headers }));
  });

  // Session for everything under /api/v1.
  app.use("/api/v1/*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (session) {
      c.set("user", { id: session.user.id, email: session.user.email, name: session.user.name, emailVerified: session.user.emailVerified });
      c.set("sessionId", session.session.id);
    } else {
      c.set("user", null);
      c.set("sessionId", null);
    }
    await next();
  });

  // Limit per signed-in user (cannot be spoofed by rotating headers); per client IP before sign-in.
  app.use(
    "/api/v1/*",
    rateLimit({
      windowMs: 60_000,
      max: env.NODE_ENV === "test" ? 10_000 : 300,
      key: (c) => (c.get("user") ? `user:${c.get("user")!.id}` : `ip:${c.get("clientIp") ?? "unknown"}`),
    }),
  );

  // Organization scope: the caller must be a member; non-members get 404 so ids do not leak.
  app.use("/api/v1/orgs/:orgId/*", async (c, next) => {
    const user = c.get("user");
    if (!user) throw unauthorized();
    const orgId = c.req.param("orgId");
    const [m] = await db
      .select({ id: schema.members.id, role: schema.members.role, organizationId: schema.members.organizationId })
      .from(schema.members)
      .where(and(eq(schema.members.organizationId, orgId), eq(schema.members.userId, user.id)))
      .limit(1);
    if (!m || !isRole(m.role)) throw notFound("Organization");
    c.set("member", { id: m.id, organizationId: m.organizationId, role: m.role });
    await next();
  });

  registerModules(app, deps);

  app.doc31("/api/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "TokenIQ API",
      version: "2.0.0",
      description: "Treasury intelligence and operations. All monetary values are decimal strings in USD unless a field says otherwise; raw token amounts are integer strings in the token's smallest unit.",
    },
  });
  if (env.NODE_ENV !== "production") app.get("/api/docs", Scalar({ url: "/api/openapi.json", pageTitle: "TokenIQ API" }));

  app.notFound((c) => c.json<ErrorBody>({ error: { code: "not_found", message: "Route not found", requestId: c.get("requestId") } }, 404));

  app.onError((err, c) => {
    const requestId = c.get("requestId");
    if (err instanceof ApiError) {
      if (err.status >= 500) logger.error({ err, requestId }, err.message);
      return c.json<ErrorBody>({ error: { code: err.code, message: err.message, details: err.details, requestId } }, err.status);
    }
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      return c.json<ErrorBody>({ error: { code: "validation_error", message: "Some fields need attention", details, requestId } }, 400);
    }
    if (err instanceof HTTPException) {
      return c.json<ErrorBody>({ error: { code: "http_error", message: err.message, requestId } }, err.status);
    }
    logger.error({ err, requestId, path: c.req.path }, "unhandled error");
    return c.json<ErrorBody>({ error: { code: "internal_error", message: "Something went wrong on our side. The request ID helps us find it.", requestId } }, 500);
  });

  return app;
}
