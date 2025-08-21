// WalletConnect project ID - replace with your own from https://cloud.walletconnect.com/
export const WALLET_CONNECT_PROJECT_ID = 'YOUR_WALLET_CONNECT_PROJECT_ID';

// Default chain ID
export const DEFAULT_CHAIN_ID = 1; // Ethereum Mainnet

// Default RPC URLs
export const RPC_URLS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  5: 'https://rpc.ankr.com/eth_goerli',
  10: 'https://mainnet.optimism.io',
  56: 'https://bsc-dataseed.binance.org/',
  137: 'https://polygon-rpc.com',
  250: 'https://rpc.ftm.tools',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
  42161: 'https://arb1.arbitrum.io/rpc',
  8453: 'https://mainnet.base.org',
  59140: 'https://evm-rpc-testnet.sei-apis.com',
};

// Explorer URLs
export const EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io',
  5: 'https://goerli.etherscan.io',
  10: 'https://optimistic.etherscan.io',
  56: 'https://bscscan.com',
  137: 'https://polygonscan.com',
  250: 'https://ftmscan.com',
  43114: 'https://snowtrace.io',
  42161: 'https://arbiscan.io',
  8453: 'https://basescan.org',
  59140: 'https://evm-rpc-testnet.sei-apis.com',
};

// Native token symbols
export const NATIVE_TOKENS: Record<number, string> = {
  1: 'ETH',
  5: 'gETH',
  10: 'ETH',
  56: 'BNB',
  137: 'MATIC',
  250: 'FTM',
  43114: 'AVAX',
  42161: 'ETH',
  8453: 'ETH',
  59140: 'SEI',
};
