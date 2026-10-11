"use client";

import { formatDecimal, toWad, wadToString } from "@tokeniq/core";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { dateLabel, usd } from "@/lib/format";
import type { MetaTokenDto, TreasuryHistoryDto } from "@/lib/types";
import { tokenKey } from "./meta";

export type HistorySeries = { kind: "usd" } | { kind: "symbol"; symbol: string };

export interface HistoryPoint {
  date: string;
  /** 18-decimal total (USD face value, or token units for a single symbol). */
  total: bigint;
  /** Number of account/asset balances known on this date. */
  observed: number;
}

/**
 * Daily totals from snapshot history, exactly. Each account/asset balance is
 * carried forward from its last observation (balances persist between syncs);
 * before an account's first observation it is absent, never zero.
 */
export function aggregateHistory(points: TreasuryHistoryDto["points"], tokens: Map<string, MetaTokenDto>, series: HistorySeries, includedAccounts: Set<string>): { points: HistoryPoint[]; unknownAssets: number } {
  const last = new Map<string, bigint>();
  const unknown = new Set<string>();
  const out: HistoryPoint[] = [];
  for (const p of [...points].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const e of p.stableRaw) {
      if (includedAccounts.size && !includedAccounts.has(e.accountId)) continue;
      const t = tokens.get(tokenKey(e.chainId, e.asset));
      if (!t) {
        unknown.add(tokenKey(e.chainId, e.asset));
        continue;
      }
      if (t.assetClass !== "stablecoin") continue;
      if (series.kind === "usd" ? t.pegCurrency !== "USD" : t.symbol !== series.symbol) continue;
      last.set(`${e.accountId}|${e.asset.toLowerCase()}`, toWad(BigInt(e.raw), t.decimals));
    }
    if (last.size === 0) continue;
    let total = 0n;
    for (const v of last.values()) total += v;
    out.push({ date: p.date, total, observed: last.size });
  }
  return { points: out, unknownAssets: unknown.size };
}

const toNum = (v: bigint) => Number(v / 10n ** 12n) / 1e6; // geometry only

function niceStep(range: number) {
  const raw = range / 4;
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-9)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

export function BalanceHistoryChart({ points, unit, height = 200, className }: { points: HistoryPoint[]; unit: { kind: "usd" } | { kind: "token"; symbol: string }; height?: number; className?: string }) {
  // Callback ref: the measured element only exists once there are two or more points.
  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if (!wrapEl) return;
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(260, Math.floor(e.contentRect.width))));
    ro.observe(wrapEl);
    return () => ro.disconnect();
  }, [wrapEl]);

  const fmt = (v: bigint, compact = false) => (unit.kind === "usd" ? usd(wadToString(v), { compact }) : `${formatDecimal(v, 18, { maxFractionDigits: 2, minFractionDigits: compact ? 0 : 2, grouping: true })} ${unit.symbol}`);
  const fmtAxis = (n: number) => (unit.kind === "usd" ? usd(String(n), { compact: true, decimals: 0 }) : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n));

  const m = { top: 12, right: 12, bottom: 26, left: 56 };
  const iw = width - m.left - m.right;
  const ih = height - m.top - m.bottom;

  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const xs = points.map((p) => day(p.date));
    const ys = points.map((p) => toNum(p.total));
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const pad = (hi - lo) * 0.15 || hi * 0.05 || 1;
    const step = niceStep(hi + pad - Math.max(0, lo - pad));
    const yMin = Math.max(0, Math.floor((lo - pad) / step) * step);
    const yMax = Math.ceil((hi + pad) / step) * step;
    const x0 = xs[0]!;
    const x1 = xs[xs.length - 1]!;
    const sx = (d: number) => ((d - x0) / Math.max(1, x1 - x0)) * iw;
    const sy = (v: number) => ih - ((v - yMin) / Math.max(1e-9, yMax - yMin)) * ih;
    // Balances persist between observations, so the line steps.
    let d = `M ${sx(xs[0]!)} ${sy(ys[0]!)}`;
    for (let i = 1; i < xs.length; i++) d += ` H ${sx(xs[i]!)} V ${sy(ys[i]!)}`;
    const area = `${d} V ${ih} H ${sx(xs[0]!)} Z`;
    const ticks: number[] = [];
    for (let v = yMin; v <= yMax + step / 1000; v += step) ticks.push(v);
    return { xs, ys, sx, sy, d, area, ticks };
  }, [points, iw, ih]);

  if (points.length === 0) {
    return <div className={cn("flex h-40 items-center justify-center rounded-[var(--radius-card)] border border-dashed border-hairline px-4 text-center text-sm text-text-2", className)}>No balance observations in this period yet. History begins with the first sync of each account.</div>;
  }
  if (!geo) {
    return (
      <div className={cn("flex h-40 flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-hairline px-4 text-center text-sm text-text-2", className)}>
        <span className="num text-lg font-medium text-text">{fmt(points[0]!.total)}</span>
        <span>Only one day observed so far ({dateLabel(points[0]!.date)}). The chart appears after a second day of observations.</span>
      </div>
    );
  }

  const first = points[0]!;
  const lastP = points[points.length - 1]!;
  const lowIdx = points.reduce((b, p, i) => (p.total < points[b]!.total ? i : b), 0);
  const highIdx = points.reduce((b, p, i) => (p.total > points[b]!.total ? i : b), 0);
  const summary = `Stablecoin balance from ${dateLabel(first.date)} to ${dateLabel(lastP.date)}: started at ${fmt(first.total, true)}, now ${fmt(lastP.total, true)}; lowest ${fmt(points[lowIdx]!.total, true)} on ${dateLabel(points[lowIdx]!.date)}, highest ${fmt(points[highIdx]!.total, true)} on ${dateLabel(points[highIdx]!.date)}.`;
  const a = active !== null ? points[active] : null;

  return (
    <div className={className}>
      <div ref={setWrapEl} className="relative w-full min-w-0 overflow-hidden">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={summary}
          tabIndex={0}
          className="block touch-pan-y outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
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
            let dist = Infinity;
            geo.xs.forEach((d, i) => {
              const dd = Math.abs(geo.sx(d) - x);
              if (dd < dist) {
                dist = dd;
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
                <line x1={0} x2={iw} y1={geo.sy(t)} y2={geo.sy(t)} stroke="var(--chart-grid)" />
                <text x={-8} y={geo.sy(t)} dy="0.32em" textAnchor="end" className="num fill-[var(--text-3)] text-[11px]">
                  {fmtAxis(t)}
                </text>
              </g>
            ))}
            <path d={geo.area} fill="var(--text-2)" fillOpacity={0.07} />
            <path d={geo.d} fill="none" stroke="var(--text)" strokeWidth={1.75} strokeLinejoin="round" />
            {geo.xs.map((d, i) => (
              <circle key={i} cx={geo.sx(d)} cy={geo.sy(geo.ys[i]!)} r={points.length > 60 ? 0 : 2} fill="var(--text)" />
            ))}
            <text x={0} y={ih + 20} className="fill-[var(--text-3)] text-[11px]">
              {dateLabel(first.date, { month: "short", day: "numeric" })}
            </text>
            <text x={iw} y={ih + 20} textAnchor="end" className="fill-[var(--text-3)] text-[11px]">
              {dateLabel(lastP.date, { month: "short", day: "numeric" })}
            </text>
            {a && active !== null && (
              <g>
                <line x1={geo.sx(geo.xs[active]!)} x2={geo.sx(geo.xs[active]!)} y1={0} y2={ih} stroke="var(--border-strong)" />
                <circle cx={geo.sx(geo.xs[active]!)} cy={geo.sy(geo.ys[active]!)} r={4.5} fill="var(--text)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}
          </g>
        </svg>
        {a && active !== null && (
          <div role="status" className="pointer-events-none absolute top-1 rounded-[var(--radius-control)] bg-text px-2.5 py-1.5 text-xs text-canvas shadow-[var(--shadow-float)]" style={{ left: Math.min(Math.max(m.left + geo.sx(geo.xs[active]!) - 80, 0), width - 180) }}>
            <div className="font-medium">{dateLabel(a.date)}</div>
            <div className="num">{fmt(a.total)}</div>
            <div className="opacity-80">
              {a.observed} balance{a.observed === 1 ? "" : "s"} known
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-3">
        <span>
          {points.length} observed day{points.length === 1 ? "" : "s"} · balances carry forward between observations
        </span>
        <button type="button" onClick={() => setShowTable((v) => !v)} className="ml-auto font-medium text-accent hover:underline" aria-expanded={showTable}>
          {showTable ? "Hide table" : "View as table"}
        </button>
      </div>
      {showTable && (
        <div className="mt-3 max-h-72 overflow-y-auto">
          <table className="w-full text-[13px]">
            <caption className="sr-only">Daily stablecoin balance</caption>
            <thead className="sticky top-0 bg-surface">
              <tr className="text-left text-xs text-text-2">
                <th scope="col" className="py-1 font-medium">
                  Date
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Balance
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Balances known
                </th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date} className="border-t border-hairline">
                  <td className="py-1.5">{dateLabel(p.date)}</td>
                  <td className="num py-1.5 text-right">{fmt(p.total)}</td>
                  <td className="num py-1.5 text-right text-text-3">{p.observed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
