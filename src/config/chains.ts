import { Chain } from "wagmi"

export const chains: Chain[] = [
  {
    id: 1,
    name: "Ethereum",
    network: "ethereum",
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
] 