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
  tvl?: string;
  performanceFee?: number;
  withdrawalFee?: number;
  lastHarvest?: number;
}
