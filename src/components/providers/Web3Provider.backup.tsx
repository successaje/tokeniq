'use client';

import * as React from 'react';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { createWagmiConfig } from '@/config/wagmi';

// Create a single query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

// Main Web3 Provider component
export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<any>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Initialize on mount
  React.useEffect(() => {
    setMounted(true);
    
    const init = async () => {
      try {
        const wagmiConfig = createWagmiConfig();
        setConfig(wagmiConfig);
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing Web3 provider:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize Web3 provider'));
        setIsInitialized(true);
      }
    };

    if (typeof window !== 'undefined') {
      init();
    }

    return () => {
      setMounted(false);
    };
  }, []);

  // Don't render anything during SSR or if not mounted yet
  if (typeof window === 'undefined' || !mounted) {
    return null;
  }

  // Handle configuration errors
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md p-6 space-y-4 text-center bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700">Web3 Provider Error</h2>
          <p className="text-red-600">{error.message}</p>
          <p className="text-sm text-red-500">
            Please check your browser's console for more details.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (!config || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Initializing Web3...</p>
        </div>
      </div>
    );
  }

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}