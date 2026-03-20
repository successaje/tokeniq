/**
 * Sei Network Branding Configuration
 * Centralized design tokens and constants for Sei Network integration
 */

export const SEI_BRANDING = {
  colors: {
    primary: '#8B5CF6', // Purple (Sei brand color)
    secondary: '#6366F1', // Indigo
    accent: '#A78BFA', // Light purple
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    gradient: {
      from: 'from-purple-500/10',
      via: 'via-indigo-500/10',
      to: 'to-purple-500/10',
    },
  },
  network: {
    name: 'Sei Network',
    shortName: 'Sei',
    chainId: 1328, // Sei testnet
    explorer: 'https://seitrace.com',
    rpc: 'https://sei-testnet.drpc.org',
  },
  features: {
    highThroughput: '20,000+ TPS',
    lowLatency: '<100ms',
    parallelExecution: 'Parallelized Order Book',
    lowFees: 'Ultra-low transaction fees',
  },
  badges: {
    intelligenceLayer: 'Powered by Sei Intelligence Layer',
    seiPowered: 'Sei Network',
    aiPowered: 'AI-Powered',
  },
} as const;

export const MOCK_DATA = {
  portfolio: {
    totalValue: 30000,
    totalYield: 3200,
    apy: 8.5,
    tokens: [
      { symbol: 'SEI', balance: 25000, price: 0.64, value: 12000 },
      { symbol: 'USDC', balance: 10000, price: 1.0, value: 10000 },
      { symbol: 'USDT', balance: 3000, price: 1.0, value: 3000 },
      { symbol: 'BTC', balance: 0.048387, price: 105340, value: 3000 },
      { symbol: 'ETH', balance: 0.588235, price: 3528, value: 2000 },
    ],
  },
  vaults: {
    totalTVL: 4500000,
    activeVaults: 12,
    averageAPY: 10.2,
    seiVaults: [
      {
        id: 'sei-yield-1',
        name: 'Sei High Yield Pool',
        apy: 12.8,
        tvl: 1200000,
        risk: 'Medium',
        strategy: 'Liquid Staking + DeFi',
      },
      {
        id: 'sei-stable-1',
        name: 'Sei Stablecoin Vault',
        apy: 9.5,
        tvl: 800000,
        risk: 'Low',
        strategy: 'Stablecoin Yield',
      },
      {
        id: 'sei-usdc-yield',
        name: 'Sei USDC Yield',
        apy: 8.5,
        tvl: 2500000,
        risk: 'Low',
        strategy: 'Sei Native Yield',
      },
      {
        id: 'sei-eth-yield',
        name: 'Sei ETH Yield',
        apy: 10.2,
        tvl: 600000,
        risk: 'Medium',
        strategy: 'ETH Yield Strategy',
      },
      {
        id: 'sei-btc-yield',
        name: 'Sei Bitcoin Vault',
        apy: 11.5,
        tvl: 950000,
        risk: 'Medium',
        strategy: 'BTC Yield Strategy',
      },
    ],
  },
  analytics: {
    totalUsers: 1500,
    totalTransactions: 45000,
    volume30d: 500000,
    avgAPY: 8.5,
  },
} as const;

