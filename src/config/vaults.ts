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

// Yei Finance Contract Addresses (placeholders for now))
const YEI_CONTRACTS = {
  LENDING_POOL: '0x0000000000000000000000000000000000000001',
  STAKING_POOL: '0x0000000000000000000000000000000000000002',
  MONEY_MARKET: '0x0000000000000000000000000000000000000003',
} as const;

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

  seiHighYield: {
    id: 'sei-high-yield',
    name: 'Sei High Yield Pool',
    description: 'Maximum yield through Sei Network liquid staking and DeFi strategies',
    chain: 'Sei',
    available: true,
    apy: 12.8,
    tvl: parseEther('1200000'), // $1.2M TVL
    minDeposit: parseEther('100'), // $100 minimum
    tokenDecimals: 18,
    tokenSymbol: 'SEI',
    tokenAddress: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54',
    vaultAddress: '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168',
    strategy: 'Liquid Staking + DeFi',
    risk: 'medium',
    tags: ['High Yield', 'Sei', 'Liquid Staking']
  },

  seiStablecoinVault: {
    id: 'sei-stablecoin-vault',
    name: 'Sei Stablecoin Vault',
    description: 'Optimized stablecoin yield strategy on Sei Network',
    chain: 'Sei',
    available: true,
    apy: 9.5,
    tvl: parseEther('800000'), // $800k TVL
    minDeposit: parseEther('50'), // $50 minimum
    tokenDecimals: 18,
    tokenSymbol: 'USDC',
    tokenAddress: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54',
    vaultAddress: '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168',
    strategy: 'Stablecoin Yield',
    risk: 'low',
    tags: ['Stablecoin', 'Sei', 'Low Risk']
  },

  seiEthVault: {
    id: 'sei-eth-vault',
    name: 'Sei ETH Yield',
    description: 'Ethereum yield opportunities on Sei Network',
    chain: 'Sei',
    available: true,
    apy: 10.2,
    tvl: parseEther('600000'), // $600k TVL
    minDeposit: parseEther('0.1'), // 0.1 ETH
    tokenDecimals: 18,
    tokenSymbol: 'ETH',
    tokenAddress: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54',
    vaultAddress: '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168',
    strategy: 'ETH Yield Strategy',
    risk: 'medium',
    tags: ['ETH', 'Sei', 'Yield']
  },

  seiBtcVault: {
    id: 'sei-btc-vault',
    name: 'Sei Bitcoin Vault',
    description: 'Bitcoin yield strategies on Sei Network',
    chain: 'Sei',
    available: true,
    apy: 11.5,
    tvl: parseEther('950000'), // $950k TVL
    minDeposit: parseEther('0.001'), // 0.001 BTC
    tokenDecimals: 8,
    tokenSymbol: 'BTC',
    tokenAddress: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54',
    vaultAddress: '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168',
    strategy: 'BTC Yield Strategy',
    risk: 'medium',
    tags: ['Bitcoin', 'Sei', 'Yield']
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
  },
  
  // Yei Finance Vaults
  btcFiVault: {
    id: 'btc-fi-vault',
    name: 'BTCFi Yield Vault',
    description: '60% Yei Lending Pool + 40% Yei Staking Pool',
    chain: 'Ethereum',
    available: true,
    apy: 12.8,
    tvl: parseEther('5000000'), // $5M TVL
    minDeposit: parseEther('0.01'), // 0.01 WBTC
    tokenDecimals: 8,
    tokenSymbol: 'WBTC',
    tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // Mainnet WBTC
    vaultAddress: YEI_CONTRACTS.LENDING_POOL as Address,
    strategy: 'Yei Finance BTCFi Strategy',
    risk: 'medium',
    tags: ['Bitcoin', 'Yield', 'Lending', 'Staking']
  },
  
  stablecoinVault: {
    id: 'stablecoin-vault',
    name: 'Stablecoin Yield Vault',
    description: 'Yield optimized stablecoin strategy via Yei money market',
    chain: 'Ethereum',
    available: true,
    apy: 8.9,
    tvl: parseEther('3000000'), // $3M TVL
    minDeposit: parseEther('100'), // 100 USDC
    tokenDecimals: 6,
    tokenSymbol: 'USDC',
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Mainnet USDC
    vaultAddress: YEI_CONTRACTS.MONEY_MARKET as Address,
    strategy: 'Yei Finance Money Market',
    risk: 'low',
    tags: ['Stablecoin', 'Yield', 'Money Market']
  },

  // Creditcoin RWA Vaults
  creditcoinRWA: {
    id: 'creditcoin-rwa-vault',
    name: 'Creditcoin RWA Vault',
    description: 'Tokenized real-world assets with credit scoring and compliance automation',
    chain: 'Creditcoin',
    available: true,
    apy: 11.2,
    tvl: parseEther('7500000'), // $7.5M TVL
    minDeposit: parseEther('1000'), // 1000 CTC
    tokenDecimals: 18,
    tokenSymbol: 'CTC',
    tokenAddress: '0x0000000000000000000000000000000000000000', // TBD - CTC token
    vaultAddress: '0x0000000000000000000000000000000000000000', // TBD - RWA Vault
    strategy: 'Creditcoin RWA Tokenization',
    risk: 'medium',
    tags: ['RWA', 'Creditcoin', 'Tokenization', 'Compliance']
  },

  creditcoinRealEstate: {
    id: 'creditcoin-real-estate-vault',
    name: 'Real Estate RWA Vault',
    description: 'Tokenized commercial and residential real estate with automated valuation',
    chain: 'Creditcoin',
    available: true,
    apy: 8.5,
    tvl: parseEther('12000000'), // $12M TVL
    minDeposit: parseEther('5000'), // 5000 CTC
    tokenDecimals: 18,
    tokenSymbol: 'CTC',
    tokenAddress: '0x0000000000000000000000000000000000000000', // TBD - CTC token
    vaultAddress: '0x0000000000000000000000000000000000000000', // TBD - Real Estate Vault
    strategy: 'Real Estate Tokenization',
    risk: 'low',
    tags: ['Real Estate', 'RWA', 'Creditcoin', 'Property']
  },

  creditcoinInvoice: {
    id: 'creditcoin-invoice-vault',
    name: 'Invoice Factoring Vault',
    description: 'Tokenized invoices with automated credit scoring and payment tracking',
    chain: 'Creditcoin',
    available: true,
    apy: 15.3,
    tvl: parseEther('4500000'), // $4.5M TVL
    minDeposit: parseEther('500'), // 500 CTC
    tokenDecimals: 18,
    tokenSymbol: 'CTC',
    tokenAddress: '0x0000000000000000000000000000000000000000', // TBD - CTC token
    vaultAddress: '0x0000000000000000000000000000000000000000', // TBD - Invoice Vault
    strategy: 'Invoice Factoring & Tokenization',
    risk: 'high',
    tags: ['Invoices', 'Factoring', 'Creditcoin', 'Business']
  },

  creditcoinCommodity: {
    id: 'creditcoin-commodity-vault',
    name: 'Commodity RWA Vault',
    description: 'Tokenized commodities with price oracles and storage verification',
    chain: 'Creditcoin',
    available: true,
    apy: 9.7,
    tvl: parseEther('6000000'), // $6M TVL
    minDeposit: parseEther('2000'), // 2000 CTC
    tokenDecimals: 18,
    tokenSymbol: 'CTC',
    tokenAddress: '0x0000000000000000000000000000000000000000', // TBD - CTC token
    vaultAddress: '0x0000000000000000000000000000000000000000', // TBD - Commodity Vault
    strategy: 'Commodity Tokenization',
    risk: 'medium',
    tags: ['Commodities', 'RWA', 'Creditcoin', 'Precious Metals']
  }
} as const;

export const VAULT_TYPE_IDS = Object.keys(VAULT_TYPES) as Array<keyof typeof VAULT_TYPES>;
