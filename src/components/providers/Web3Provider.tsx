'use client';

import { WagmiConfig, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';
import { config, supportedChains, createWagmiConfig } from '@/config/wagmi';

// Create a single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

// Create config outside component to avoid re-creation
const wagmiConfig = createWagmiConfig();

// Add a component to handle connection state
function ConnectionHandler() {
  const { isConnected, isConnecting, isDisconnected } = useAccount();

  useEffect(() => {
    console.log('Wallet connection state changed:', {
      isConnected,
      isConnecting,
      isDisconnected,
    });
  }, [isConnected, isConnecting, isDisconnected]);

  return null;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setMounted(true);
      // Check if window.ethereum is available
      if (typeof window !== 'undefined' && !window.ethereum) {
        console.warn('No Ethereum provider detected. Please install MetaMask or another Web3 wallet.');
      }
    } catch (err) {
      console.error('Error initializing Web3 provider:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize Web3 provider'));
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Don't render anything until we're on the client
  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-sm text-muted-foreground">
          Initializing wallet...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">
            {error.message || 'Failed to connect to wallet. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          chains={supportedChains}
          theme={lightTheme({
            accentColor: '#6366f1',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          <ConnectionHandler />
          <div className="w-full h-full">
            {children}
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
} 