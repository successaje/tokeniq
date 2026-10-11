"use client";

import { AlertTriangle, CheckCircle2, Info, Loader2, OctagonAlert, X } from "lucide-react";
import { Toast as T } from "radix-ui";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToastTone = "info" | "success" | "warning" | "danger" | "pending";

export interface ToastInput {
  /** Same id replaces an existing toast instead of stacking a duplicate. */
  id?: string;
  tone?: ToastTone;
  title: string;
  description?: ReactNode;
  action?: { label: string; href?: string; onClick?: () => void };
  /** ms; pending toasts stay until replaced. */
  duration?: number;
}

const Ctx = createContext<{ toast: (t: ToastInput) => string; dismiss: (id: string) => void } | null>(null);

const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: OctagonAlert, pending: Loader2 };
const tones = { info: "text-info", success: "text-success", warning: "text-warning", danger: "text-danger", pending: "text-accent animate-spin" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Array<ToastInput & { id: string; open: boolean }>>([]);
  const toast = useCallback((t: ToastInput) => {
    const id = t.id ?? crypto.randomUUID();
    setItems((prev) => {
      const rest = prev.filter((p) => p.id !== id);
      return [...rest, { ...t, id, open: true }].slice(-4);
    });
    return id;
  }, []);
  const dismiss = useCallback((id: string) => setItems((prev) => prev.map((p) => (p.id === id ? { ...p, open: false } : p))), []);
  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  return (
    <Ctx.Provider value={value}>
      <T.Provider swipeDirection="right" duration={6000}>
        {children}
        {items.map((t) => {
          const tone = t.tone ?? "info";
          const Icon = icons[tone];
          return (
            <T.Root
              key={t.id}
              open={t.open}
              duration={tone === "pending" ? Infinity : (t.duration ?? (tone === "danger" ? 12000 : 6000))}
              type={tone === "danger" ? "foreground" : "background"}
              onOpenChange={(open) => {
                if (!open) setItems((prev) => prev.filter((p) => p.id !== t.id));
              }}
              className="pointer-events-auto flex w-full gap-3 rounded-[var(--radius-card)] border border-hairline bg-raised p-3 shadow-[var(--shadow-float)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]"
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", tones[tone])} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <T.Title className="text-sm font-medium text-text">{t.title}</T.Title>
                {t.description && <T.Description className="mt-0.5 text-[13px] text-text-2">{t.description}</T.Description>}
                {t.action && (
                  <T.Action altText={t.action.label} asChild>
                    {t.action.href ? (
                      <a href={t.action.href} className="mt-1.5 inline-block text-[13px] font-medium text-accent hover:underline" target={t.action.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                        {t.action.label}
                      </a>
                    ) : (
                      <button onClick={t.action.onClick} className="mt-1.5 text-[13px] font-medium text-accent hover:underline">
                        {t.action.label}
                      </button>
                    )}
                  </T.Action>
                )}
              </div>
              <T.Close className="self-start rounded p-0.5 text-text-3 hover:text-text" aria-label="Dismiss notification">
                <X className="size-3.5" aria-hidden="true" />
              </T.Close>
            </T.Root>
          );
        })}
        <T.Viewport className="pointer-events-none fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-md:bottom-16" />
      </T.Provider>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
