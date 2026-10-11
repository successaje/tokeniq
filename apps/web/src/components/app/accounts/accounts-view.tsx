"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseDecimal, wadToString } from "@tokeniq/core";
import { ExternalLink, Eye, MoreHorizontal, Pencil, Plus, RefreshCw, ShieldCheck, ShieldQuestion, Trash2, Users, Wallet } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { AddressText, ChainLabel, Freshness } from "@/components/ui/identity";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { QueryError } from "@/components/ui/query-error";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { isPositive } from "@/lib/format";
import { useCan, useOrg, useOrgQuery } from "@/lib/org";
import type { AccountSyncResultDto, OverviewDto, TreasuryAccountDto } from "@/lib/types";
import { VerificationStatus } from "./account-badges";
import { AddAccountSheet } from "./add-account-sheet";
import { EditAccountSheet } from "./edit-account-sheet";
import { kindLabel, purposeLabel, safeVersionNote, useMeta } from "./labels";
import { SafeDetailsSheet } from "./safe-details-sheet";
import { VerifySheet } from "./verify-sheet";

interface AccountValue {
  value: string;
  unpriced: number;
}

function valuesByAccount(d: OverviewDto | undefined): Map<string, AccountValue> {
  const acc = new Map<string, { value: bigint; unpriced: number }>();
  const add = (id: string, v: string | null, raw: string) => {
    if (raw === "0") return;
    const cur = acc.get(id) ?? { value: 0n, unpriced: 0 };
    if (v) cur.value += parseDecimal(v);
    else cur.unpriced++;
    acc.set(id, cur);
  };
  for (const h of d?.holdings ?? []) add(h.accountId, h.valueUsd, h.raw);
  for (const p of d?.positions ?? []) add(p.accountId, p.valueUsd, p.assetsRaw);
  return new Map([...acc].map(([k, v]) => [k, { value: wadToString(v.value), unpriced: v.unpriced }]));
}

export function AccountsView() {
  const { orgId, org } = useOrg();
  const canManage = useCan("accounts.manage");
  const canVerify = useCan("accounts.verify");
  const qc = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = useOrgQuery<{ accounts: TreasuryAccountDto[] }>("/accounts");
  const overview = useOrgQuery<OverviewDto>("/treasury");
  const meta = useMeta();

  const accounts = useMemo(() => q.data?.accounts ?? [], [q.data]);
  const values = useMemo(() => valuesByAccount(overview.data), [overview.data]);
  const explorerFor = (chainId: number) => meta.data?.chains.find((c) => c.id === chainId)?.explorer.replace(/\/$/, "") ?? null;

  // Sheets are addressable (?add=1, ?verify=<id>, ?safe=<id>) so other pages can link straight into a flow.
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    for (const k of ["add", "verify", "safe", "edit"]) if (k !== key) next.delete(k);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };
  const addOpen = params.get("add") === "1" && canManage;
  const verifyId = params.get("verify");
  const safeId = params.get("safe");
  const editId = params.get("edit");
  const find = (id: string | null) => (id ? (accounts.find((a) => a.id === id) ?? null) : null);
  const [removing, setRemoving] = useState<TreasuryAccountDto | null>(null);
  const [verifyAccount, setVerifyAccount] = useState<TreasuryAccountDto | null>(null);
  const verifying = find(verifyId) ?? (verifyAccount && verifyAccount.id === verifyId ? verifyAccount : null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["org", orgId, "/accounts"] });
    qc.invalidateQueries({ queryKey: ["org", orgId, "/treasury"] });
  };

  const sync = useMutation({
    mutationFn: (a: TreasuryAccountDto) => api<AccountSyncResultDto>(orgPath(orgId, `/accounts/${a.id}/sync`), { method: "POST", body: {} }),
    onMutate: (a) => toast({ id: `sync-${a.id}`, tone: "pending", title: `Reading ${a.label}…`, description: "Fetching balances at the latest block." }),
    onSuccess: (r, a) => {
      invalidate();
      if (r.verificationRevoked) toast({ id: `sync-${a.id}`, tone: "warning", title: `Verification revoked for ${a.label}`, description: "The signer who verified it is no longer a Safe owner. Its balance is excluded until a current owner verifies again." });
      else if (!r.ok) toast({ id: `sync-${a.id}`, tone: "danger", title: `Couldn't read ${a.label}`, description: r.failures[0] ?? "The network didn't respond. The previous balances are kept and marked stale." });
      else toast({ id: `sync-${a.id}`, tone: r.failures.length ? "warning" : "success", title: `${a.label} synced`, description: `${r.balances} balance${r.balances === 1 ? "" : "s"} read at block #${r.blockNumber}${r.failures.length ? ` · ${r.failures.length} read${r.failures.length === 1 ? "" : "s"} failed` : ""}.` });
    },
    onError: (e, a) =>
      // 429 sync_rate_limited carries a precise message ("…synced N seconds ago. Try again in M seconds."); show it as is.
      e instanceof ApiError && e.code === "sync_rate_limited"
        ? toast({ id: `sync-${a.id}`, tone: "info", title: `${a.label} was synced moments ago`, description: e.message })
        : toast({ id: `sync-${a.id}`, tone: "danger", title: `Couldn't sync ${a.label}`, description: e instanceof ApiError && e.status === 403 ? "Your role can't sync accounts." : e.message }),
  });

  const include = useMutation({
    mutationFn: ({ a, value }: { a: TreasuryAccountDto; value: boolean }) => api<{ account: TreasuryAccountDto }>(orgPath(orgId, `/accounts/${a.id}`), { method: "PATCH", body: { includeInTreasury: value } }),
    onSuccess: ({ account }) => {
      qc.setQueryData<{ accounts: TreasuryAccountDto[] }>(["org", orgId, "/accounts"], (d) => (d ? { accounts: d.accounts.map((x) => (x.id === account.id ? account : x)) } : d));
      invalidate();
      toast({ id: `include-${account.id}`, tone: "success", title: account.includeInTreasury ? `${account.label} counts in the treasury` : `${account.label} left out of the treasury`, description: account.includeInTreasury ? "Totals and reserve figures include it again." : "It is still read on-chain but no longer counts in any figure." });
    },
    onError: (e, { a }) => toast({ id: `include-${a.id}`, tone: "danger", title: "Couldn't change the setting", description: e instanceof ApiError && e.status === 403 ? "Your role can't change accounts." : e.message }),
  });

  const remove = useMutation({
    mutationFn: (a: TreasuryAccountDto) => api<{ ok: boolean }>(orgPath(orgId, `/accounts/${a.id}`), { method: "DELETE" }),
    onSuccess: (_r, a) => {
      invalidate();
      setRemoving(null);
      toast({ id: `remove-${a.id}`, tone: "success", title: `Stopped tracking ${a.label}`, description: "Its history stays in reports and Activity." });
    },
    onError: (e, a) => toast({ id: `remove-${a.id}`, tone: "danger", title: `Couldn't stop tracking ${a.label}`, description: e instanceof ApiError && e.status === 403 ? "Your role can't remove accounts." : e.message }),
  });

  const openVerify = (a: TreasuryAccountDto) => {
    setVerifyAccount(a);
    setParam("verify", a.id);
  };

  const verifiedCount = accounts.filter((a) => a.verified).length;
  const lastSync = accounts.reduce<string | null>((m, a) => (a.lastSyncedAt && (!m || a.lastSyncedAt > m) ? a.lastSyncedAt : m), null);
  const failing = accounts.filter((a) => a.lastSyncError && a.verificationMethod !== "sample");
  const unverifiedValue = overview.data?.treasury.unverifiedValue;

  const actionsFor = (a: TreasuryAccountDto) => ({
    sample: a.verificationMethod === "sample",
    onSync: () => sync.mutate(a),
    syncing: sync.isPending && sync.variables?.id === a.id,
    onVerify: () => openVerify(a),
    onSafe: () => setParam("safe", a.id),
    onEdit: () => setParam("edit", a.id),
    onRemove: () => setRemoving(a),
    onInclude: (v: boolean) => include.mutate({ a, value: v }),
    including: include.isPending && include.variables?.a.id === a.id,
  });

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Safes and wallets TokenIQ reads balances from. Tracking is read-only; verifying proves your organization controls an account so it counts toward the reserve."
        meta={
          accounts.length > 0 ? (
            <>
              <span>
                {accounts.length} account{accounts.length === 1 ? "" : "s"} · {verifiedCount} verified
              </span>
              <Freshness at={lastSync} label="Last read" />
            </>
          ) : null
        }
        actions={
          canManage && accounts.length > 0 ? (
            <Button size="sm" onClick={() => setParam("add", "1")}>
              <Plus className="size-4" aria-hidden="true" /> Add account
            </Button>
          ) : null
        }
      />

      {q.isLoading ? (
        <AccountsSkeleton />
      ) : q.isError ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't load accounts" />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description={
            <>
              <p>Add a Safe or wallet address and TokenIQ reads its balances directly from the chain: watch-only, no keys, no permissions.</p>
              <p className="mt-2">To count an account toward your reserve, an owner then signs a message proving control. Signing is free and authorizes nothing.</p>
            </>
          }
          actions={
            canManage ? (
              <Button size="sm" onClick={() => setParam("add", "1")}>
                <Plus className="size-4" aria-hidden="true" /> Add account
              </Button>
            ) : (
              <p className="text-xs text-text-3">Ask an owner, admin or finance member to add your organization&apos;s accounts.</p>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {unverifiedValue && isPositive(unverifiedValue) && (
            <Callout tone="warning" title={<>Unverified accounts hold <Money value={unverifiedValue} compact approximate /> that doesn&apos;t count</>}>
              TokenIQ reads these balances but leaves them out of reserve and deployable figures until someone proves control. {canVerify ? "Use Verify control on each account." : "Ask an owner, admin, finance member or approver to verify."}
            </Callout>
          )}
          {failing.length > 0 && (
            <Callout tone="danger" title={`${failing.length} account${failing.length === 1 ? "" : "s"} couldn't be read on the last attempt`}>
              Figures use the last successful read and are marked stale. {failing.slice(0, 2).map((a) => `${a.label}: ${a.lastSyncError}`).join(" · ")}
            </Callout>
          )}

          {/* Desktop table */}
          <Card className="hidden xl:block">
            <Table>
              <caption className="sr-only">Tracked accounts</caption>
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th>Type</Th>
                  <Th numeric>Value</Th>
                  <Th>Verification</Th>
                  <Th>Counted</Th>
                  <Th>Last read</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const act = actionsFor(a);
                  return (
                    <Tr key={a.id}>
                      <Td className="py-2.5">
                        <div className="font-medium text-text">{a.label}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                          <ChainLabel chainId={a.chainId} name={a.chain} />
                          <AddressText address={a.address} explorer={a.explorer} />
                        </div>
                        <div className="mt-0.5 text-xs text-text-3">{purposeLabel(a.purpose)}</div>
                      </Td>
                      <Td>
                        <TypeCell a={a} onSafe={act.onSafe} />
                      </Td>
                      <Td numeric>
                        <ValueCell v={values.get(a.id)} loading={overview.isLoading} included={a.includeInTreasury} />
                      </Td>
                      <Td>
                        <VerificationStatus account={a} />
                      </Td>
                      <Td>
                        <IncludeSwitch a={a} canManage={canManage} onChange={act.onInclude} pending={act.including} />
                      </Td>
                      <Td>
                        <SyncCell a={a} />
                      </Td>
                      <Td className="w-12 text-right">
                        <RowMenu a={a} canManage={canManage} canVerify={canVerify} {...act} />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>

          {/* Mobile and tablet cards */}
          <ul className="grid gap-3 md:grid-cols-2 xl:hidden" aria-label="Tracked accounts">
            {accounts.map((a) => {
              const act = actionsFor(a);
              return (
                <li key={a.id}>
                  <Card className="h-full">
                    <div className="flex items-start gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-medium text-text">{a.label}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                          <ChainLabel chainId={a.chainId} name={a.chain} />
                          <span className="text-text-3">{purposeLabel(a.purpose)}</span>
                        </div>
                        <AddressText address={a.address} explorer={a.explorer} className="mt-1" />
                      </div>
                      <RowMenu a={a} canManage={canManage} canVerify={canVerify} {...act} />
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-hairline p-4 text-[13px]">
                      <div>
                        <dt className="text-xs text-text-2">Value</dt>
                        <dd className="mt-0.5">
                          <ValueCell v={values.get(a.id)} loading={overview.isLoading} included={a.includeInTreasury} align="left" />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-2">Type</dt>
                        <dd className="mt-0.5">
                          <TypeCell a={a} onSafe={act.onSafe} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-2">Verification</dt>
                        <dd className="mt-0.5">
                          <VerificationStatus account={a} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-2">Last read</dt>
                        <dd className="mt-0.5">
                          <SyncCell a={a} />
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-4 py-3">
                      <IncludeSwitch a={a} canManage={canManage} onChange={act.onInclude} pending={act.including} withLabel />
                      {!a.verified && !act.sample && canVerify && (
                        <Button size="sm" variant="secondary" onClick={act.onVerify} className="h-10 sm:h-8">
                          <ShieldCheck className="size-4" aria-hidden="true" /> Verify control
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <p className="flex items-start gap-1.5 text-xs text-text-3">
            <Eye className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            TokenIQ only reads these addresses. Payments and allocations are proposed in TokenIQ and signed by your Safe owners in their own wallets.
          </p>
        </div>
      )}

      {canManage && (
        <AddAccountSheet
          open={addOpen}
          onOpenChange={(v) => setParam("add", v ? "1" : null)}
          orgId={orgId}
          canVerify={canVerify}
          onVerify={openVerify}
        />
      )}
      <VerifySheet open={!!verifyId && !!verifying} onOpenChange={(v) => !v && setParam("verify", null)} orgId={orgId} account={verifying} explorerBase={verifying ? explorerFor(verifying.chainId) : null} />
      <SafeDetailsSheet
        open={!!find(safeId)}
        onOpenChange={(v) => !v && setParam("safe", null)}
        account={find(safeId)}
        explorerBase={find(safeId) ? explorerFor(find(safeId)!.chainId) : null}
        onVerify={canVerify ? () => openVerify(find(safeId)!) : undefined}
      />
      {canManage && <EditAccountSheet open={!!find(editId)} onOpenChange={(v) => !v && setParam("edit", null)} orgId={orgId} account={find(editId)} />}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(v) => !v && setRemoving(null)}
        title={removing ? `Stop tracking ${removing.label}?` : "Stop tracking"}
        description="TokenIQ stops reading this address and it no longer counts toward any figure."
        consequences={
          <ul className="list-disc space-y-1 pl-4">
            <li>Balance history, payments and Activity entries are kept.</li>
            <li>Its verification is dropped; adding the address again needs a new signature.</li>
            {org.isSample ? <li>This is a sample workspace; nothing on-chain is affected.</li> : <li>Nothing happens on-chain. The Safe or wallet is unaffected.</li>}
          </ul>
        }
        confirmLabel="Stop tracking"
        confirmText={removing?.label}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing)}
      />
    </div>
  );
}

function TypeCell({ a, onSafe }: { a: TreasuryAccountDto; onSafe: () => void }) {
  const note = a.kind === "safe" ? safeVersionNote(a.safe?.version) : null;
  const modules = a.safe?.modules.length ?? 0;
  if (a.kind !== "safe") return <span className="text-[13px] text-text">{kindLabel(a)}</span>;
  return (
    <div>
      <button type="button" onClick={onSafe} className="text-left text-[13px] text-text underline decoration-text-3/50 underline-offset-2 hover:decoration-text" aria-label={`${kindLabel(a)}. View Safe owners, modules and version`}>
        {kindLabel(a)}
      </button>
      {modules > 0 && (
        <div className="text-xs font-medium text-warning">
          {modules} module{modules === 1 ? "" : "s"} enabled
        </div>
      )}
      {note?.tone === "danger" && <div className="text-xs font-medium text-danger">Unsupported for transactions</div>}
    </div>
  );
}

function ValueCell({ v, loading, included, align = "right" }: { v: AccountValue | undefined; loading: boolean; included: boolean; align?: "left" | "right" }) {
  if (loading) return <Skeleton className={cn("h-4 w-20", align === "right" && "ml-auto")} />;
  return (
    <div className={cn(align === "right" ? "text-right" : "text-left")}>
      {v ? <Money value={v.value} compact approximate className="text-[13px] font-medium text-text" /> : <span className="num text-[13px] text-text-3">$0</span>}
      {v && v.unpriced > 0 && <div className="text-xs text-text-3">+ {v.unpriced} unpriced</div>}
      {!included && <div className="text-xs text-text-3">Not counted</div>}
    </div>
  );
}

function SyncCell({ a }: { a: TreasuryAccountDto }) {
  if (a.verificationMethod === "sample") return <span className="text-xs text-text-3">Simulated</span>;
  return (
    <div className="max-w-56">
      <Freshness at={a.lastSyncedAt} label="Read" />
      {a.lastSyncError && (
        <div className="mt-0.5 line-clamp-2 break-words text-xs text-danger" title={a.lastSyncError}>
          Last attempt failed: {a.lastSyncError}
        </div>
      )}
    </div>
  );
}

function IncludeSwitch({ a, canManage, onChange, pending, withLabel }: { a: TreasuryAccountDto; canManage: boolean; onChange: (v: boolean) => void; pending: boolean; withLabel?: boolean }) {
  const sw = <Switch checked={a.includeInTreasury} onCheckedChange={onChange} disabled={!canManage || pending} aria-label={`Count ${a.label} in treasury figures`} />;
  if (!withLabel) return sw;
  return (
    <label className="flex items-center gap-2 text-[13px] text-text-2">
      {sw}
      {a.includeInTreasury ? "Counted in treasury" : "Not counted"}
    </label>
  );
}

function RowMenu({
  a,
  canManage,
  canVerify,
  sample,
  onSync,
  syncing,
  onVerify,
  onSafe,
  onEdit,
  onRemove,
}: {
  a: TreasuryAccountDto;
  canManage: boolean;
  canVerify: boolean;
  sample: boolean;
  onSync: () => void;
  syncing: boolean;
  onVerify: () => void;
  onSafe: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 sm:size-8" aria-label={`Actions for ${a.label}`}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </MenuTrigger>
      <MenuContent>
        {!sample && (
          <MenuItem onSelect={onSync} disabled={syncing}>
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} aria-hidden="true" /> {syncing ? "Syncing…" : "Sync now"}
          </MenuItem>
        )}
        {!sample && canVerify && (
          <MenuItem onSelect={onVerify}>
            {a.verified ? <ShieldQuestion className="size-3.5" aria-hidden="true" /> : <ShieldCheck className="size-3.5" aria-hidden="true" />}
            {a.verified ? "Verify again" : "Verify control"}
          </MenuItem>
        )}
        {a.kind === "safe" && (
          <MenuItem onSelect={onSafe}>
            <Users className="size-3.5" aria-hidden="true" /> Safe owners and modules
          </MenuItem>
        )}
        {a.explorer && (
          <MenuItem onSelect={() => window.open(a.explorer!, "_blank", "noopener,noreferrer")}>
            <ExternalLink className="size-3.5" aria-hidden="true" /> Open in block explorer
          </MenuItem>
        )}
        {canManage && (
          <>
            <MenuSeparator />
            <MenuItem onSelect={onEdit}>
              <Pencil className="size-3.5" aria-hidden="true" /> Edit
            </MenuItem>
            <MenuItem tone="danger" onSelect={onRemove}>
              <Trash2 className="size-3.5" aria-hidden="true" /> Stop tracking
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}

function AccountsSkeleton() {
  return (
    <LoadingRegion label="Loading accounts…">
      <div className="hidden space-y-0 rounded-[var(--radius-card)] border border-hairline bg-surface xl:block">
        <div className="h-9 border-b border-hairline" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-hairline px-5 py-4 last:border-b-0">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-9" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:hidden">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </LoadingRegion>
  );
}

