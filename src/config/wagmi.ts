import { http, createConfig } from 'wagmi';
import { 
  sepolia, 
  avalancheFuji,
  baseSepolia,
  defineChain
} from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';
import { SEI_MAINNET, SEI_TESTNET } from './chains';

// Define Sei Network chains
const seiMainnet = defineChain(SEI_MAINNET);
const seiTestnet = defineChain(SEI_TESTNET);

// Only include the chains we want to support
export const supportedChains = [
  sepolia,
  avalancheFuji,
  baseSepolia,
  seiMainnet,
  seiTestnet
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
