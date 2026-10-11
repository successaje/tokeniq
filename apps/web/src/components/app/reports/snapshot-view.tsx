"use client";

import { parseDecimal, wadToString } from "@tokeniq/core";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CoverageBadge, UncertaintyBadge } from "@/components/app/coverage-badge";
import { Button } from "@/components/ui/button";
import { Money, TokenAmount } from "@/components/ui/money";
import { QueryError } from "@/components/ui/query-error";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { dateLabel, dateTimeLabel, pct, tokenAmount, usd } from "@/lib/format";
import { useOrgQuery } from "@/lib/org";
import type { SnapshotDto } from "@/lib/types";

/**
 * Print rules scoped to this page: hide the app shell (sidebar, top bar, mobile
 * navigation, toasts), remove its offsets and print in the light palette.
 */
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  :root:root:root {
    --canvas: #ffffff; --surface: #ffffff; --sunken: #f3f4f3; --raised: #ffffff; --hairline: #d6d9d8; --border-strong: #8a9396;
    --text: #0f1416; --text-2: #3f484c; --text-3: #5b6569; --accent: #0e6470; --accent-subtle: #e4f1f2;
    --success: #1e7a46; --success-subtle: #e7f4ec; --warning: #995700; --warning-subtle: #fdf3e3; --danger: #b42318; --danger-subtle: #fdeceb;
    --info: #2f5fb3; --info-subtle: #eaf0fb; color-scheme: light;
  }
  html, body { background: #ffffff !important; }
  aside[aria-label="Primary"], nav[aria-label="Primary"], header.sticky, [role="region"][aria-label^="Notifications"], nextjs-portal { display: none !important; }
  .lg\\:pl-\\[232px\\] { padding-left: 0 !important; }
  main#main { max-width: none !important; padding: 0 !important; }
  .snapshot-section { break-inside: avoid-page; }
  .snapshot-table tr { break-inside: avoid; }
  a { color: inherit !important; text-decoration: none !important; }
}
`;

function Section({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="snapshot-section border-t border-hairline py-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {note && <span className="text-xs text-text-3">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function Total({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-hairline px-3 py-2.5">
      <dt className="text-xs font-medium text-text-2">{label}</dt>
      <dd className="mt-0.5 text-lg font-medium tracking-tight text-text">
        <Money value={value} />
      </dd>
      {note && <dd className="text-[11px] text-text-3">{note}</dd>}
    </div>
  );
}

function Line({ label, value, strong, note, sign }: { label: string; value: ReactNode; strong?: boolean; note?: string; sign?: string }) {
  return (
    <div className={cn("grid grid-cols-[1rem_minmax(0,1fr)_auto] items-baseline gap-x-2 py-1.5 text-[13px]", strong && "border-t border-hairline font-medium")}>
      <span className="text-text-3" aria-hidden="true">
        {sign}
      </span>
      <span>
        <span className="text-text">{label}</span>
        {note && <span className="block text-xs font-normal text-text-3">{note}</span>}
      </span>
      <span className="num text-right text-text">{value}</span>
    </div>
  );
}

export function SnapshotView() {
  const q = useOrgQuery<SnapshotDto>("/reports/snapshot", { staleTime: 0 });

  if (q.isLoading) {
    return (
      <LoadingRegion label="Preparing the snapshot…" className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </LoadingRegion>
    );
  }
  if (q.isError || !q.data) return <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't prepare the snapshot" />;
  const d = q.data;
  const r = d.reserve;
  const t = d.treasury;
  const occ = r.obligations.occurrences.filter((o) => o.direction === "outflow");
  const holdingsTotal = wadToString(d.holdings.reduce((s, h) => s + (h.valueUsd ? parseDecimal(h.valueUsd) : 0n), 0n));
  const positionsTotal = wadToString(d.positions.reduce((s, p) => s + (p.valueUsd ? parseDecimal(p.valueUsd) : 0n), 0n));
  const binding = r.rules.find((x) => x.binding);

  return (
    <div className="mx-auto max-w-4xl">
      <style>{PRINT_CSS}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/reports">
            <ArrowLeft className="size-4" aria-hidden="true" /> Reports
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-text-3 sm:inline">Use “Save as PDF” in the print dialog for a file.</span>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" /> Print
          </Button>
        </div>
      </div>

      <article className="rounded-[var(--radius-card)] border border-hairline bg-surface px-5 py-6 sm:px-8 print:border-0 print:p-0">
        <header className="pb-5">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-text-3">Treasury snapshot</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-text">{d.organization}</h1>
          <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-2">
            <div>
              <dt className="inline text-text-3">Generated </dt>
              <dd className="inline">{dateTimeLabel(d.generatedAt)}</dd>
            </div>
            <div>
              <dt className="inline text-text-3">Position as of </dt>
              <dd className="inline">{dateLabel(d.asOf)}</dd>
            </div>
            <div>
              <dt className="inline text-text-3">Balances last observed </dt>
              <dd className="inline">{d.lastObservedAt ? dateTimeLabel(d.lastObservedAt) : "never"}</dd>
            </div>
            <div>
              <dt className="inline text-text-3">Treasury policy </dt>
              <dd className="inline">version {d.policyVersion}</dd>
            </div>
          </dl>
          {d.isSample && (
            <p className="mt-3 rounded-[var(--radius-control)] border border-warning/40 bg-warning-subtle px-3 py-2 text-xs font-medium text-warning">
              Sample workspace: every balance and obligation in this report is simulated.
            </p>
          )}
        </header>

        <Section title="Position">
          <p className="text-[15px] leading-6 text-text text-pretty">{d.sentence}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CoverageBadge reserve={r} />
            <UncertaintyBadge level={r.uncertainty.level} />
          </div>
          {!t.complete && (
            <Callout tone="warning" className="mt-3" title="Some figures are incomplete">
              {t.issues.map((i) => i.message).join(". ")}.
            </Callout>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Total label="Total tracked treasury" value={t.gross} note="Market value, all included accounts" />
            <Total label="Liquid stablecoins" value={t.liquid.stable} note="Market value" />
            <Total label="Other liquid assets" value={t.liquid.other} note="Never counted toward the reserve" />
            <Total label="Deployed in protocols" value={t.allocated.total} note={`${usd(t.allocated.withdrawableNow, { compact: true })} withdrawable now`} />
            <Total label="Reserve-eligible" value={t.reserveEligible} note="Capped at $1 per token, after haircuts" />
            <Total label="Unverified, excluded" value={t.unverifiedValue} note="Accounts whose control is not verified" />
          </dl>
        </Section>

        <Section title="Reserve requirement" note={binding ? `Set by the ${binding.label.toLowerCase()} rule` : "No requirement configured"}>
          <Table className="snapshot-table">
            <thead>
              <tr>
                <Th>Rule</Th>
                <Th>Status</Th>
                <Th numeric>Amount</Th>
              </tr>
            </thead>
            <tbody>
              {r.rules.map((rule) => (
                <Tr key={rule.id}>
                  <Td className="py-2">
                    <div className="font-medium">{rule.label}</div>
                    <div className="text-xs text-text-3">{rule.explanation}</div>
                  </Td>
                  <Td className="py-2">
                    {rule.binding ? (
                      <StatusBadge tone="accent" icon={null}>
                        Binding (strictest)
                      </StatusBadge>
                    ) : rule.enabled ? (
                      <span className="text-xs text-text-2">Enabled</span>
                    ) : (
                      <span className="text-xs text-text-3">Off</span>
                    )}
                  </Td>
                  <Td numeric className="py-2">
                    <Money value={rule.amount} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <div className="mt-3 rounded-[var(--radius-control)] bg-sunken px-4 py-2">
            <Line label="Requirement" note="The strictest enabled rule" value={<Money value={r.required} />} strong />
            <Line label="Reserve-eligible capital" value={<Money value={r.available} />} />
            {r.pendingOutflows !== "0" && <Line sign="−" label="Pending proposals" note="In active proposals (awaiting approval, signatures or execution), counted as spent" value={<Money value={r.pendingOutflows} />} />}
            <Line label="Coverage" value={r.coverageBps === null ? "No requirement" : pct(r.coverageBps, 0)} />
            {r.status === "shortfall" && <Line label="Shortfall" value={<Money value={r.shortfall} className="text-danger" />} />}
            <Line label="Runway covered" note={r.burn.basis === "none" ? "No monthly burn estimate" : `At ${usd(r.burn.used)} per month`} value={r.runwayCoveredMonths ? `${r.runwayCoveredMonths} months` : "—"} />
          </div>
        </Section>

        <Section title="Deployable">
          <div className="rounded-[var(--radius-control)] bg-sunken px-4 py-2">
            <Line label="Available after the reserve" note="Reserve-eligible capital minus the requirement and pending proposals" value={<Money value={r.surplus.afterReserve} />} />
            <Line label="Room under the maximum-deployed limit" note={`${pct(d.policy.maxDeployedBps, 0)} of the total treasury, minus what is already deployed`} value={<Money value={r.surplus.capRemaining} />} />
            <Line sign="=" label="Deployable surplus" note={r.surplus.explanation} value={<Money value={r.surplus.deployable} />} strong />
          </div>
        </Section>

        <Section title="Obligations in the horizon" note={`Unpaid, due through ${dateLabel(r.horizonEnd)} (${d.policy.obligationHorizonDays} days)`}>
          {occ.length === 0 ? (
            <p className="text-sm text-text-2">No unpaid obligations fall in the horizon.</p>
          ) : (
            <Table className="snapshot-table">
              <thead>
                <tr>
                  <Th>Due</Th>
                  <Th>Obligation</Th>
                  <Th>Certainty</Th>
                  <Th numeric>Amount</Th>
                  <Th numeric>USD</Th>
                </tr>
              </thead>
              <tbody>
                {occ.map((o) => (
                  <Tr key={`${o.obligationId}-${o.dueDate}`}>
                    <Td className="whitespace-nowrap py-2">
                      {dateLabel(o.dueDate, { month: "short", day: "numeric", year: "numeric" })}
                      {o.overdue && <span className="block text-xs font-medium text-danger">Overdue</span>}
                    </Td>
                    <Td className="py-2">
                      <div className="font-medium">{o.title}</div>
                      <div className="text-xs text-text-3">
                        <span className="capitalize">{o.category}</span> · {o.priority} priority
                      </div>
                    </Td>
                    <Td className="py-2 capitalize text-text-2">{o.certainty}</Td>
                    <Td numeric className="py-2">
                      {o.currency === "USD" ? <Money value={o.amount} /> : `${usd(o.amount).replace("$", "")} ${o.currency}`}
                    </Td>
                    <Td numeric className="py-2">
                      {o.usd ? <Money value={o.usd} approximate={o.currency !== "USD"} /> : "No rate"}
                    </Td>
                  </Tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <Td className="font-medium" colSpan={4}>
                    Total in horizon{r.obligations.overdue !== "0" ? ` (including ${usd(r.obligations.overdue)} overdue)` : ""}
                  </Td>
                  <Td numeric className="font-medium">
                    <Money value={r.obligations.total} />
                  </Td>
                </tr>
              </tfoot>
            </Table>
          )}
          {r.obligations.excludedEstimates !== "0" && <p className="mt-2 text-xs text-text-3">{usd(r.obligations.excludedEstimates)} of estimated obligations is excluded by policy.</p>}
          {r.obligations.unconvertible > 0 && <p className="mt-2 text-xs text-warning">{r.obligations.unconvertible} obligation occurrence(s) could not be converted to USD and are not in the total.</p>}
        </Section>

        <Section title="Holdings" note={`${d.accounts.length} account${d.accounts.length === 1 ? "" : "s"}`}>
          {d.holdings.length === 0 ? (
            <p className="text-sm text-text-2">No wallet balances observed.</p>
          ) : (
            <Table className="snapshot-table">
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th>Asset</Th>
                  <Th numeric>Balance</Th>
                  <Th numeric>Price</Th>
                  <Th numeric>Value</Th>
                </tr>
              </thead>
              <tbody>
                {d.holdings.map((h) => (
                  <Tr key={`${h.accountId}-${h.chainId}-${h.assetAddress}`}>
                    <Td className="py-2">
                      <div className="font-medium">{h.accountLabel}</div>
                      <div className="text-xs text-text-3">{h.chain}</div>
                    </Td>
                    <Td className="py-2">{h.symbol}</Td>
                    <Td numeric className="py-2">
                      <span className="num">{tokenAmount(h.raw, h.decimals, 2)}</span>
                    </Td>
                    <Td numeric className="py-2 text-xs text-text-2">
                      {h.price ? (
                        <>
                          ${tokenAmount(h.price.value, h.price.decimals, 4)}
                          {h.price.stale && <span className="block font-medium text-warning">Stale</span>}
                        </>
                      ) : (
                        "No price"
                      )}
                    </Td>
                    <Td numeric className="py-2">
                      <Money value={h.valueUsd} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <Td className="font-medium" colSpan={4}>
                    Total in wallets
                  </Td>
                  <Td numeric className="font-medium">
                    <Money value={holdingsTotal} />
                  </Td>
                </tr>
              </tfoot>
            </Table>
          )}
          {d.positions.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-sm font-semibold text-text">Protocol positions</h3>
              <Table className="snapshot-table">
                <thead>
                  <tr>
                    <Th>Venue</Th>
                    <Th>Account</Th>
                    <Th numeric>Amount</Th>
                    <Th numeric>Value</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.positions.map((p) => (
                    <Tr key={p.id}>
                      <Td className="py-2">
                        <div className="font-medium">{p.venueName}</div>
                        <div className="text-xs text-text-3">
                          {p.protocol} · {p.chain}
                        </div>
                      </Td>
                      <Td className="py-2">{p.accountLabel}</Td>
                      <Td numeric className="py-2">
                        <TokenAmount raw={p.assetsRaw} decimals={p.decimals} symbol={p.symbol} />
                      </Td>
                      <Td numeric className="py-2">
                        <Money value={p.valueUsd} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <Td className="font-medium" colSpan={3}>
                      Total deployed
                    </Td>
                    <Td numeric className="font-medium">
                      <Money value={positionsTotal} />
                    </Td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Section>

        <footer className="border-t border-hairline pt-4 text-xs text-text-3">
          <p className="font-medium text-text-2">{d.disclaimer}</p>
          <p className="mt-1">
            Generated by TokenIQ on {dateTimeLabel(d.generatedAt)}. Stablecoins count toward the reserve at no more than $1 per token after policy haircuts; balances in unverified accounts and non-stable assets are excluded from reserve figures.
          </p>
        </footer>
      </article>
    </div>
  );
}
