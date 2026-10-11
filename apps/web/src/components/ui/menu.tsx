"use client";

import { DropdownMenu as M } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Menu = M.Root;
export const MenuTrigger = M.Trigger;

export function MenuContent({ children, align = "end", className }: { children: ReactNode; align?: "start" | "end" | "center"; className?: string }) {
  return (
    <M.Portal>
      <M.Content align={align} sideOffset={6} className={cn("z-50 min-w-48 rounded-[var(--radius-card)] border border-hairline bg-raised p-1 shadow-[var(--shadow-float)]", className)}>
        {children}
      </M.Content>
    </M.Portal>
  );
}

export function MenuItem({ children, onSelect, tone, disabled }: { children: ReactNode; onSelect?: () => void; tone?: "danger"; disabled?: boolean }) {
  return (
    <M.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn("flex cursor-default select-none items-center gap-2 rounded-[5px] px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-sunken data-[disabled]:opacity-50", tone === "danger" ? "text-danger" : "text-text")}
    >
      {children}
    </M.Item>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <M.Label className="px-2 py-1 text-xs font-medium text-text-3">{children}</M.Label>;
}

export function MenuSeparator() {
  return <M.Separator className="my-1 h-px bg-hairline" />;
}
