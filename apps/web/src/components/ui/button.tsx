"use client";

import { Slot } from "radix-ui";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover disabled:hover:bg-accent",
  secondary: "bg-surface text-text border border-border-strong/60 hover:bg-sunken",
  ghost: "text-text-2 hover:bg-sunken hover:text-text",
  danger: "bg-danger text-white hover:opacity-90 dark:text-[#1a0806]",
  link: "text-accent underline-offset-4 hover:underline px-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
  icon: "h-9 w-9 justify-center",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Text announced while loading, e.g. "Saving". */
  loadingLabel?: string;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, loadingLabel, asChild, className, children, disabled, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center whitespace-nowrap rounded-[var(--radius-control)] font-medium",
        "transition-[background-color,color,opacity,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
        "disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner className="size-4" label={loadingLabel ?? "Working"} />}
          {children}
        </>
      )}
    </Comp>
  );
});
