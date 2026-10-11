import { AlertTriangle, CheckCircle2, CircleDashed, Info, OctagonAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const toneClass: Record<Tone, string> = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
  info: "bg-info-subtle text-info",
  neutral: "bg-sunken text-text-2",
  accent: "bg-accent-subtle text-accent",
};

const toneIcon: Record<Tone, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: OctagonAlert,
  info: Info,
  neutral: CircleDashed,
  accent: Info,
};

/** Status is always icon + text; colour is only the third cue. */
export function StatusBadge({ tone, children, icon, className }: { tone: Tone; children: ReactNode; icon?: LucideIcon | null; className?: string }) {
  const Icon = icon === null ? null : (icon ?? toneIcon[tone]);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-[var(--radius-chip)] px-1.5 py-0.5 text-xs font-medium leading-4", toneClass[tone], className)}>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Callout({ tone = "info", title, children, action, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  const Icon = toneIcon[tone];
  const border: Record<Tone, string> = {
    success: "border-success/30",
    warning: "border-warning/35",
    danger: "border-danger/35",
    info: "border-info/30",
    neutral: "border-hairline",
    accent: "border-accent/30",
  };
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-[var(--radius-card)] border bg-surface p-3 text-sm", border[tone], className)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", toneClass[tone].split(" ")[1])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium text-text">{title}</div>}
        {children && <div className={cn("text-text-2", title && "mt-0.5")}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
