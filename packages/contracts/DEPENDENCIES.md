# Dependencies

Dependencies are **vendored** into `lib/` (plain files, no git submodules, no nested `.git`).
Each one was shallow-cloned at an exact tag, pruned to what Foundry needs, and then checked
byte-for-byte against a fresh clone of the same tag (`diff -r` showed no differences) on 2026-10-11.

| Package            | Version / tag | Commit                                     | Source                                                                                         | License           | Vendored subset                                                                                                                 |
| ------------------ | ------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Safe Smart Account | `v1.5.0`      | `dc437e8fba8b4805d76bcbd1c668c9fd3d1e83be` | https://github.com/safe-fndn/safe-smart-account (the old `safe-global/...` URL redirects here) | LGPL-3.0-only     | `contracts/` (git tree `2c1af93179f8da1cbd7dd0c46e4819d7ea8be936`), LICENSE, README, CHANGELOG, package.json, hardhat.config.ts |
| forge-std          | `v1.17.0`     | `f3dae6e6ee381f25eb6a246f7da9b85c91a68219` | https://github.com/foundry-rs/forge-std                                                        | MIT OR Apache-2.0 | `src/` (git tree `24741b2e9c076a7867c191655b797dc7a3474c54`), licenses, README, foundry.toml, package.json                      |

OpenZeppelin is **not** used. The guard needs only Safe's `IModuleGuard`, `IERC165` and `Enum`.

## Verifying the vendored copies

```bash
git clone --depth 1 --branch v1.5.0 https://github.com/safe-fndn/safe-smart-account /tmp/safe
git -C /tmp/safe rev-parse HEAD            # dc437e8fba8b4805d76bcbd1c668c9fd3d1e83be
diff -r /tmp/safe/contracts lib/safe-smart-account/contracts && echo identical

git clone --depth 1 --branch v1.17.0 https://github.com/foundry-rs/forge-std /tmp/fstd
git -C /tmp/fstd rev-parse HEAD            # f3dae6e6ee381f25eb6a246f7da9b85c91a68219
diff -r /tmp/fstd/src lib/forge-std/src && echo identical
```

## Safe v1.5.0 facts this package relies on (read from the vendored source)

- `contracts/Safe.sol`: `VERSION = "1.5.0"`.
- `contracts/base/ModuleManager.sol`:
  - `interface IModuleGuard is IERC165` with
    `checkModuleTransaction(address to, uint256 value, bytes data, Enum.Operation operation, address module) returns (bytes32 moduleTxHash)`
    and `checkAfterModuleExecution(bytes32 txHash, bool success)`. Interface id `0x58401ed8`
    (asserted in `test_InterfaceIds_MatchSafe150`).
  - `setModuleGuard(address)` is `authorized` (only via a Safe transaction). It reverts with `GS301` unless
    `supportsInterface(type(IModuleGuard).interfaceId)` is true. `address(0)` removes the guard.
  - The guard is stored at `keccak256("module_manager.module_guard.address")` =
    `0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947`. There is no public getter, so it is read
    with `StorageAccessible.getStorageAt`.
  - Both `execTransactionFromModule` and `execTransactionFromModuleReturnData` call the guard before and after
    execution. The post-hook runs even when the inner call failed (`success == false`). A revert in either hook
    reverts the whole module transaction.
- `contracts/base/GuardManager.sol`: the transaction guard (`setGuard`) requires `ITransactionGuard` (`0xe6d7a83a`).
  TreasuryReserveGuard deliberately does not claim that id, so it can never be installed as a transaction guard
  (`GS300`).
- Safe v1.4.1 has **no** module guard. On a 1.4.1 Safe without a fallback handler, a `setModuleGuard` owner
  transaction "succeeds" through the empty fallback and enforces nothing. This is demonstrated on canonical 1.4.1
  bytecode by `test_Fork_Safe141_SetModuleGuardIsSilentNoOp_VersionMustBeCheckedOffChain`.

## Compilers

- Project: solc **0.8.28**, `evm_version = cancun` (needed for EIP-1153 `TSTORE`/`TLOAD`), optimizer on (200 runs).
- Canonical Safe v1.5.0 deployments were built by Safe with solc **0.7.6**, optimizer **disabled** (see
  `lib/safe-smart-account/CHANGELOG.md`). Unit and invariant tests compile the same v1.5.0 sources with 0.8.28. Their
  pragma `>=0.7.0 <0.9.0` allows this, and 1.5.0 made its assembly memory-safe for ≥0.8.19. The Base fork tests run
  against the canonical 0.7.6 bytecode and assert its code hashes:

| Contract (canonical, same address on every chain) | Address                                      | codehash (safe-deployments, matched on Base)                         |
| ------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| SafeL2 1.5.0                                      | `0xEdd160fEBBD92E350D4D398fb636302fccd67C7e` | `0x180193227186ccb85316c94db1f0d156ed932b14712cfaac78901899178572dc` |
| Safe 1.5.0                                        | `0xFf51A5898e281Db6DfC7855790607438dF2ca44b` | `0xdda019cbd7c867a533a2a86e5c53434fdc50b13122b5a5ddb4a8df61b31c20f2` |
| SafeProxyFactory 1.5.0                            | `0x14F2982D601c9458F93bd70B218933A6f8165e7b` | `0x967dae4cda22b0c9ef7f31b010bdc1ceb0af9904b0c3dc060b5302e4c18a4529` |
| CompatibilityFallbackHandler 1.5.0                | `0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4` | `0x3c6a85bcf7b563daa624b884b4e9a1b9fa5371edde7be945d998071a48f28bbc` |
| MultiSendCallOnly 1.5.0                           | `0xA83c336B20401Af773B6219BA5027174338D1836` | `0xcdbdcec38d2f1c7d961b0029ff8416b7e86e9974d6f0e9c9580c7d17fcfb6663` |
| SafeL2 1.4.1                                      | `0x29fcB43b46531BcA003ddC8FCB67FFE91900C762` | `0xb1f926978a0f44a2c0ec8fe822418ae969bd8c3f18d61e5103100339894f81ff` |
| SafeProxyFactory 1.4.1                            | `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` | `0x50c3cdc4074750a7a974204a716c999edd37482f907608d960b2b025ee0b3317` |

Source: `https://raw.githubusercontent.com/safe-global/safe-deployments/main/src/assets/v1.5.0/*.json` and
`.../v1.4.1/*.json`. Every row has `networkAddresses["8453"] = "canonical"`. The code hashes were
re-checked with `cast` against `https://mainnet.base.org` and `https://base-rpc.publicnode.com`.

## License note

`TreasuryReserveGuard.sol` imports LGPL-3.0-only Safe interfaces. The package's Solidity files are therefore
marked `LGPL-3.0-only`. Revisit this if the repository adopts a different license policy.
