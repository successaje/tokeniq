"use client";

import { isAddress, getAddress } from "viem";
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { normalizeAmountInput } from "@/lib/sanitize";

export const inputClass =
  // Full-strength border: an input's boundary must reach 3:1 against the surface (WCAG 1.4.11); 50% opacity measured 1.67:1.
  "block w-full rounded-[var(--radius-control)] border border-border-strong bg-surface px-3 text-sm text-text placeholder:text-text-3 " +
  "transition-colors duration-[var(--dur-fast)] hover:border-text-3 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--focus)] " +
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-text-3 aria-[invalid=true]:border-danger";

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
  className?: string;
}

/** Label + control + hint + error, wired with ids so errors are announced with the field. */
export function Field({ label, hint, error, optional, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-medium text-text">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-text-3">Optional</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, "h-9", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputClass, "min-h-20 py-2 leading-5", className)} {...props} />;
});

/**
 * Amount entry that only ever holds a plain decimal string (no floats, no
 * locale separators) so values reach the API exactly as typed. Input that would
 * change meaning (a decimal comma, too many decimals, letters) is not accepted.
 */
export function AmountInput({
  value,
  onChange,
  unit = "USD",
  maxDecimals = 2,
  className,
  ...rest
}: { value: string; onChange: (v: string) => void; unit?: string; maxDecimals?: number; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className={cn("relative", className)}>
      <input
        {...rest}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          const v = normalizeAmountInput(e.target.value, maxDecimals);
          if (v !== null) onChange(v);
        }}
        className={cn(inputClass, "num h-9 pr-14 text-right")}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-text-3">{unit}</span>
    </div>
  );
}

/** Address entry with checksum validation and a non-destructive normalised preview. */
export function AddressInput({ value, onChange, className, ...rest }: { value: string; onChange: (v: string) => void; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [touched, setTouched] = useState(false);
  const trimmed = value.trim();
  const valid = trimmed === "" || isAddress(trimmed, { strict: false });
  const mixedCaseInvalid = trimmed !== "" && /[A-F]/.test(trimmed.slice(2)) && /[a-f]/.test(trimmed.slice(2)) && !isAddress(trimmed, { strict: true });
  return (
    <div className={className}>
      <input
        {...rest}
        value={value}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        placeholder={rest.placeholder ?? "0x…"}
        onBlur={(e) => {
          setTouched(true);
          rest.onBlur?.(e);
        }}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={(touched && (!valid || mixedCaseInvalid)) || rest["aria-invalid"] ? true : undefined}
        className={cn(inputClass, "h-9 font-mono text-[13px]")}
      />
      {touched && trimmed !== "" && (!valid || mixedCaseInvalid) && (
        <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {mixedCaseInvalid ? "The checksum does not match. Copy the address again from its source." : "Enter a 0x address with 40 hexadecimal characters."}
        </p>
      )}
      {valid && !mixedCaseInvalid && trimmed !== "" && trimmed !== getAddress(trimmed) && <p className="mt-1.5 font-mono text-xs text-text-3">{getAddress(trimmed)}</p>}
    </div>
  );
}

export function isValidAddress(v: string) {
  const t = v.trim();
  if (!isAddress(t, { strict: false })) return false;
  const body = t.slice(2);
  if (/[A-F]/.test(body) && /[a-f]/.test(body)) return isAddress(t, { strict: true });
  return true;
}
