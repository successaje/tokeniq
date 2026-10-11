"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Info } from "lucide-react";
import type { ReactNode } from "react";
import { AddressText, ChainLabel, Freshness } from "@/components/ui/identity";
import { Money } from "@/components/ui/money";
import { checkSummary, PolicyCheckList } from "@/components/ui/policy-checks";
import { Sheet } from "@/components/ui/sheet";
import { Callout, StatusBadge } from "@/components/ui/status";
import { api } from "@/lib/api";
import { pct } from "@/lib/format";
import type { MetaDto, OpportunityDto } from "@/lib/types";
import { fetchedIso, KIND_LABEL, MEASUREMENT_LABEL, protocolLabel, VENUE_STALE_MINUTES, WITHDRAWAL_LABEL } from "./labels";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-hairline py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text-3">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="py-1">
      <div className="flex items-baseline justify-between gap-4 text-[13px]">
        <dt className="text-text-2">{label}</dt>
        <dd className="num text-right font-medium text-text">{children}</dd>
      </div>
      {hint && <p className="text-xs text-text-3">{hint}</p>}
    </div>
  );
}

const safeHref = (url: string | null | undefined) => (url && /^https:\/\//i.test(url) ? url : null);

/** Every check and figure for one venue, with the illustrative yield clearly labelled. */
export function OpportunitySheet({ venue: o, open, missing, onOpenChange }: { venue?: OpportunityDto; open: boolean; missing: boolean; onOpenChange: (v: boolean) => void }) {
  const meta = useQuery({ queryKey: ["meta"], queryFn: () => api<MetaDto>("/api/v1/meta"), staleTime: 3_600_000 });
  if (missing) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="Venue not found">
        <p className="text-sm text-text-2">This venue is not in the current venue data. It may have been delisted or the link is out of date.</p>
      </Sheet>
    );
  }
  if (!o) return null;
  const explorer = meta.data?.chains.find((c) => c.id === o.chainId)?.explorer;
  const curatorUrl = safeHref(o.curator?.url);
  const sourceUrl = safeHref(o.source.url);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      width="lg"
      title={o.name}
      description={
        <span className="flex flex-wrap items-center gap-x-2">
          {protocolLabel(o.protocol)} · {KIND_LABEL[o.kind]} · <ChainLabel chainId={o.chainId} name={o.chain} /> · {o.asset.symbol}
        </span>
      }
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {o.suitability.suitable ? <StatusBadge tone="success">Suitable under your policy</StatusBadge> : <StatusBadge tone="danger">Not suitable: {checkSummary(o.suitability.checks)}</StatusBadge>}
        {o.listed ? (
          <StatusBadge tone="accent" icon={null}>
            Listed for execution
          </StatusBadge>
        ) : (
          <StatusBadge tone="neutral" icon={null}>
            Reference only — cannot become a proposal
          </StatusBadge>
        )}
      </div>

      {o.warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {o.warnings.map((w) => (
            <Callout key={w.code} tone={w.level === "critical" ? "danger" : w.level === "warning" ? "warning" : "info"} title={w.level === "critical" ? "Critical warning" : w.level === "warning" ? "Warning" : "Note"}>
              {w.message}
            </Callout>
          ))}
        </div>
      )}

      <Block title="Rate">
        <dl>
          <Row label="Net APY" hint={`${MEASUREMENT_LABEL[o.apy.measurement]} from ${o.source.name}. Rates move with borrowing demand.`}>
            {pct(o.apy.netBps, 2)}
          </Row>
          <Row label="Native yield (after fees)">{pct(o.apy.nativeBps, 2)}</Row>
          <Row label="Incentive rewards" hint={o.apy.rewardsBps > 0 ? "Rewards can end at any time without notice." : undefined}>
            {pct(o.apy.rewardsBps, 2)}
          </Row>
          <Row label="Curator or protocol fee">{o.feeBps === null ? "Not applicable" : pct(o.feeBps, 2)}</Row>
        </dl>
      </Block>

      <Block title="Illustrative yield">
        <div className="rounded-[var(--radius-control)] bg-sunken px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-text-2">On $100,000 for one year</span>
            <Money value={o.illustrativeYieldOn100k} className="text-base font-medium text-text" />
          </div>
          <p className="mt-1 flex gap-1.5 text-xs text-text-3">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Illustrative only: simple interest at the current {pct(o.apy.netBps, 2)} net rate held constant for 365 days. Not a forecast or a promise; actual yield will differ.
          </p>
        </div>
      </Block>

      <Block title="Size and liquidity">
        <dl>
          <Row label="Total value locked">
            <Money value={o.tvlUsd} />
          </Row>
          <Row label="Available to withdraw now" hint="Assets the venue could pay out right now; withdrawals beyond this wait for liquidity.">
            <Money value={o.availableLiquidityUsd} />
          </Row>
          <Row label="Largest position your policy allows here" hint="Your policy caps a position at a share of the venue's available liquidity, so you can always exit.">
            <Money value={o.maxPositionByLiquidity} />
          </Row>
        </dl>
      </Block>

      <Block title="Withdrawal terms">
        <p className="text-sm text-text">{WITHDRAWAL_LABEL[o.withdrawal]}</p>
        <p className="mt-0.5 text-xs text-text-3">
          {o.withdrawal === "instant_subject_to_liquidity"
            ? "Withdrawals settle in one transaction when the venue has enough idle liquidity."
            : o.withdrawal === "queued"
              ? "Withdrawals enter a queue and complete later."
              : "Funds cannot be withdrawn until the lock ends."}
        </p>
      </Block>

      <Block title={`Policy checks · ${checkSummary(o.suitability.checks)}`}>
        <PolicyCheckList checks={o.suitability.checks} />
      </Block>

      <Block title="Who and what it depends on">
        <dl>
          <Row label="Curator">
            {o.curator ? (
              curatorUrl ? (
                <a href={curatorUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:underline">
                  {o.curator.name} <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ) : (
                o.curator.name
              )
            ) : (
              "None"
            )}
          </Row>
        </dl>
        {o.dependencies.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-medium text-text-2">Dependencies</div>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {o.dependencies.map((d) => (
                <li key={d} className="rounded-[var(--radius-chip)] bg-sunken px-1.5 py-0.5 text-xs text-text-2">
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-2">
          <div className="text-xs font-medium text-text-2">Audits</div>
          {o.audits.length === 0 ? (
            <p className="text-xs text-text-3">The data source lists no audits for this venue.</p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {o.audits.map((a) => {
                const href = safeHref(a.url);
                return (
                  <li key={a.name + a.url} className="text-[13px]">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
                        {a.name} <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    ) : (
                      a.name
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Block>

      <Block title="Source">
        <dl>
          <Row label="Data source">
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:underline">
                {o.source.name} <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            ) : (
              o.source.name
            )}
          </Row>
          <Row label="Fetched">
            <Freshness at={fetchedIso(o)} staleAfterMinutes={VENUE_STALE_MINUTES} label="Fetched" />
          </Row>
        </dl>
        <div className="mt-2 space-y-1 text-xs text-text-2">
          <div className="flex items-center justify-between gap-3">
            <span>Venue contract</span>
            <AddressText address={o.address} explorer={explorer ? `${explorer.replace(/\/$/, "")}/address/${o.address}` : null} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>{o.asset.symbol} token</span>
            <AddressText address={o.asset.address} explorer={explorer ? `${explorer.replace(/\/$/, "")}/token/${o.asset.address}` : null} />
          </div>
        </div>
      </Block>
    </Sheet>
  );
}
