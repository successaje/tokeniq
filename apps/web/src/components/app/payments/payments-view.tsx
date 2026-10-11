"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, parseDecimal, wadToString } from "@tokeniq/core";
import { CalendarCheck2, CheckCircle2, ExternalLink, FilterX, HandCoins, MoreHorizontal, Plus, RefreshCw, Search, Undo2, Workflow } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMeta } from "@/components/app/accounts/labels";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { ChainLabel } from "@/components/ui/identity";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Money, TokenAmount } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { QueryError } from "@/components/ui/query-error";
import { Segmented } from "@/components/ui/segmented";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { Timestamp } from "@/components/ui/timestamp";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dateLabel, shortAddress } from "@/lib/format";
import { useCan, useOrg, useOrgQuery } from "@/lib/org";
import type { ObligationDto, ObligationScheduleDto, OccurrenceDto, PaymentDto } from "@/lib/types";
import { amountLabel } from "./amount";
import { occurrenceKey } from "./occurrence-picker";
import { FILTER_OPTIONS, PaymentBadge, verificationDetail, type PaymentFilter } from "./payment-status";
import { invalidatePayments, RecordPaymentSheet } from "./record-payment-sheet";
import { UndoPaymentDialog } from "./undo-payment-dialog";

const SCHEDULE = "/obligations/schedule?days=120";

function sumUsd(items: OccurrenceDto[]): { total: string; unconverted: number } {
  let t = 0n;
  let unconverted = 0;
  for (const o of items) {
    if (o.usd) t += parseDecimal(o.usd);
    else unconverted++;
  }
  return { total: wadToString(t), unconverted };
}

export function PaymentsView() {
  const { orgId } = useOrg();
  const canRecord = useCan("payments.record");
  const qc = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const payments = useOrgQuery<{ payments: PaymentDto[] }>("/payments");
  const schedule = useOrgQuery<ObligationScheduleDto>(SCHEDULE);
  const obligations = useOrgQuery<{ obligations: ObligationDto[] }>("/obligations?status=all");
  const meta = useMeta();

  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [search, setSearch] = useState("");
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [undoing, setUndoing] = useState<PaymentDto | null>(null);

  const recordParam = params.get("record");
  const setRecord = (v: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set("record", v);
    else next.delete("record");
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const obMap = useMemo(() => new Map((obligations.data?.obligations ?? []).map((o) => [o.id, o])), [obligations.data]);
  const unpaid = useMemo(
    () => (schedule.data?.occurrences ?? []).filter((o) => o.direction === "outflow").sort((a, b) => (a.overdue === b.overdue ? a.dueDate.localeCompare(b.dueDate) : a.overdue ? -1 : 1)),
    [schedule.data],
  );
  const asOf = schedule.data?.asOf;
  const in30 = asOf ? addDays(asOf, 30) : null;
  const overdue = unpaid.filter((o) => o.overdue);
  const soon = unpaid.filter((o) => !o.overdue && in30 && o.dueDate <= in30);
  const later = unpaid.filter((o) => !o.overdue && in30 && o.dueDate > in30);
  const shownUnpaid = [...overdue, ...soon, ...(showAllUpcoming ? later : [])];

  const all = payments.data?.payments ?? [];
  const q = search.trim().toLowerCase();
  const rows = all.filter((p) => (filter === "all" || p.status === filter) && (!q || (p.title ?? "").toLowerCase().includes(q) || (p.txHash ?? "").includes(q) || (p.note ?? "").toLowerCase().includes(q)));
  const counts = { verified: all.filter((p) => p.status === "paid_verified").length, unverified: all.filter((p) => p.status === "paid_unverified").length, skipped: all.filter((p) => p.status === "skipped").length };

  const recheck = useMutation({
    mutationFn: (p: PaymentDto) => api<{ payment: PaymentDto }>(orgPath(orgId, `/payments/${p.id}/verify`), { method: "POST", body: {} }),
    onMutate: (p) => toast({ id: `recheck-${p.id}`, tone: "pending", title: "Checking the transaction on-chain…", description: p.title ?? undefined }),
    onSuccess: ({ payment }, p) => {
      invalidatePayments(qc, orgId);
      const v = payment.verification;
      if (payment.status === "paid_verified") toast({ id: `recheck-${p.id}`, tone: "success", title: "Verified on-chain", description: `${p.title ?? "Payment"} · ${v?.confirmations ?? 0} confirmations.` });
      else if (v?.status === "pending") toast({ id: `recheck-${p.id}`, tone: "info", title: "Still waiting for confirmations", description: `${v.confirmations} of ${v.requiredConfirmations}. Check again shortly.` });
      else toast({ id: `recheck-${p.id}`, tone: "warning", title: "Still not verified", description: verificationDetail({ ...p, ...payment }) });
    },
    onError: (e, p) => toast({ id: `recheck-${p.id}`, tone: "danger", title: "Couldn't check the transaction", description: e instanceof ApiError && e.status === 403 ? "Your role can't verify payments." : e.message }),
  });

  const loading = payments.isLoading || schedule.isLoading;
  const tokenDecimals = (p: PaymentDto) => meta.data?.tokens.find((t) => t.chainId === p.chainId && t.symbol === p.assetSymbol)?.decimals;

  return (
    <div>
      <PageHeader
        title="Payments"
        description="What was paid against your obligations, and whether TokenIQ verified it on-chain."
        meta={
          schedule.data ? (
            <>
              <span>Schedule as of {dateLabel(schedule.data.asOf)}</span>
              <span>Unpaid shown through {dateLabel(schedule.data.through)}</span>
            </>
          ) : null
        }
        actions={
          canRecord ? (
            <Button size="sm" onClick={() => setRecord("1")}>
              <Plus className="size-4" aria-hidden="true" /> Record payment
            </Button>
          ) : null
        }
      />

      <Callout tone="info" className="mb-4" title="Payments made through TokenIQ settle automatically">
        When a payment proposal is executed by your Safe, TokenIQ marks the obligation paid and verified. Record payments here only when they were made outside TokenIQ.
      </Callout>

      {loading ? (
        <PaymentsSkeleton />
      ) : payments.isError || schedule.isError ? (
        <QueryError error={payments.error ?? schedule.error} onRetry={() => {
            payments.refetch();
            schedule.refetch();
          }} title="Couldn't load payments" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Overdue" value={<Money value={sumUsd(overdue).total} />} meta={overdue.length ? `${overdue.length} payment${overdue.length === 1 ? "" : "s"} past due` : "Nothing overdue"} tone={overdue.length ? "danger" : undefined} />
            <Kpi label="Due in the next 30 days" value={<Money value={sumUsd(soon).total} />} meta={`${soon.length} payment${soon.length === 1 ? "" : "s"}${sumUsd(soon).unconverted ? ` · ${sumUsd(soon).unconverted} not converted to USD` : ""}`} />
            <Kpi label="Marked paid, not verified" value={<span className="num">{counts.unverified}</span>} meta={counts.unverified ? "Add a transaction or re-check to verify" : `${counts.verified} verified on-chain · ${counts.skipped} skipped`} tone={counts.unverified ? "warning" : undefined} />
          </div>

          {/* Unpaid & overdue */}
          <Card>
            <CardHeader title="Unpaid & overdue" description="Outgoing obligations not yet recorded as paid or skipped. Overdue first." />
            <CardBody className="pt-2">
              {unpaid.length === 0 ? (
                <div className="flex gap-2 py-2 text-sm text-text-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span>
                    Nothing unpaid in the next 120 days.{" "}
                    {(obligations.data?.obligations.length ?? 0) === 0 && (
                      <Link href="/app/obligations?new=1" className="font-medium text-accent hover:underline">
                        Record an obligation
                      </Link>
                    )}
                  </span>
                </div>
              ) : (
                <>
                  {shownUnpaid.length === 0 && <p className="py-2 text-[13px] text-text-2">Nothing overdue or due in the next 30 days.</p>}
                  <ul className="divide-y divide-hairline">
                    {shownUnpaid.map((o) => (
                      <li key={occurrenceKey(o)} className="flex items-center gap-3 py-2.5">
                        <div className="w-16 shrink-0 text-xs">
                          <div className={cn("font-medium", o.overdue ? "text-danger" : "text-text")}>{dateLabel(o.dueDate, { month: "short", day: "numeric" })}</div>
                          {o.overdue ? <div className="font-medium text-danger">Overdue</div> : <div className="text-text-3">{dateLabel(o.dueDate, { year: "numeric" })}</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/app/obligations/${o.obligationId}`} className="block truncate text-[13px] font-medium text-text hover:underline">
                            {o.title}
                          </Link>
                          <div className="text-xs capitalize text-text-3">
                            {o.category} · {o.certainty}
                            {obMap.get(o.obligationId) && !obMap.get(o.obligationId)!.recipientAddress && <span className="normal-case"> · no recipient address</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="num text-[13px] font-medium text-text">{amountLabel(o.amount, o.currency)}</div>
                          {o.currency !== "USD" && o.usd && <Money value={o.usd} approximate className="block text-xs text-text-3" />}
                        </div>
                        {canRecord && (
                          <Button variant="secondary" size="sm" className="h-10 sm:h-8" onClick={() => setRecord(occurrenceKey(o))} aria-label={`Record payment for ${o.title}, due ${dateLabel(o.dueDate)}`}>
                            Record
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {later.length > 0 && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAllUpcoming((v) => !v)} aria-expanded={showAllUpcoming}>
                      {showAllUpcoming ? "Show only the next 30 days" : `Show ${later.length} more due by ${dateLabel(schedule.data?.through)}`}
                    </Button>
                  )}
                </>
              )}
            </CardBody>
          </Card>

          {/* Recorded payments */}
          <Card>
            <CardHeader title="Recorded payments" description="Paid and verified on-chain, marked paid without verification, or skipped." />
            {all.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={HandCoins}
                  title="No payments recorded yet"
                  description="When an obligation is paid, record it here with its transaction hash and TokenIQ checks the transfer on-chain. Payments executed through TokenIQ proposals appear automatically."
                  actions={
                    canRecord && unpaid.length > 0 ? (
                      <Button size="sm" onClick={() => setRecord("1")}>
                        Record payment
                      </Button>
                    ) : undefined
                  }
                />
              </CardBody>
            ) : (
              <>
                <div className="flex flex-col gap-2 px-4 pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <Segmented label="Filter by status" value={filter} onValueChange={setFilter} options={FILTER_OPTIONS.map((o) => ({ ...o, label: o.value === "all" ? `All (${all.length})` : o.value === "paid_verified" ? `Verified (${counts.verified})` : o.value === "paid_unverified" ? `Not verified (${counts.unverified})` : `Skipped (${counts.skipped})` }))} size="sm" className="max-w-full overflow-x-auto" />
                  <div className="relative sm:w-64">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-3" aria-hidden="true" />
                    <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, note or hash" aria-label="Search payments" className="h-8 pl-8 text-[13px]" />
                  </div>
                </div>
                {rows.length === 0 ? (
                  <CardBody>
                    <EmptyState
                      icon={FilterX}
                      title="No payments match"
                      description="Try another status or clear the search."
                      actions={
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setFilter("all");
                            setSearch("");
                          }}
                        >
                          Clear filters
                        </Button>
                      }
                    />
                  </CardBody>
                ) : (
                  <>
                    <div className="mt-3 hidden xl:block">
                      <Table>
                        <caption className="sr-only">Recorded payments</caption>
                        <thead>
                          <tr>
                            <Th>Due</Th>
                            <Th>Obligation</Th>
                            <Th>Status</Th>
                            <Th numeric>Amount</Th>
                            <Th>Transaction</Th>
                            <Th>
                              <span className="sr-only">Actions</span>
                            </Th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((p) => (
                            <Tr key={p.id}>
                              <Td className="whitespace-nowrap">{dateLabel(p.dueDate)}</Td>
                              <Td className="max-w-72 py-2.5">
                                <Link href={`/app/obligations/${p.obligationId}`} className="block truncate font-medium text-text hover:underline">
                                  {p.title ?? "Obligation"}
                                </Link>
                                <div className="text-xs text-text-3">
                                  Recorded <Timestamp at={p.createdAt} />
                                  {p.note ? ` · “${p.note}”` : ""}
                                </div>
                              </Td>
                              <Td className="py-2.5">
                                <PaymentBadge p={p} />
                                <div className="mt-0.5 max-w-80 text-xs text-text-3">{verificationDetail(p, tokenDecimals(p))}</div>
                              </Td>
                              <Td numeric>
                                <AmountCell p={p} decimals={tokenDecimals(p)} />
                              </Td>
                              <Td>
                                <TxCell p={p} />
                              </Td>
                              <Td className="w-12 text-right">
                                <RowActions p={p} canRecord={canRecord} recheck={() => recheck.mutate(p)} checking={recheck.isPending && recheck.variables?.id === p.id} undo={() => setUndoing(p)} />
                              </Td>
                            </Tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <ul className="mt-2 divide-y divide-hairline xl:hidden">
                      {rows.map((p) => (
                        <li key={p.id} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <Link href={`/app/obligations/${p.obligationId}`} className="block truncate text-[13px] font-medium text-text hover:underline">
                                {p.title ?? "Obligation"}
                              </Link>
                              <div className="text-xs text-text-3">Due {dateLabel(p.dueDate)}</div>
                            </div>
                            <div className="text-right">
                              <AmountCell p={p} decimals={tokenDecimals(p)} />
                            </div>
                            <RowActions p={p} canRecord={canRecord} recheck={() => recheck.mutate(p)} checking={recheck.isPending && recheck.variables?.id === p.id} undo={() => setUndoing(p)} />
                          </div>
                          <div className="mt-1.5">
                            <PaymentBadge p={p} />
                          </div>
                          <p className="mt-1 text-xs text-text-3">{verificationDetail(p, tokenDecimals(p))}</p>
                          {p.txHash && (
                            <div className="mt-1">
                              <TxCell p={p} />
                            </div>
                          )}
                          {p.note && <p className="mt-1 text-xs text-text-2">“{p.note}”</p>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="flex gap-1.5 border-t border-hairline px-4 py-3 text-xs text-text-3 sm:px-5">
                  <Workflow className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Verified on-chain means TokenIQ matched a confirmed transfer to the obligation&apos;s recipient (and the amount, for USD obligations paid in USD stablecoins). Verified records can&apos;t be undone.
                </p>
              </>
            )}
          </Card>
        </div>
      )}

      {canRecord && (
        <RecordPaymentSheet
          open={!!recordParam}
          onOpenChange={(v) => setRecord(v ? (recordParam ?? "1") : null)}
          occurrences={unpaid}
          obligations={obMap}
          initialKey={recordParam && recordParam !== "1" ? recordParam : null}
        />
      )}
      <UndoPaymentDialog payment={undoing} onOpenChange={(v) => !v && setUndoing(null)} />
    </div>
  );
}

function Kpi({ label, value, meta, tone }: { label: string; value: React.ReactNode; meta: string; tone?: "danger" | "warning" }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs font-medium text-text-2">{label}</div>
        <div className={cn("mt-1 text-xl font-medium tracking-tight", tone === "danger" ? "text-danger" : "text-text")}>{value}</div>
        <div className={cn("mt-0.5 text-xs", tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-text-3")}>{meta}</div>
      </CardBody>
    </Card>
  );
}

function AmountCell({ p, decimals }: { p: PaymentDto; decimals: number | undefined }) {
  if (p.tokenAmountRaw && p.assetSymbol && decimals !== undefined) {
    return (
      <div>
        <TokenAmount raw={p.tokenAmountRaw} decimals={decimals} symbol={p.assetSymbol} className="text-[13px] text-text" />
        {p.amount && <div className="text-xs text-text-3">Owed <Money value={p.amount} /></div>}
      </div>
    );
  }
  if (p.amount) return <Money value={p.amount} className="text-[13px] text-text" />;
  return <span className="text-xs text-text-3">{p.status === "skipped" ? "—" : "Non-USD"}</span>;
}

function TxCell({ p }: { p: PaymentDto }) {
  if (!p.txHash) return <span className="text-xs text-text-3">{p.status === "skipped" ? "—" : "No transaction"}</span>;
  return (
    <div className="text-xs">
      {p.explorer ? (
        <a href={p.explorer} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-mono text-text-2 hover:text-text hover:underline" aria-label={`View transaction ${p.txHash} in block explorer`}>
          {shortAddress(p.txHash, 6)}
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      ) : (
        <span className="font-mono text-text-2">{shortAddress(p.txHash, 6)}</span>
      )}
      {p.chainId && p.chain && <ChainLabel chainId={p.chainId} name={p.chain} className="mt-0.5 flex text-text-3" />}
    </div>
  );
}

function RowActions({ p, canRecord, recheck, checking, undo }: { p: PaymentDto; canRecord: boolean; recheck: () => void; checking: boolean; undo: () => void }) {
  const canRecheck = canRecord && p.status === "paid_unverified" && !!p.txHash;
  const canUndo = canRecord && p.status !== "paid_verified";
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 sm:size-8" aria-label={`Actions for ${p.title ?? "payment"} due ${dateLabel(p.dueDate)}`}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </MenuTrigger>
      <MenuContent>
        {canRecheck && (
          <MenuItem onSelect={recheck} disabled={checking}>
            <RefreshCw className={cn("size-3.5", checking && "animate-spin")} aria-hidden="true" /> Re-check on-chain
          </MenuItem>
        )}
        <MenuItem onSelect={() => (window.location.href = `/app/obligations/${p.obligationId}`)}>
          <CalendarCheck2 className="size-3.5" aria-hidden="true" /> View obligation
        </MenuItem>
        {p.explorer && (
          <MenuItem onSelect={() => window.open(p.explorer!, "_blank", "noopener,noreferrer")}>
            <ExternalLink className="size-3.5" aria-hidden="true" /> View transaction
          </MenuItem>
        )}
        {canUndo && (
          <>
            <MenuSeparator />
            <MenuItem tone="danger" onSelect={undo}>
              <Undo2 className="size-3.5" aria-hidden="true" /> Undo record
            </MenuItem>
          </>
        )}
        {p.status === "paid_verified" && (
          <div className="px-2 py-1.5 text-xs text-text-3">
            <StatusBadge tone="neutral" icon={null}>
              Verified records are permanent
            </StatusBadge>
          </div>
        )}
      </MenuContent>
    </Menu>
  );
}

function PaymentsSkeleton() {
  return (
    <LoadingRegion label="Loading payments…" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-56" />
      <Skeleton className="h-72" />
    </LoadingRegion>
  );
}

