import pino from "pino";

export function createLogger(level: string) {
  return pino({
    level,
    base: { service: "tokeniq-api" },
    // Never log credentials, session tokens, signatures or OTPs.
    redact: {
      paths: ["req.headers.cookie", "req.headers.authorization", "*.password", "*.otp", "*.token", "*.signature", "*.apiKey", "headers.cookie"],
      censor: "[redacted]",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type Logger = ReturnType<typeof createLogger>;
