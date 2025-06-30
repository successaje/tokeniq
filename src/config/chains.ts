import { Chain } from "wagmi"

interface CustomChain extends Omit<Chain, 'id'> {
  id: number;
  icon?: string;
  color?: string;
}

export const chains: CustomChain[] = [
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