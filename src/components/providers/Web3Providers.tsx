'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/config/wagmi'
import { useState, useEffect } from 'react'
import { Web3ModalProvider } from './Web3ModalProvider'
import '@rainbow-me/rainbowkit/styles.css'

// Create a simple in-memory storage for SSR
const createSSRStorage = () => ({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
})

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Web3ModalProvider>
            {children}
          </Web3ModalProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 