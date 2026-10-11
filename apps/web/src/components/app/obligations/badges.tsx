import { Ban, ChevronDown, ChevronsUp, ChevronUp, CircleCheck, CircleDashed, Handshake, Minus, Pause, Receipt, ShieldCheck, SkipForward, CircleAlert, Play } from "lucide-react";
import { StatusBadge } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import type { ObligationDto, ObligationPaymentDto } from "@/lib/types";
import { CERTAINTY, PRIORITY, STATUS_LABEL } from "./format";

const certaintyIcon = { estimate: CircleDashed, committed: Handshake, invoiced: Receipt } as const;

/** Estimate, committed and invoiced are different states of knowledge: distinct words and icons. */
export function CertaintyBadge({ certainty, className }: { certainty: ObligationDto["certainty"]; className?: string }) {
  const meta = CERTAINTY[certainty];
  return (
    <span title={meta.description} className={cn("inline-flex", className)}>
      <StatusBadge tone={certainty === "estimate" ? "neutral" : "info"} icon={certaintyIcon[certainty]} className={certainty === "estimate" ? "border border-dashed border-border-strong/50 bg-transparent" : undefined}>
        {meta.label}
      </StatusBadge>
    </span>
  );
}

const priorityIcon = { critical: ChevronsUp, high: ChevronUp, normal: Minus, low: ChevronDown } as const;

export function PriorityLabel({ priority, className }: { priority: ObligationDto["priority"]; className?: string }) {
  const Icon = priorityIcon[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", priority === "critical" ? "font-medium text-danger" : priority === "high" ? "font-medium text-warning" : "text-text-2", className)} title={PRIORITY[priority].description}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {PRIORITY[priority].label}
    </span>
  );
}

export function ObligationStatusBadge({ status }: { status: ObligationDto["status"] }) {
  switch (status) {
    case "active":
      return <StatusBadge tone="success" icon={Play}>{STATUS_LABEL.active}</StatusBadge>;
    case "paused":
      return <StatusBadge tone="warning" icon={Pause}>{STATUS_LABEL.paused}</StatusBadge>;
    case "cancelled":
      return <StatusBadge tone="neutral" icon={Ban}>{STATUS_LABEL.cancelled}</StatusBadge>;
    case "completed":
      return <StatusBadge tone="neutral" icon={CircleCheck}>{STATUS_LABEL.completed}</StatusBadge>;
  }
}

/** Marked paid is not the same as verified on-chain; both differ from skipped. */
export function PaymentStatusBadge({ status }: { status: ObligationPaymentDto["status"] }) {
  switch (status) {
    case "paid_verified":
      return <StatusBadge tone="success" icon={ShieldCheck}>Verified on-chain</StatusBadge>;
    case "paid_unverified":
      return <StatusBadge tone="warning" icon={CircleAlert}>Marked paid, not verified</StatusBadge>;
    case "skipped":
      return <StatusBadge tone="neutral" icon={SkipForward}>Skipped</StatusBadge>;
    default:
      return <StatusBadge tone="neutral">{String(status)}</StatusBadge>;
  }
}
