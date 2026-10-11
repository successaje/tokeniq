"use client";

import { CircleDashed, CircleHelp, CircleSlash, OctagonAlert, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge, type Tone } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { dateTimeLabel, relativeTime } from "@/lib/format";

interface StatusResponse {
  checkedAt: string;
  components: Array<{ id: string; name: string; status: string }>;
  providers: Array<{ provider: string; status: string; lastOkAt: string | null; lastErrorAt: string | null; latencyMs: number | null; consecutiveFailures: number }>;
  data: { opportunitiesFetchedAt: string | null; pricesObservedAt: string | null };
}

type Normalized = "operational" | "degraded" | "outage" | "not_configured" | "disabled" | "unknown";

/** Map whatever the API reports onto honest, user-facing states. Anything unrecognised is "unknown". */
function normalize(status: string): Normalized {
  switch (status) {
    case "operational":
    case "ok":
      return "operational";
    case "degraded":
      return "degraded";
    case "outage":
    case "down":
      return "outage";
    case "not_configured":
      return "not_configured";
    case "disabled":
      return "disabled";
    default:
      return "unknown";
  }
}

const META: Record<Normalized, { label: string; tone: Tone; icon: LucideIcon }> = {
  operational: { label: "Operational", tone: "success", icon: CheckCircle2 },
  degraded: { label: "Degraded", tone: "warning", icon: TriangleAlert },
  outage: { label: "Outage", tone: "danger", icon: OctagonAlert },
  not_configured: { label: "Not configured", tone: "neutral", icon: CircleSlash },
  disabled: { label: "Disabled", tone: "neutral", icon: CircleSlash },
  unknown: { label: "Unknown", tone: "neutral", icon: CircleHelp },
};

const NOTES: Record<string, string> = {
  separate_worker: "Runs in a separate worker that this page cannot observe.",
};

const CHAINS: Record<string, string> = { "1": "Ethereum", "8453": "Base", "42161": "Arbitrum One", "10": "OP Mainnet", "84532": "Base Sepolia", "11155111": "Sepolia" };
const PROVIDERS: Record<string, string> = { chainlink: "Chainlink price feeds", sequencer: "L2 sequencer uptime feed", rpc: "RPC endpoint", morpho: "Morpho API", aave: "Aave v3", safe: "Safe Transaction Service" };

/** "chainlink:8453" → "Chainlink price feeds · Base". Unknown names are shown as reported. */
function providerLabel(id: string): string {
  const [kind, chain] = id.split(":");
  const name = (kind && PROVIDERS[kind]) ?? kind ?? id;
  if (!chain) return name;
  return `${name} · ${CHAINS[chain] ?? `chain ${chain}`}`;
}

function overall(s: StatusResponse): { label: string; tone: Tone; icon: LucideIcon } {
  const states = [...s.components.map((c) => normalize(c.status)), ...s.providers.map((p) => normalize(p.status))];
  if (states.includes("outage")) return { label: "Some systems have an outage", tone: "danger", icon: OctagonAlert };
  if (states.includes("degraded")) return { label: "Some systems are degraded", tone: "warning", icon: TriangleAlert };
  if (states.includes("unknown")) return { label: "Operational, with components whose state is unknown", tone: "info", icon: CircleDashed };
  return { label: "All checked systems are operational", tone: "success", icon: CheckCircle2 };
}

export function StatusBoard() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status", { cache: "no-store", headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`The status service answered ${res.status}.`);
      const json = (await res.json()) as StatusResponse;
      if (!json || !Array.isArray(json.components)) throw new Error("The status service returned an unexpected response.");
      setData(json);
    } catch (e) {
      setData(null);
      setError(e instanceof Error && e.message && !e.message.startsWith("Failed to fetch") ? e.message : "The status service could not be reached.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-2" aria-live="polite">
          {data ? (
            <>
              Checked <time dateTime={data.checkedAt}>{relativeTime(data.checkedAt)}</time> · <span className="text-text-3">{dateTimeLabel(data.checkedAt)}</span>
            </>
          ) : loading ? (
            "Checking…"
          ) : (
            "Status unavailable"
          )}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] border border-border-strong/60 bg-surface px-3 text-[13px] font-medium text-text hover:bg-sunken disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" />
          Check again
        </button>
      </div>

      {error && !data && (
        <Callout tone="warning" title="Status unavailable">
          {error} This does not necessarily mean TokenIQ is down; the status endpoint itself may be unreachable. Try again shortly.
        </Callout>
      )}

      {loading && !data && !error && (
        <div role="status" aria-label="Loading status" className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {data && (
        <>
          <OverallBanner s={data} />
          <section aria-labelledby="components-title">
            <h2 id="components-title" className="text-xs font-medium text-text-2">
              Components
            </h2>
            <ul className="mt-3 divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline bg-surface">
              {data.components.map((c) => {
                const n = normalize(c.status);
                const m = META[n];
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-text">{c.name}</p>
                      {NOTES[c.status] && <p className="text-xs text-text-3">{NOTES[c.status]}</p>}
                    </div>
                    <StatusBadge tone={m.tone} icon={m.icon}>
                      {m.label}
                    </StatusBadge>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="providers-title">
            <h2 id="providers-title" className="text-xs font-medium text-text-2">
              Data providers
            </h2>
            {data.providers.length === 0 ? (
              <p className="mt-3 rounded-[var(--radius-card)] border border-dashed border-hairline px-4 py-5 text-[13px] text-text-2">
                No provider checks have run yet, so their state is unknown. They appear here after the first background sync.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline bg-surface">
                {data.providers.map((p) => {
                  const m = META[normalize(p.status)];
                  return (
                    <li key={p.provider} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-text">{providerLabel(p.provider)}</p>
                        <p className="text-xs text-text-3">
                          Last success {p.lastOkAt ? relativeTime(p.lastOkAt) : "never"}
                          {p.lastErrorAt ? ` · last error ${relativeTime(p.lastErrorAt)}` : ""}
                          {p.latencyMs !== null ? ` · ${p.latencyMs} ms` : ""}
                          {p.consecutiveFailures > 0 ? ` · ${p.consecutiveFailures} failed checks in a row` : ""}
                        </p>
                      </div>
                      <StatusBadge tone={m.tone} icon={m.icon} className="justify-self-start sm:justify-self-end">
                        {m.label}
                      </StatusBadge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="freshness-title">
            <h2 id="freshness-title" className="text-xs font-medium text-text-2">
              Data freshness
            </h2>
            <dl className="mt-3 divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline bg-surface text-[14px]">
              <Fresh label="Latest price observation" at={data.data.pricesObservedAt} />
              <Fresh label="Latest venue data fetch" at={data.data.opportunitiesFetchedAt} />
            </dl>
          </section>
        </>
      )}
    </div>
  );
}

function OverallBanner({ s }: { s: StatusResponse }) {
  const o = overall(s);
  const Icon = o.icon;
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-hairline bg-surface px-4 py-4">
      <Icon className={cn("size-5 shrink-0", { success: "text-success", warning: "text-warning", danger: "text-danger", info: "text-info", neutral: "text-text-3", accent: "text-accent" }[o.tone])} aria-hidden="true" />
      <p className="text-[16px] font-medium text-text">{o.label}</p>
    </div>
  );
}

function Fresh({ label, at }: { label: string; at: string | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
      <dt className="text-text">{label}</dt>
      <dd className="text-text-2">{at ? <time dateTime={at}>{`${relativeTime(at)} · ${dateTimeLabel(at)}`}</time> : <StatusBadge tone="neutral">No data yet</StatusBadge>}</dd>
    </div>
  );
}
