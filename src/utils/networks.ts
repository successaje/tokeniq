import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';
import { CORE_MAINNET, CORE_TESTNET } from '@/config/chains';

export const SUPPORTED_CHAINS = [
  avalancheFuji,
  sepolia,
  baseSepolia,
  CORE_MAINNET,
  CORE_TESTNET,
] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number]['id'];

export const CHAIN_NAMES: Record<number, string> = {
  [avalancheFuji.id]: 'Avalanche Fuji',
  [sepolia.id]: 'Sepolia',
  [baseSepolia.id]: 'Base Sepolia',
  [CORE_MAINNET.id]: 'Core Mainnet',
  [CORE_TESTNET.id]: 'Core Testnet',
};

export const CHAIN_ICONS: Record<number, string> = {
  [avalancheFuji.id]: '⛓️',
  [sepolia.id]: '🔷',
  [baseSepolia.id]: '🟦',
  [CORE_MAINNET.id]: '🟧', // Using orange square for Core (similar to Core's logo color)
  [CORE_TESTNET.id]: '🟠', // Using orange circle for Core Testnet
};

export const DEFAULT_CHAIN = avalancheFuji;

// Map of feature to supported chain IDs
export const FEATURE_SUPPORT: Record<string, number[]> = {
  aaveVault: [sepolia.id],
  vaults: [avalancheFuji.id, CORE_MAINNET.id, CORE_TESTNET.id],
  crossChain: [
    avalancheFuji.id, 
    sepolia.id, 
    baseSepolia.id, 
    CORE_MAINNET.id, 
    CORE_TESTNET.id
  ],
  btcVaults: [CORE_MAINNET.id, CORE_TESTNET.id],
};

export function isFeatureSupported(feature: string, chainId?: number): boolean {
  if (!chainId) return false;
  return FEATURE_SUPPORT[feature]?.includes(chainId) || false;
}

export function getFeatureSupportedChains(feature: string): number[] {
  return FEATURE_SUPPORT[feature] || [];
}
