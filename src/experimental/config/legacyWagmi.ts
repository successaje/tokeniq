import { http, createConfig } from 'wagmi';
import { 
  sepolia, 
  avalancheFuji,
  baseSepolia
} from 'wagmi/chains';
import { defineChain } from 'viem';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';
import { SEI_MAINNET, SEI_TESTNET } from './chains';

// Define Sei Network chains
const seiMainnet = defineChain(SEI_MAINNET);
const seiTestnet = defineChain(SEI_TESTNET);

// Creditcoin chain configurations
const CREDITCOIN_MAINNET = defineChain({
  id: 102030,
  name: 'Creditcoin',
  network: 'creditcoin',
  icon: '/logos/creditcoin-logo.png',
  nativeCurrency: { 
    name: 'Creditcoin', 
    symbol: 'CTC', 
    decimals: 18 
  },
  rpcUrls: {
    default: { http: ['https://mainnet3.creditcoin.network'] },
    public: { http: ['https://mainnet3.creditcoin.network'] },
  },
  blockExplorers: {
    default: { 
      name: 'Creditcoin Explorer', 
      url: 'https://explorer.creditcoin.network' 
    },
  },
  testnet: false,
});

const CREDITCOIN_TESTNET = defineChain({
  id: 102031,
  name: 'Creditcoin Testnet',
  network: 'creditcoin-testnet',
  icon: '/logos/creditcoin-logo.png',
  nativeCurrency: { 
    name: 'Creditcoin Testnet', 
    symbol: 'tCTC', 
    decimals: 18 
  },
  rpcUrls: {
    default: { http: ['https://rpc.cc3-testnet.creditcoin.network'] },
    public: { http: ['https://rpc.cc3-testnet.creditcoin.network'] },
  },
  blockExplorers: {
    default: { 
      name: 'Creditcoin Testnet Explorer', 
      url: 'https://explorer.cc3-testnet.creditcoin.network' 
    },
  },
  testnet: true,
});

// Only include the chains we want to support
export const supportedChains = [
  sepolia,
  avalancheFuji,
  baseSepolia,
  seiMainnet,
  seiTestnet,
  CREDITCOIN_MAINNET,
  CREDITCOIN_TESTNET,
] as const;

// Export chains as a const array
export type SupportedChainId = typeof supportedChains[number]['id'];

// Helper function to create the config
export function createWagmiConfig() {
  // Skip during SSR
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

    // Configure transports for all supported chains
    const transports = supportedChains.reduce((acc, chain) => {
      acc[chain.id] = http();
      return acc;
    }, {} as Record<number, any>);

    // Configure connectors
    const connectors = [
      injected(),
      metaMask(),
      ...(projectId ? [
        walletConnect({
          projectId,
          showQrModal: true,
        })
      ] : []),
    ];

    return createConfig({
      chains: supportedChains,
      transports,
      connectors,
      ssr: false,
    });
  } catch (error) {
    console.error('Failed to create wagmi config:', error);
    return null;
  }
}
