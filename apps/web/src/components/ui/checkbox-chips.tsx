"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Multi-select as a wrap of checkbox chips (native checkboxes, so Space toggles
 * and every option is in the tab order). Use for short lists such as networks or assets.
 */
export function CheckboxChips<T extends string | number>({
  value,
  onChange,
  options,
  label,
  disabled,
  className,
  id,
  ...aria
}: {
  value: T[];
  onChange: (v: T[]) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  label: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
}) {
  const set = new Set(value);
  return (
    <div role="group" aria-label={label} id={id} className={cn("flex flex-wrap gap-1.5", className)} {...aria}>
      {options.map((o) => {
        const checked = set.has(o.value);
        return (
          <label
            key={String(o.value)}
            className={cn(
              "relative inline-flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 text-[13px] font-medium",
              "transition-colors duration-[var(--dur-fast)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
              checked ? "border-accent bg-accent-subtle text-text" : "border-hairline bg-surface text-text-2 hover:border-border-strong/60 hover:text-text",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
            />
            <span aria-hidden="true" className={cn("flex size-3.5 items-center justify-center rounded-[3px] border", checked ? "border-accent bg-accent text-on-accent" : "border-border-strong/70")}>
              {checked && <Check className="size-3" strokeWidth={3} />}
            </span>
            {o.label}
            {o.hint && <span className="text-xs font-normal text-text-3">{o.hint}</span>}
          </label>
        );
      })}
    </div>
  );
}
