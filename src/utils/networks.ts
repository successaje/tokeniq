import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';
import { CREDITCOIN_MAINNET, CREDITCOIN_TESTNET, SEI_MAINNET, SEI_TESTNET } from '@/config/chains';

// Re-export for backward compatibility
export { SEI_MAINNET, SEI_TESTNET, CREDITCOIN_MAINNET, CREDITCOIN_TESTNET };

// This is now just for backward compatibility
// The main source of truth is in @/config/chains
export const SUPPORTED_CHAINS = [
  avalancheFuji,
  sepolia,
  baseSepolia,
  CREDITCOIN_MAINNET,
  CREDITCOIN_TESTNET,
  SEI_MAINNET,
  SEI_TESTNET,
] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number]['id'];

export const CHAIN_NAMES: Record<number, string> = {
  [avalancheFuji.id]: 'Avalanche Fuji',
  [sepolia.id]: 'Sepolia',
  [baseSepolia.id]: 'Base Sepolia',
  [CREDITCOIN_MAINNET.id]: 'Creditcoin',
  [CREDITCOIN_TESTNET.id]: 'Creditcoin Testnet',
  [SEI_MAINNET.id]: 'Sei Network',
  [SEI_TESTNET.id]: 'Sei Testnet',
};

export const CHAIN_ICONS: Record<number, string> = {
  [avalancheFuji.id]: '⛓️',
  [sepolia.id]: '🔷',
  [baseSepolia.id]: '🟦',
  [CREDITCOIN_MAINNET.id]: '🟣', // Using purple circle for Creditcoin
  [CREDITCOIN_TESTNET.id]: '🟪', // Using purple square for Creditcoin Testnet
  [SEI_MAINNET.id]: '🔵', // Using blue circle for Sei
  [SEI_TESTNET.id]: '🔹', // Using blue diamond for Sei Testnet
};

export const DEFAULT_CHAIN = avalancheFuji;

// Map of feature to supported chain IDs
export const FEATURE_SUPPORT: Record<string, number[]> = {
  aaveVault: [sepolia.id],
  vaults: [
    avalancheFuji.id, 
    SEI_MAINNET.id, 
    SEI_TESTNET.id,
    CREDITCOIN_MAINNET.id,
    CREDITCOIN_TESTNET.id
  ],
  crossChain: [
    avalancheFuji.id, 
    sepolia.id, 
    baseSepolia.id, 
    SEI_MAINNET.id,
    SEI_TESTNET.id,
    CREDITCOIN_MAINNET.id,
    CREDITCOIN_TESTNET.id
  ],
  btcVaults: [SEI_MAINNET.id, SEI_TESTNET.id],
  rwa: [CREDITCOIN_MAINNET.id, CREDITCOIN_TESTNET.id, sepolia.id, avalancheFuji.id],
};

export function isFeatureSupported(feature: string, chainId?: number): boolean {
  if (!chainId) return false;
  return FEATURE_SUPPORT[feature]?.includes(chainId) || false;
}

export function getFeatureSupportedChains(feature: string): number[] {
  return FEATURE_SUPPORT[feature] || [];
}
