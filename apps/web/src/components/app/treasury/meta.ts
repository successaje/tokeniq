"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";
import type { MetaDto, MetaTokenDto } from "@/lib/types";

/** Supported networks and tokens (decimals, peg currency, price feeds). Static product metadata. */
export function useMeta() {
  return useQuery({ queryKey: ["meta"], queryFn: ({ signal }) => api<MetaDto>("/api/v1/meta", { signal }), staleTime: 60 * 60_000 });
}

export const tokenKey = (chainId: number, address: string) => `${chainId}:${address.toLowerCase()}`;

export function useMetaIndex() {
  const q = useMeta();
  return useMemo(() => {
    const tokens = new Map<string, MetaTokenDto>();
    for (const t of q.data?.tokens ?? []) tokens.set(tokenKey(t.chainId, t.address), t);
    const chains = new Map((q.data?.chains ?? []).map((c) => [c.id, c]));
    return { query: q, tokens, chains };
  }, [q]);
}

export function explorerTxUrl(explorer: string | undefined | null, txHash: string): string | null {
  if (!explorer || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) return null;
  return `${explorer.replace(/\/$/, "")}/tx/${txHash}`;
}

export function explorerAddressUrl(explorer: string | undefined | null, address: string): string | null {
  if (!explorer || !/^0x[0-9a-fA-F]{40}$/.test(address)) return null;
  return `${explorer.replace(/\/$/, "")}/address/${address}`;
}
