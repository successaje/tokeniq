"use client";

import { ApiError } from "@/lib/api";
import { Button } from "./button";
import { Callout } from "./status";

/** Human message for any thrown value. ApiError messages are already written for people. */
export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Failed query: a retry for transient errors, a plain explanation for 403
 * (the role cannot see this) and 404 (the record no longer exists).
 */
export function QueryError({ error, onRetry, title = "Couldn't load this", className }: { error: unknown; onRetry?: () => void; title?: string; className?: string }) {
  if (error instanceof ApiError && error.status === 403) {
    return (
      <Callout tone="warning" title="Your role doesn't include this" className={className}>
        {error.message.replace(/\.$/, "")}. Ask an owner or admin if you need access.
      </Callout>
    );
  }
  return (
    <Callout
      tone="danger"
      title={title}
      className={className}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    >
      {errorMessage(error, "Unknown error").replace(/\.$/, "")}. {/unless stated otherwise/i.test(errorMessage(error)) ? "" : "Your data is unchanged."}
    </Callout>
  );
}
