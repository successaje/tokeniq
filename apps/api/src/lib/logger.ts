import pino, { type DestinationStream } from "pino";

/** Paths redacted from every log line: credentials, session tokens, signatures, OTPs and API keys. */
export const REDACT_PATHS = [
  "req.headers.cookie",
  "req.headers.authorization",
  "headers.cookie",
  "headers.authorization",
  "*.password",
  "*.otp",
  "*.token",
  "*.signature",
  "*.apiKey",
  "*.cookie",
  "*.authorization",
];

export function createLogger(level: string, destination?: DestinationStream) {
  return pino(
    {
      level,
      base: { service: "tokeniq-api" },
      // Never log credentials, session tokens, signatures or OTPs.
      redact: { paths: REDACT_PATHS, censor: "[redacted]" },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    destination,
  );
}

export type Logger = ReturnType<typeof createLogger>;
