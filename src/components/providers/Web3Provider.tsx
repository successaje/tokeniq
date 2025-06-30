'use client';

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { mainnet, sepolia, avalanche, avalancheFuji, base, baseSepolia, Chain } from 'viem/chains';

// Import chain configurations
import { SUPPORTED_CHAINS } from '@/contexts/ContractContext';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

// Define our supported chains with their RPC URLs
const CHAINS = {
  mainnet: {
    ...mainnet,
    rpcUrls: {
      ...mainnet.rpcUrls,
      default: { http: ['https://eth.llamarpc.com'] },
    },
  },
  sepolia: {
    ...sepolia,
    rpcUrls: {
      ...sepolia.rpcUrls,
      default: { http: ['https://rpc.sepolia.org'] },
    },
  },
  avalanche: {
    ...avalanche,
    rpcUrls: {
      ...avalanche.rpcUrls,
      default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    },
  },
  avalancheFuji: {
    ...avalancheFuji,
    rpcUrls: {
      ...avalancheFuji.rpcUrls,
      default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
    },
  },
  base: {
    ...base,
    rpcUrls: {
      ...base.rpcUrls,
      default: { http: ['https://mainnet.base.org'] },
    },
  },
  baseSepolia: {
    ...baseSepolia,
    rpcUrls: {
      ...baseSepolia.rpcUrls,
      default: { http: ['https://sepolia.base.org'] },
    },
  },
};

// Create chains array from SUPPORTED_CHAINS
const supportedChains = Object.values(SUPPORTED_CHAINS).map(chainConfig => {
  const chainId = chainConfig.id;
  
  // Map to our predefined chains
  switch (chainId) {
    case 1: return CHAINS.mainnet;
    case 11155111: return CHAINS.sepolia;
    case 43114: return CHAINS.avalanche;
    case 43113: return CHAINS.avalancheFuji;
    case 8453: return CHAINS.base;
    case 84532: return CHAINS.baseSepolia;
    default: return CHAINS.mainnet;
  }
});

// Ensure we have at least one chain
if (supportedChains.length === 0) {
  throw new Error('No supported chains configured');
}

// Create wagmi config
const config = createConfig({
  chains: supportedChains as [Chain, ...Chain[]],
  transports: {
    [mainnet.id]: http(CHAINS.mainnet.rpcUrls.default.http[0]),
    [sepolia.id]: http(CHAINS.sepolia.rpcUrls.default.http[0]),
    [avalanche.id]: http(CHAINS.avalanche.rpcUrls.default.http[0]),
    [avalancheFuji.id]: http(CHAINS.avalancheFuji.rpcUrls.default.http[0]),
    [base.id]: http(CHAINS.base.rpcUrls.default.http[0]),
    [baseSepolia.id]: http(CHAINS.baseSepolia.rpcUrls.default.http[0]),
  },
});

// Create a client-side only wrapper component
const ClientWeb3Provider = React.memo(({ children }: { children: React.ReactNode }) => {
  // Memoize theme and config first to ensure stable references
  const theme = React.useMemo(() => darkTheme({
    accentColor: '#6366f1',
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
    overlayBlur: 'small',
  }), []);

  // Create a stable config reference
  const wagmiConfig = React.useMemo(() => config, []);
  
  // Track if we're on the client
  const [isClient, setIsClient] = React.useState(false);

  // Use layout effect to set client state before paint
  React.useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything during SSR or before client-side hydration
  if (!isClient) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={theme}
          modalSize="compact"
          appInfo={{
            appName: 'TokenIQ',
            learnMoreUrl: 'https://tokeniq.xyz',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
});

// Add display name for better debugging
ClientWeb3Provider.displayName = 'ClientWeb3Provider';

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Don't render anything during SSR
  if (typeof window === 'undefined') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <ClientWeb3Provider>{children}</ClientWeb3Provider>;
}
