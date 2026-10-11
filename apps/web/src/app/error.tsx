"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorScreen, errorButton } from "@/components/marketing/error-screen";

/**
 * Route-level error boundary. Shows the error reference (digest) so support can
 * match it to server logs; never shows the raw message from server errors.
 */
export default function RouteError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const again = retry ?? reset;
  return (
    <ErrorScreen
      code="Error · Something went wrong"
      title="This page couldn’t load."
      description={
        <>
          <p>An unexpected error stopped this page from rendering. No action was taken on your treasury, and nothing was submitted.</p>
          <p className="mt-2 text-[14px] text-text-3">If it keeps happening, contact us and include the reference below.</p>
        </>
      }
      details={[
        { label: "Reference", value: error.digest ?? "Not available" },
        { label: "Time", value: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC" },
      ]}
      actions={
        <>
          {again && (
            <button type="button" onClick={() => again()} className={errorButton.primary}>
              Try again
            </button>
          )}
          <Link href="/" className={errorButton.secondary}>
            Go to the home page
          </Link>
          <Link href="/status" className={errorButton.secondary}>
            Check status
          </Link>
        </>
      }
    />
  );
}
