import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";

const n = (v: string) => Number.parseFloat(v); // geometry only; every label uses the exact string

function niceStep(max: number) {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const k = raw / mag;
  return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 2.5 ? 2.5 : k <= 5 ? 5 : 10) * mag;
}

/**
 * Projected level chart (server-rendered, no JS): a step line of the liquid
 * balance over the horizon, the policy floor as a labelled dashed line, and
 * each payment as a tick on the time axis. Strokes do not scale with the
 * responsive SVG; text lives in HTML so it stays legible at any width.
 */
export function LevelChart({
  points,
  floor,
  floorLabel = "Policy floor",
  events,
  days,
  title,
  className,
}: {
  points: Array<{ inDays: number; balance: string; outflow: string }>;
  floor: string;
  floorLabel?: string;
  events: Array<{ inDays: number; title: string; usd: string }>;
  days: number;
  title: string;
  className?: string;
}) {
  const H = 300;
  const W = 1000;
  const max = Math.max(...points.map((p) => n(p.balance)), n(floor));
  const step = niceStep(max * 1.08);
  const yMax = Math.ceil((max * 1.08) / step) * step;
  const x = (d: number) => (d / days) * W;
  const y = (v: number) => H - (v / yMax) * H;
  let d = `M 0 ${y(n(points[0]!.balance))}`;
  for (let i = 1; i < points.length; i++) d += ` H ${x(points[i]!.inDays)} V ${y(n(points[i]!.balance))}`;
  d += ` H ${W}`;
  const area = `${d} V ${H} H 0 Z`;
  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-6; v += step) ticks.push(v);
  const lowest = points.reduce((a, b) => (n(b.balance) < n(a.balance) ? b : a), points[0]!);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const summary = `${title}. Starts at ${usd(points[0]!.balance, { decimals: 0 })}, falls with each payment to a low of ${usd(lowest.balance, { decimals: 0 })} on day ${lowest.inDays}, and ${n(lowest.balance) >= n(floor) ? "stays above" : "falls below"} the ${usd(floor, { decimals: 0 })} ${floorLabel.toLowerCase()}.`;

  return (
    <figure className={className}>
      <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-2">
        {/* y axis */}
        <div className="relative h-[240px] sm:h-[280px]" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="num absolute right-0 -translate-y-1/2 text-[11px] text-text-3" style={{ top: pct(H - (t / yMax) * H, H) }}>
              {usd(String(t), { compact: true, decimals: 0 })}
            </span>
          ))}
        </div>
        <div className="relative h-[240px] sm:h-[280px]">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" role="img" aria-label={summary}>
            {ticks.map((t) => (
              <line key={t} x1={0} x2={W} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill="var(--bucket-deployable)" fillOpacity={0.09} />
            <path d={d} fill="none" stroke="var(--bucket-deployable)" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <line x1={0} x2={W} y1={y(n(floor))} y2={y(n(floor))} stroke="var(--bucket-reserve)" strokeWidth={1.5} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
            {events.map((e, i) => (
              <line key={i} x1={x(e.inDays)} x2={x(e.inDays)} y1={H} y2={H - 10} stroke="var(--bucket-obligations)" strokeWidth={3} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          <span className="num pointer-events-none absolute left-2 -translate-y-[calc(100%+4px)] text-[11px] font-medium text-text-2" style={{ top: pct(y(n(floor)), H) }} aria-hidden="true">
            {floorLabel} {usd(floor, { compact: true })}
          </span>
          <span
            className="num pointer-events-none absolute -translate-x-full -translate-y-[calc(100%+4px)] whitespace-nowrap pr-1 text-[11px] font-medium text-text"
            style={{ left: pct(x(lowest.inDays), W), top: pct(y(n(lowest.balance)), H) }}
            aria-hidden="true"
          >
            Low {usd(lowest.balance, { compact: true })}
          </span>
        </div>
        <div />
        <div className="relative mt-2 h-4 text-[11px] text-text-3" aria-hidden="true">
          {[0, 30, 60, 90].filter((t) => t <= days).map((t) => (
            <span key={t} className={cn("absolute", t === 0 ? "left-0" : t === days ? "right-0" : "-translate-x-1/2")} style={t === 0 || t === days ? undefined : { left: pct(t, days) }}>
              {t === 0 ? "Today" : `${t} days`}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-3">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 rounded bg-deployable" /> Projected liquid balance
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="w-4 border-t-[1.5px] border-dashed border-reserve" /> {floorLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-[3px] rounded-sm bg-obligations" /> Payment due
        </span>
      </figcaption>
      <details className="group mt-3 text-[13px]">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">View payments as a table</span>
          <span className="hidden group-open:inline">Hide table</span>
        </summary>
        <table className="mt-3 w-full">
          <caption className="sr-only">{title}: payments and projected balance</caption>
          <thead>
            <tr className="text-left text-xs text-text-2">
              <th scope="col" className="border-b border-hairline py-1.5 font-medium">
                Due
              </th>
              <th scope="col" className="border-b border-hairline py-1.5 font-medium">
                Payment
              </th>
              <th scope="col" className="border-b border-hairline py-1.5 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="border-b border-hairline py-1.5 text-right font-medium">
                Balance after
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => {
              const after = points.find((p) => p.inDays === e.inDays)?.balance ?? "0";
              return (
                <tr key={i}>
                  <td className="num border-b border-hairline py-1.5 text-text-2">Day {e.inDays}</td>
                  <td className="border-b border-hairline py-1.5 text-text">{e.title}</td>
                  <td className="num border-b border-hairline py-1.5 text-right text-text">{usd(e.usd, { decimals: 0 })}</td>
                  <td className="num border-b border-hairline py-1.5 text-right text-text-2">{usd(after, { decimals: 0 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
