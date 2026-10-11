"use client";

import { RadioGroup } from "radix-ui";
import { cn } from "@/lib/cn";

/** Single choice among a few options; arrow keys move between them (radio group semantics). */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: Array<{ value: T; label: string; description?: string }>;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={label}
      orientation="horizontal"
      className={cn("inline-flex rounded-[var(--radius-control)] border border-hairline bg-sunken p-0.5", className)}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          title={o.description}
          className={cn(
            "rounded-[5px] font-medium text-text-2 transition-colors duration-[var(--dur-fast)] hover:text-text",
            "data-[state=checked]:bg-surface data-[state=checked]:text-text data-[state=checked]:shadow-[0_0_0_1px_var(--hairline)]",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
          )}
        >
          {o.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
