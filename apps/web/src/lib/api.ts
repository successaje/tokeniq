/**
 * Browser API client. All requests go to the same origin (/api is proxied to the
 * API service), carry the session cookie, and return typed errors. Mutations are
 * never retried automatically; financial writes send an Idempotency-Key.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
  get isAuth() {
    return this.status === 401;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (opts.body !== undefined && !(opts.body instanceof FormData)) headers["content-type"] = "application/json";
  if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers,
      credentials: "same-origin",
      body: opts.body === undefined ? undefined : opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "network_error", "Can't reach TokenIQ. Check your connection and try again.");
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string; details?: unknown; requestId?: string } } | null)?.error;
    const fallback =
      res.status === 429
        ? "Too many requests. Wait a moment and try again."
        : res.status >= 500
          ? "TokenIQ had a problem completing this request. Nothing was changed unless stated otherwise."
          : res.statusText || "Request failed";
    throw new ApiError(res.status, e?.code ?? `http_${res.status}`, e?.message ?? fallback, e?.details, e?.requestId);
  }
  return data as T;
}

export const orgPath = (orgId: string, path = "") => `/api/v1/orgs/${encodeURIComponent(orgId)}${path}`;

/** Field errors from a validation_error response, keyed by field path. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || err.code !== "validation_error" || !Array.isArray(err.details)) return {};
  const out: Record<string, string> = {};
  for (const d of err.details as Array<{ path: string; message: string }>) {
    const key = d.path.replace(/^body\./, "");
    if (!out[key]) out[key] = d.message;
  }
  return out;
}
