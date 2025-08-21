import { Chain } from "wagmi";

// Network IDs
export const CORE_MAINNET_ID = 1116;
export const CORE_TESTNET_ID = 1115;
export const SEI_MAINNET_ID = 1329;
export const SEI_TESTNET_ID = 1328;

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
  // Core chains
  core: {
    id: CORE_MAINNET_ID,
    name: 'Core Mainnet',
    logo: '/logos/core-dao-core-logo.png',
    color: '#31cb9e',
  },
  'core-testnet': {
    id: CORE_TESTNET_ID,
    name: 'Core Testnet',
    logo: '/logos/core-dao-core-logo.png',
    color: '#31cb9e',
  },
  
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
};

export const CORE_MAINNET: Chain = {
  id: 1116,
  name: 'Core Mainnet',
  network: 'core',
  icon: "/logos/core-dao-core-logo.png",
  nativeCurrency: {
    decimals: 18,
    name: 'Core',
    symbol: 'CORE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.coredao.org'] },
    public: { http: ['https://rpc.coredao.org'] },
  },
  blockExplorers: {
    default: { 
      name: 'CoreScan',
      url: 'https://scan.coredao.org',
    },
  },
  testnet: false,
};



export const CORE_TESTNET: Chain = {
  id: 1114,
  name: 'Core Testnet',
  network: 'core-testnet',
  icon: "/logos/core-dao-core-logo.png",
  nativeCurrency: {
    decimals: 18,
    name: 'tCORE',
    symbol: 'tCORE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.test.btcs.network'] },
    public: { http: ['https://rpc.test.btcs.network'] },
  },
  blockExplorers: {
    default: { 
      name: 'CoreScan Testnet',
      url: 'https://scan.test.btcs.network',
    },
  },
  testnet: true,
};

export const chains: CustomChain[] = [
  {
    id: 1,
    name: "Core",
    network: "core",
    icon: "/logos/core-dao-core-logo.png",
    color: "#627EEA",
    nativeCurrency: {
      name: "Core",
      symbol: "CORE",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://core.llamarpc.com"] },
      public: { http: ["https://core.llamarpc.com"] },
    },
    blockExplorers: {
      default: { name: "CoreScan", url: "https://corescan.io" },
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
  {
    id: 5,
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