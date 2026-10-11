# TokenIQ Legacy Contracts — Summary & Why 2.0 Starts Fresh

This is a public-safe summary of an internal engineering review of the original `tokeniq-contracts` repository, written ahead of the ground-up **TokenIQ 2.0** rebuild. It describes what the legacy contracts were, what actually worked versus what was demonstrative, and why 2.0 does not reuse the original custodial-vault design. It intentionally omits exploit detail and proof-of-concept code.

## What the legacy repository was

A Hardhat / Solidity 0.8.27 prototype built across several hackathon-style iterations (17 commits). It explored four areas:

1. **Arbitrum "autonomous treasury" (latest iteration):** a `TreasuryVault` holding deposited funds, a `StrategyManager` registry of yield strategies, an `AgentExecutor` meant to let an off-chain AI agent move funds from the vault into a strategy, and a `TreasuryRegistry` for metadata.
2. **AI/automation layer:** a `TreasuryAIManager` intended to record strategy decisions and read market data via Chainlink.
3. **Yield vaults & strategies:** an Aave-integration vault, an ERC-4626-style WBTC liquid-staking vault (`LSTBTCVault`), and a `VaultManager`/`VaultFactory`.
4. **Tokenization, RWA invoices, and cross-chain:** ERC-20/721/1155 asset templates, a tokenized-invoice financing flow, and Chainlink CCIP routers (three generations).

The code was deployed to **testnets only** (see address table) and never carried real user funds.

## Functional vs demonstrative

The review verified behavior by compiling the real contracts, writing targeted tests, and reading the live testnet deployments — not by trusting the README or docs.

- **Compiles and deploys:** Yes. The contracts compile under solc 0.8.27 and bytecode is present at the documented testnet addresses.
- **Flagship "agent moves funds" flow:** **Not functional.** An interface/return-type mismatch between `AgentExecutor` and `StrategyManager` means the allocation call cannot succeed. On-chain, the executor was also never fully wired (its agent address is unset) and the vault holds no funds.
- **Custody model:** Demonstrative and centralized — a single owner key controls everything, depositors receive no shares or on-chain claim, and there are no reserve floors, withdrawal limits, or timelocks. Appropriate for a demo, not for holding real treasury funds.
- **Yield vaults, AI manager, tokenization, RWA, cross-chain:** Largely **demonstrative/prototype** quality — several have correctness bugs (e.g. a factory that produces unusable vaults, a liquid-staking vault pinned to a 1:1 rate that ignores yield, a decision log that corrupts after a fixed number of entries) or incomplete flows. One cross-chain router generation (V3) implements the correct security pattern (source-chain and sender allowlists) and is worth keeping as a reference.
- **Tests:** The project compiles cleanly (137 Solidity files). Its Hardhat test suite runs at 80 passing / 1 failing, and covers only the older vault/tokenization/cross-chain code — there are **no tests for the four "latest architecture" Arbitrum contracts** the project advertises as the product, and several TypeScript test files are stale and no longer run.
- **Secrets:** No private keys or live API keys were found in the repository or its git history; configuration uses environment variables with placeholder examples.

## Classification at a glance

Legend: A functional · B demonstrative/mocked · C incomplete · D outdated · E insecure/fragile · F reusable · G needs refactor · H remove · I replace with modern infra · J preserve for history.

| Component | Class | One-line status |
|---|---|---|
| TreasuryVault (Arbitrum) | E · I | Centralized custodial design; replace with Safe-based custody |
| AgentExecutor | C · H | Core allocation flow non-functional; replace |
| StrategyManager | B · G | Minimal registry; rebuild as vetted-protocol allowlist |
| TreasuryRegistry | A · F | Simple metadata registry; works, low value |
| TreasuryAIManager | B · G | Decision-log and oracle handling flawed; rebuild |
| VaultManager / VaultFactory | C · I | Hand-rolled accounting / unusable clones; replace |
| AaveVault / AaveStrategy | B · G | Demo-grade Aave integration; replace with thin adapter |
| LSTBTCVault | B · G | Non-standard 1:1 vault; replace with standard ERC-4626 |
| TokenIQVault | A(thin) · F/G | Closest to reusable; still needs hardening |
| CrossChainRouter V1 / V2 / Router | E/C · H | Incomplete/weak; remove |
| CrossChainRouter V3 | A · F/J | Correct allowlist pattern; keep as reference |
| Tokenization templates (ERC20/721/1155, AssetFactory) | B · G | Prototype; secondary to 2.0, archive |
| RWA invoice layer | C · H | Incomplete flow; out of 2.0 scope |
| Stubs (CurveVault, TokenIQToken, SeiToken, XCMSimulator) | C · H/J | Placeholders; remove / keep in history |
| Interface copies, deploy scripts, docs | D · G/J | Duplicated/contradictory; rebuild, keep address record |

## Deployed testnet addresses (preserved for continuity)

All deployments are **testnet-only**. This was verified directly on-chain: every address below holds bytecode on the stated testnet, while a scan of the deployer's activity across major mainnets (Ethereum, Arbitrum One, Base, Polygon, Optimism, BNB, Avalanche, Sei, Core) found **no TokenIQ contracts deployed on any mainnet**. Addresses are retained here as a historical record.

### Arbitrum Sepolia (chain 421614) — latest architecture
| Contract | Address |
|---|---|
| Deposit token (mock) | `0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c` |
| StrategyManager | `0x86C41594e9aDeCcf8c85ba9EEe0138C7c9E70dBc` |
| TreasuryVault | `0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54` |
| AgentExecutor | `0xF673F508104876c72C8724728f81d50E01649b40` |
| TreasuryRegistry | `0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6` |

### Avalanche Fuji (chain 43113)
| Contract | Address |
|---|---|
| AaveVault | `0x16A54CdEcf7e051084B3CfEC169249e170121A8B` |
| CrossChainRouter | `0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c` |
| TreasuryAIManager | `0x86C41594e9aDeCcf8c85ba9EEe0138C7c9E70dBc` |
| VaultFactory | `0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54` |
| VaultManager | `0xF673F508104876c72C8724728f81d50E01649b40` |

### Ethereum Sepolia (chain 11155111)
| Contract | Address |
|---|---|
| AaveVault | `0xB791Be1D932397e3eFa757C8d4B9F6BAC86F1Ca1` |
| CrossChainRouter | `0xD1d6EE0c5309A09Df9ca4c2936956A49cca9eb71` |

### Base Sepolia (chain 84532)
| Contract | Address |
|---|---|
| CrossChainRouter | `0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6` |

### Core Testnet2 (chain 1114) — tokenization
| Contract | Address |
|---|---|
| AssetFactory (proxy) | `0x02406b6d17E743deA7fBbfAE8A15c82e4481E168` |
| AssetFactory (implementation) | `0x89C3FBe736EDa478967Ac19Ca8634D3562881f6F` |
| ERC20VaultToken template | `0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54` |
| ERC721CollateralNFT (proxy) | `0xc4d732199B7d21207a74CFE6CEd4d17dD330C7Ea` |
| ERC1155HybridAsset (proxy) | `0xc9C0Fb76a50eAb570665977703cC8f7185c082b5` |

### Sei Testnet (chain 1328) — tokenization
| Contract | Address |
|---|---|
| ERC20VaultToken template | `0xCaFF129Ec344A98Da8C9a4091a239DF158Cf31A5` |
| ERC721CollateralNFT (proxy) | `0x8e827a12C78dED9459268eb05cce2C5d709FE6AF` |
| ERC1155HybridAsset (proxy) | `0xd6D6fBc6c0ebbB07411acB0EDad6373db389aC13` |
| AssetFactory (implementation) | `0xa2B39823120Ea8e7a1f2E3E6864596644eE96689` |

> Note: some addresses appear on more than one network because a single deployer account was reused across chains. A handful of addresses in the old documentation point to nothing on-chain (documentation placeholders/typos) and are omitted here.

## Why TokenIQ 2.0 does not reuse the custodial-vault design

The legacy design asked users to move funds into a project-owned vault controlled by a single key, with an off-chain agent authorized to move those funds out. Even setting aside the specific bugs, that shape concentrates custody and trust in one place and gives depositors no direct on-chain claim on their assets.

TokenIQ 2.0 takes the opposite approach:

- **Custody stays with the customer's own Safe multisig** rather than a project-owned vault. TokenIQ never takes custody.
- **Actions run through a constrained, allowlisted module** that can only call **vetted, audited protocols** (such as Morpho and Aave) within explicit limits (caps, reserve floors, pause, and time delays) — instead of a general-purpose "move any amount anywhere" withdrawal.
- **Accounting and integrations use battle-tested standards and up-to-date libraries** rather than hand-rolled vault math.

This directly addresses the main lessons from the legacy review: no single-key honeypot, no bespoke custody, correctness and safety checks on every integration, and tests for the flows that matter. The legacy contracts remain valuable as a prototype and as the historical testnet record above, but they are a starting point to learn from, not a codebase to extend.
