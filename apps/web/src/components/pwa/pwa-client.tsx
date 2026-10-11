"use client";

import { RefreshCw, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Service worker registration, update prompt and offline indicator.
 *
 * - Registers /sw.js in production only (or in development when NEXT_PUBLIC_ENABLE_SW=1).
 * - When a new worker is waiting, offers "Reload" which tells it to skipWaiting,
 *   then reloads once the new worker takes control.
 * - Shows an offline banner from navigator.onLine events and marks
 *   <html data-offline="true"> so screens can disable actions.
 *
 * Mount once per layout: the marketing layout mounts it; the app shell can too.
 */
export function PwaClient() {
  const online = useOnlineStatus();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissedOffline, setDismissedOffline] = useState(false);
  /** Set when this tab asked the waiting worker to take over; only then do we reload. */
  const updateRequested = useRef(false);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-offline", !online);
    if (online) setDismissedOffline(false);
  }, [online]);

  useEffect(() => {
    const enabled = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "1";
    if (!enabled || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;

    const track = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // Only prompt when this is an update (a controller already exists), not the first install.
          if (installing.state === "installed" && navigator.serviceWorker.controller && !cancelled) setWaiting(reg.waiting ?? installing);
        });
      });
    };

    const onControllerChange = () => {
      if (!updateRequested.current) return;
      updateRequested.current = false;
      window.location.reload();
    };

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          if (cancelled) return;
          registration = reg;
          track(reg);
        })
        .catch(() => {
          // Registration failure only disables offline support; the site works without it.
        });
    };

    // Check for updates when the tab becomes visible again.
    const onVisible = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("load", register);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waiting) return;
    updateRequested.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [waiting]);

  const showOffline = !online && !dismissedOffline;
  if (!showOffline && !waiting) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:bottom-16">
      {showOffline && (
        <div role="status" className="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-[var(--radius-card)] border border-warning/35 bg-raised p-3 text-sm shadow-[var(--shadow-float)]">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-text">
            <span className="font-medium">You’re offline.</span> <span className="text-text-2">Figures shown may be out of date; actions are disabled.</span>
          </p>
          <button type="button" onClick={() => setDismissedOffline(true)} className="rounded p-0.5 text-text-3 hover:text-text" aria-label="Dismiss offline notice">
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
      {waiting && (
        <div role="status" className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-[var(--radius-card)] border border-hairline bg-raised p-3 text-sm shadow-[var(--shadow-float)]">
          <RefreshCw className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-text">
            <span className="font-medium">Update available.</span> <span className="text-text-2">Reload to use the latest version.</span>
          </p>
          <button type="button" onClick={applyUpdate} className="inline-flex h-8 shrink-0 items-center rounded-[var(--radius-control)] bg-accent px-3 text-[13px] font-medium text-on-accent hover:bg-accent-hover">
            Reload
          </button>
          <button type="button" onClick={() => setWaiting(null)} className="rounded p-0.5 text-text-3 hover:text-text" aria-label="Dismiss update notice">
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** navigator.onLine as React state; true during server rendering. */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
