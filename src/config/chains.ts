import { Chain } from "wagmi";

export const ARBITRUM_ID = 42161;
export const ETHEREUM_ID = 1;
export const BASE_ID = 8453;

interface CustomChain extends Omit<Chain, 'id'> {
  id: number;
  icon?: string;
  color?: string;
}

export const chains: CustomChain[] = [
  // Arbitrum
  {
    id: ARBITRUM_ID,
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
  // Ethereum
  {
    id: ETHEREUM_ID,
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
  // Base
  {
    id: BASE_ID,
    name: "Base",
    network: "base",
    icon: "/base-logo.jpeg",
    color: "#0052FF",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ["https://mainnet.base.org"] },
      public: { http: ["https://mainnet.base.org"] },
    },
    blockExplorers: {
      default: { name: "Basescan", url: "https://basescan.org" },
    },
  }
];