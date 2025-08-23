'use client';

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { mainnet, sepolia, avalanche, avalancheFuji, base, seiTestnet, sei, baseSepolia, Chain } from 'viem/chains';
import { CORE_MAINNET, CORE_TESTNET } from '@/config/chains';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';

// Get WalletConnect project ID from environment variables
const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!WALLET_CONNECT_PROJECT_ID) {
  console.warn('WalletConnect project ID is not set. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your environment variables.');
}

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
  seiTestnet: {
    ...seiTestnet,
    rpcUrls: {
      ...seiTestnet.rpcUrls,
      default: { http: ['https://sei-testnet.drpc.org'] },
    },
  },
  sei: {
    ...sei,
    rpcUrls: {
      ...sei.rpcUrls,
      default: { http: ['wss://sei.drpc.org'] },
    },
  },
} as const;

// Configure Web3Modal
const projectId = WALLET_CONNECT_PROJECT_ID;

// Create wagmiConfig with supported chains
const chains = [
  CHAINS.mainnet,
  CHAINS.sepolia,
  CHAINS.avalanche,
  CHAINS.avalancheFuji,
  CHAINS.base,
  CHAINS.baseSepolia,
  CHAINS.seiTestnet,
  CHAINS.sei,
  CORE_MAINNET,
  CORE_TESTNET,
] as const;

// Create wagmiConfig
const wagmiConfig = defaultWagmiConfig({
  projectId,
  chains,
  ssr: true,
  metadata: {
    name: 'CoreIQ',
    description: 'AI-powered asset intelligence platform',
    url: 'https://coreiq.xyz',
    icons: ['https://coreiq.xyz/logo.png']
  }
});

// Create Web3Modal instance - we'll initialize this in a useEffect to avoid SSR issues
let web3Modal: any;

if (typeof window !== 'undefined') {
  web3Modal = createWeb3Modal({
    wagmiConfig,
    projectId,
    enableAnalytics: true,
    enableOnramp: true,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-color-mix': '#7C3AED',
      '--w3m-color-mix-strength': 40,
    },
    featuredWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // Metamask
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      'c03dfee351b6fcc421b4494ea33b9d4b98a021f564a69b85d81de06441169a22', // OKX
    ],
    termsConditionsUrl: 'https://tokeniq.xyz/terms',
    privacyPolicyUrl: 'https://tokeniq.xyz/privacy'
  });
}

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
    case 1328: return CHAINS.seiTestnet;
    case 1329: return CHAINS.sei;
    case 1116: return CORE_MAINNET;
    case 1114: return CORE_TESTNET;
    default: return CHAINS.mainnet;
  }
});

// Ensure we have at least one chain
if (supportedChains.length === 0) {
  throw new Error('No supported chains configured');
}

// Create wagmi config
const config = createConfig({
  chains: [
    CHAINS.mainnet,
    CHAINS.sepolia,
    CHAINS.avalanche,
    CHAINS.avalancheFuji,
    CHAINS.base,
    CHAINS.baseSepolia,
    CHAINS.seiTestnet,
    CHAINS.sei,
    CORE_MAINNET,
    CORE_TESTNET,
  ],
  transports: {
    [mainnet.id]: http(CHAINS.mainnet.rpcUrls.default.http[0]),
    [sepolia.id]: http(CHAINS.sepolia.rpcUrls.default.http[0]),
    [avalanche.id]: http(CHAINS.avalanche.rpcUrls.default.http[0]),
    [avalancheFuji.id]: http(CHAINS.avalancheFuji.rpcUrls.default.http[0]),
    [base.id]: http(CHAINS.base.rpcUrls.default.http[0]),
    [baseSepolia.id]: http(CHAINS.baseSepolia.rpcUrls.default.http[0]),
    [seiTestnet.id]: http(CHAINS.seiTestnet.rpcUrls.default.http[0]),
    [sei.id]: http(CHAINS.sei.rpcUrls.default.http[0]),
    [CORE_MAINNET.id]: http(CORE_MAINNET.rpcUrls.default.http[0]),
    [CORE_TESTNET.id]: http(CORE_TESTNET.rpcUrls.default.http[0]),
  },
});

// ClientWeb3Provider component - only rendered on client side
const ClientWeb3Provider = React.memo(({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(false);
  
  // Use effect to handle client-side only operations
  React.useEffect(() => {
    setMounted(true);
    
    // Initialize Web3Modal on client side
    if (typeof window !== 'undefined' && !web3Modal) {
      web3Modal = createWeb3Modal({
        wagmiConfig,
        projectId,
        enableAnalytics: true,
        enableOnramp: true,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-color-mix': '#7C3AED',
          '--w3m-color-mix-strength': 40,
        },
        featuredWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // Metamask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
          'c03dfee351b6fcc421b4494ea33b9d4b98a021f564a69b85d81de06441169a22', // OKX
        ],
        termsConditionsUrl: 'https://coreiq.xyz/terms',
        privacyPolicyUrl: 'https://coreiq.xyz/privacy'
      });
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // Use dark theme for RainbowKit
  const theme = darkTheme({
    accentColor: '#7C3AED',
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
    overlayBlur: 'small',
  });

  // Don't render anything until we're on the client
  if (!mounted) {
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
