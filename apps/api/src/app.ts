import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { and, eq, schema } from "@tokeniq/db";
import { bodyLimit } from "hono/body-limit";
import { csrf } from "hono/csrf";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { ZodError } from "zod";
import type { AppEnv, Deps } from "./context.js";
import { isRole } from "./lib/authz.js";
import { ApiError, notFound, unauthorized, type ErrorBody } from "./lib/errors.js";
import { rateLimit } from "./lib/rate-limit.js";
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
  const allowedOrigins = new Set([new URL(env.APP_URL).origin, new URL(env.API_PUBLIC_URL).origin]);
  app.use("/api/*", csrf({ origin: [...allowedOrigins] }));
  app.use("/api/v1/*", async (c, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      const origin = c.req.header("origin") ?? (c.req.header("referer") ? new URL(c.req.header("referer")!).origin : null);
      if (!origin || !allowedOrigins.has(origin)) {
        return c.json<ErrorBody>({ error: { code: "bad_origin", message: "This request did not come from the TokenIQ app", requestId: c.get("requestId") } }, 403);
      }
    }
    await next();
  });
  app.use("/api/v1/*", bodyLimit({ maxSize: 6 * 1024 * 1024, onError: (c) => c.json<ErrorBody>({ error: { code: "payload_too_large", message: "Request is too large" } }, 413) }));
  app.use("/api/v1/*", rateLimit({ windowMs: 60_000, max: env.NODE_ENV === "test" ? 10_000 : 300 }));

  // Better Auth owns /api/auth/*.
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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
