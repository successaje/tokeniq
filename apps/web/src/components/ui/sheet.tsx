"use client";

import { X } from "lucide-react";
import { Dialog as D } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Side panel on desktop, full-height sheet on mobile, for detail views and long forms. */
export function Sheet({ open, onOpenChange, title, description, children, footer, width = "md" }: { open: boolean; onOpenChange: (v: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; width?: "md" | "lg" }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
        <D.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-raised shadow-[var(--shadow-float)] outline-none pt-safe",
            width === "md" ? "sm:max-w-md" : "sm:max-w-2xl",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
            <div className="min-w-0">
              <D.Title className="text-base font-semibold text-text">{title}</D.Title>
              {description ? <D.Description className="mt-1 text-[13px] text-text-2">{description}</D.Description> : <D.Description className="sr-only">Details</D.Description>}
            </div>
            <D.Close className="-mr-1.5 rounded-[var(--radius-control)] p-1.5 text-text-3 hover:bg-sunken hover:text-text" aria-label="Close panel">
              <X className="size-4" aria-hidden="true" />
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-hairline px-5 py-3 pb-safe sm:flex-row sm:justify-end">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
