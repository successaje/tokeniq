import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Errors returned to clients. `code` is stable and machine-readable; `message`
 * is written for the person using the product. Internal details are logged,
 * never returned.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (what = "Resource") => new ApiError(404, "not_found", `${what} not found`);
export const forbidden = (message = "You do not have permission to do this") => new ApiError(403, "forbidden", message);
export const unauthorized = () => new ApiError(401, "unauthorized", "Your session has expired. Sign in again.");
export const conflict = (code: string, message: string, details?: unknown) => new ApiError(409, code, message, details);
export const badRequest = (code: string, message: string, details?: unknown) => new ApiError(400, code, message, details);
export const unprocessable = (code: string, message: string, details?: unknown) => new ApiError(422, code, message, details);
export const unavailable = (code: string, message: string) => new ApiError(503, code, message);

export interface ErrorBody {
  error: { code: string; message: string; details?: unknown; requestId?: string };
}

/**
 * True when `err` (or any error in its cause chain, e.g. a DrizzleQueryError wrapping a pg error) is a
 * Postgres unique violation, optionally on a specific constraint or index name.
 */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  let cur: unknown = err;
  for (let depth = 0; cur && typeof cur === "object" && depth < 6; depth++) {
    const e = cur as { code?: unknown; constraint?: unknown; cause?: unknown };
    if (e.code === "23505") return constraint === undefined || e.constraint === constraint;
    cur = e.cause;
  }
  return false;
}
