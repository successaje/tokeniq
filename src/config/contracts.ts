import { Address } from 'viem';
import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';

export const CONTRACT_ADDRESSES = {
  // Main Contracts
  vaultManager: '0xF673F508104876c72C8724728f81d50E01649b40' as Address, // Fuji
  vaultFactory: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54' as Address, // Fuji
  treasuryAIManager: '0x86C41594e9aDeCcf8c85ba9EEe0138C7c9E70dBc' as Address, // Fuji
  
  // Vaults
  aaveVault: '0xd7b55471Ff384d8a229E948e711CB4C4F952f277' as Address, // New AaveVault deployment on Sepolia
  
  // Cross Chain
  crossChainRouter: {
    [sepolia.id]: '0xD1d6EE0c5309A09Df9ca4c2936956A49cca9eb71' as Address,
    [avalancheFuji.id]: '0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c' as Address,
    [baseSepolia.id]: '0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6' as Address,
  },
} as const;

export const SUPPORTED_VAULT_TYPES = ['aave', 'curve', 'yearn', 'generic'] as const;
