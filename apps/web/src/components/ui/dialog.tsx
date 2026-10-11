"use client";

import { X } from "lucide-react";
import { Dialog as D } from "radix-ui";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

/**
 * Centered dialog on desktop, bottom sheet on small screens. Focus is trapped
 * and returned to the trigger on close (Radix).
 */
export function DialogContent({ title, description, children, footer, className, size = "md" }: { title: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode; className?: string; size?: "sm" | "md" | "lg" }) {
  const width = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" }[size];
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
      <D.Content
        className={cn(
          "fixed z-50 flex max-h-[92dvh] w-full flex-col bg-raised shadow-[var(--shadow-float)] outline-none",
          "inset-x-0 bottom-0 rounded-t-[var(--radius-sheet)] pb-safe",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-sheet)] sm:pb-0",
          width,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            <D.Title className="text-base font-semibold text-text">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-[13px] text-text-2">{description}</D.Description> : <D.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</D.Description>}
          </div>
          <D.Close className="-mr-1.5 rounded-[var(--radius-control)] p-1.5 text-text-3 hover:bg-sunken hover:text-text" aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-hairline px-5 py-3 sm:flex-row sm:justify-end">{footer}</div>}
      </D.Content>
    </D.Portal>
  );
}

/**
 * Confirmation for irreversible or financially significant actions. When
 * `confirmText` is set the person must type it, so the action is never one stray click away.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  confirmLabel,
  confirmText,
  tone = "primary",
  loading,
  confirmDisabled,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: ReactNode;
  consequences?: ReactNode;
  confirmLabel: string;
  confirmText?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  /** Keep the confirm button disabled, e.g. until a required reason is entered. */
  confirmDisabled?: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ready = !confirmText || typed.trim() === confirmText;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setTyped("");
        onOpenChange(v);
      }}
    >
      <DialogContent
        title={title}
        description={description}
        size="sm"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant={tone === "danger" ? "danger" : "primary"} disabled={!ready || confirmDisabled} loading={loading} onClick={onConfirm} className="h-auto min-h-9 justify-center whitespace-normal py-1.5 text-center">
              {confirmLabel}
            </Button>
          </>
        }
      >
        {consequences && <div className="text-sm text-text-2">{consequences}</div>}
        {confirmText && (
          <label className="mt-3 block text-[13px] text-text-2">
            Type <span className="font-mono font-medium text-text">{confirmText}</span> to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1.5 block h-9 w-full rounded-[var(--radius-control)] border border-border-strong bg-surface px-3 font-mono text-sm" autoComplete="off" />
          </label>
        )}
      </DialogContent>
    </Dialog>
  );
}
