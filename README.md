<div align="center">
  <img src="https://cryptologos.cc/logos/polkadot-new-dot-logo.png" alt="Polkadot Logo" width="100" />
  <h2>Polkadot Solidity Hackathon Submission</h2>
</div>

# 🧠 TokenIQ

**TokenIQ** is a B2B decentralized finance (DeFi) platform that leverages **AI**, **Polkadot Hub (EVM)**, and **tokenized real-world assets (RWAs)** to empower businesses, DAOs, and funds with smart treasury management, cross-chain (XCM) liquidity, and yield optimization strategies across Polkadot parachains.

> Think: **Quant-as-a-Service** + **Decentralized BlackRock**  
> Powered by **AI-driven capital allocation** and **Polkadot XCM**, TokenIQ turns idle capital into intelligent yield across Moonbeam, Astar, and Acala.


## 🚀 Key Features

### ✅ AI Treasury Manager
- Smart, risk-adjusted allocation of idle capital.
- Uses market data, Chainlink Data Streams, and NLP sentiment analysis.
- Supports yield-bearing DeFi strategies across chains.

### ✅ Tokenization Layer
- Tokenize invoices, equity, commodities, or other RWAs.
- Chainlink CCIP support for cross-chain token movement.
- Enables collateralization, liquidity, or fractional ownership.

### ✅ Smart Yield Routing
- AI + Chainlink Automation routes capital to protocols based on:
  - Yield performance
  - Protocol health
  - Volatility and liquidity

### ✅ B2B Non-Custodial Dashboard
- Businesses connect wallets and deploy idle capital.
- Track performance, access liquidity, or tokenize assets.
- Non-custodial and fully transparent.

### ✅ Proof and Auditability
- Chainlink Proof of Reserve & Data Feeds for on-chain validation.
- Verifiable asset backing and real-time portfolio analytics.

---

## 🧩 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js, TailwindCSS, TypeScript, shadcn/ui, Framer Motion |
| **Backend / Smart Contracts** | Solidity, Hardhat, Chainlink CCIP, Automation, Data Feeds |
| **AI Integration** | ElizaOS, OpenAI/Anthropic (for market intelligence & NLP) |
| **Deployment Targets** | Moonbeam, Astar, Acala, Ethereum, Core |
| **Token Standards** | ERC-20, ERC-721, ERC-3643 (for RWA compliance) |

---

## 📜 Smart Contracts

### Contract Repository
- [TokenIQ Contracts](https://github.com/TokenIQ-X/tokeniq-contracts) - Source code for all smart contracts

## 🌊 Integration with Polkadot Ecosystem

We will be deploying our core TokenIQ contracts natively on **Polkadot EVM parachains** (Moonbeam, Astar), enabling next-generation DeFi automation, vaults, and tokenization on top of Polkadot's high-performance and interoperable network.

### ✅ Contracts (Deploying Soon)

- **ERC20VaultToken**
  - Implements **ERC-4626 vault standard**, forming the backbone of our DOT and cross-chain vaults.
  - Enables seamless deposits, withdrawals, and yield strategies natively on parachains.

- **Wrapped Assets (e.g. xcDOT)**
  - Wrapped representation of assets for cross-chain liquidity.
  - Used as collateral for vault deposits, tokenized assets, and lending.

- **ERC721CollateralNFT & ERC1155HybridAsset**
  - Collateralized NFTs for tokenized assets (e.g., real estate, invoices, carbon credits).
  - Enables fractionalized ownership and bundled collateralization natively on parachains.

- **AssetFactory**
  - Factory for deploying new ERC20, ERC721, and ERC1155 tokenized asset templates.
  - Acts as the **entrypoint** for asset creation, ensuring modularity and reusability.

---

### 🔗 How TokenIQ Uses Polkadot

1. **High-Speed Vault Operations**
   - By deploying ERC-4626-compliant vaults directly on high-performance parachains, we leverage fast block times to execute deposits, withdrawals, and automated AI-driven reallocations.

2. **Cross-Chain Liquidity with XCM & CCIP**
   - Assets can be bridged across chains using **Polkadot XCM** and **Chainlink CCIP** for global liquidity, with Polkadot acting as the secure settlement layer.

3. **Tokenization of Real-World Assets**
   - Provides frameworks for **verifiable, on-chain tokenization**.
   - Documents are uploaded → parsed into IPFS → verified.
   - Once verified, the assets are minted as NFTs or hybrid tokens.

4. **AI-Driven Automation**
   - Contracts are designed to be managed by our **AI Treasury Agent (ElizaOS)**, which monitors balances, spending behavior, and vault yields, then rebalances positions across parachains automatically.

---

### 🚀 Why Polkadot?

- **Shared Security** → DeFi vaults and AI-driven agents require enterprise-grade security.
- **XCM Interoperability** → Perfect for scaling multiple vault strategies and tokenization workflows across distinct, purpose-built parachains.
- **Native liquidity ecosystem** → Seamless integration with money markets, programmable payments, and DeFi lending hubs within the Polkadot ecosystem.

By deploying on Polkadot, TokenIQ unlocks a **highly interoperable, AI-driven treasury management layer** where vaults, tokenized assets, and cross-chain payments converge.  

## 📁 Contract Structure
```
contracts/
│
├── VaultManager.sol # Main user deposit, vault, and yield routing logic
├── VaultFactory.sol # Deploys StrategyVaults modularly
│
├── strategies/ # Yield-generating vault strategies
│ ├── AaveVault.sol
│ ├── CurveVault.sol
│ └── RWAInvoiceVault.sol
│
├── rwa/ # Tokenized Real World Asset contracts
│ ├── TokenizedInvoice.sol # ERC721 token for invoice representation
│ └── InvoiceRegistry.sol # Stores metadata, valuation, status
│
├── ai/ # AI agent configuration (ElizaOS or off-chain trigger)
│ └── TreasuryAIManager.sol
│
├── crosschain/ # Chainlink CCIP and message router
│ └── CrossChainRouter.sol
│
└── governance/ # Optional governance and reward token logic
└── TokenIQToken.sol
```
---


## Deployed contracts 

### AaveVault 
- Ethereum Sepolia 
    - [0xd7b55471Ff384d8a229E948e711CB4C4F952f277](https://sepolia.etherscan.io/address/0xd7b55471Ff384d8a229E948e711CB4C4F952f277#code)
- Avalanche Fuji
    - [0x16A54CdEcf7e051084B3CfEC169249e170121A8B](https://testnet.snowtrace.io/address/0x16A54CdEcf7e051084B3CfEC169249e170121A8B#code)
    
### CrossChainRouter
- Ethereum Sepolia
    - [0xD1d6EE0c5309A09Df9ca4c2936956A49cca9eb71](https://sepolia.etherscan.io/address/0xD1d6EE0c5309A09Df9ca4c2936956A49cca9eb71#code)
- Avalanche Fuji
    - [0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c](https://testnet.snowtrace.io/address/0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c#code)
- Base Sepolia
    - [0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6](https://sepolia.basescan.org/address/0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6#code)

### TreasuryAIManager
- Avalanche Fuji
    - [0x86C41594e9aDeCcf8c85ba9EEe0138C7c9E70dBc](https://testnet.snowtrace.io/address/0x86C41594e9aDeCcf8c85ba9EEe0138C7c9E70dBc#code)

### VaultFactory
- Avalanche Fuji
    - [0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54](https://testnet.snowtrace.io/address/0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54#code)

### VaultManager
- Avalanche Fuji
    - [0xF673F508104876c72C8724728f81d50E01649b40](https://testnet.snowtrace.io/address/0xF673F508104876c72C8724728f81d50E01649b40#code)

---

## 🔗 Use Cases

- Web3 DAOs and protocols managing idle treasury
- Crypto hedge funds and on-chain investment DAOs
- Tokenization of TradFi assets (e.g., invoices, carbon credits)
- RWA & stablecoin protocols seeking automated reserve deployment
- Enterprise treasury diversification with AI-driven DeFi exposure

---

# 🧠 Vision
TokenIQ aims to become the Stripe + BlackRock for tokenized assets, where any business can:

Turn invoices into real-time capital

Let AI manage on-chain yields

Access secure, composable, and non-custodial treasury infrastructure

---

## 📝 TODOs: 
- [ ] Add more features
- [ ] Add more docs
- [ ] Deploy contracts to Moonbeam/Astar
- [ ] Integrate XCM logic directly in contracts
- [ ] Communicate with the AI agent by Marv
- [ ] Emmanuel works on the integration pages
