"use client";

import { Switch as S } from "radix-ui";
import { cn } from "@/lib/cn";

export function Switch({ checked, onCheckedChange, id, disabled, className, ...aria }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string; disabled?: boolean; className?: string; "aria-describedby"?: string; "aria-label"?: string }) {
  return (
    <S.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border-strong/50 bg-sunken transition-colors duration-[var(--dur-fast)] data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50", className)}
      {...aria}
    >
      <S.Thumb className="block size-3.5 translate-x-0.5 rounded-full bg-surface shadow-sm ring-1 ring-border-strong/40 transition-transform duration-[var(--dur-fast)] data-[state=checked]:translate-x-[18px]" />
    </S.Root>
  );
}
