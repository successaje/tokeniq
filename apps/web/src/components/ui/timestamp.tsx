"use client";

import { cn } from "@/lib/cn";
import { dateTimeLabel, relativeTime } from "@/lib/format";

/**
 * Relative time ("3 hours ago") with the absolute time in the accessible name
 * and title. Pass `absolute` to also print the absolute time.
 */
export function Timestamp({ at, absolute = false, className, prefix }: { at: string | null | undefined; absolute?: boolean; className?: string; prefix?: string }) {
  if (!at) return <span className={className}>—</span>;
  const abs = dateTimeLabel(at);
  return (
    <time dateTime={at} title={abs} className={cn("whitespace-nowrap", className)}>
      {prefix ? `${prefix} ` : ""}
      {relativeTime(at)}
      {absolute && <span className="text-text-3"> · {abs}</span>}
    </time>
  );
}
