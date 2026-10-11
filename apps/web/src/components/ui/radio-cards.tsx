"use client";

import type { LucideIcon } from "lucide-react";
import { RadioGroup } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  description?: ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
  /** Shown under the description when the option is disabled, so the reason is never hidden in a tooltip. */
  disabledReason?: ReactNode;
}

/**
 * A choice between a few options that each need a sentence of explanation.
 * Radio-group semantics: arrow keys move between options, disabled options are skipped.
 */
export function RadioCards<T extends string>({
  value,
  onValueChange,
  options,
  label,
  columns = 1,
  disabled,
  className,
  ...aria
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: Array<RadioCardOption<T>>;
  label: string;
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={label}
      disabled={disabled}
      className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3", className)}
      {...aria}
    >
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <RadioGroup.Item
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            className={cn(
              "group flex w-full items-start gap-2.5 rounded-[var(--radius-control)] border border-hairline bg-surface p-3 text-left",
              "transition-colors duration-[var(--dur-fast)] hover:border-border-strong/60",
              "data-[state=checked]:border-accent data-[state=checked]:bg-accent-subtle/40 data-[state=checked]:shadow-[inset_0_0_0_1px_var(--accent)]",
              "data-[disabled]:cursor-not-allowed data-[disabled]:bg-sunken data-[disabled]:hover:border-hairline",
            )}
          >
            <span aria-hidden="true" className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface group-data-[state=checked]:border-accent group-data-[disabled]:opacity-50">
              <span className="size-2 rounded-full bg-accent opacity-0 group-data-[state=checked]:opacity-100" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-text group-data-[disabled]:text-text-3">
                {Icon && <Icon className="size-3.5 shrink-0 text-text-2" aria-hidden="true" />}
                {o.label}
              </span>
              {o.description && <span className="mt-0.5 block text-xs text-text-2 group-data-[disabled]:text-text-3">{o.description}</span>}
              {o.disabled && o.disabledReason && <span className="mt-1 block text-xs text-text-3">{o.disabledReason}</span>}
            </span>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
