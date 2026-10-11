"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as S } from "radix-ui";
import { cn } from "@/lib/cn";
import { inputClass } from "./field";

export function Select<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  className,
  disabled,
  ...aria
}: {
  value: T | "";
  onValueChange: (v: T) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  return (
    <S.Root value={value || undefined} onValueChange={(v) => onValueChange(v as T)} disabled={disabled}>
      <S.Trigger id={id} className={cn(inputClass, "flex h-9 items-center justify-between gap-2 text-left", className)} {...aria}>
        <S.Value placeholder={<span className="text-text-3">{placeholder ?? "Select…"}</span>} />
        <S.Icon>
          <ChevronDown className="size-4 text-text-3" aria-hidden="true" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={4} className="z-50 max-h-[min(360px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-raised shadow-[var(--shadow-float)]">
          <S.Viewport className="p-1">
            {options.map((o) => (
              <S.Item key={o.value} value={o.value} className="relative flex cursor-default select-none items-center rounded-[5px] py-1.5 pl-7 pr-2 text-sm text-text outline-none data-[highlighted]:bg-sunken data-[disabled]:opacity-50">
                <S.ItemIndicator className="absolute left-2 inline-flex">
                  <Check className="size-3.5 text-accent" aria-hidden="true" />
                </S.ItemIndicator>
                <S.ItemText>{o.label}</S.ItemText>
                {o.hint && <span className="ml-auto pl-3 text-xs text-text-3">{o.hint}</span>}
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
