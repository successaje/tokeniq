'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { useEffect, useState } from 'react'
import { config } from '@/config/wagmi'
import { 
  mainnet, 
  arbitrum, 
  base, 
  avalanche, 
  polygon, 
  optimism 
} from 'wagmi/chains'

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
          defaultChain: mainnet.id,
          chains: [
            mainnet.id,
            arbitrum.id,
            base.id,
            avalanche.id,
            polygon.id,
            optimism.id
          ],
        })
        web3ModalInitialized = true
      } catch (error) {
        console.error('Failed to initialize Web3Modal:', error)
      }
    }
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <>{children}</>
} 