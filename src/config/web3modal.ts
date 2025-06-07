import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/ethers'
import { mainnet, sepolia } from 'viem/chains'

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

// 2. Create wagmiConfig
const metadata = {
  name: 'TokenIQ',
  description: 'TokenIQ - DeFi Asset Management',
  url: 'https://tokeniq.xyz',
  icons: ['https://tokeniq.xyz/logo.png']
}

const chains = [mainnet, sepolia]
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableAnalytics: true,
  enableOnramp: true
})

// 3. Create modal
export const web3Modal = createWeb3Modal({
  ethersConfig: wagmiConfig,
  chains,
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#10B981',
    '--w3m-color-mix-strength': 20
  }
})
