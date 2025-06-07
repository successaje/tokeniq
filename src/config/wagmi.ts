import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'viem/chains'
import { createWeb3Modal } from '@web3modal/wagmi'

// 1. Get projectId at https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

if (!projectId) {
  console.warn('WalletConnect project ID is not set. Please set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID in your .env file')
}

// 2. Create wagmiConfig
export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`)
  },
  ssr: true
})

// 3. Create modal
export const web3Modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#10B981',
    '--w3m-color-mix-strength': 20
  },
  defaultChain: mainnet,
  enableEIP6963: true,
})
