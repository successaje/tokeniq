import type { Metadata } from "next";
import { ErrorScreen, errorButton } from "@/components/marketing/error-screen";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };
export const dynamic = "force-static";

/**
 * Served by the service worker when a navigation fails. Fully static and works
 * without JavaScript: the actions are plain links that retry the network.
 */
export default function OfflinePage() {
  return (
    <ErrorScreen
      code="Offline · No connection"
      title="You’re offline."
      description={
        <>
          <p>TokenIQ needs a connection to show balances, obligations and approvals. It doesn’t show cached figures, so you never act on numbers that might be out of date.</p>
          <p className="mt-2">Nothing you were doing has been submitted. Reconnect, then try again.</p>
        </>
      }
      actions={
        <>
          <a href="/app" className={errorButton.primary}>
            Try again
          </a>
          <a href="/" className={errorButton.secondary}>
            Home page
          </a>
        </>
      }
    />
  );
}
