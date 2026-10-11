/**
 * What TokenIQ integrates with, stated honestly. Statuses:
 *  - available: works today in the product.
 *  - read_only: TokenIQ reads from it; it never writes or moves funds through it.
 *  - planned:   designed, not built. Not available.
 * Names are plain text: no partner logos are used.
 */
export type IntegrationStatus = "available" | "read_only" | "planned";

export interface Integration {
  name: string;
  kind: "Accounts" | "Networks" | "Prices" | "Venues" | "Wallets" | "Notifications" | "Copilot" | "Automation";
  does: string;
  status: IntegrationStatus;
  notes: string;
}

export const INTEGRATIONS: Integration[] = [
  {
    name: "Safe (smart accounts)",
    kind: "Accounts",
    does: "Reads balances of tracked Safes. For approved proposals, prepares the exact Safe transaction, collects owner signatures and verifies the execution event on-chain.",
    status: "available",
    notes: "Safe 1.3.0 or later. Owners sign in their own wallets; TokenIQ is never an owner and holds no keys.",
  },
  {
    name: "Externally owned accounts",
    kind: "Accounts",
    does: "Reads balances of tracked wallet addresses.",
    status: "read_only",
    notes: "Tracking needs only an address. Proposals execute through a Safe, not from an EOA.",
  },
  {
    name: "Ethereum",
    kind: "Networks",
    does: "Balances, prices, Morpho and Aave v3 positions, Safe execution.",
    status: "available",
    notes: "Production deployments configure their own RPC endpoints.",
  },
  {
    name: "Base",
    kind: "Networks",
    does: "Balances, prices, Morpho and Aave v3 positions, Safe execution.",
    status: "available",
    notes: "Chainlink prices are gated on the L2 sequencer uptime feed.",
  },
  {
    name: "Arbitrum One",
    kind: "Networks",
    does: "Balances, prices, Aave v3 positions, Safe execution.",
    status: "available",
    notes: "Chainlink prices are gated on the L2 sequencer uptime feed.",
  },
  {
    name: "OP Mainnet",
    kind: "Networks",
    does: "Balances, prices, Aave v3 positions, Safe execution.",
    status: "available",
    notes: "Chainlink prices are gated on the L2 sequencer uptime feed.",
  },
  {
    name: "Sepolia and Base Sepolia",
    kind: "Networks",
    does: "Test networks for trying the full workflow without real funds.",
    status: "available",
    notes: "For evaluation only; testnet tokens have no value.",
  },
  {
    name: "Chainlink price feeds",
    kind: "Prices",
    does: "Values stablecoins and other assets. Stale or missing prices are flagged and lower the confidence of every figure that depends on them.",
    status: "read_only",
    notes: "USD stablecoins are never valued above $1 for reserve purposes.",
  },
  {
    name: "Morpho vaults",
    kind: "Venues",
    does: "Reads vault data (net and gross rates, fees, curator, liquidity) and prepares ERC-4626 deposits and withdrawals for approved proposals.",
    status: "available",
    notes: "Vault data comes from Morpho’s public API, which has no service-level agreement; rates show their measurement and time.",
  },
  {
    name: "Aave v3",
    kind: "Venues",
    does: "Reads supply rates and liquidity on-chain and prepares supply and withdraw transactions for approved proposals.",
    status: "available",
    notes: "Approvals are for the exact amount, never unlimited.",
  },
  {
    name: "Browser wallets (EIP-6963) and WalletConnect",
    kind: "Wallets",
    does: "Lets Safe owners connect the wallet they already use to sign proposals, and lets members sign in with a wallet.",
    status: "available",
    notes: "Signing happens in the wallet. TokenIQ never sees a private key or seed phrase.",
  },
  {
    name: "Email",
    kind: "Notifications",
    does: "Sign-in codes, approval requests and alerts.",
    status: "available",
    notes: "Requires the deployment to configure an email provider; see the status page.",
  },
  {
    name: "Copilot model provider",
    kind: "Copilot",
    does: "Answers questions about your treasury with citations to your own records.",
    status: "available",
    notes: "Off unless the deployment configures it. It has no tools that sign, approve or move funds.",
  },
  {
    name: "Zodiac Roles (bounded automation)",
    kind: "Automation",
    does: "Would let a Safe allow narrowly scoped, pre-approved actions without a full signing round.",
    status: "planned",
    notes: "Not available. Every action today needs human approval and Safe signatures.",
  },
];

export const STATUS_LABEL: Record<IntegrationStatus, string> = {
  available: "Available",
  read_only: "Read-only",
  planned: "Planned",
};
