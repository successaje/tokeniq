import { StatusBadge } from "@/components/ui/status";
import { pct } from "@/lib/format";
import type { ReserveDto } from "@/lib/types";

export function CoverageBadge({ reserve }: { reserve: Pick<ReserveDto, "status" | "coverageBps"> }) {
  switch (reserve.status) {
    case "covered":
      return <StatusBadge tone="success">Reserve covered · {pct(reserve.coverageBps, 0)}</StatusBadge>;
    case "thin":
      return <StatusBadge tone="warning">Coverage thin · {pct(reserve.coverageBps, 0)}</StatusBadge>;
    case "shortfall":
      return <StatusBadge tone="danger">Reserve short · {pct(reserve.coverageBps, 0)}</StatusBadge>;
    default:
      return <StatusBadge tone="neutral">No requirement set</StatusBadge>;
  }
}

export function UncertaintyBadge({ level }: { level: "low" | "medium" | "high" }) {
  if (level === "low") return <StatusBadge tone="success">Inputs complete</StatusBadge>;
  if (level === "medium") return <StatusBadge tone="warning">Some estimates</StatusBadge>;
  return <StatusBadge tone="danger">Key inputs missing</StatusBadge>;
}
