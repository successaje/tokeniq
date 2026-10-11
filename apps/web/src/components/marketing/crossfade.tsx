"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Crossfade a figure when its value changes: the outgoing value fades out in
 * the same grid cell while the new one fades in (120ms, opacity only). There is
 * no animation on first render and none under reduced motion (durations are 0).
 * Numbers never "roll".
 */
export function Crossfade({ value, children = (v) => v, className }: { value: string; children?: (value: string) => ReactNode; className?: string }) {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  if (current !== value) {
    setPrevious(current);
    setCurrent(value);
    setChanged(true);
  }

  return (
    <span className={cn("inline-grid", className)}>
      {previous !== null && previous !== value && (
        <span key={`out-${previous}`} aria-hidden="true" className="mk-fade-out pointer-events-none [grid-area:1/1]" onAnimationEnd={() => setPrevious(null)}>
          {children(previous)}
        </span>
      )}
      <span key={`in-${value}`} className={cn("[grid-area:1/1]", changed && "mk-fade-in")}>
        {children(value)}
      </span>
    </span>
  );
}
