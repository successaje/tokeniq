# Product vision

- **Date:** 2026-10-11
- **Applies to:** TokenIQ 2.0 (branch `tokeniq-2`)
- **Related:** [`PRD.md`](PRD.md) (what this release does), [`COMPETITIVE_RESEARCH.md`](COMPETITIVE_RESEARCH.md) (evidence), [`docs/adr`](adr) (decisions already taken)

## Vision

Every crypto-native organization should know, at any moment, three things: what it owes, what it must keep safe to pay that, and what is genuinely free. Every move of its money should be checked against rules the team agreed, approved by the right people and signed on infrastructure the team already trusts.

TokenIQ is the workspace that does this. It reads the organization's own Safes, turns its obligations and policy into a protected reserve and a deployable-surplus figure, explains the arithmetic, and routes any resulting action through approval and Safe signatures. It never holds the money.

## The problem

Treasury teams at DAOs, foundations and web3 startups can see their balances, but no tool tells them how much of a balance is already spoken for. The answer lives in spreadsheets, policy documents and forum posts. ENS writes a 3-year runway floor into an investment policy; Lido caps yield-bearing assets at 15% of its treasury; Aave runs a finance committee and monthly funding posts ([evidence](research/customer-workflows.md#3-protocol-finance--ops)). Signing tools such as Safe secure the signature but do not know what is owed. Managed-treasury services apply a policy by hand and charge basis points. Yield products show a rate but not whether the organization can afford to lock the money up.

The result is idle cash, or cash deployed without regard to next month's payroll, decided in chat threads and signed by people who cannot easily check what they sign.

## Who it is for

| Segment | Description | Why TokenIQ fits |
|---|---|---|
| DAO and foundation treasury teams | Treasuries in Safe multisigs, with stewards, committees and a governance-approved policy | Applies the agreed policy to every move; separates internal approval from owner signatures; keeps an append-only record for token holders |
| Web3 startups | Operating capital held mostly in stablecoins, with payroll and vendors to pay | Shows protected runway before anyone suggests yield; tiered approvals; board-ready snapshots |
| Protocol finance and operations teams | Finance functions running obligations, reserve rules and concentration limits | Policy versions with reasons, deterministic checks, stress scenarios, exports for accountants |

Common traits: funds already sit in Safe accounts on Ethereum, Base, Arbitrum One or OP Mainnet; a meaningful share is in stablecoins; more than one person must agree before money moves. *Hypothesis, not validated:* the best fit is treasuries of roughly $1M–$50M, large enough to need policy and approvals, too small to justify a 50 bps manager.

## Who it is not for

- **Individuals seeking the highest yield.** TokenIQ is reserve-first and will often recommend doing nothing.
- **Teams that want a bank account.** Fiat rails, cards and custodial accounts are better served by Ramp, Coinbase Business, Request Finance or Squads Altitude.
- **Teams that want an agent to manage funds on its own.** TokenIQ does not move money without people.
- **Organizations that need an accounting subledger, tax or payroll compliance.** TokenIQ exports to those tools; it does not replace them.
- **Treasuries outside Safe or outside the supported EVM networks**, including Solana. Plain wallets can be watched but not executed through.

## Positioning statement

For finance leads, treasury stewards and signers at crypto-native organizations that hold stablecoins in Safe multisigs, TokenIQ is the treasury operations workspace that turns obligations and policy into a protected reserve and a deployable-surplus figure, and routes every resulting action through approval and Safe signatures. Unlike Safe{Wallet}, which secures signing but does not know what the organization owes, or managed-treasury services that apply a policy by hand for a percentage of assets, TokenIQ computes the reserve deterministically, shows its working, and never takes custody.

## Product principles

Each principle says what it means, how the product does it today, and what it rules out.

### 1. Deterministic maths before AI

Every figure, recommendation and policy check comes from `@tokeniq/core`, a pure engine with no I/O. Identical inputs produce identical outputs, fingerprinted so the same recommendation is not raised twice ([ADR 0002](adr/0002-deterministic-engine-ai-explains.md)). The product works fully with the AI switched off.

*Rules out:* model-generated numbers, model-ranked venues, and any figure that cannot be recomputed from stored observations.

### 2. AI explains and proposes; humans approve

The copilot reads the organization's data through read-only tools, runs hypothetical scenarios, and must cite the records it uses. It cannot create, approve, sign or execute anything. Text written by members or external sources is passed to it as untrusted data.

*Rules out:* converting model output into an action. Prompt injection can at worst make an explanation wrong.

### 3. Never fabricate figures

No success state without proof: a payment is verified only when an on-chain transfer matches it, and an execution counts only after the receipt, the Safe's own success event and enough confirmations. No hardcoded financial figures outside the clearly labelled sample workspace. Every rate shows what it measures and when it was fetched. Missing or stale data lowers confidence and is shown, not hidden.

*Rules out:* placeholder balances, invented transaction hashes, "deposit successful" without a receipt. These were the failures of TokenIQ v1 ([legacy audit](research/legacy-audit.md)).

### 4. Protect obligations first

The reserve requirement is the strictest of a fixed floor, months of runway, and unpaid obligations in the horizon plus a buffer ([ADR 0004](adr/0004-reserve-model.md)). Only liquid stablecoins in verified accounts count toward it, never valued above $1. Positions in protocols and expected inflows never reduce it. Only what is left after the reserve, and under the maximum-deployed cap, is called deployable.

*Rules out:* netting expected income against obligations, counting a vault position as cash, sizing by APY.

### 5. Prefer existing infrastructure

Funds stay in the organization's Safe. Owners sign in their own wallets. Venues are established protocols (Morpho, Aave). Prices come from Chainlink. On-chain limits, when they arrive, will use Zodiac Roles and a minimal Safe guard rather than a new custody contract ([ADR 0001](adr/0001-non-custodial-safe-first.md), [ADR 0006](adr/0006-bounded-automation.md)).

*Rules out:* TokenIQ-run vaults, proprietary wallets, and features that only work while TokenIQ's interface is up.

### 6. A documented exit; no lock-in

Because TokenIQ holds nothing, leaving it costs nothing on-chain: the Safe, its owners and any venue positions remain the customer's, reachable from any Safe or venue interface. Data leaves as CSV. The product must also publish a short "leaving TokenIQ" guide covering exports, withdrawing positions without TokenIQ, and removing any module TokenIQ helped install. That guide does not exist yet (see the PRD).

*Rules out:* positions that can only be unwound through TokenIQ, and data that cannot be exported.

### 7. Non-custodial, always

TokenIQ never holds keys, never has signing authority over owner transactions, and never asks for a seed phrase.

*Rules out:* custody, pooled funds, and "sign once, we handle the rest" consent.

### 8. Widening scope always needs a person

Adding a venue requires a code review and deploy ([ADR 0008](adr/0008-venue-listing-in-code.md)). Changing policy creates a new version with an author and a reason. Bounded automation cannot be switched on from settings ([ADR 0006](adr/0006-bounded-automation.md)).

*Rules out:* a registry that grows without the user re-consenting, the pattern seen in at least one agentic yield product ([competitor matrix](research/competitor-matrix.md)).

## What TokenIQ will never do

1. Take custody of funds, hold keys, or run a pooled vault.
2. Move funds without the organization's approval policy and the Safe's owner signatures.
3. Let the AI create, approve, sign or execute anything.
4. Show a fabricated figure, a fake customer, a testimonial, a partnership, an audit or a performance number it cannot prove.
5. Count protocol positions or expected inflows toward the protected reserve, or value a stablecoin above $1 for it.
6. Build a transaction to an address taken from an external data feed; venue addresses come only from the reviewed listing in code.
7. Queue a fund-moving action for later submission while offline.
8. Widen what automation may do without a fresh, recorded human decision.
9. Earn from the size of deployments, through a fee on yield or on assets, because that rewards deploying more against a reserve-first product. This matches the current pricing page; final pricing is not set.

## Long-term direction

**Now (2.0): read, reason, propose, coordinate.** Read-only onboarding, obligations, reserve and surplus maths, a vetted venue list, deterministic recommendations, approvals, owner signatures collected in-app, execution tracking, alerts, a read-only copilot, reports and a labelled sample workspace.

**Next: close the loops people already run by hand.**
- Pay obligations from the Safe through the same proposal flow.
- Reach signers by email or chat when a signature blocks a due date.
- Leading venue risk indicators: pending curator changes inside their timelock, oracle design, collateral look-through, incentive share.
- Morpho Vault V2 support with withdrawable liquidity computed from idle assets, the liquidity adapter and in-kind exit paths.
- Accounting exports in the formats Cryptio, Bitwave, Xero and QuickBooks accept.
- The "leaving TokenIQ" guide.

**Later: make the policy enforceable on-chain.** Compile the treasury policy into Zodiac Roles permissions, and offer `TreasuryReserveGuard` once it has passed an independent audit, so that narrow, pre-approved actions (such as topping up an operating Safe to its buffer) can run within on-chain floors and limits. Consider tokenized treasury funds as venues, a manager view across several organizations, and reports that anyone can verify against Safe addresses.

**Not on the roadmap:** custody, fiat rails, autonomous agents, bridging, non-EVM chains.

## How we will know it is working

Success metrics and release criteria are in [`PRD.md`](PRD.md#8-success-metrics). The short version: organizations trust the reserve figure enough to make decisions on it, every fund-moving action in TokenIQ has its approvals, signatures and on-chain proof, and nobody has to rebuild the arithmetic in a spreadsheet.
