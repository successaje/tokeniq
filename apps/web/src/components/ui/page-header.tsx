import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({ title, description, actions, meta, className }: { title: string; description?: ReactNode; actions?: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-8 tracking-[-0.01em] text-text sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-text-2">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-3">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
