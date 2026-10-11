# Contract review

> Internal security review by an AI-assisted engineering process. **Not an independent third-party audit.** No TokenIQ contract is deployed.

## Scope

| Item | Reviewed | Where |
|---|---|---|
| `TreasuryReserveGuard` (new, Safe v1.5.0 module guard) | Full self-review: 22 findings, threat scenarios, static analysis, mutation spot-checks | [`packages/contracts/REVIEW.md`](../packages/contracts/REVIEW.md) |
| Legacy 2025 contracts (`TokenIQ-X/tokeniq-contracts`) | Inventory, proof-of-concept tests, on-chain checks; not reused | public summary: [`docs/research/legacy-contracts-summary.md`](../docs/research/legacy-contracts-summary.md); full findings in the private repository |
| Integration with third-party contracts (Safe, Morpho, Aave, Chainlink) | Addresses, versions and code hashes verified on-chain; calldata builders unit-tested; live mainnet read tests | [`docs/research/integration-facts.md`](../docs/research/integration-facts.md), `packages/chain/test` |

## TreasuryReserveGuard summary

| ID | Severity | Title | Status |
|---|---|---|---|
| TRG-01 | High | Allowance granted in a module tx is spent later, outside any module tx | Fixed (approval gating) |
| TRG-02 | High | Module tx calls the Safe or the guard (self-escalation, guard removal) | Fixed (forbidden targets) |
| TRG-03 | High | Guard hooks callable by anyone | Fixed (`onlySafe`) |
| TRG-04 | High | Module tx calls the Safe's fallback handler and spoofs `onlySelf` (EIP-1271 verifier install) | Fixed (forbidden target, proven by test) |
| TRG-05 | Medium | MultiSend inner calls skip target and approval rules | Fixed (strict batch parsing) |
| TRG-06 | Medium | Module tx calls the Roles admin (owned by the Safe) | Fixed (allowlisted modules are forbidden targets) |
| TRG-07 | Medium | Allowlisted opaque delegatecall target can change Safe state | Mitigated by post-checks; accepted |
| TRG-08 | Medium | Compromised automation key drains within limits | Accepted by design: floors, limits and pause bound it |
| TRG-09 | Medium | Safe 1.4.1 has no module guard (silent no-op) | Mitigated (deploy script refuses; UI reads the version) |
| TRG-10 | Medium | Module-based recovery blocked while installed | Open: product decision |
| TRG-11 – TRG-22 | Low/Info | See REVIEW.md | Accepted, documented or covered |

## Integration findings

| ID | Severity | Component | Finding | Status |
|---|---|---|---|---|
| INT-01 | Medium | Venue addresses | Execution must not trust addresses from external data (Morpho API) | Fixed: build-tx resolves addresses only from the code-defined listing (ADR 0008); the call-target allowlist is enforced per call |
| INT-02 | Medium | Morpho Vault V2 | `maxWithdraw` returns 0, so withdrawable liquidity can't be read on-chain | Mitigated: V2 vaults are not listed; withdrawable is "unknown" where it can't be read |
| INT-03 | Low | Approvals | USDT-style tokens revert on non-zero → non-zero `approve` | Fixed: reset to 0 first; approvals are exact, never infinite |
| INT-04 | Low | Simulation | `simulateAndRevert` skips guard and signature checks; gas covers the inner call only | Documented; re-simulated immediately before submission |
| INT-05 | Info | Contract signatures | EIP-1271 owner signatures (v=0) and pre-approved hashes (v=1) are not supported | Documented limitation (`recoverSafeSigner` returns a typed "unsupported") |

## Before any production deployment of the guard

1. An independent audit by a qualified firm.
2. A product decision on TRG-10 (recovery modules).
3. A Roles permission template reviewed together with the guard (TRG-11).
4. A testnet deployment (Base Sepolia) exercised end to end, with the manifest recorded.
5. Explicit owner authorization.
