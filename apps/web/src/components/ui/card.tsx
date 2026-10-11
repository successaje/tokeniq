import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-card)] border border-hairline bg-surface", className)} {...props} />;
}

export function CardHeader({ title, description, action, className, id }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-4 pt-4 sm:px-5 sm:pt-5", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold leading-6 text-text">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[13px] leading-5 text-text-2">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-4 sm:px-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 border-t border-hairline px-4 py-3 sm:px-5", className)} {...props} />;
}

/** Label / value / meta stack used for KPIs. */
export function Stat({ label, value, meta, className }: { label: ReactNode; value: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-xs font-medium text-text-2">{label}</div>
      <div className="mt-1 text-2xl font-medium tracking-tight text-text">{value}</div>
      {meta && <div className="mt-1 text-xs text-text-3">{meta}</div>}
    </div>
  );
}
