import { z } from "zod";

const bool = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

/**
 * All configuration comes from the environment and is validated at boot.
 * Optional integrations (Anthropic, SMTP, Safe API, RPC overrides) degrade to
 * clearly reported "not configured" states rather than failing silently.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1),
  /** Public origin of the web app (cookies, CORS, SIWE domain, passkey RP). */
  APP_URL: z.string().url().default("http://localhost:3000"),
  /** Origin at which the browser reaches the API (normally the web origin through its /api proxy). */
  API_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32),
  /** Development only: additional browser origins (comma-separated), e.g. per-tester *.localhost hosts. Ignored in production. */
  DEV_EXTRA_ORIGINS: z.string().default(""),
  /**
   * Number of reverse proxies in front of the API that append to X-Forwarded-For (for example 2 for a
   * platform edge plus the web app's /api rewrite). Used to find the real client IP for rate limits and
   * audit records. Unset = leftmost X-Forwarded-For entry, which clients can spoof.
   */
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).max(10).optional(),
  /** Requests per signed-in user (or IP before sign-in) per minute under /api/v1. Default 300. */
  API_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(10).max(100_000).optional(),
  /** Run background jobs in this process. Production runs a dedicated worker. */
  RUN_JOBS: bool.default(true),
  /** Apply database migrations when the API starts (development). Production uses a release step. */
  MIGRATE_ON_BOOT: bool.default(true),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // Email. Without SMTP, development prints codes to the log and test mode keeps an in-memory outbox.
  SMTP_URL: z.string().optional(),
  EMAIL_FROM: z.string().default("TokenIQ <no-reply@tokeniq.local>"),

  // Copilot
  ANTHROPIC_API_KEY: z.string().optional(),
  COPILOT_MODEL: z.string().default("claude-opus-5-5"),

  // Chain access. Defaults are public endpoints suitable for development only.
  RPC_URL_1: z.string().url().optional(),
  RPC_URL_8453: z.string().url().optional(),
  RPC_URL_42161: z.string().url().optional(),
  RPC_URL_10: z.string().url().optional(),
  RPC_URL_84532: z.string().url().optional(),
  RPC_URL_11155111: z.string().url().optional(),
  SAFE_API_KEY: z.string().optional(),

  /** Comma-separated feature flags that can be switched off without a deploy (kill switches). */
  DISABLED_FEATURES: z.string().default(""),
});

export type Env = z.infer<typeof schema> & { disabled: Set<string>; extraOrigins: string[] };

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
    throw new Error(`Invalid environment:\n  ${issues}`);
  }
  const disabled = new Set(
    parsed.data.DISABLED_FEATURES.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const extraOrigins = parsed.data.NODE_ENV === "production" ? [] : parsed.data.DEV_EXTRA_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  return { ...parsed.data, disabled, extraOrigins };
}

/** Features that can be disabled at runtime via DISABLED_FEATURES. */
export const FEATURES = ["copilot", "proposals", "signatures", "sync", "opportunities", "email"] as const;
export type Feature = (typeof FEATURES)[number];
