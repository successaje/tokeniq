import { http } from 'wagmi'
import { 
  mainnet, 
  arbitrum, 
  base, 
  avalanche, 
  polygon, 
  optimism 
} from 'wagmi/chains'
import { createConfig } from 'wagmi'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

if (!projectId) {
  console.warn('WalletConnect project ID is not set. Please set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID in your .env file')
}

// Configure chains
const chains = [mainnet, arbitrum, base, avalanche, polygon, optimism]

// 2. Create wagmiConfig
export const config = createConfig({
  chains,
  connectors: [
    injected({ shimDisconnect: true }),
    metaMask({ dappMetadata: { name: 'TokenIQ' } }),
    walletConnect({ 
      projectId,
      showQrModal: false, // We'll use Web3Modal's modal
      metadata: {
        name: 'TokenIQ',
        description: 'AI-Powered Treasury Management',
        url: isBrowser ? window.location.hostname : '',
        icons: ['https://tokeniq.xyz/logo.png']
      }
    }),
  ],
  transports: Object.fromEntries(
    chains.map(chain => [chain.id, http()])
  ),
  ssr: true,
  // Disable auto-connect to prevent hydration issues
  autoConnect: false
})
