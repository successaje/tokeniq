# @tokeniq/contracts

**TreasuryReserveGuard** is a [Safe v1.5.0](https://github.com/safe-fndn/safe-smart-account/tree/v1.5.0)
**module guard**. It limits what automation can do to a treasury Safe. Automation here means an agent key that
acts through a Zodiac Roles Modifier enabled as a Safe module.

TokenIQ 2.0 builds on vetted infrastructure (Safe, Zodiac Roles, Morpho, Aave) and does not run custodial vaults.
The humans keep full authority through their Safe. This package adds a small, auditable contract that guarantees
three things:

1. automation can never take the treasury below its protected reserve;
2. automation can be paused instantly;
3. automation cannot expand its own authority.

None of the legacy TokenIQ contracts are reused. The old single-key custodial vault, whose AI executor could withdraw
everything, is gone.

> This is an internal, self-reviewed contract (see [REVIEW.md](./REVIEW.md)). It has **not** had an independent audit
> and has **not** been deployed anywhere (see [deployments/README.md](./deployments/README.md)).

## How it fits together

```
 agent key ──► Zodiac Roles Modifier v2 ──► Safe.execTransactionFromModule ──► target (USDC, Morpho vault, …)
                (WHAT may be called:          │            ▲
                 targets, selectors,          ▼            │
                 parameters)            TreasuryReserveGuard (HOW MUCH must remain, HOW FAST
                                        checkModuleTransaction / checkAfterModuleExecution
                                        value may leave, pause, no self-escalation)

 owners (2-of-3 …) ──► Safe.execTransaction ──► anything   (never sees the guard: unrestricted by design)
```

- **Zodiac Roles scopes WHAT** the automation key may call: which targets, which function selectors, and which
  parameter values. For example, it can allow "deposit into this Morpho vault with receiver = the Safe".
- **TreasuryReserveGuard enforces HOW MUCH** must remain and **HOW FAST** value may leave, and it provides the
  **pause**. It does not care which function was called. It measures the Safe's balances before and after every
  module transaction.
- Behind Roles, the guard sees the **Roles modifier proxy** as `module`. Allowlist that proxy address, not the
  mastercopy. (Per the integration research notes, Roles mastercopy **2.1.1**
  `0xF2964CE6161ce0e75964Fe7927cE114cb0B283D5` is current and 2.1.0 is flagged faulty. Verify this before use.)

## What the guard enforces (for every module transaction)

| Check                 | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caller                | The hooks only accept calls from the immutable `safe`.                                                                                                                                                                                                                                                                                                                                                                                                        |
| Pause                 | `pause()` can be called by the Safe or by any guardian (one key). `unpause()` can only be called by the Safe. While paused, every module transaction reverts with `GuardIsPaused`.                                                                                                                                                                                                                                                                            |
| Module allowlist      | `setModuleAllowed(module, bool)`. Modules not on the list revert with `ModuleNotAllowed(module)`.                                                                                                                                                                                                                                                                                                                                                             |
| Forbidden targets     | A module CALL may not target any of these (`ForbiddenTarget`): the Safe itself (`setModuleGuard(0)`, `enableModule`, `addOwner…`); this guard; any allowlisted module (for example Roles, whose owner is the Safe, so no self-escalation); the Safe's fallback handler; or its transaction guard. The fallback-handler rule matters because ExtensibleFallbackHandler trusts the last 20 calldata bytes, so a direct call could install an EIP-1271 verifier. |
| DELEGATECALL          | Rejected unless `setDelegateCallAllowed(target, true)` was set (`DelegateCallNotAllowed`). For a `multiSend(bytes)` payload (Safe MultiSend/MultiSendCallOnly), the batch is parsed strictly and **every inner call** is held to the target and approval rules. Inner DELEGATECALLs and malformed batches are rejected.                                                                                                                                       |
| Nesting               | A module transaction started while another is in flight reverts with `NestedModuleExecution`. The flag lives in EIP-1153 transient storage and is cleared by the post-hook.                                                                                                                                                                                                                                                                                   |
| Config lock           | Every Safe-only setter reverts with `ConfigLockedDuringModuleExecution` while a module transaction is in flight.                                                                                                                                                                                                                                                                                                                                              |
| Guard still installed | After execution, the Safe's module-guard slot must still point to this guard (`ModuleGuardChanged`).                                                                                                                                                                                                                                                                                                                                                          |
| Approval leak         | For configured ERC-20s, `approve`, `increaseAllowance` and `increaseApproval` with a non-zero amount, and ERC-777 `authorizeOperator`, require `setSpenderAllowed(token, spender, true)`. Revoking (amount 0) is always allowed.                                                                                                                                                                                                                              |
| **Reserve floor**     | After execution, `balance(token) >= floor` for **every** configured token (`address(0)` = ETH). Otherwise the transaction reverts with `ReserveFloorBreached(token, balance, floor)`.                                                                                                                                                                                                                                                                         |
| **Outflow limit**     | `outflow = pre − post` per token, added up per fixed window. Exceeding the limit reverts with `OutflowLimitExceeded(token, spentInWindow, limit)`. Inflows never add allowance.                                                                                                                                                                                                                                                                               |
| Evidence              | `ModuleTransactionChecked(module, to, selector, operation, success, moduleTxHash)` and `OutflowRecorded(...)` on every passing module transaction. Every configuration change emits an event as well.                                                                                                                                                                                                                                                         |

Configuration (`setFloor`, `setOutflowLimit`, `setModuleAllowed`, `setGuardian`, `setDelegateCallAllowed`,
`setSpenderAllowed`, `unpause`) is accepted **only from the Safe**, which means only from a multisig transaction.
At most 16 tokens can be configured, which bounds gas. Measured inside tests with warm state: the guard adds about
24k gas to a module transfer with one configured token, and a module transfer with 16 configured tokens costs about
156k gas in total. Cold storage in a real transaction costs more. The runtime bytecode is 9,289 bytes.

**Window semantics:** a window opens at the first outflow after the previous window expired. Over any interval of
length `windowSeconds`, at most **2× the limit** can leave (the end of one window plus the start of the next). Lowering
a limit keeps the amount already spent. `setOutflowLimit(token, 0, w > 0)` freezes module outflow of that token.
`setOutflowLimit(token, 0, 0)` disables the limit.

## Trust model

**Protects:** automation (any allowlisted module) cannot leave a configured token below its floor. It cannot move more
than the window limit. It cannot run while paused, and it cannot uninstall or reconfigure the guard. It cannot call the
Safe's admin functions, its fallback handler, its transaction guard or any allowlisted module (including inside
MultiSend batches). It cannot DELEGATECALL into unapproved code, and it cannot leak allowances on configured tokens to
unapproved spenders.

**Does NOT protect:**

- **Owner-signed multisig transactions.** They are unrestricted by design and can go below floors. Owners can always
  remove the guard with `setModuleGuard(address(0))`. The guard is not a transaction guard and cannot be installed as
  one (`GS300`).
- **Unconfigured tokens.** They are invisible to the guard.
- **Value held in positions.** The floor measures the Safe's **liquid** balance (USDC, not vault shares). Configure
  the share token separately if it matters. No oracle or price is used.
- **A malicious or compromised allowlisted module still moves funds within the limits**, to any destination its own
  scope allows. Roles must restrict destinations, for example `receiver == Safe`.
- **Opaque DELEGATECALL payloads.** MultiSend batches are parsed. Any other payload sent to an allowlisted delegatecall
  target runs as the Safe. The post-checks still apply (balances, guard installed, config lock), but such code could
  change other Safe state (owners, modules) or grant approvals. Only allow audited targets such as Safe's
  `MultiSendCallOnly`, and keep Roles scoping every call.
- **Authorization grants on other contracts.** For example Morpho `setAuthorization`, Aave credit delegation, Permit2
  sub-allowances, or operators on vault shares and NFTs. The guard does not recognize these, and they can expose
  positions. Roles must never permit them.
- **Approval routes other than the four gated selectors.** Never allowlist allowance-forwarding contracts such as
  Permit2 or routers as spenders.
- **Liveness.** The floor is strict: if owners take a configured token below its floor, **all** module transactions
  revert until the balance is restored or the floor is lowered. A token whose `balanceOf` breaks, or a guardian that
  keeps pausing, also blocks automation. Owners fix all of these with a multisig transaction.
- **Safe version.** It relies on Safe **v1.5.0** module-guard semantics. **Safe v1.4.1 has no module guards.** On a
  1.4.1 Safe without a fallback handler, `setModuleGuard` even "succeeds" while enforcing nothing (demonstrated on
  canonical bytecode in the fork test). Check `VERSION()` off-chain. The deploy script refuses anything other than
  `1.5.0`. After installation, confirm `isActiveOnSafe() == true`.
- **Chain support.** It needs EIP-1153 transient storage (Cancun). Base has it (Ecotone).

The full threat analysis is in [REVIEW.md](./REVIEW.md).

## Layout

```
src/TreasuryReserveGuard.sol            the guard (only production contract)
script/DeployTreasuryReserveGuard.s.sol deploys the guard; PRINTS the owner Safe txs (never calls the Safe)
test/TreasuryReserveGuard.t.sol         unit + fuzz tests against a REAL Safe v1.5.0 (2-of-3, signed txs)
test/TreasuryReserveGuard.targets.t.sol forbidden Safe-authority targets + strict MultiSend parsing (model fuzz)
test/invariant/…invariant.t.sol         handler-based invariants (random module txs + config changes)
test/fork/BaseMorphoFork.t.sol          Base mainnet fork: canonical Safe 1.5.0 + Morpho USDC vault
test/DeployScript.t.sol                 printed txs install/configure the guard (one-by-one and MultiSend)
test/mocks, test/utils                  TestModule, MockERC20, Safe test base (anvil default keys only)
abi/TreasuryReserveGuard.ts             generated ABI (`export const treasuryReserveGuardAbi = [...] as const`)
scripts/export-abi.mjs                  regenerates the ABI file from out/
reports/                                aderyn + slither output (triaged in REVIEW.md)
deployments/                            manifests of owner-authorized deployments (none yet)
```

## Build and test

Requires Foundry (tested with forge 1.6.0-nightly). Dependencies are vendored in `lib/` (see
[DEPENDENCIES.md](./DEPENDENCIES.md)), so there is nothing to install.

```bash
forge build
forge test -vv                                   # everything (fork test needs network; skips if unreachable)
forge test --no-match-path 'test/fork/*'         # offline suite
forge test --match-path 'test/fork/*' -vv        # Base fork only
forge coverage --report summary --no-match-path 'test/fork/*'
node scripts/export-abi.mjs                      # after forge build
```

Fork test environment variables:

- `BASE_RPC_URL` (default `https://mainnet.base.org`)
- `BASE_RPC_FALLBACK_URL` (default `https://base-rpc.publicnode.com`)
- `BASE_FORK_BLOCK` (optional; pins a block for reproducibility)

If neither RPC answers, the fork tests are **skipped**, not failed. Note that `pnpm test` at the repository root also
runs the fork suite, which adds about 30–45 s when the network is available.

Last local run (2026-10-11):

- 90 tests passed: 60 unit/fuzz, 12 target/batch, 7 invariant (128 runs × depth 64), 5 deploy-script and 6 Base fork
  (fork block 52478975).
- Guard coverage: 100% lines, 99.6% statements, 98.0% branches, 100% functions.
- forge-lint: clean. aderyn: 0 high, 3 low. slither: 8 informational. All are triaged in REVIEW.md.

## Installing on a Safe (summary)

1. Confirm the Safe reports `VERSION() == "1.5.0"`.
2. Simulate `script/DeployTreasuryReserveGuard.s.sol` with the policy in environment variables. Then deploy (owner
   authorized, hardware wallet or keystore).
3. Owners sign the printed Safe transactions. Configuration comes first and `setModuleGuard(guard)` comes **last**.
   Alternatively, sign the single printed `MultiSendCallOnly` batch with operation `DELEGATECALL`.
4. Verify `isActiveOnSafe()`, `trackedTokens()` and `policyOf(token)`, then record `deployments/<chainId>.json`.
