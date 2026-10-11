import { z, type RouteConfig } from "@hono/zod-openapi";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv, SessionUser } from "../context.js";
import { isIsoDate } from "@tokeniq/core";
import { unauthorized } from "./errors.js";

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
      requestId: z.string().optional(),
    }),
  })
  .openapi("Error");

/** USD decimal string, e.g. "125000.5". */
export const Usd = z.string().openapi({ example: "125000.00", description: "USD amount as a decimal string" });
/** Raw integer token amount in the token's smallest unit. */
export const RawAmount = z.string().regex(/^\d+$/).openapi({ example: "125000000000", description: "Integer amount in the token's smallest unit" });
export const Address = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Enter a 0x address with 40 hexadecimal characters")
  .openapi({ example: "0x0000000000000000000000000000000000000001" });
export const TxHash = z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Enter a 0x transaction hash with 64 hexadecimal characters");
export const IsoDateString = z.string().refine(isIsoDate, "Enter a real calendar date as YYYY-MM-DD");
export const Id = z.string().min(1).max(64);

export const json = <T extends z.ZodType>(schema: T, description = "OK") => ({ content: { "application/json": { schema } }, description });
export const body = <T extends z.ZodType>(schema: T) => ({ body: { content: { "application/json": { schema } }, required: true } });

export const errors = {
  400: json(ErrorSchema, "Invalid request"),
  401: json(ErrorSchema, "Not signed in"),
  403: json(ErrorSchema, "Not permitted"),
  404: json(ErrorSchema, "Not found"),
  409: json(ErrorSchema, "Conflict with current state"),
  422: json(ErrorSchema, "Rejected by policy or validation"),
} as const;

export const orgParams = z.object({ orgId: Id });

export function requireUser(c: Context<AppEnv>): SessionUser {
  const user = c.get("user");
  if (!user) throw unauthorized();
  return user;
}

export function clientInfo(c: Context<AppEnv>) {
  return {
    ip: c.get("clientIp") ?? null,
    userAgent: c.req.header("user-agent")?.slice(0, 256) ?? null,
  };
}

export type Route = RouteConfig;

/**
 * Send JSON when the handler's shape is wider than @hono/zod-openapi can type
 * (e.g. jsonb columns, alternative error statuses). The OpenAPI document is
 * still generated from the route definition.
 */
export function send(c: Context<AppEnv>, data: unknown, status: ContentfulStatusCode = 200): never {
  return c.json(data as object, status) as never;
}
