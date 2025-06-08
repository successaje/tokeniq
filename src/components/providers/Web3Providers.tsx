'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/config/wagmi'
import { useState, useEffect } from 'react'
import { Web3ModalProvider } from './Web3ModalProvider'

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

  // Return a loading state during SSR or before mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  return (
    <WagmiProvider config={config} storage={createSSRStorage()}>
      <QueryClientProvider client={queryClient}>
        <Web3ModalProvider>
          {children}
        </Web3ModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 