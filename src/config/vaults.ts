import { Address } from 'viem';

export interface VaultType {
  id: string;
  name: string;
  description: string;
  available: boolean;
  apy?: number;
  tvl?: bigint;
  minDeposit?: bigint;
  tokenDecimals: number;
  tokenSymbol: string;
  tokenAddress: Address;
  vaultAddress?: Address;
  strategy: string;
  risk: 'low' | 'medium' | 'high';
  tags?: string[];
}

export const VAULT_TYPES: Record<string, VaultType> = {
  aave: {
    id: 'aave',
    name: 'Aave Yield',
    description: 'Earn yield by supplying assets to Aave protocol',
    available: true,
    apy: 3.5,
    tvl: 0n,
    minDeposit: parseEther('0.1'),
    tokenDecimals: 18,
    tokenSymbol: 'aUSDC',
    tokenAddress: '0x...', // Replace with actual token address
    strategy: 'Aave V3 Yield',
    risk: 'low',
    tags: ['DeFi', 'Lending']
  },
  rwa: {
    id: 'rwa',
    name: 'Real World Assets',
    description: 'Access to tokenized real-world assets',
    available: false,
    tokenDecimals: 18,
    tokenSymbol: 'RWA',
    tokenAddress: '0x...', // Replace with actual token address
    strategy: 'RWA Yield',
    risk: 'medium',
    tags: ['Real World', 'Fixed Income']
  },
  // Add more vault types as needed
} as const;

export const VAULT_TYPE_IDS = Object.keys(VAULT_TYPES) as Array<keyof typeof VAULT_TYPES>;
