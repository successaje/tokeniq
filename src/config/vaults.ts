import { Address } from 'viem';

// Helper function to parse ether values
export const parseEther = (value: string) => {
  return BigInt(Math.floor(parseFloat(value) * 1e18));
};

export interface VaultType {
  id: string;
  name: string;
  description: string;
  chain: string;
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
  // Sei Network Vaults
  seiUsdcVault: {
    id: 'sei-usdc-vault',
    name: 'Sei USDC Yield',
    description: 'Earn yield on USDC on Sei Network',
    chain: 'Sei',
    available: true,
    apy: 8.5,
    tvl: parseEther('2500000'), // $2.5M TVL
    minDeposit: parseEther('10'), // 10 USDC
    tokenDecimals: 18,
    tokenSymbol: 'USDC',
    tokenAddress: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54', // ERC20VaultToken address
    vaultAddress: '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168', // AssetFactory Proxy address
    strategy: 'Sei Native Yield',
    risk: 'low',
    tags: ['Stablecoin', 'Sei', 'Yield']
  },
  
  // Core Vaults
  coreUsdtVault: {
    id: 'core-usdt-vault',
    name: 'Core USDT Vault',
    description: 'Stable yield on USDT on Core Chain',
    chain: 'Core',
    available: true,
    apy: 7.2,
    tvl: parseEther('1800000'), // $1.8M TVL
    minDeposit: parseEther('10'), // 10 USDT
    tokenDecimals: 18,
    tokenSymbol: 'USDT',
    tokenAddress: '0xc4d732199B7d21207a74CFE6CEd4d17dD330C7Ea', // ERC721CollateralNFT
    vaultAddress: '0x89C3FBe736EDa478967Ac19Ca8634D3562881f6F', // AssetFactory Implementation
    strategy: 'Core Bridge Yield',
    risk: 'low',
    tags: ['Stablecoin', 'Core', 'Bridge']
  },
  
  // Avalanche Vaults
  avaxNativeVault: {
    id: 'avax-native-vault',
    name: 'Avalanche Native Vault',
    description: 'Earn yield on native AVAX',
    chain: 'Avalanche',
    available: true,
    apy: 9.1,
    tvl: parseEther('3200000'), // $3.2M TVL
    minDeposit: parseEther('0.1'), // 0.1 AVAX
    tokenDecimals: 18,
    tokenSymbol: 'WAVAX',
    tokenAddress: '0xc9C0Fb76a50eAb570665977703cC8f7185c082b5', // ERC1155HybridAsset
    vaultAddress: '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168', // AssetFactory Proxy
    strategy: 'Avalanche Native Staking',
    risk: 'medium',
    tags: ['Native', 'Staking', 'Avalanche']
  },
  
  // Cross-chain Vault
  crossChainYield: {
    id: 'cross-chain-yield',
    name: 'Cross-Chain Yield',
    description: 'Optimized yield across multiple chains',
    chain: 'Multi-Chain',
    available: true,
    apy: 10.5,
    tvl: parseEther('5000000'), // $5M TVL
    minDeposit: parseEther('100'), // $100 minimum
    tokenDecimals: 18,
    tokenSymbol: 'TOKE',
    tokenAddress: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54', // ERC20VaultToken
    vaultAddress: '0x89C3FBe736EDa478967Ac19Ca8634D3562881f6F', // AssetFactory Implementation
    strategy: 'Cross-Chain Yield Aggregator',
    risk: 'high',
    tags: ['Multi-Chain', 'Yield Aggregator']
  }
} as const;

export const VAULT_TYPE_IDS = Object.keys(VAULT_TYPES) as Array<keyof typeof VAULT_TYPES>;
