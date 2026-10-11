import { arbitrum, base, baseSepolia, mainnet, optimism, sepolia, type Chain } from "viem/chains";

export interface SupportedChain {
  id: number;
  key: string;
  name: string;
  shortName: string;
  testnet: boolean;
  viem: Chain;
  explorer: string;
  /** Public endpoints for development reads. Production must configure RPC_URL_<chainId>. */
  publicRpcs: string[];
  /** L2s whose Chainlink prices must be gated on the sequencer uptime feed. */
  isL2: boolean;
  /** Blocks to wait before treating a balance read as settled. */
  confirmations: number;
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  { id: 1, key: "ethereum", name: "Ethereum", shortName: "ETH", testnet: false, viem: mainnet, explorer: "https://etherscan.io", publicRpcs: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com"], isL2: false, confirmations: 3 },
  { id: 8453, key: "base", name: "Base", shortName: "Base", testnet: false, viem: base, explorer: "https://basescan.org", publicRpcs: ["https://mainnet.base.org", "https://base-rpc.publicnode.com"], isL2: true, confirmations: 5 },
  { id: 42161, key: "arbitrum", name: "Arbitrum One", shortName: "Arb", testnet: false, viem: arbitrum, explorer: "https://arbiscan.io", publicRpcs: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-one-rpc.publicnode.com"], isL2: true, confirmations: 5 },
  { id: 10, key: "optimism", name: "OP Mainnet", shortName: "OP", testnet: false, viem: optimism, explorer: "https://optimistic.etherscan.io", publicRpcs: ["https://mainnet.optimism.io", "https://optimism-rpc.publicnode.com"], isL2: true, confirmations: 5 },
  { id: 84532, key: "base-sepolia", name: "Base Sepolia", shortName: "Base Sep", testnet: true, viem: baseSepolia, explorer: "https://sepolia.basescan.org", publicRpcs: ["https://sepolia.base.org", "https://base-sepolia-rpc.publicnode.com"], isL2: true, confirmations: 2 },
  { id: 11155111, key: "sepolia", name: "Sepolia", shortName: "Sep", testnet: true, viem: sepolia, explorer: "https://sepolia.etherscan.io", publicRpcs: ["https://ethereum-sepolia-rpc.publicnode.com"], isL2: false, confirmations: 2 },
];

const byId = new Map(SUPPORTED_CHAINS.map((c) => [c.id, c]));

export function getChain(id: number): SupportedChain | undefined {
  return byId.get(id);
}

export function requireChain(id: number): SupportedChain {
  const c = byId.get(id);
  if (!c) throw new Error(`Unsupported chain ${id}`);
  return c;
}

export function chainName(id: number): string {
  return byId.get(id)?.name ?? `Chain ${id}`;
}

export function explorerTx(chainId: number, hash: string): string | null {
  const c = byId.get(chainId);
  return c ? `${c.explorer}/tx/${hash}` : null;
}

export function explorerAddress(chainId: number, address: string): string | null {
  const c = byId.get(chainId);
  return c ? `${c.explorer}/address/${address}` : null;
}

/**
 * Chainlink L2 sequencer uptime feeds (answer 0 = up, 1 = down). Prices on an L2
 * are treated as unreliable while the sequencer is down and for a grace period after it recovers.
 * Verified on-chain 2026-10-11 (docs/research/integration-facts.md).
 */
export const SEQUENCER_UPTIME_FEEDS: Record<number, string> = {
  8453: "0xBCF85224fc0756B9Fa45aA7892530B47e10b6433",
  42161: "0xFdB631F5EE196F0ed6FAa767959853A9F217697D",
  10: "0x371EAD81c9102C9BF4874A9075FFFf170F2Ee389",
};

export const SEQUENCER_GRACE_SECONDS = 3600;
