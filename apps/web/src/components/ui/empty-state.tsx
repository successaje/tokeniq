import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({ icon: Icon, title, description, actions, className }: { icon?: LucideIcon; title: string; description: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-hairline bg-surface px-5 py-8 sm:items-center sm:text-center", className)}>
      {Icon && (
        <div className="flex size-9 items-center justify-center rounded-[var(--radius-control)] bg-sunken text-text-2">
          <Icon className="size-4.5" aria-hidden="true" />
        </div>
      )}
      <div className="max-w-md">
        <h3 className="text-[15px] font-semibold text-text">{title}</h3>
        <div className="mt-1 text-sm text-text-2">{description}</div>
      </div>
      {actions && <div className="mt-1 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
