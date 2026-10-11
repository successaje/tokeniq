import { createClients, type ClientRegistry } from "@tokeniq/chain";
import type { PublicClient } from "viem";
import type { Env } from "../env.js";

export type PublicClientFor = (chainId: number) => PublicClient | undefined;

export function createChainClients(env: Env): { clients: ClientRegistry; clientFor: PublicClientFor } {
  const clients = createClients({
    rpcOverrides: {
      1: env.RPC_URL_1,
      8453: env.RPC_URL_8453,
      42161: env.RPC_URL_42161,
      10: env.RPC_URL_10,
      84532: env.RPC_URL_84532,
      11155111: env.RPC_URL_11155111,
    },
  });
  return { clients, clientFor: (chainId) => clients.get(chainId) };
}
