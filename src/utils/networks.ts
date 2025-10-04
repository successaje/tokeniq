import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';
import { CORE_MAINNET, CORE_TESTNET, SEI_MAINNET, SEI_TESTNET } from '@/config/chains';

// Re-export for backward compatibility
export { SEI_MAINNET, SEI_TESTNET };

// This is now just for backward compatibility
// The main source of truth is in @/config/chains
export const SUPPORTED_CHAINS = [
  avalancheFuji,
  sepolia,
  baseSepolia,
  CORE_MAINNET,
  CORE_TESTNET,
  SEI_MAINNET,
  SEI_TESTNET,
] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number]['id'];

export const CHAIN_NAMES: Record<number, string> = {
  [avalancheFuji.id]: 'Avalanche Fuji',
  [sepolia.id]: 'Sepolia',
  [baseSepolia.id]: 'Base Sepolia',
  [CORE_MAINNET.id]: 'Core Mainnet',
  [CORE_TESTNET.id]: 'Core Testnet',
  [SEI_MAINNET.id]: 'Sei Network',
  [SEI_TESTNET.id]: 'Sei Testnet',
};

export const CHAIN_ICONS: Record<number, string> = {
  [avalancheFuji.id]: '⛓️',
  [sepolia.id]: '🔷',
  [baseSepolia.id]: '🟦',
  [CORE_MAINNET.id]: '🟧', // Using orange square for Core (similar to Core's logo color)
  [CORE_TESTNET.id]: '🟠', // Using orange circle for Core Testnet
  [SEI_MAINNET.id]: '🔵', // Using blue circle for Sei
  [SEI_TESTNET.id]: '🔹', // Using blue diamond for Sei Testnet
};

// Creditcoin chain configurations
const CREDITCOIN_MAINNET_ID = 102030;
const CREDITCOIN_TESTNET_ID = 102031;

CHAIN_NAMES[CREDITCOIN_MAINNET_ID] = 'Creditcoin';
CHAIN_NAMES[CREDITCOIN_TESTNET_ID] = 'Creditcoin Testnet';

CHAIN_ICONS[CREDITCOIN_MAINNET_ID] = '🟣';
CHAIN_ICONS[CREDITCOIN_TESTNET_ID] = '🟪';

export const DEFAULT_CHAIN = avalancheFuji;

// Map of feature to supported chain IDs
export const FEATURE_SUPPORT: Record<string, number[]> = {
  aaveVault: [sepolia.id],
  vaults: [avalancheFuji.id, CORE_MAINNET.id, CORE_TESTNET.id, SEI_MAINNET.id, SEI_TESTNET.id],
  crossChain: [
    avalancheFuji.id, 
    sepolia.id, 
    baseSepolia.id, 
    CORE_MAINNET.id, 
    CORE_TESTNET.id,
    SEI_MAINNET.id,
    SEI_TESTNET.id
  ],
  btcVaults: [CORE_MAINNET.id, CORE_TESTNET.id, SEI_MAINNET.id, SEI_TESTNET.id],
};

// Extend feature support to include Creditcoin
FEATURE_SUPPORT.vaults.push(CREDITCOIN_MAINNET_ID, CREDITCOIN_TESTNET_ID);
FEATURE_SUPPORT.crossChain.push(CREDITCOIN_MAINNET_ID, CREDITCOIN_TESTNET_ID);
FEATURE_SUPPORT.rwa = [CREDITCOIN_MAINNET_ID, CREDITCOIN_TESTNET_ID, sepolia.id, avalancheFuji.id];

export function isFeatureSupported(feature: string, chainId?: number): boolean {
  if (!chainId) return false;
  return FEATURE_SUPPORT[feature]?.includes(chainId) || false;
}

export function getFeatureSupportedChains(feature: string): number[] {
  return FEATURE_SUPPORT[feature] || [];
}
