import { Chain } from "wagmi";

// Network IDs
export const SEI_MAINNET_ID = 1329;
export const SEI_TESTNET_ID = 1328;
export const CREDITCOIN_MAINNET_ID = 102030;
export const CREDITCOIN_TESTNET_ID = 102031;

// Sei Network configuration
export const SEI_MAINNET: Chain = {
  id: SEI_MAINNET_ID,
  name: 'Sei Network',
  network: 'sei',
  nativeCurrency: {
    decimals: 18,
    name: 'SEI',
    symbol: 'SEI',
  },
  rpcUrls: {
    default: { http: ['https://rpc-sei.keplr.app'] },
    public: { http: ['https://rpc-sei.keplr.app'] },
  },
  blockExplorers: {
    default: {
      name: 'Sei Explorer',
      url: 'https://www.seiscan.app',
    },
  },
  testnet: false,
};

export const SEI_TESTNET: Chain = {
  id: SEI_TESTNET_ID,
  name: 'Sei Testnet',
  network: 'sei-testnet',
  icon: "/logos/sei-logo.png",

  nativeCurrency: {
    decimals: 18,
    name: 'SEI',
    symbol: 'SEI',
  },
  rpcUrls: {
    default: { http: ['https://evm-rpc-testnet.sei-apis.com'] },
    public: { http: ['https://evm-rpc-testnet.sei-apis.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Sei Testnet Explorer',
      url: 'https://testnet.seitrace.com',
    },
  },
  testnet: true,
};

interface CustomChain extends Omit<Chain, 'id'> {
  id: number;
  icon?: string;
  color?: string;
}

export const SUPPORTED_CHAINS = {
  // Sei chains
  sei: {
    ...SEI_MAINNET,
    logo: '/logos/sei-logo.png',
    color: '#00e6b8',
  },
  'sei-testnet': {
    ...SEI_TESTNET,
    logo: '/logos/sei-logo.png',
    color: '#00e6b8',
  },

  // Creditcoin chains
  creditcoin: {
    id: CREDITCOIN_MAINNET_ID,
    name: 'Creditcoin',
    logo: '/logos/creditcoin-logo.png',
    color: '#8B5CF6',
  },
  'creditcoin-testnet': {
    id: CREDITCOIN_TESTNET_ID,
    name: 'Creditcoin Testnet',
    logo: '/logos/creditcoin-logo.png',
    color: '#8B5CF6',
  },
};

// Creditcoin Network configuration
export const CREDITCOIN_MAINNET: Chain = {
  id: CREDITCOIN_MAINNET_ID,
  name: 'Creditcoin',
  network: 'creditcoin',
  icon: "/logos/creditcoin-logo.png",
  nativeCurrency: {
    decimals: 18,
    name: 'Creditcoin',
    symbol: 'CTC',
  },
  rpcUrls: {
    default: { http: ['https://mainnet3.creditcoin.network'] },
    public: { http: ['https://mainnet3.creditcoin.network'] },
  },
  blockExplorers: {
    default: {
      name: 'Creditcoin Explorer',
      url: 'https://explorer.creditcoin.network',
    },
  },
  testnet: false,
};

export const CREDITCOIN_TESTNET: Chain = {
  id: CREDITCOIN_TESTNET_ID,
  name: 'Creditcoin Testnet',
  network: 'creditcoin-testnet',
  icon: "/logos/creditcoin-logo.png",
  nativeCurrency: {
    decimals: 18,
    name: 'Creditcoin Testnet',
    symbol: 'tCTC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.cc3-testnet.creditcoin.network'] },
    public: { http: ['https://rpc.cc3-testnet.creditcoin.network'] },
  },
  blockExplorers: {
    default: {
      name: 'Creditcoin Testnet Explorer',
      url: 'https://explorer.cc3-testnet.creditcoin.network',
    },
  },
  testnet: true,
};

export const chains: CustomChain[] = [
  // Polkadot Hub
  {
    id: 1284,
    name: "Polkadot Hub",
    network: "polkadot-hub",
    icon: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
    color: "#E6007A",
    nativeCurrency: {
      name: "Polkadot",
      symbol: "DOT",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://rpc.api.moonbeam.network"] },
      public: { http: ["https://rpc.api.moonbeam.network"] },
    },
    blockExplorers: {
      default: { name: "Moonscan", url: "https://moonscan.io" },
    },
  },
  // Creditcoin Mainnet
  {
    id: CREDITCOIN_MAINNET_ID,
    name: "Creditcoin",
    network: "creditcoin",
    icon: "/logos/creditcoin-logo.png",
    color: "#8B5CF6",
    nativeCurrency: {
      name: "Creditcoin",
      symbol: "CTC",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://mainnet3.creditcoin.network"] },
      public: { http: ["https://mainnet3.creditcoin.network"] },
    },
    blockExplorers: {
      default: { name: "Creditcoin Explorer", url: "https://explorer.creditcoin.network" },
    },
  },

  // Creditcoin Testnet
  {
    id: CREDITCOIN_TESTNET_ID,
    name: "Creditcoin Testnet",
    network: "creditcoin-testnet",
    icon: "/logos/creditcoin-logo.png",
    color: "#8B5CF6",
    nativeCurrency: {
      name: "Creditcoin Testnet",
      symbol: "tCTC",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://rpc.cc3-testnet.creditcoin.network"] },
      public: { http: ["https://rpc.cc3-testnet.creditcoin.network"] },
    },
    blockExplorers: {
      default: { name: "Creditcoin Testnet Explorer", url: "https://explorer.cc3-testnet.creditcoin.network" },
    },
  },

  // Sei Network
  {
    ...SEI_MAINNET,
    icon: "/logos/sei-logo.png",
    color: "#00e6b8",
  },

  // Avalanche
  {
    id: 43114,
    name: "Avalanche",
    network: "avalanche",
    icon: "/logos/avalanche-avax-logo.png",
    color: "#E84142",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
      public: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
    },
    blockExplorers: {
      default: { name: "SnowTrace", url: "https://snowtrace.io" },
    },
  },
  {
    id: 2,
    name: "Bitcoin",
    network: "bitcoin",
    icon: "/logos/bitcoin-btc-logo.png",
    color: "#F7931A",
    nativeCurrency: {
      name: "Bitcoin",
      symbol: "BTC",
      decimals: 8,
    },
    rpcUrls: {
      default: { http: ["https://bitcoin.llamarpc.com"] },
      public: { http: ["https://bitcoin.llamarpc.com"] },
    },
    blockExplorers: {
      default: { name: "BlockCypher", url: "https://live.blockcypher.com" },
    },
  },
  // Ethereum
  {
    id: 1,
    name: "Ethereum",
    network: "ethereum",
    icon: "/logos/ethereum.png",
    color: "#627EEA",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://eth.llamarpc.com"] },
      public: { http: ["https://eth.llamarpc.com"] },
    },
    blockExplorers: {
      default: { name: "Etherscan", url: "https://etherscan.io" },
    },
  },
  {
    id: 137,
    name: "Polygon",
    network: "polygon",
    icon: "/logos/polygon-matic-logo.png",
    color: "#8247E5",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://polygon.llamarpc.com"] },
      public: { http: ["https://polygon.llamarpc.com"] },
    },
    blockExplorers: {
      default: { name: "PolygonScan", url: "https://polygonscan.com" },
    },
  },
  {
    id: 42161,
    name: "Arbitrum",
    network: "arbitrum",
    icon: "/logos/arbitrum-arb-logo.png",
    color: "#28A0F0",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://arb1.arbitrum.io/rpc"] },
      public: { http: ["https://arb1.arbitrum.io/rpc"] },
    },
    blockExplorers: {
      default: { name: "Arbiscan", url: "https://arbiscan.io" },
    },
  },
  {
    id: 10,
    name: "Optimism",
    network: "optimism",
    icon: "/logos/optimism.png",
    color: "#FF0420",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://mainnet.optimism.io"] },
      public: { http: ["https://mainnet.optimism.io"] },
    },
    blockExplorers: {
      default: { name: "Optimism Explorer", url: "https://optimistic.etherscan.io" },
    },
  },
  {
    id: 43114,
    name: "Avalanche",
    network: "avalanche",
    icon: "/logos/avalanche-avax-logo.png",
    color: "#E84142",
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
      public: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
    },
    blockExplorers: {
      default: { name: "Snowtrace", url: "https://snowtrace.io" },
    },
  },
] 