import { Address } from 'viem';

export type ChainConfig = {
  id: number;
  name: string;
  chainSelector: bigint;
  routerAddress: Address;
  nativeToken: string;
  explorerUrl: string;
  logo: string;
  icon: string;
};

export type CrossChainTransfer = {
  id: string;
  fromChain: number;
  toChain: number;
  token: Address;
  amount: string;
  fee: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  timestamp: number;
};
