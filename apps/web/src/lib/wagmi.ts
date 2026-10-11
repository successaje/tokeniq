import { createConfig, fallback, http, injected } from "wagmi";
import { safe, walletConnect } from "wagmi/connectors";
import { arbitrum, base, baseSepolia, mainnet, optimism, sepolia } from "wagmi/chains";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

/**
 * Wallet configuration. Browser wallets are discovered via EIP-6963, the Safe
 * connector activates when TokenIQ runs inside Safe{Wallet}, and WalletConnect is
 * offered only when a project id is configured (it is loaded lazily).
 */
export const wagmiConfig = createConfig({
  chains: [base, mainnet, arbitrum, optimism, baseSepolia, sepolia],
  multiInjectedProviderDiscovery: true,
  ssr: true,
  connectors: [
    injected({ shimDisconnect: true }),
    safe({ allowedDomains: [/app\.safe\.global$/], debug: false }),
    ...(WC_PROJECT_ID ? [walletConnect({ projectId: WC_PROJECT_ID, showQrModal: true, metadata: { name: "TokenIQ", description: "Treasury intelligence for on-chain organizations", url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000", icons: [] } })] : []),
  ],
  transports: {
    [base.id]: fallback([http("https://mainnet.base.org"), http("https://base-rpc.publicnode.com")]),
    [mainnet.id]: fallback([http("https://ethereum-rpc.publicnode.com"), http("https://eth.llamarpc.com")]),
    [arbitrum.id]: fallback([http("https://arb1.arbitrum.io/rpc"), http("https://arbitrum-one-rpc.publicnode.com")]),
    [optimism.id]: fallback([http("https://mainnet.optimism.io"), http("https://optimism-rpc.publicnode.com")]),
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
});

export const walletConnectEnabled = !!WC_PROJECT_ID;
