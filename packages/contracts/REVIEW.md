# TreasuryReserveGuard — internal self-review

> **This is an internal self-review by the engineer who wrote the contract. It is NOT an independent security
> audit.** Before any deployment that protects real funds, get an independent audit, run a public review period,
> and do a staged rollout (small floors and limits on a low-value Safe first).

| Item         | Value                                                                                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope        | `src/TreasuryReserveGuard.sol` (sha256 `06d98fba…402c4`), `script/DeployTreasuryReserveGuard.s.sol` (sha256 `aad585b0…a76a3`)                                                                               |
| Out of scope | Safe v1.5.0 itself (audited by Certora and Ackee per the Safe repo), Zodiac Roles, Morpho, token contracts                                                                                                  |
| Date         | 2026-10-11, working tree of `packages/contracts` (not yet committed)                                                                                                                                        |
| Compiler     | solc 0.8.28, `evm_version = cancun`, optimizer 200 runs                                                                                                                                                     |
| Method       | Manual line-by-line review against the Safe v1.5.0 source; threat modelling; unit, fuzz, invariant, fork and model-based differential tests; mutation spot-checks; forge-lint, aderyn 0.6.5, slither 0.11.3 |
| Deployment   | None. See `deployments/README.md`.                                                                                                                                                                          |

Severity scale: **Critical** means funds can be lost by default. **High** means floors or limits can be bypassed by
the automation. **Medium** means bypass or loss of availability needs a plausible misconfiguration, or the design
accepts a meaningful risk. **Low** means limited impact. **Info** means a note or hardening.

## Summary

| ID     | Severity | Title                                                                                   | Status                            |
| ------ | -------- | --------------------------------------------------------------------------------------- | --------------------------------- |
| TRG-01 | High     | Allowance granted in a module tx is spent later, outside any module tx                  | Fixed                             |
| TRG-02 | High     | Module tx calls the Safe or the guard (self-escalation, guard removal)                  | Fixed                             |
| TRG-03 | High     | Guard hooks callable by anyone (in-flight state can be cleared or forged)               | Fixed                             |
| TRG-04 | High     | Module tx calls the Safe's fallback handler and spoofs `onlySelf` (EIP-1271 verifier)   | Fixed                             |
| TRG-05 | Medium   | MultiSend batch inner calls skip target and approval rules                              | Fixed                             |
| TRG-06 | Medium   | Module tx calls Roles (allowlisted module) admin, whose owner is the Safe               | Fixed                             |
| TRG-07 | Medium   | An allowlisted opaque delegatecall target can change Safe state                         | Mitigated (post-checks); accepted |
| TRG-08 | Medium   | A compromised automation key or malicious allowlisted module drains within limits       | Accepted (by design)              |
| TRG-09 | Medium   | Safe version mismatch: 1.4.1 has no module guard, so `setModuleGuard` is a silent no-op | Mitigated (script + view)         |
| TRG-10 | Medium   | Module-based recovery (social recovery) is blocked while the guard is installed         | Open (product decision)           |
| TRG-11 | Low      | Authorization primitives on other contracts are not recognised                          | Accepted; Roles must scope        |
| TRG-12 | Low      | Strict floor blocks all automation when any configured token is below its floor         | Accepted (fail closed)            |
| TRG-13 | Low      | Fixed window allows up to 2× the limit over a sliding interval                          | Accepted; documented              |
| TRG-14 | Low      | Liveness: broken `balanceOf`, griefing guardian, or guard installed on the wrong Safe   | Accepted; owners recover          |
| TRG-15 | Info     | Oracle-free: limits are per token, in token units; no aggregate value limit             | By design                         |
| TRG-16 | Info     | Fee-on-transfer and rebasing tokens                                                     | Covered (net delta)               |
| TRG-17 | Info     | ERC-777 hooks and re-entrancy                                                           | Covered                           |
| TRG-18 | Info     | Balance manipulation by sending tokens to the Safe                                      | Covered (net accounting)          |
| TRG-19 | Info     | Gas griefing with many tokens                                                           | Bounded (max 16)                  |
| TRG-20 | Info     | Chain-specific concerns (Cancun, L2 sequencer, native token)                            | Documented                        |
| TRG-21 | Info     | Reverted attempts leave no on-chain evidence                                            | Documented                        |
| TRG-22 | Info     | Owner-signed transactions are unrestricted, and owners can always remove the guard      | By design                         |

## Findings

### TRG-01: Allowance granted in a module tx is spent later, outside any module tx

- **Severity:** High
- **Component:** `checkModuleTransaction` → `_checkApproval`
- **Description:** The guard measures balances only around module transactions. A module tx calling
  `USDC.approve(attacker, max)` moves no balance, so it passes floors and limits. The attacker then calls
  `transferFrom(safe, …)` in a separate transaction that never reaches the guard. The floors and limits are bypassed
  completely.
- **Reproduction / test:** `test_Approve_ToNonAllowlistedSpender_Rejected` (approve, increaseAllowance,
  increaseApproval, authorizeOperator); `test_Batch_InnerApproveToNonAllowlistedSpender_Rejected`;
  `test_Fork_ApproveToUnlistedSpender_Reverts` (real USDC on Base).
- **Root cause:** Balance-delta accounting cannot see authority that is granted now and used later.
- **Impact:** Total loss of a configured token's balance.
- **Remediation:** For configured ERC-20s, `approve`, `increaseAllowance` and `increaseApproval` with a non-zero amount,
  and ERC-777 `authorizeOperator`, require `isSpenderAllowed[token][spender]`, which only the Safe sets. Revoking
  (amount 0) is always allowed. Malformed approval calldata is rejected.
- **Verification:** The tests above, plus `test_Approve_ToAllowlistedSpender_Allowed_AndRevokeAlwaysAllowed` and
  `test_Approve_MalformedCalldata_Rejected`. The model fuzz `testFuzz_Batch_DecisionMatchesModel` covers approvals
  inside batches.
- **Status:** Fixed. The residual approval routes are covered in TRG-11.

### TRG-02: Module tx calls the Safe or the guard

- **Severity:** High
- **Component:** `_checkCall`
- **Description:** Module txs execute with `msg.sender == safe`. A module tx with `to == safe` could call
  `setModuleGuard(0)`, `enableModule`, `addOwnerWithThreshold` or `changeThreshold`, all of which are Safe
  `authorized`. A module tx with `to == guard` could call `setFloor` or `unpause`, since it passes `onlySafe`.
- **Reproduction / test:** `test_ModuleTx_CannotTargetSafe_EgRemoveGuardOrEnableModule`,
  `test_ModuleTx_CannotTargetGuard`, `test_Batch_InnerCallToSafeOrGuardOrModule_Rejected` (including inner
  `to == address(0)`, which MultiSend maps to the Safe).
- **Root cause:** Safe self-authorization (`msg.sender == address(this)`) and the guard's `onlySafe` cannot tell an
  owner-approved call apart from a module-initiated call.
- **Impact:** Automation removes its own limits or takes over the Safe.
- **Remediation:** `ForbiddenTarget` for `safe` and `address(this)`, both at the top level and for every inner batch
  call. The config setters are also locked while any module tx is in flight (`ConfigLockedDuringModuleExecution`).
  After execution the guard checks that the Safe's module-guard slot still points at itself (`ModuleGuardChanged`).
- **Verification:** The tests above, plus `test_DelegateCall_CannotUninstallGuardBehindItsBack`,
  `test_DelegateCall_CannotReconfigureGuardMidTransaction`, and the invariant `invariant_guardStaysInstalled`.
- **Status:** Fixed.

### TRG-03: Guard hooks callable by anyone

- **Severity:** High
- **Component:** `checkModuleTransaction`, `checkAfterModuleExecution`
- **Description:** The `IModuleGuard` hooks are `external`. Without a caller check, a contract invoked during a module
  tx could call `checkAfterModuleExecution` itself. That would run the post-checks early and clear the in-flight
  state, or replace the balance snapshot through `checkModuleTransaction`.
- **Reproduction / test:** `test_GuardHooks_OnlyCallableBySafe`, `test_CheckAfter_WithoutPreCheck_Reverts`,
  `test_CheckAfter_HashMismatch_Reverts`.
- **Root cause:** The interface does not restrict callers.
- **Impact:** Floor and limit checks could be evaded or confused.
- **Remediation:** Both hooks are `onlySafe`. `checkAfterModuleExecution` also requires the `moduleTxHash` returned by
  the pre-hook, which is held in transient storage.
- **Verification:** The tests above.
- **Status:** Fixed.

### TRG-04: Module tx calls the Safe's fallback handler and spoofs `onlySelf`

- **Severity:** High (when the Safe uses `ExtensibleFallbackHandler`)
- **Component:** `_checkCall`
- **Description:** In `ExtensibleFallbackHandler`, `onlySelf` checks `_msgSender() == _manager()`, where `_msgSender`
  is the **last 20 calldata bytes** and `_manager` is `msg.sender`. A module tx that CALLs the handler directly, with
  the Safe address appended, passes this check. It can then call `setDomainVerifier(domain, evilVerifier)`. After that,
  the Safe "signs" anything for that EIP-712 domain through EIP-1271. That enables, for example, USDC v2.2 EIP-1271
  permits that grant allowances outside any module tx (see TRG-01).
- **Reproduction / test:** `test_ExtensibleFallbackHandler_SpoofedSelfCall_IsRealAndBlocked`. With the guard
  removed, the spoofed call succeeds and `domainVerifiers(safe, domain) == evilVerifier`, which proves the vector is
  real. With the guard installed it reverts `ForbiddenTarget(handler)`, both directly and inside a MultiSend batch.
  Also `test_ModuleTx_CannotCallFallbackHandler`.
- **Root cause:** The fallback handler authenticates the Safe by calldata convention, which any CALL from the Safe
  can satisfy.
- **Impact:** A full bypass of floors and limits through signature-based allowances.
- **Remediation:** The guard reads the Safe's fallback-handler slot (`getStorageAt`) on every module tx. CALLs to that
  address are forbidden. The Safe's transaction guard address is forbidden in the same way, to protect owner-side
  controls.
- **Verification:** The tests above, plus `test_ModuleTx_CannotCallTransactionGuard` and the model fuzz.
- **Status:** Fixed. Note: if the owners later switch the fallback handler, the new address is picked up
  automatically, because it is read on every transaction.

### TRG-05: MultiSend batch inner calls skip target and approval rules

- **Severity:** Medium (needs owners to allowlist MultiSend for delegatecall, which is the normal Roles batching
  setup)
- **Component:** `_checkMultiSendBatch`
- **Description:** Zodiac Roles executes batches as `DELEGATECALL` into MultiSend. The inner calls then run as the
  Safe. If only the top-level target were checked, an inner `approve(attacker)` or an inner call to the
  Safe or fallback handler would escape the rules.
- **Reproduction / test:** `test_Batch_*` and `testFuzz_Batch_DecisionMatchesModel`, a structured differential fuzz
  with 1,000 runs that compares the guard's decision with an independent model.
- **Root cause:** The batch payload is opaque unless it is decoded.
- **Impact:** The protections of TRG-01, TRG-02 and TRG-04 would be bypassed inside batches.
- **Remediation:** For any allowlisted delegatecall whose selector is `multiSend(bytes)`, the guard parses the payload
  **strictly**, exactly as `MultiSendCallOnly.multiSend` executes it. It accepts only the standard ABI offset `0x20`.
  The entries must tile the payload exactly (no trailing bytes, and no declared length past the end). Only CALL
  entries are accepted (`UnsupportedBatchOperation` otherwise). `to == address(0)` is mapped to the Safe. Each inner
  call goes through `_checkCall`. Because the tiling is exact, the entries the guard checks are exactly the entries
  MultiSend executes. MultiSend's loop condition (`i < length` with a `0x20` base) only skips data that cannot start a
  valid entry, and the strict parser rejects such data.
- **Verification:** `test_Batch_Malformed_Rejected` covers six malformed shapes. `testFuzz_Batch_ParserNeverPanics`
  (1,000 runs of arbitrary bytes) shows there are no panics and only expected errors. A mutation that disables
  parsing fails 6 of 12 tests in that suite.
- **Status:** Fixed. Payloads for delegatecall targets other than MultiSend stay opaque (TRG-07).

### TRG-06: Module tx calls the Roles modifier's admin functions

- **Severity:** Medium
- **Component:** `_checkCall`
- **Description:** A Roles modifier is normally owned by the Safe. A module tx (including one sent by Roles itself)
  that calls `Roles.assignRoles`, `scopeTarget` or similar has `msg.sender == safe`, so it passes `onlyOwner`. If Roles
  permissions ever allowed it, the automation could widen its own scope.
- **Reproduction / test:** `test_ModuleTx_CannotCallAllowlistedModule_NoRolesSelfEscalation`; the batch variant is in
  `test_Batch_InnerCallToSafeOrGuardOrModule_Rejected`.
- **Root cause:** The Safe is the owner of its modules.
- **Impact:** Automation could expand its own authority. Floors and limits would still apply, because every Roles
  execution still passes this guard.
- **Remediation:** CALLs to any `isModuleAllowed` address are forbidden.
- **Verification:** The tests above.
- **Status:** Fixed for allowlisted modules. Other modules that are enabled on the Safe but not allowlisted cannot
  execute through the guard at all, so reconfiguring them gains nothing within module txs.

### TRG-07: An allowlisted opaque delegatecall target can change Safe state

- **Severity:** Medium
- **Component:** `setDelegateCallAllowed` and the post-checks
- **Description:** Code reached by DELEGATECALL runs in the Safe's storage context. For targets whose payload is not a
  MultiSend batch, the guard cannot see what the code does. It could change owners, threshold, modules or the fallback
  handler, write `signedMessages`, or grant approvals.
- **Reproduction / test:** `test_DelegateCall_RejectedByDefault`,
  `test_DelegateCall_AllowedTarget_IsStillBalanceChecked`, `test_DelegateCall_CannotUninstallGuardBehindItsBack`,
  `test_DelegateCall_CannotReconfigureGuardMidTransaction`.
- **Root cause:** Delegatecall is inherently all-powerful.
- **Impact:** Bounded by owner choice. Delegatecall is denied by default.
- **Remediation:** Default deny. The Safe and the guard can never be allowlisted. Post-checks still enforce balances,
  that the guard is still installed, and the config lock. Recommendation: allowlist only Safe's `MultiSendCallOnly`
  1.5.0 (`0xA83c336B20401Af773B6219BA5027174338D1836`), never `MultiSend` and never `SignMessageLib`.
- **Verification:** The tests above.
- **Status:** Mitigated. The residual risk is accepted and documented in the NatSpec and README.

### TRG-08: A compromised automation key or malicious allowlisted module drains within limits

- **Severity:** Medium (inherent)
- **Component:** Design
- **Description:** Inside the floors and window limits, a compromised agent key (through Roles) or a malicious
  allowlisted module can move value to any destination its Roles scope permits. It can also deposit into an ERC-4626
  vault with `receiver = attacker`, which is counted as an outflow. If the attacker sees a guardian's `pause` in the
  mempool, they can front-run it, but only up to the remaining limit.
- **Reproduction / test:** The invariants `invariant_noSuccessfulModuleTxLeavesTokenBelowFloor` and
  `invariant_windowOutflowNeverExceedsLimit` (128 runs × depth 64 with random transfers, inflows, owner withdrawals,
  config changes and time). They show that the loss is bounded and never exceeds the bounds.
- **Root cause:** The guard bounds _how much_, not _where_.
- **Impact:** Loss of up to `min(balance − floor, remaining limit)` per token per window (2× across a window
  boundary, see TRG-13).
- **Remediation:** Roles must pin destinations (for example `receiver == avatar`). Set limits to the loss you can
  tolerate. Name guardians who can pause with one key. Monitor `ModuleTransactionChecked` and `OutflowRecorded`.
- **Verification:** The invariants above, plus mutation checks: removing the floor or limit revert makes them fail.
- **Status:** Accepted by design.

### TRG-09: Safe version mismatch (1.4.1)

- **Severity:** Medium (operational)
- **Component:** Installation (script and off-chain checks)
- **Description:** Safe v1.4.1 and older have **no module guard**. Module txs run unchecked. On a 1.4.1 Safe without a
  fallback handler, an owner tx calling `setModuleGuard(guard)` even **succeeds**: the unknown selector hits the
  empty fallback. Owners would believe they are protected.
- **Reproduction / test:** `test_Fork_Safe141_SetModuleGuardIsSilentNoOp_VersionMustBeCheckedOffChain` runs on
  canonical 1.4.1 bytecode on Base. The owner tx succeeds, `isActiveOnSafe() == false`, and a module drains below the
  floor. `test_Script_RejectsNon150Safe` covers the script check.
- **Root cause:** Earlier Safe versions lack the feature, and the fallback behaviour hides the mismatch.
- **Impact:** False assurance and fully unguarded automation.
- **Remediation:** The deploy script refuses any Safe whose `VERSION()` is not `"1.5.0"`. The guard exposes
  `isActiveOnSafe()`, which reads the 1.5.0 module-guard slot. The app must check `VERSION()` off-chain (or the Safe
  Transaction Service `moduleGuard` field) and `isActiveOnSafe()` before it shows the treasury as protected.
  Migrating a 1.4.1 Safe to 1.5.0 (with `SafeMigration`) is a separate, owner-approved step.
- **Verification:** The tests above.
- **Status:** Mitigated. The guard deliberately does not check the version on-chain.

### TRG-10: Module-based recovery is blocked while the guard is installed

- **Severity:** Medium (availability; product decision)
- **Component:** Module allowlist and `_checkCall`
- **Description:** Every module must be allowlisted, and no module may CALL the Safe. Recovery modules (social
  recovery, Safe{RecoveryHub}-style delay recovery) work by calling `swapOwner` or `addOwnerWithThreshold` on the Safe
  through `execTransactionFromModule`. With the guard installed, these are rejected (`ModuleNotAllowed` or
  `ForbiddenTarget(safe)`). If owners lose enough keys to fall below the threshold, they cannot remove the guard,
  and the recovery module cannot act either.
- **Reproduction / test:** `test_ModuleTx_CannotTargetSafe_EgRemoveGuardOrEnableModule` shows the same mechanism.
- **Root cause:** It is a design choice: module txs must never change Safe configuration (TRG-02).
- **Impact:** The Safe can lose its key-loss recovery path. Funds are not at risk from attackers.
- **Remediation options:** (a) Do not combine with module-based recovery; use owner-signature-based recovery
  procedures. (b) Add a narrowly scoped `recoveryModule` exemption: one module, Safe-set, allowed to call only
  `swapOwner`, `addOwnerWithThreshold` and `removeOwner` on the Safe, ideally behind its own delay. This needs its own
  review.
- **Verification:** Not applicable yet.
- **Status:** **Open.** The product needs to decide before production.

### TRG-11: Authorization primitives the guard does not recognize

- **Severity:** Low (needs Roles to permit them)
- **Component:** `_checkApproval` (scope)
- **Description:** These calls grant authority that is used later and that the guard does not decode:
  - Permit2 `approve` sub-allowances (only usable if Permit2 is an allowlisted spender)
  - `approveAndCall`
  - non-standard approval functions
  - Morpho Blue `setAuthorization`
  - Aave `approveDelegation` (credit delegation)
  - ERC-721 and ERC-1155 `setApprovalForAll`, and approvals on vault-share tokens that are not configured
  - allowances that existed before a token was configured

  ERC-2612 permits signed by the Safe need EIP-1271 approval. With CompatibilityFallbackHandler that requires
  `signedMessages`, which can only be written by DELEGATECALL into `SignMessageLib` (denied by default), or by owner
  signatures.

- **Reproduction / test:** Not applicable. This is a scope statement.
- **Root cause:** The guard does not decode every protocol's authorization model.
- **Impact:** Positions, or the configured tokens via Permit2, could be exposed if Roles permits these calls.
- **Remediation:** Never allowlist Permit2, routers or other allowance-forwarding contracts as spenders. Roles must not
  permit these selectors. When configuring a token, owners should revoke existing allowances (off-chain review).
  Consider configuring vault-share tokens with floors.
- **Status:** Accepted and documented.

### TRG-12: Strict floor blocks all automation when any configured token is below its floor

- **Severity:** Low
- **Component:** `checkAfterModuleExecution`
- **Description:** The floor is checked as an absolute post-condition on every configured token for every module tx.
  If owners spend below a floor, every module tx reverts, including unrelated tokens and transactions that would
  restore liquidity, until owners top up or lower the floor.
- **Reproduction / test:** `test_StrictFloor_BlocksEveryModuleTxWhileAConfiguredTokenIsBelowFloor`.
- **Root cause:** It is a design choice: the strict invariant "no successful module tx leaves a token below its floor".
- **Impact:** Automation stops; funds are safe.
- **Remediation:** Owners adjust the floor in the same multisig tx that spends below it. A relaxed variant (revert only
  if the token decreased) could be considered later.
- **Status:** Accepted (fail closed).

### TRG-13: Fixed window allows up to 2× the limit over a sliding interval

- **Severity:** Low
- **Component:** `_recordOutflow`
- **Description:** A window opens at the first outflow after the previous window expired. Spending the limit at the
  end of one window and again at the start of the next moves 2× the limit within a short interval. Lowering a limit
  keeps the amount already spent.
- **Reproduction / test:** `test_OutflowLimit_ResetsAfterWindow`, `testFuzz_OutflowLimitMatchesModel`, and the
  invariant `invariant_guardAccountingMatchesModel`.
- **Root cause:** Fixed-window accounting, which is cheap and has a single storage slot.
- **Impact:** Bounded, documented over-spend.
- **Remediation:** Set the limit to half the tolerated amount per interval, or adopt a sliding window or token bucket
  in a later version.
- **Status:** Accepted and documented (NatSpec and README).

### TRG-14: Liveness issues (broken token, griefing guardian, wrong Safe)

- **Severity:** Low
- **Component:** `_balanceOf`, `pause`, constructor
- **Description:**
  - A configured token whose `balanceOf` reverts or returns fewer than 32 bytes blocks every module tx
    (`BalanceQueryFailed`).
  - A guardian can re-pause repeatedly.
  - A guard deployed for Safe A but installed on Safe B makes every module tx on B revert `CallerNotSafe`.
- **Reproduction / test:** `test_BrokenToken_BlocksModuleTxs_UntilOwnersRemoveIt`, `test_SetFloor_OnNonToken_Reverts`,
  `test_RevokedGuardian_CannotPause`.
- **Root cause:** The guard fails closed.
- **Impact:** Automation stops; funds are safe.
- **Remediation:** Removing a token never queries it, so a broken token can always be removed. Adding a token probes
  `balanceOf` first. Owners can revoke guardians. Verify `guard.safe()` before installation. Balance reads use
  STATICCALL and copy at most 32 bytes, so there are no return-data bombs and no state changes.
- **Status:** Accepted. Owners recover with one multisig tx.

### TRG-15: Oracle-free design

- **Severity:** Info
- **Description:** No prices are used. There is no oracle manipulation, no staleness and no depeg logic. As a
  consequence, limits are per token and in token units. There is no aggregate USD limit across tokens, and economically
  equivalent tokens (for example USDC and USDbC) are separate entries.
- **Status:** By design. Configure each material token.

### TRG-16: Fee-on-transfer and rebasing tokens

- **Severity:** Info
- **Description:** Outflow is the Safe's **balance delta**, so a fee-on-transfer token is measured correctly (the full
  debit). A negative rebase during a module tx counts as outflow, which is conservative. Rebases between transactions
  never add allowance, because only drops within a module tx are counted. Tokens like stETH, which round down 1–2 wei
  on transfer, may leave the balance 1–2 wei under an exact floor. Leave slack.
- **Test:** `test_FeeOnTransferToken_OutflowMeasuredByBalanceDelta`.
- **Status:** Covered.

### TRG-17: ERC-777 hooks and re-entrancy

- **Severity:** Info
- **Description:** Hooks such as `tokensReceived` on recipients, or callbacks from targets, may try to:
  - start a nested module tx: rejected with `NestedModuleExecution` by the transient in-flight flag;
  - reconfigure the guard: rejected with `ConfigLockedDuringModuleExecution`;
  - call `pause`: allowed, since it only reduces authority.

  Balance and slot reads are STATICCALLs, so measurement cannot be re-entered with state changes. The guard holds no
  funds and has no payable or receive function.

- **Test:** `test_NestedModuleExecution_Rejected`. A mutation that removes the nesting check fails it.
- **Status:** Covered.

### TRG-18: Balance manipulation by sending tokens to the Safe

- **Severity:** Info
- **Description:**
  - **Donation before a module tx in the same transaction:** this raises the pre-balance. Outflow is measured
    against it, so it cannot unlock extra outflow; the floor is absolute.
  - **Donation during a module tx:** this offsets measured outflow one-for-one. The Safe's net loss is still at most
    the limit, and the donor pays. The donation stays in the Safe. Pulling it back requires another module tx (which
    is measured) or an allowance (which is gated, TRG-01).
  - **Inflows:** they never create allowance.
- **Test:** `test_Inflows_DoNotCreateAllowance`, `test_Fork_OutflowLimit_AppliesToDeposits_AndWithdrawalsDoNotCreateAllowance`.
- **Status:** Covered (net accounting is intended).

### TRG-19: Gas griefing with many tokens

- **Severity:** Info
- **Description:** Each module tx makes 2 balance reads per configured token, plus 2 or 3 `getStorageAt` reads. The
  token list is capped at `MAX_TRACKED_TOKENS = 16`, and only the Safe can add tokens. Measured in tests with warm
  state: the overhead with 1 token is about 24k gas, and a full 16-token module transfer costs about 156k gas.
- **Test:** `test_GasOverhead_OneConfiguredToken`, `test_GasBound_ModuleTxWith16ConfiguredTokens`,
  `test_MaxTrackedTokens_Enforced`.
- **Status:** Bounded.

### TRG-20: Chain-specific concerns

- **Severity:** Info
- **Description:**
  - The guard needs **EIP-1153** (Cancun) for `TSTORE`/`TLOAD` and `MCOPY`. Base has it (Ecotone). Do not deploy where
    it is missing.
  - `block.timestamp` on L2s is set by the sequencer. Windows are long (≥ 1 s, typically hours), so skew does not
    matter.
  - If the sequencer is down, nobody can pause, but automation cannot act either.
  - `address(0)` means the chain's native token.
  - USDC can be frozen by its issuer. That is outside the guard's control.
  - Canonical Safe 1.5.0 addresses and code hashes are verified for Base; re-verify on any new chain.
- **Status:** Documented.

### TRG-21: Reverted attempts leave no on-chain evidence

- **Severity:** Info
- **Description:** Events (`ModuleTransactionChecked`, `OutflowRecorded`) are emitted only when a transaction
  succeeds. Blocked attempts revert, so their events revert too. Alerting on attempted breaches needs off-chain
  monitoring of reverted transactions and traces.
- **Status:** Documented.

### TRG-22: Owner-signed transactions are unrestricted, and owners can always remove the guard

- **Severity:** Info (by design)
- **Description:** The contract is a module guard, not a transaction guard. It does not claim `ITransactionGuard`
  (`0xe6d7a83a`), so Safe's `setGuard` refuses it (`GS300`). Owners can therefore go below floors and remove the guard
  at any time, including while it is paused.
- **Test:** `test_OwnerSignedTx_CanGoBelowFloor_ByDesign`, `test_OwnersCanAlwaysRemoveGuard_EvenWhilePaused`,
  `test_CannotBeInstalledAsTransactionGuard_SoOwnerTxsAreNeverBlocked`,
  `test_SetModuleGuard_RequiresErc165ModuleGuardInterface`.
- **Status:** By design.

## Threat scenarios (requested) → coverage

| Scenario                                           | Where                                                    |
| -------------------------------------------------- | -------------------------------------------------------- |
| Compromised automation key                         | TRG-08 (bounded), TRG-01/02/04/05/06 (no escalation)     |
| Malicious allowlisted module                       | TRG-08, TRG-07, TRG-06                                   |
| Oracle-free design (no prices used)                | TRG-15                                                   |
| Fee-on-transfer / rebasing token                   | TRG-16                                                   |
| ERC-777 hooks                                      | TRG-17, TRG-01 (`authorizeOperator` gated)               |
| Balance manipulation by sending tokens to the Safe | TRG-18                                                   |
| Guard removal                                      | TRG-02 (automation cannot), TRG-22 (owners always can)   |
| Gas griefing with many tokens                      | TRG-19                                                   |
| Safe version mismatch (1.4.1 has no module guards) | TRG-09 (state clearly: detect off-chain via `VERSION()`) |
| Chain-specific concerns                            | TRG-20                                                   |

## Static analysis triage

**forge-lint** (built into `forge build`) reports no remaining warnings. Each suppressed `unsafe-typecast` and
`block-timestamp` site has an inline justification.

**aderyn 0.6.5**: `reports/aderyn.md` lists 0 High and 3 Low.

| Finding                                                        | Triage                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (earlier run) H-1 "Incorrect assembly shift order"             | **False positive.** `shl(224, selector)` is the correct EVM operand order (shift first). The code was still refactored to build calldata with `abi.encodeWithSelector`, so neither aderyn nor slither (`too-many-digits`) flags it. |
| (earlier run) L "Literal instead of constant"                  | **Fixed.** ABI and MultiSend layout sizes are now named constants.                                                                                                                                                                  |
| (earlier run) L "Uninitialized local variable" (loop `i`)      | **Fixed.** Explicit `= 0`.                                                                                                                                                                                                          |
| L-1 Loop contains `revert` (snapshot, post-check, batch)       | **Intended.** Any violating token or inner call must revert the whole module tx (fail closed). Loops are bounded by `MAX_TRACKED_TOKENS` or by calldata.                                                                            |
| L-2 Costly operations inside loop (`_recordOutflow` SSTORE)    | **Intended.** Per-token window accounting; at most 16 iterations.                                                                                                                                                                   |
| L-3 Unchecked return (`_balanceOf(token);` in `_syncTracking`) | **Intended.** The call is a probe that reverts with `BalanceQueryFailed` when a token is added; the value is not needed.                                                                                                            |

**slither 0.11.3**: `reports/slither.txt`; filtered to `src/`; 8 results, all informational.

| Finding                                                                                               | Triage                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamp` ×2 (`_recordOutflow`, `remainingOutflow`)                                                 | **Intended.** Window bookkeeping. Validators or sequencers can skew by seconds, which is irrelevant for windows of hours. `MAX_WINDOW_SECONDS` = 365 days.                                                                                            |
| `assembly` ×6 (`_tload`, `_tstore`, `_balanceOf`, `_slice`, `_checkApproval`, `_checkMultiSendBatch`) | **Intended and reviewed.** Transient storage has no high-level syntax for keyed slots. `_balanceOf` bounds return data to 32 bytes. `_slice` uses `MCOPY`. The calldata word reads are bounds-checked before each read. All blocks are `memory-safe`. |

## Test evidence (2026-10-11)

The run had 90 tests: 90 passed, 0 failed, 0 skipped.

- 60 unit and fuzz tests (1,000 runs per fuzz)
- 12 target and batch tests, including the differential model fuzz and the parser no-panic fuzz
- 7 invariant tests (128 runs × depth 64, 8,192 calls each; the handler hits both the allowed and blocked paths)
- 5 deploy-script tests
- 6 Base mainnet fork tests at block 52478975, against canonical Safe 1.5.0 and 1.4.1 bytecode (code hashes
  asserted) and Gauntlet USDC Prime, a MetaMorpho V1 vault (`0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61`). The fork
  tests skip cleanly when no RPC is reachable; this was verified.

Coverage of `src/TreasuryReserveGuard.sol` with the fork tests excluded: 100% lines, 99.65% statements, 98.04%
branches, 100% functions. The one branch reported as uncovered is the config-lock modifier, which
`test_CheckAfter_HashMismatch_Reverts` and `test_DelegateCall_CannotReconfigureGuardMidTransaction` both assert
explicitly. The coverage instrumentation does not attribute modifier branches.

Mutation spot-checks: removing each of these checks makes at least one test or invariant fail:

- floor check
- limit check
- nesting check
- fallback-handler target check
- MultiSend parsing
- `to == 0` mapping

## Open items before production

1. Independent audit (scope: this contract together with its Roles configuration).
2. TRG-10: decide on recovery-module compatibility.
3. Choose the window model (TRG-13), and decide whether to keep a strict or a relaxed floor (TRG-12).
4. Define a Roles permission template that pins destinations and never permits the TRG-11 primitives. Test the guard
   and Roles together on a fork, using Roles mastercopy 2.1.1 (not 2.1.0).
5. Off-chain monitoring of guard events and reverted module transactions (TRG-21), plus `VERSION()` and
   `isActiveOnSafe()` checks in the app (TRG-09).
