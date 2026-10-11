import { createPublicClient, fallback, http, type PublicClient } from "viem";
import { SUPPORTED_CHAINS, type SupportedChain } from "./chains.js";

export interface ClientOptions {
  /** chainId → RPC URL overrides (e.g. from RPC_URL_<id> env vars). Tried before public fallbacks. */
  rpcOverrides?: Record<number, string | undefined>;
  /** Restrict to these chains. */
  chainIds?: number[];
  timeoutMs?: number;
}

export type ClientRegistry = Map<number, PublicClient>;

/** One public client per chain with ordered RPC failover and multicall batching. */
export function createClients(opts: ClientOptions = {}): ClientRegistry {
  const out: ClientRegistry = new Map();
  const timeout = opts.timeoutMs ?? 10_000;
  for (const chain of SUPPORTED_CHAINS) {
    if (opts.chainIds && !opts.chainIds.includes(chain.id)) continue;
    out.set(chain.id, createClientFor(chain, opts.rpcOverrides?.[chain.id], timeout));
  }
  return out;
}

export function createClientFor(chain: SupportedChain, override: string | undefined, timeout = 10_000): PublicClient {
  const urls = [override, ...chain.publicRpcs].filter((u): u is string => !!u);
  return createPublicClient({
    chain: chain.viem,
    transport: fallback(
      urls.map((url) => http(url, { timeout, retryCount: 1, batch: false })),
      { rank: false, retryCount: 1 },
    ),
    batch: { multicall: { wait: 16 } },
  }) as PublicClient;
}
