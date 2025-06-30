import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [
  avalancheFuji,
  sepolia,
  baseSepolia,
] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number]['id'];

export const CHAIN_NAMES: Record<number, string> = {
  [avalancheFuji.id]: 'Avalanche Fuji',
  [sepolia.id]: 'Sepolia',
  [baseSepolia.id]: 'Base Sepolia',
};

export const CHAIN_ICONS: Record<number, string> = {
  [avalancheFuji.id]: '⛓️',
  [sepolia.id]: '🔷',
  [baseSepolia.id]: '🟦',
};

export const DEFAULT_CHAIN = avalancheFuji;

// Map of feature to supported chain IDs
export const FEATURE_SUPPORT: Record<string, number[]> = {
  aaveVault: [sepolia.id],
  vaults: [avalancheFuji.id],
  crossChain: [avalancheFuji.id, sepolia.id, baseSepolia.id],
};

export function isFeatureSupported(feature: string, chainId?: number): boolean {
  if (!chainId) return false;
  return FEATURE_SUPPORT[feature]?.includes(chainId) || false;
}

export function getFeatureSupportedChains(feature: string): number[] {
  return FEATURE_SUPPORT[feature] || [];
}
