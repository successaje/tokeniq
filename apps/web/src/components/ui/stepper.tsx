"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Numeric stepper: two buttons around an announced value. A pointer-free,
 * drag-free alternative to a slider (WCAG 2.5.7). At a bound the button stays
 * focusable (aria-disabled) so keyboard focus is never dropped.
 */
export function Stepper({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  label,
  format = (v) => String(v),
  className,
  size = "md",
}: {
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Accessible name of the quantity, e.g. "Runway to protect". */
  label: string;
  format?: (v: number) => string;
  className?: string;
  size?: "md" | "lg";
}) {
  const id = useId();
  const atMin = value <= min;
  const atMax = value >= max;
  const btn = cn(
    "inline-flex shrink-0 items-center justify-center rounded-[5px] text-text-2 transition-colors duration-[var(--dur-fast)]",
    "hover:bg-surface hover:text-text aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent",
    size === "lg" ? "size-10 sm:size-9" : "size-8",
  );
  return (
    <div role="group" aria-labelledby={`${id}-label`} className={cn("inline-flex items-center rounded-[var(--radius-control)] border border-hairline bg-sunken p-0.5", className)}>
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <button type="button" className={btn} aria-label={`Decrease ${label.toLowerCase()}`} aria-disabled={atMin || undefined} onClick={() => !atMin && onValueChange(Math.max(min, value - step))}>
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className={cn("num min-w-[6.5rem] px-2 text-center font-medium text-text", size === "lg" ? "text-[15px]" : "text-[13px]")}>
        {format(value)}
      </output>
      <button type="button" className={btn} aria-label={`Increase ${label.toLowerCase()}`} aria-disabled={atMax || undefined} onClick={() => !atMax && onValueChange(Math.min(max, value + step))}>
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
