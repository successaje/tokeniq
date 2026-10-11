"use client";

import { Tabs as T } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Underlined section tabs. Arrow keys move between tabs (Radix roving focus). */
export const Tabs = T.Root;

export function TabsList({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <T.List aria-label={label} className={cn("-mx-4 flex gap-1 overflow-x-auto border-b border-hairline px-4 sm:mx-0 sm:px-0", className)}>
      {children}
    </T.List>
  );
}

export function TabsTrigger({ value, children, count }: { value: string; children: ReactNode; count?: number }) {
  return (
    <T.Trigger
      value={value}
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-t-[var(--radius-control)] px-2.5 text-[13px] font-medium text-text-2 transition-colors duration-[var(--dur-fast)] hover:text-text",
        "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:text-text data-[state=active]:after:bg-accent",
      )}
    >
      {children}
      {count !== undefined && <span className="num rounded-full bg-sunken px-1.5 text-[11px] leading-[18px] text-text-2">{count}</span>}
    </T.Trigger>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return (
    <T.Content value={value} className={cn("pt-5 outline-none", className)}>
      {children}
    </T.Content>
  );
}
