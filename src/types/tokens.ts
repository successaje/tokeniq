import { Address } from 'viem';

export interface TokenBalance {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceRaw: bigint;
  priceUsd?: number;
  valueUsd?: number;
  logoURI?: string;
}

export interface TransactionHistory {
  hash: string;
  timestamp: number;
  from: Address;
  to: Address | null;
  value: string;
  tokenAddress: Address | null;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  type: 'send' | 'receive' | 'contract';
  status: 'pending' | 'success' | 'failed';
  blockNumber: number | null;
  gasUsed: string | null;
  gasPrice: string | null;
  nonce: number;
  input: string;
  contractAddress: Address | null;
  confirmations: number;
  chainId: number;
}
