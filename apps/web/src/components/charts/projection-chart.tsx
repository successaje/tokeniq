"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { dateLabel, usd } from "@/lib/format";

export interface ProjectionPoint {
  date: string;
  balance: string;
  outflow: string;
}

export interface ProjectionEvent {
  dueDate: string;
  title: string;
  usd: string | null;
}

function niceStep(range: number) {
  const raw = range / 4;
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

const toNum = (v: string) => Number.parseFloat(v); // layout only; every label uses the exact string
const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

/**
 * Liquidity runway: projected reserve-eligible balance as a step chart (money
 * moves in discrete payments), the policy floor as a labelled reference line,
 * and obligations as ticks on the time axis.
 */
export function ProjectionChart({ points, floor, events = [], height = 220, title = "Projected liquid balance", className }: { points: ProjectionPoint[]; floor: string; events?: ProjectionEvent[]; height?: number; title?: string; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  // The measured wrapper only exists once there are enough points, so re-attach when that changes.
  const measurable = points.length >= 2;
  useEffect(() => {
    if (!wrap.current) return;
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [measurable]);

  const m = { top: 12, right: 12, bottom: 28, left: 56 };
  const iw = width - m.left - m.right;
  const ih = height - m.top - m.bottom;

  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const xs = points.map((p) => day(p.date));
    const ys = points.map((p) => toNum(p.balance));
    const floorN = toNum(floor);
    const lo = Math.min(0, ...ys, floorN);
    const hiRaw = Math.max(...ys, floorN) * 1.08 || 1;
    const step = niceStep(hiRaw - lo);
    const yMin = Math.floor(lo / step) * step;
    const yMax = Math.ceil(hiRaw / step) * step;
    const x0 = xs[0]!;
    const x1 = xs[xs.length - 1]!;
    const sx = (d: number) => ((d - x0) / Math.max(1, x1 - x0)) * iw;
    const sy = (v: number) => ih - ((v - yMin) / Math.max(1, yMax - yMin)) * ih;
    let d = `M ${sx(xs[0]!)} ${sy(ys[0]!)}`;
    for (let i = 1; i < xs.length; i++) d += ` H ${sx(xs[i]!)} V ${sy(ys[i]!)}`;
    const area = `${d} V ${sy(Math.max(yMin, 0))} H ${sx(xs[0]!)} Z`;
    const ticks: number[] = [];
    for (let v = yMin; v <= yMax + 1e-6; v += step) ticks.push(v);
    return { xs, ys, sx, sy, d, area, ticks, floorY: sy(floorN), x0, x1 };
  }, [points, floor, iw, ih]);

  const lowestIdx = useMemo(() => points.reduce((best, p, i) => (toNum(p.balance) < toNum(points[best]!.balance) ? i : best), 0), [points]);
  const crosses = points.some((p) => toNum(p.balance) < toNum(floor));

  if (!geo) {
    return <div className={cn("flex h-40 items-center justify-center rounded-[var(--radius-card)] border border-dashed border-hairline text-sm text-text-2", className)}>Not enough data to project yet.</div>;
  }

  const summary = `${title}. Starts at ${usd(points[0]!.balance, { compact: true })} on ${dateLabel(points[0]!.date)}; lowest ${usd(points[lowestIdx]!.balance, { compact: true })} on ${dateLabel(points[lowestIdx]!.date)}; policy floor ${usd(floor, { compact: true })}. ${crosses ? "The projected balance falls below the floor." : "The projected balance stays above the floor."}`;
  const a = active !== null ? points[active] : null;

  return (
    <div className={className}>
      <div ref={wrap} className="relative w-full">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={summary}
          tabIndex={0}
          // max-w-full: the measured width must never be what sizes the container (a grid's auto column would grow to fit it).
          className="block max-w-full touch-pan-y outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setActive((i) => Math.min(points.length - 1, (i ?? -1) + 1));
            else if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? points.length) - 1));
            else if (e.key === "Escape") setActive(null);
          }}
          onBlur={() => setActive(null)}
          onPointerMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const x = e.clientX - rect.left - m.left;
            let best = 0;
            let bestDist = Infinity;
            geo.xs.forEach((d, i) => {
              const dist = Math.abs(geo.sx(d) - x);
              if (dist < bestDist) {
                bestDist = dist;
                best = i;
              }
            });
            setActive(best);
          }}
          onPointerLeave={() => setActive(null)}
        >
          <g transform={`translate(${m.left},${m.top})`}>
            {geo.ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={iw} y1={geo.sy(t)} y2={geo.sy(t)} stroke="var(--chart-grid)" strokeWidth={1} />
                <text x={-8} y={geo.sy(t)} dy="0.32em" textAnchor="end" className="num fill-[var(--text-3)] text-[11px]">
                  {usd(String(t), { compact: true, decimals: 0 })}
                </text>
              </g>
            ))}
            <path d={geo.area} fill="var(--bucket-deployable)" fillOpacity={0.1} />
            <path d={geo.d} fill="none" stroke="var(--bucket-deployable)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {/* Policy floor: a threshold, so it is dashed and directly labelled. */}
            <line x1={0} x2={iw} y1={geo.floorY} y2={geo.floorY} stroke="var(--bucket-reserve)" strokeWidth={1.5} strokeDasharray="5 4" />
            <text x={iw} y={geo.floorY - 6} textAnchor="end" className="num fill-[var(--text-2)] text-[11px] font-medium">
              Reserve floor {usd(floor, { compact: true })}
            </text>
            {events.map((ev, i) => {
              const d = day(ev.dueDate);
              if (d < geo.x0 || d > geo.x1) return null;
              return <rect key={`${ev.dueDate}-${i}`} x={geo.sx(d) - 1.5} y={ih + 4} width={3} height={8} rx={1} fill="var(--bucket-obligations)" />;
            })}
            <text x={0} y={ih + 24} className="fill-[var(--text-3)] text-[11px]">
              {dateLabel(points[0]!.date, { month: "short", day: "numeric" })}
            </text>
            <text x={iw} y={ih + 24} textAnchor="end" className="fill-[var(--text-3)] text-[11px]">
              {dateLabel(points[points.length - 1]!.date, { month: "short", day: "numeric" })}
            </text>
            {a && active !== null && (
              <g>
                <line x1={geo.sx(geo.xs[active]!)} x2={geo.sx(geo.xs[active]!)} y1={0} y2={ih} stroke="var(--border-strong)" strokeWidth={1} />
                <circle cx={geo.sx(geo.xs[active]!)} cy={geo.sy(geo.ys[active]!)} r={4.5} fill="var(--bucket-deployable)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}
          </g>
        </svg>
        {a && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 rounded-[var(--radius-control)] bg-text px-2.5 py-1.5 text-xs text-canvas shadow-[var(--shadow-float)]"
            style={{ left: Math.min(Math.max(m.left + geo.sx(geo.xs[active]!) - 80, 0), width - 170) }}
          >
            <div className="font-medium">{dateLabel(a.date)}</div>
            <div className="num">Projected {usd(a.balance)}</div>
            {a.outflow !== "0" && <div className="num opacity-80">Due this period {usd(a.outflow)}</div>}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-3">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 rounded bg-deployable" /> Projected balance (obligations only, no inflows)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0 w-4 border-t-[1.5px] border-dashed border-reserve" /> Policy floor
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-[3px] rounded-sm bg-obligations" /> Payment due
        </span>
        <button type="button" onClick={() => setShowTable((v) => !v)} className="ml-auto font-medium text-accent hover:underline" aria-expanded={showTable}>
          {showTable ? "Hide table" : "View as table"}
        </button>
      </div>
      {showTable && (
        <table className="mt-3 w-full text-[13px]">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-left text-xs text-text-2">
              <th scope="col" className="py-1 font-medium">
                Period ending
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                Payments due
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                Projected balance
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date} className="border-t border-hairline">
                <td className="py-1.5">{dateLabel(p.date)}</td>
                <td className="num py-1.5 text-right">{usd(p.outflow)}</td>
                <td className={cn("num py-1.5 text-right", toNum(p.balance) < toNum(floor) && "font-medium text-danger")}>{usd(p.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
