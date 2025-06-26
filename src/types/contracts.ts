import { Address } from 'viem';

export interface ContractAddresses {
  vaultManager: Address;
  vaultFactory: Address;
  treasuryAIManager: Address;
  aaveVault: Address;
  crossChainRouter: Record<number, Address>;
}

export interface VaultInfo {
  id: string;
  address: Address;
  name: string;
  symbol: string;
  asset: Address;
  totalAssets: bigint;
  totalSupply: bigint;
  apy: number;
  chainId: number;
}

export type VaultType = 'aave' | 'curve' | 'yearn' | 'generic';

export interface VaultCreationParams {
  name: string;
  symbol: string;
  asset: Address;
  vaultType: VaultType;
  strategyParams?: any;
}
