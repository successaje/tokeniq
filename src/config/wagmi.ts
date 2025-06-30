import { http, createConfig } from 'wagmi';
import { 
  mainnet, 
  sepolia, 
  polygon, 
  polygonMumbai, 
  arbitrum, 
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  base,
  baseSepolia
} from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

// Configure chains
export const supportedChains = [
  mainnet, 
  sepolia, 
  polygon, 
  polygonMumbai, 
  arbitrum, 
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  base,
  baseSepolia
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
