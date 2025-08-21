import { Address } from 'viem';

export enum VaultType {
  STANDARD = 'STANDARD',
  YIELD = 'YIELD',
  STRATEGY = 'STRATEGY',
  BTC = 'BTC',
}

export interface VaultInfo {
  id: string;
  address: Address;
  name: string;
  symbol: string;
  asset: Address;
  totalAssets: string;
  totalSupply: string;
  apy?: number;
  chainId?: number;
  owner?: Address;
  type?: VaultType;
  strategy?: string;
  tvl?: string | bigint;
  performanceFee?: number;
  withdrawalFee?: number;
  lastHarvest?: number;
  
  // Additional fields for UI and configuration
  description?: string;
  risk?: 'low' | 'medium' | 'high';
  minDeposit?: bigint;
  tokenDecimals?: number;
  tokenSymbol?: string;
  tokenAddress?: Address;
  vaultAddress?: Address;
  chain?: string;
  availability?: 'public' | 'private' | 'whitelist';
  tags?: string[];
  isNew?: boolean;
  
  // For UI state
  userBalance?: bigint;
  recommendation?: {
    vaultId: string;
    action: 'deposit' | 'withdraw' | 'hold';
    confidence: number;
    reason: string;
  };
}
