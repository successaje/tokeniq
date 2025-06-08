'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { useEffect, useState } from 'react'
import { config } from '@/config/wagmi'

// Global flag to track if Web3Modal has been initialized
let web3ModalInitialized = false

export function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!web3ModalInitialized) {
      const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
      if (!projectId) {
        console.warn('WalletConnect project ID not set')
        return
      }

      try {
        createWeb3Modal({
          wagmiConfig: config,
          projectId,
          enableAnalytics: true,
          enableOnramp: true,
          enableWalletFeatures: true,
          enableExplorer: true,
          defaultChain: 1, // Ethereum mainnet
          chains: [1], // Add more chains as needed
        })
        web3ModalInitialized = true
      } catch (error) {
        console.error('Failed to initialize Web3Modal:', error)
      }
    }
    setMounted(true)
  }, [])

  // Return a loading state during SSR or before mount
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
} 