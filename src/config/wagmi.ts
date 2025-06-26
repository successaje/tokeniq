import { http } from 'wagmi';
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
import { createConfig } from 'wagmi';

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

// Helper function to create the config
export function createWagmiConfig() {
  // Only access environment variables on the client side
  const projectId = typeof window !== 'undefined' ? 
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID : '';

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
    ssr: false, // Disable SSR to prevent issues with browser APIs
    // Note: autoConnect is not a valid config option in the current wagmi version
    // We'll handle connection state in the UI components
  });
}

// Export a default config for backward compatibility
export const config = createWagmiConfig();
