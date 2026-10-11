import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-[var(--radius-chip)]", className)} />;
}

/** Announces loading once for screen readers while skeletons render visually. */
export function LoadingRegion({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
