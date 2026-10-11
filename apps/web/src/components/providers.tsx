"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";
import { ThemeProvider } from "@/lib/theme";

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}&reason=session`);
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (err) => {
            if (err instanceof ApiError && err.isAuth) redirectToLogin();
          },
        }),
        mutationCache: new MutationCache({
          onError: (err) => {
            if (err instanceof ApiError && err.isAuth) redirectToLogin();
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            // Retry reads only for transient failures; never retry 4xx.
            retry: (count, err) => count < 2 && (!(err instanceof ApiError) || err.isNetwork || err.status >= 500),
          },
          // Financial writes are never retried automatically.
          mutations: { retry: false },
        },
      }),
  );
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <TooltipProvider delayDuration={250}>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
