import { ComponentType } from 'react';

// Define NetworkType type
export type NetworkType = 'testnet' | 'mainnet';

// Define ChainId type
export type ChainId = number;

// Define Chain interface
export interface Chain {
  id: string;
  name: string;
  icon: string;
  isTestnet: boolean;
  chainId: ChainId;
  color: string;
  chainSelector: string;
  symbol: string;
  component?: ComponentType<{ className?: string }>;
  className?: string;
}

// Define Token interface
export interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon: string;
  color: string;
  addresses: Record<number, `0x${string}`>;
  component?: ComponentType<{ className?: string }>;
  className?: string;
}

// Define Transaction interface
export interface Transaction {
  id: string;
  txHash: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

// Define the main component props
export interface CrossChainBridgeProps {
  onFromChainChange?: (chainId: number) => void;
  onToChainChange?: (chainId: number) => void;
  onTokenChange?: (tokenId: string) => void;
  onAmountChange?: (amount: number) => void;
}

// Define token addresses with proper checksum for all networks
export interface TokenAddresses {
  [key: string]: Record<number, `0x${string}`>;
}

// ChainIcon component props
export interface ChainIconProps {
  icon: {
    component?: ComponentType<{ className?: string }>;
    color: string;
    icon?: string;
    id?: string;
    symbol?: string;
    name?: string;
  } | string; // Allow string for direct icon names
  className?: string;
  size?: number;
  isToken?: boolean;
}
