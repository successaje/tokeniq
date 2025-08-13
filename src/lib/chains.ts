import { Chain } from 'viem';

// Core Testnet 2 configuration
export const coreTestnet2: Chain = {
  id: 1115, // Core Testnet 2 chain ID
  name: 'Core Testnet 2',
  network: 'core-testnet-2',
  nativeCurrency: {
    decimals: 18,
    name: 'Core',
    symbol: 'tCORE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test.btcs.network'],
    },
    public: {
      http: ['https://rpc.test.btcs.network'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Core Testnet Explorer',
      url: 'https://scan.test.btcs.network' 
    },
  },
  testnet: true,
};
