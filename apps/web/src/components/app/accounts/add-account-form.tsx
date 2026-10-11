"use client";

import { useMutation, useQuery, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { parseDecimal, wadToString } from "@tokeniq/core";
import { CheckCircle2, CircleAlert, Eye, FileCode2, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getAddress } from "viem";
import { AddressInput, Field, Input, isValidAddress } from "@/components/ui/field";
import { GroupedSelect } from "@/components/ui/grouped-select";
import { AddressText } from "@/components/ui/identity";
import { Money, TokenAmount } from "@/components/ui/money";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { ApiError, api, fieldErrors, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { AccountPurpose, AddAccountResponseDto, MetaChainDto, OverviewDto } from "@/lib/types";
import { PURPOSES, safeVersionNote, useNetworkGroups } from "./labels";

export interface AddAccountInput {
  chainId: number;
  address: string;
  label: string;
  purpose: AccountPurpose;
}

/** POST /accounts. The first sync runs inline, so the response already says what was found. */
export function useAddAccount(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddAccountInput) => api<AddAccountResponseDto>(orgPath(orgId, "/accounts"), { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org", orgId, "/accounts"] });
      qc.invalidateQueries({ queryKey: ["org", orgId, "/treasury"] });
    },
  });
}

/** EIP-3770 prefixes Safe{Wallet} puts in front of copied addresses, e.g. "base:0x…". */
const SHORT_NAMES: Record<string, number> = { eth: 1, base: 8453, arb1: 42161, oeth: 10, basesep: 84532, sep: 11155111 };

/**
 * Network, address, label and purpose. Submits through the mutation passed in so
 * the caller can place the submit button (Sheet footer or inline).
 */
export function AddAccountForm({
  id,
  mutation,
  compact = false,
  autoFocus = false,
}: {
  id: string;
  mutation: UseMutationResult<AddAccountResponseDto, Error, AddAccountInput>;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const { meta, groups } = useNetworkGroups();
  const [chainId, setChainId] = useState("8453");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [purpose, setPurpose] = useState<AccountPurpose>("operating");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prefixNote, setPrefixNote] = useState<string | null>(null);

  const chain = meta.data?.chains.find((c) => String(c.id) === chainId);
  const server = fieldErrors(mutation.error);
  const err = mutation.error;
  const duplicate = err instanceof ApiError && err.code === "duplicate_account";
  const fieldErr = (k: string) => errors[k] ?? server[k];

  const onAddress = (v: string) => {
    const m = /^\s*([a-z0-9]+):(0x[0-9a-fA-F]{40})\s*$/.exec(v);
    if (m && SHORT_NAMES[m[1]!]) {
      const cid = String(SHORT_NAMES[m[1]!]);
      setChainId(cid);
      setAddress(m[2]!);
      setPrefixNote(`Network set from the “${m[1]}:” prefix.`);
      return;
    }
    setPrefixNote(null);
    setAddress(v);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!chainId) next.chainId = "Choose the network the account is on.";
    if (!address.trim()) next.address = "Paste the Safe or wallet address.";
    else if (!isValidAddress(address)) next.address = "Enter a valid 0x address. If it has mixed case, the checksum must match.";
    if (!label.trim()) next.label = "Give the account a name your team will recognise.";
    else if (label.trim().length > 60) next.label = "Keep the name under 60 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    mutation.mutate({ chainId: Number(chainId), address: getAddress(address.trim()), label: label.trim(), purpose });
  };

  return (
    <form id={id} onSubmit={submit} noValidate className={cn("space-y-4", compact && "space-y-3.5")}>
      <div className={cn("grid gap-4", compact && "sm:grid-cols-2")}>
        <Field label="Network" error={fieldErr("chainId")} hint={chain?.testnet ? "Testnet stablecoins are valued at their peg for practice. They have no market value." : undefined}>
          {(p) =>
            meta.isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <GroupedSelect {...p} value={chainId} onValueChange={(v) => setChainId(v)} groups={groups} placeholder="Choose a network" />
            )
          }
        </Field>
        <Field label="Purpose" hint={compact ? undefined : "Used for grouping and reports. It doesn't change the maths."}>
          {(p) => <Select {...p} value={purpose} onValueChange={setPurpose} options={PURPOSES.map((o) => ({ value: o.value, label: o.label, hint: o.hint }))} />}
        </Field>
      </div>
      <Field label="Address" error={fieldErr("address") ?? (duplicate ? err.message : undefined)} hint={prefixNote ?? "A Safe, a wallet or another contract. Copy it from Safe{Wallet} or your block explorer."}>
        {(p) => <AddressInput {...p} value={address} onChange={onAddress} autoFocus={autoFocus} />}
      </Field>
      <Field label="Name" error={fieldErr("label")} hint={compact ? undefined : "Shown to your team, e.g. “Operations Safe”."}>
        {(p) => <Input {...p} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Operations Safe" maxLength={60} />}
      </Field>
      {err && !duplicate && !Object.keys(server).length && <AddAccountError error={err} chain={chain} />}
      {duplicate && (
        <p className="text-xs text-text-2">
          <Link href="/app/accounts" className="font-medium text-accent hover:underline">
            Open Accounts
          </Link>{" "}
          to find it.
        </p>
      )}
    </form>
  );
}

function AddAccountError({ error, chain }: { error: Error; chain?: MetaChainDto }) {
  if (error instanceof ApiError && error.status === 403) {
    return (
      <Callout tone="warning" title="Your role can't add accounts">
        Owners, admins and finance members can add accounts. Nothing was added.
      </Callout>
    );
  }
  if (error instanceof ApiError && (error.code === "chain_read_failed" || error.code === "chain_unavailable")) {
    return (
      <Callout tone="danger" title={`Couldn't read the address from ${chain?.name ?? "the network"}`}>
        {error.message} Your entries are kept: submit again to retry.
      </Callout>
    );
  }
  return (
    <Callout tone="danger" title="The account wasn't added">
      {error.message}
    </Callout>
  );
}

/** What TokenIQ found at the address and what the first balance read returned. */
export function AddAccountResult({ orgId, result, compact = false }: { orgId: string; result: AddAccountResponseDto; compact?: boolean }) {
  const { account, sync } = result;
  const overview = useQuery({ queryKey: ["org", orgId, "/treasury"], queryFn: ({ signal }) => api<OverviewDto>(orgPath(orgId, "/treasury"), { signal }) });
  const holdings = (overview.data?.holdings ?? []).filter((h) => h.accountId === account.id && h.raw !== "0");
  const positions = (overview.data?.positions ?? []).filter((p) => p.accountId === account.id && p.assetsRaw !== "0");
  let total = 0n;
  let unpriced = 0;
  for (const v of [...holdings.map((h) => h.valueUsd), ...positions.map((p) => p.valueUsd)]) {
    if (v) total += parseDecimal(v);
    else unpriced++;
  }
  const note = account.kind === "safe" ? safeVersionNote(account.safe?.version) : null;
  const owners = account.safe?.owners ?? [];

  return (
    <div className="space-y-4">
      <Callout tone="success" title={`${account.label} is now tracked on ${account.chain}`}>
        Watch-only: TokenIQ reads balances and can never move funds. Until someone proves control, its value is excluded from reserve maths.
      </Callout>

      <section aria-labelledby="detected-heading" className="rounded-[var(--radius-card)] border border-hairline bg-surface p-4">
        <h3 id="detected-heading" className="text-xs font-medium text-text-2">
          What TokenIQ found at this address
        </h3>
        {account.kind === "safe" ? (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm font-medium text-text">
              <ShieldCheck className="size-4 text-text-2" aria-hidden="true" />
              Safe{account.safe?.version ? ` v${account.safe.version}` : ""} · {account.safe?.threshold ?? "?"} of {owners.length} owners must sign
            </div>
            {owners.length > 0 && (
              <ul className="mt-2 space-y-1" aria-label="Safe owners">
                {owners.slice(0, compact ? 3 : 8).map((o) => (
                  <li key={o}>
                    <AddressText address={o} />
                  </li>
                ))}
                {owners.length > (compact ? 3 : 8) && <li className="text-xs text-text-3">and {owners.length - (compact ? 3 : 8)} more</li>}
              </ul>
            )}
            {(account.safe?.modules.length ?? 0) > 0 && (
              <p className="mt-2 flex gap-1.5 text-xs font-medium text-warning">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {account.safe!.modules.length} module{account.safe!.modules.length === 1 ? "" : "s"} enabled. Modules can move funds without owner signatures; review them in the Safe details.
              </p>
            )}
            {note && <p className={cn("mt-2 text-xs", note.tone === "danger" ? "font-medium text-danger" : "text-text-2")}>{note.title}. {note.body}</p>}
          </div>
        ) : account.kind === "eoa" ? (
          <div className="mt-2 flex gap-2 text-sm text-text">
            <Wallet className="mt-0.5 size-4 shrink-0 text-text-2" aria-hidden="true" />
            <span>
              <span className="font-medium">Wallet</span> (an externally owned account). Its owner proves control by signing with this wallet.
            </span>
          </div>
        ) : (
          <div className="mt-2 flex gap-2 text-sm text-text">
            <FileCode2 className="mt-0.5 size-4 shrink-0 text-text-2" aria-hidden="true" />
            <span>
              <span className="font-medium">Smart contract</span>, not a Safe. Balances are tracked. Verification works if the contract signs messages (EIP-1271), as smart-contract wallets do.
            </span>
          </div>
        )}
      </section>

      <section aria-labelledby="sync-heading" className="rounded-[var(--radius-card)] border border-hairline bg-surface p-4">
        <h3 id="sync-heading" className="text-xs font-medium text-text-2">
          First balance read
        </h3>
        {sync.ok ? (
          <div className="mt-2 space-y-2">
            <p className="flex gap-2 text-sm text-text">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              <span>
                Read {sync.balances} supported token balance{sync.balances === 1 ? "" : "s"}
                {sync.positions > 0 ? ` and ${sync.positions} protocol position${sync.positions === 1 ? "" : "s"}` : ""}
                {sync.blockNumber ? (
                  <>
                    {" "}
                    at block <span className="num">#{sync.blockNumber}</span>
                  </>
                ) : null}
                .
              </span>
            </p>
            {overview.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : holdings.length + positions.length === 0 ? (
              <p className="text-[13px] text-text-2">No balances in supported assets (USDC, USDT, EURC, ETH and others TokenIQ tracks) right now.</p>
            ) : (
              <ul className="divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline">
                {holdings.slice(0, 6).map((h) => (
                  <li key={h.assetAddress} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                    <TokenAmount raw={h.raw} decimals={h.decimals} symbol={h.symbol} />
                    {h.valueUsd ? <Money value={h.valueUsd} approximate className="text-text-2" /> : <span className="text-xs text-text-3">No price</span>}
                  </li>
                ))}
                {positions.slice(0, 3).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                    <span className="min-w-0">
                      <TokenAmount raw={p.assetsRaw} decimals={p.decimals} symbol={p.symbol} /> <span className="text-xs text-text-3">in {p.venueName}</span>
                    </span>
                    {p.valueUsd ? <Money value={p.valueUsd} approximate className="text-text-2" /> : <span className="text-xs text-text-3">No price</span>}
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 bg-sunken/60 px-3 py-2 text-[13px] font-medium">
                  <span>Total</span>
                  <span>
                    <Money value={wadToString(total)} approximate />
                    {unpriced > 0 && <span className="ml-1 text-xs font-normal text-text-3">+ {unpriced} unpriced</span>}
                  </span>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <p className="mt-2 flex gap-2 text-sm text-warning">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>The account was added, but the first read failed. TokenIQ retries on its regular sync, or use Sync now from Accounts.</span>
          </p>
        )}
        {sync.failures.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-medium text-text-2">{sync.ok ? "Some reads failed" : "Error"}</div>
            <ul className="mt-1 space-y-0.5">
              {sync.failures.slice(0, 4).map((f, i) => (
                <li key={i} className="break-words font-mono text-[11.5px] text-text-3">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {!compact && (
        <p className="flex gap-1.5 text-xs text-text-3">
          <Eye className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Verifying means signing a message with {account.kind === "safe" ? "an owner wallet" : "this wallet"}. It costs no gas and authorizes nothing.
        </p>
      )}
    </div>
  );
}
