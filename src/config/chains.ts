import { Chain } from "wagmi"

interface CustomChain extends Omit<Chain, 'id'> {
  id: number;
  icon?: string;
  color?: string;
}

// Core Blockchain Mainnet and Testnet configurations
// Core Network IDs
export const CORE_MAINNET_ID = 1116;
export const CORE_TESTNET_ID = 1115;

export const SUPPORTED_CHAINS = {
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
  id: 1115,
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