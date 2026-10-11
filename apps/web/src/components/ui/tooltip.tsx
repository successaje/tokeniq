"use client";

import { Tooltip as T } from "radix-ui";
import type { ReactNode } from "react";

export const TooltipProvider = T.Provider;

/** Supplementary text only: never put the only copy of important information in a tooltip. */
export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className="z-[60] max-w-xs rounded-[var(--radius-control)] bg-text px-2.5 py-1.5 text-xs leading-4 text-canvas shadow-[var(--shadow-float)]">
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
