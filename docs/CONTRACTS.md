# Contracts and on-chain integration

TokenIQ is non-custodial (ADR 0001). It ships one contract, and it integrates existing, widely used contracts for everything else.

## What TokenIQ calls (no TokenIQ contract involved)

| Purpose | Contracts | Versions / addresses | Source of truth |
|---|---|---|---|
| Treasury custody and execution | Safe Smart Account (owners sign, any wallet executes) | 1.3.0, 1.4.1, 1.5.0; MultiSendCallOnly and SimulateTxAccessor per version; code hashes checked against safe-deployments on all supported chains | `packages/chain/src/safe-deployments.ts`, `safe.ts` |
| Prices | Chainlink data feeds and L2 sequencer uptime feeds | per token, with heartbeat | `packages/chain/src/tokens.ts`, `chains.ts` |
| Yield venues | Morpho Vaults V1 (ERC-4626) and Aave v3 Pool (native USDC reserve) | listed venues only | `packages/chain/src/listing.ts`, `aave.ts` |
| Bounded automation (optional) | Zodiac Roles Modifier v2.1.1 | mastercopy `0xF2964CE6161ce0e75964Fe7927cE114cb0B283D5` (re-verify before use) | `docs/research/integration-facts.md` §C |

### Transactions TokenIQ prepares

All of these are built in `apps/api/src/services/build-tx.ts` from code-defined addresses only. The receiver is always the Safe.

- **Allocate into a Morpho vault:**
  - `approve(vault, 0)`, only when an allowance is already set (required for USDT-style tokens);
  - `approve(vault, exactAmount)`;
  - `vault.deposit(amount, safe)`;
  - batched through MultiSendCallOnly (DELEGATECALL), with no infinite approvals.
- **Allocate into Aave v3:** the same approve pattern for the Pool, then `Pool.supply(asset, amount, safe, 0)`.
- **Withdraw:** `vault.withdraw(assets, safe, safe)` or `Pool.withdraw(asset, amount, safe)`.
- **Pay an obligation:** `token.transfer(recipient, amount)`. The recipient comes from the obligation and must be a 0x address, never the Safe itself.

Each transaction is simulated with `Safe.simulateAndRevert` before anyone signs. The simulation skips guard and signature checks, and its gas covers the inner call only.

## TreasuryReserveGuard (the one TokenIQ contract)

A Safe **v1.5.0 module guard** that bounds automation acting through Safe modules (for example an agent key behind Zodiac Roles):
- reserve floors per token;
- outflow limits per window;
- a module allowlist;
- guardian pause, with Safe-only unpause;
- forbidden admin targets (the Safe, the guard, modules, the fallback handler, the transaction guard);
- strict MultiSend parsing and approval gating.

Owner-signed multisig transactions are never restricted, and owners can always remove the guard.

- Code, trust model and usage: [`packages/contracts/README.md`](../packages/contracts/README.md)
- Self-review (22 findings, status of each): [`packages/contracts/REVIEW.md`](../packages/contracts/REVIEW.md)
- Tests: 90 Foundry tests covering unit, fuzz and invariant cases, the deploy script, and a Base mainnet fork against a live Morpho vault. Coverage is 100% of lines and 98% of branches.
- Static analysis: forge-lint is clean; aderyn reports 0 high and 3 low; slither reports 8 informational. All are triaged in REVIEW.md.
- **Deployments: none.** See [`packages/contracts/deployments/README.md`](../packages/contracts/deployments/README.md). Deploying requires owner authorization, Safe v1.5.0, and an independent audit before it holds authority over real funds.

### Requirements and limits

- Safe **v1.5.0** only, because 1.4.1 runs no guard on module transactions. The deploy script refuses other versions, and TokenIQ reads `VERSION()` and the module-guard slot to show this in the UI.
- Requires Cancun (EIP-1153 transient storage). Base, Ethereum, Arbitrum and OP Mainnet support it.
- Floors and limits are per token, in token units. There is no oracle and no aggregate USD limit (by design).
- Module-based social recovery cannot operate while the guard is installed (TRG-10, open product decision).

## Legacy contracts

The 2025 contracts are not reused. See [`docs/research/legacy-contracts-summary.md`](research/legacy-contracts-summary.md) for what they were, and the testnet addresses kept for history.
