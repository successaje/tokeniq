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

## 📜 Smart Contracts

### Contract Repository
- [TokenIQ Contracts](https://github.com/TokenIQ-X/tokeniq-contracts) - Source code for all smart contracts

## 🌊 Integration with Sei Network  

We have successfully deployed our core TokenIQ contracts on the **Sei Testnet**, enabling next-generation DeFi automation, vaults, and tokenization on top of Sei’s sub-second finality and parallelized execution.  

### ✅ Deployed Contracts on Sei  

- **ERC20VaultToken** — [0xCaFF129Ec344A98Da8C9a4091a239DF158Cf31A5](https://testnet.seistream.app/contracts/0xCaFF129Ec344A98Da8C9a4091a239DF158Cf31A5)  
  - Implements **ERC-4626 vault standard**, forming the backbone of our BTCFi vaults.  
  - Enables seamless deposits, withdrawals, and yield strategies natively on Sei.  

- **WBTC (sWBTC)** — [0xc9C0Fb76a50eAb570665977703cC8f7185c082b5](https://testnet.seistream.app/contracts/0xc9C0Fb76a50eAb570665977703cC8f7185c082b5)  
  - Wrapped BTC representation on Sei.  
  - Used as collateral for vault deposits, tokenized assets, and lending.  

- **ERC721CollateralNFT** — [0x8e827a12C78dED9459268eb05cce2C5d709FE6AF](https://testnet.seistream.app/contracts/0x8e827a12C78dED9459268eb05cce2C5d709FE6AF)  
  - Implementation: [0x1a983C4e0B9f57B5b34b6C753Ab13828ad21969F](https://testnet.seistream.app/contracts/0x1a983C4e0B9f57B5b34b6C753Ab13828ad21969F#code)  
  - Collateralized NFTs for tokenized assets (e.g., real estate, invoices, carbon credits).  
  - Assets can be verified (via Chainlink Proof-of-Reserve) and then minted as ERC-721 tokens.  

- **ERC1155HybridAsset** — [0xd6D6fBc6c0ebbB07411acB0EDad6373db389aC13](https://testnet.seistream.app/contracts/0xd6D6fBc6c0ebbB07411acB0EDad6373db389aC13)  
  - Implementation: [0x9EFb119c507CEa769b4277D6eC42274096579ce9](https://testnet.seistream.app/contracts/0x9EFb119c507CEa769b4277D6eC42274096579ce9#code)  
  - Hybrid **ERC-1155 template** for multi-class tokenized assets.  
  - Enables fractionalized ownership and bundled collateralization.  

- **AssetFactory** — [0x7b65E735F1b43102f672Dc04B6E33a424a955c13](https://testnet.seistream.app/contracts/0x7b65E735F1b43102f672Dc04B6E33a424a955c13)  
  - Implementation: [0xa2B39823120Ea8e7a1f2E3E6864596644eE96689](https://testnet.seistream.app/contracts/0xa2B39823120Ea8e7a1f2E3E6864596644eE96689#code)  
  - Factory for deploying new ERC20, ERC721, and ERC1155 tokenized asset templates.  
  - Acts as the **entrypoint** for asset creation, ensuring modularity and reusability.  

---

### 🔗 How TokenIQ Uses Sei  

1. **High-Speed Vault Operations**  
   - By deploying ERC-4626-compliant vaults (ERC20VaultToken) directly on Sei, we leverage **sub-400ms block times** to execute fast deposits, withdrawals, and automated AI-driven reallocations.  

2. **Cross-Chain Liquidity with CCIP**  
   - Assets like sWBTC can be bridged across chains using **Chainlink CCIP** for global liquidity, with Sei acting as the settlement layer.  

3. **Tokenization of Real-World Assets**  
   - ERC721CollateralNFT and ERC1155HybridAsset provide frameworks for **verifiable, on-chain tokenization**.  
   - Documents are uploaded → parsed into IPFS → verified (exploring Chainlink Proof-of-Reserve).  
   - Once verified, the assets are minted on Sei as NFTs or hybrid tokens.  

4. **Composable Asset Factory**  
   - AssetFactory allows other protocols to easily spin up new vaults and tokenized assets on Sei.  
   - Supports seamless integration with **Yei Finance money markets** and programmable payment agents.  

5. **AI-Driven Automation**  
   - Contracts are designed to be managed by our **AI Treasury Agent (ElizaOS)**, which monitors balances, spending behavior, and vault yields, then rebalances positions on Sei automatically.  
   - Emergency withdrawals ensure **user funds remain under user control**.  

---

### 🚀 Why Sei?  

- **Ultra-fast finality** → DeFi vaults and AI-driven agents require low-latency execution.  
- **Parallelized execution** → Perfect for scaling multiple vault strategies and tokenization workflows.  
- **Native liquidity ecosystem** → Integration with Yei Finance for programmable payments and DeFi lending markets.  

By deploying on Sei, TokenIQ unlocks a **high-performance, AI-driven treasury management layer** where vaults, tokenized assets, and payments converge.  

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


