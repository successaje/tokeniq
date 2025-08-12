# 🧠 TokenIQ

**TokenIQ** is a B2B decentralized finance (DeFi) platform that leverages **AI**, **Chainlink infrastructure**, and **tokenized real-world assets (RWAs)** to empower businesses, DAOs, and funds with smart treasury management, cross-chain liquidity, and yield optimization strategies.

> Think: **Quant-as-a-Service** + **Decentralized BlackRock**  
> Powered by **AI-driven capital allocation** and **Chainlink CCIP**, TokenIQ turns idle capital into intelligent yield.


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
| **Deployment Targets** | Ethereum, Avalanche, Base, Optimism, Polygon (modular EVM support) |
| **Token Standards** | ERC-20, ERC-721, ERC-3643 (for RWA compliance) |

---

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

=======

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
| **Deployment Targets** | Ethereum, Optimism, Polygon (modular EVM support) |
| **Token Standards** | ERC-20, ERC-721, ERC-3643 (for RWA compliance) |

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


TODOs: 
- [ ] Add more features
- [ ] Add more docs
- [ ] Call the functions in the contracts
- [ ] Communicate with the AI agent by Marv
- [ ] Emmanuel works on the integration pages
- [ ] 


