# TokenIQ 2.0: integration facts (verified)

- **Date checked:** 2026-10-11, between 18:10 and 19:00 UTC, for every item unless a row says otherwise.
- **Method:** primary sources only. That means GitHub source at tags, read with `gh api`; npm registry JSON; live API calls with `curl`; and on-chain reads with `cast` against public RPCs. Docs pages were read with WebFetch. Nothing here is from memory. Where a value comes only from an on-chain read and not from an official doc, the row says so.
- **Raw evidence:** saved next to this file in `research/`. That covers `morpho/*.json`, `aave/*.json`, `cl/feeds-*.json`, `cl/verify.txt`, `tokens.txt`, `codecheck.txt`, `rpc-test.txt`, `tx-schema.raw` (the Safe Transaction Service OpenAPI document) and `npm-versions.txt`.
- **Checksums:** every address was checked with `cast to-check-sum-address`; see the note at the end.

---

## A. Safe Smart Account

### A.1 Versions

| Item | Fact | Source |
|---|---|---|
| Latest release | **v1.5.0**, published 2025-07-03, not a prerelease. Previous: v1.4.1-3 (2024-10-02). | `gh api repos/safe-global/safe-smart-account/releases` |
| Repo move | `github.com/safe-global/safe-smart-account` now redirects to **`github.com/safe-fndn/safe-smart-account`**. | `gh api repos/safe-global/safe-smart-account` returns `safe-fndn/safe-smart-account` |
| Tag commit | `v1.5.0` → commit `dc437e8fba8b4805d76bcbd1c668c9fd3d1e83be` | `gh api repos/safe-fndn/safe-smart-account/git/ref/tags/v1.5.0` |
| `VERSION` constant | `"1.5.0"` in `contracts/Safe.sol` (it is `"1.4.1"` at tag v1.4.1) | source at tags |
| Pragma | `pragma solidity >=0.7.0 <0.9.0;` in both 1.4.1 and 1.5.0 | `contracts/Safe.sol@v1.5.0` |
| Official build | solc **0.7.6**, optimizer **disabled**. 1.5.0 also fixed memory-safety so the contracts compile with solc ≥0.8.19. | `CHANGELOG.md@v1.5.0`; `hardhat.config.ts` (`defaultSolidityVersion = "0.7.6"`) |
| Audits (1.5.0) | Certora and Ackee. Reports: `docs/Safe_Audit_Report_1_5_0_Certora.pdf` and `docs/Safe_Audit_Report_1_5_0_Ackee.pdf`. | `docs/audit_1_5_0.md@v1.5.0` |
| Wallet default | Safe Wallet's client gateway returns `recommendedMasterCopyVersion: "1.5.0"` for chains 1, 8453, 42161, 10, 84532, 11155111 and 137. | `https://safe-client.safe.global/v1/chains/{id}`. Returns 403 to the default curl UA; works with a browser UA. |
| SDK default | **`@safe-global/protocol-kit` still defaults to `DEFAULT_SAFE_VERSION = '1.4.1'`.** Pass `safeVersion: '1.5.0'` explicitly when deploying new Safes. | `packages/protocol-kit/src/contracts/config.ts` (safe-core-sdk main) |
| Tx-service indexing | The Base tx-service lists singleton `0xEdd160fEBBD92E350D4D398fb636302fccd67C7e` as `1.5.0+L2`. | `GET https://api.safe.global/tx-service/base/api/v1/about/singletons/` |

### A.2 Module guards: **yes, Safe v1.5.0 supports them** (v1.4.1 does not)

The changelog entry for 1.5.0 is titled "Add module guard interface (#758)". It says: "The `IModuleGuard` interface was added to allow checking the module transactions before and after execution."

`IModuleGuard` is declared in `contracts/base/ModuleManager.sol@v1.5.0`. The signatures below are verbatim:

```solidity
interface IModuleGuard is IERC165 {
    function checkModuleTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        address module
    ) external returns (bytes32 moduleTxHash);

    function checkAfterModuleExecution(bytes32 txHash, bool success) external;
}

abstract contract BaseModuleGuard is IModuleGuard {
    function supportsInterface(bytes4 interfaceId) external view virtual override returns (bool) {
        return
            interfaceId == type(IModuleGuard).interfaceId || // 0x58401ed8
            interfaceId == type(IERC165).interfaceId; // 0x01ffc9a7
    }
}
```

**Setter** (in `ModuleManager`, `authorized`, so it can only be called through a Safe tx to itself):

```solidity
function setModuleGuard(address moduleGuard) external override authorized {
    if (moduleGuard != address(0) && !IModuleGuard(moduleGuard).supportsInterface(type(IModuleGuard).interfaceId))
        revertWithError("GS301");
    // sstore(MODULE_GUARD_STORAGE_SLOT, moduleGuard)
    emit ChangedModuleGuard(moduleGuard);
}
```

**Details:**

- **Storage slot:** `MODULE_GUARD_STORAGE_SLOT = keccak256("module_manager.module_guard.address")`, which is `0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947`. The getter is internal only, so read it with `getStorageAt`. The Safe Transaction Service `GET /api/v1/safes/{address}/` response includes a `moduleGuard` field.
- **Selectors:**
  - `setModuleGuard(address)` = `0xe068df37`
  - `setGuard(address)` = `0xe19a9dd9`
- **Error codes:**
  - `GS301`: module guard does not implement the interface.
  - `GS300`: same check for the transaction guard.
  - `GS104`: caller is not an enabled module.
- **Interface ID requirement:** the guard's `supportsInterface(0x58401ed8)` must return true, or `setModuleGuard` reverts. I recomputed it with `cast`: `checkModuleTransaction(address,uint256,bytes,uint8,address)` = `0x728c2972` XOR `checkAfterModuleExecution(bytes32,bool)` = `0x2acc37aa`, which gives **`0x58401ed8`**.

**Execution flow** (`execTransactionFromModule` and `execTransactionFromModuleReturnData`):

1. `preModuleExecution` runs the `onBeforeExecTransactionFromModule` hook.
2. It requires `msg.sender` to be an enabled module, else `GS104`.
3. If a module guard is set, it calls `checkModuleTransaction(to, value, data, operation, msg.sender)`.
4. The Safe executes the call with `type(uint256).max` gas.
5. `postModuleExecution` calls `checkAfterModuleExecution(guardHash, success)`, then emits `ExecutionFromModuleSuccess` or `ExecutionFromModuleFailure`.

Implications for the module guard design:

- A revert in either hook reverts the module transaction.
- Behind a Zodiac Roles Modifier, the `module` argument is the **Roles modifier's address**, not the role member's EOA.
- The post-hook receives `success=false` for inner calls that failed without reverting.
- A reserve-floor check fits best in `checkAfterModuleExecution`: read the Safe's balances after execution and revert if they are below the floor. A pre-check in `checkModuleTransaction` can store the starting balances transiently (`tstore`) if solc ≥0.8.24 and the chain is Cancun+.

**Safe 1.4.1:** `ModuleManager.execTransactionFromModule` performs **no guard call at all**. The 1.4.1 transaction guard only covers `execTransaction`. A module-scoped reserve floor therefore needs 1.5.0. Existing 1.3.0/1.4.1 Safes must migrate by delegatecalling `SafeMigration` (1.5.0 target): `0x6439e7ABD8Bb915A5263094784C5CF561c4172AC` → `migrateL2Singleton()` or `migrateL2WithFallbackHandler()`. It is canonical on all 7 chains below.

### A.3 Transaction guard interface (1.4.1 vs 1.5.0)

| | 1.4.1 (`contracts/base/GuardManager.sol@v1.4.1`) | 1.5.0 (`contracts/base/GuardManager.sol@v1.5.0`) |
|---|---|---|
| Interface name | `interface Guard is IERC165` | `interface ITransactionGuard is IERC165` |
| Base contract | `abstract contract BaseGuard is Guard` (in GuardManager.sol) | `abstract contract BaseTransactionGuard is ITransactionGuard`. `contracts/examples/guards/BaseGuard.sol` combines both and reports `0xe6d7a83a`, `0x58401ed8` and `0x01ffc9a7`. |
| `checkTransaction` | `(address to, uint256 value, bytes memory data, Enum.Operation operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, bytes memory signatures, address msgSender) external` | identical signature |
| After-hook | `checkAfterExecution(bytes32 txHash, bool success) external` | `checkAfterExecution(bytes32 hash, bool success) external` (parameter renamed only) |
| interfaceId | `0xe6d7a83a` | `0xe6d7a83a` (recomputed with cast: `0x75f0bb52 ^ 0x93271368`) |
| Slot | `keccak256("guard_manager.guard.address")` = `0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8` | same |
| `Enum` import path | `contracts/common/Enum.sol` | **`contracts/libraries/Enum.sol`** (moved) |

### A.4 Canonical deployments (safe-deployments `main`, release v1.37.63 of 2026-09-08)

Source: `https://raw.githubusercontent.com/safe-global/safe-deployments/main/src/assets/{v1.4.1|v1.5.0}/*.json`.

The `networkAddresses` value is **"canonical"** for every listed contract on **1 (Ethereum), 8453 (Base), 42161 (Arbitrum), 10 (Optimism), 84532 (Base Sepolia), 11155111 (Sepolia) and 137 (Polygon)**, for both versions. The same address therefore applies on every chain.

**On-chain check:** I ran `cast codesize` against each chain's public RPC (`codecheck.txt`). Every address below has code on all 7 chains, with identical sizes. Examples: Safe 1.5.0 = 21451 bytes, SafeL2 1.5.0 = 22231 bytes.

| Contract | v1.5.0 (recommended) | v1.4.1 |
|---|---|---|
| Safe (L1 singleton) | `0xFf51A5898e281Db6DfC7855790607438dF2ca44b` | `0x41675C099F32341bf84BFc5382aF534df5C7461a` |
| SafeL2 (use on L2s; emits events) | `0xEdd160fEBBD92E350D4D398fb636302fccd67C7e` | `0x29fcB43b46531BcA003ddC8FCB67FFE91900C762` |
| SafeProxyFactory | `0x14F2982D601c9458F93bd70B218933A6f8165e7b` | `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` |
| MultiSend | `0x218543288004CD07832472D464648173c77D7eB7` | `0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526` |
| MultiSendCallOnly | `0xA83c336B20401Af773B6219BA5027174338D1836` | `0x9641d764fc13c8B624c04430C7356C1C7C8102e2` |
| CompatibilityFallbackHandler | `0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4` | `0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99` |
| ExtensibleFallbackHandler | `0x85a8ca358D388530ad0fB95D0cb89Dd44Fc242c3` | n/a |
| SafeToL2Setup | `0x900C7589200010D6C6eCaaE5B06EBe653bc2D82a` | `0xBD89A1CE4DDe368FFAB0eC35506eEcE0b1fFdc54` |
| SafeMigration | `0x6439e7ABD8Bb915A5263094784C5CF561c4172AC` (target 1.5.0) | `0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6` (target 1.4.1) |
| SignMessageLib | `0x4FfeF8222648872B3dE295Ba1e49110E61f5b5aa` | `0xd53cd0aB83D845Ac265BE939c57F53AD838012c9` |
| CreateCall | `0x2Ef5ECfbea521449E4De05EDB1ce63B75eDA90B4` | `0x9b35Af71d77eaf8d7e40252370304687390A1A52` |
| SimulateTxAccessor | `0x07EfA797c55B5DdE3698d876b277aBb6B893654C` | `0x3d4BA2E0884aa488718476ca2FB8Efc291A46199` |

**Notes:**

- **Proposals should use MultiSendCallOnly**, which cannot delegatecall nested txs. The Safe tx that calls it uses `operation=1` (DelegateCall). The selector for `multiSend(bytes)` is `0x8d80ff0a`.
- 1.5.0 dropped zkSync EraVM builds and deprecated `SafeToL2Migration` (CHANGELOG 1.5.0).

### A.5 Dependency to use

| Option | Value |
|---|---|
| npm | **`@safe-global/safe-smart-account@1.5.0`** (latest). The tarball ships `contracts/**/*.sol`; I checked `contracts/base/ModuleManager.sol`, `GuardManager.sol` and `libraries/Enum.sol`. The old name `@safe-global/safe-contracts` stops at `1.4.1-2`. |
| Foundry | `forge install safe-fndn/safe-smart-account@v1.5.0` (pinned commit `dc437e8f…`). Example remapping: `@safe-global/safe-smart-account/=lib/safe-smart-account/`. The repo is Hardhat-based (no `foundry.toml`), so Foundry only needs the sources. |
| Imports for a guard | `import {BaseModuleGuard, IModuleGuard} from ".../contracts/base/ModuleManager.sol";`, `import {BaseTransactionGuard} from ".../contracts/base/GuardManager.sol";`, `import {Enum} from ".../contracts/libraries/Enum.sol";` |
| Guard pragma | Upstream allows `>=0.7.0 <0.9.0`. A custom guard can use `^0.8.24` and import these files unchanged. |

---

## B. Safe Transaction Service / Safe API

| Item | Fact | Source / evidence |
|---|---|---|
| Base URL | **`https://api.safe.global/tx-service/{shortName}`**, then `/api/v1/...` or `/api/v2/...`. The legacy hosts `https://safe-transaction-{network}.safe.global/...` now return **HTTP 308** to the new URL. | `curl -i` (2026-10-11); api-kit `TRANSACTION_SERVICE_URL = 'https://api.safe.global/tx-service'` |
| Short names (tested, all return 200) | Ethereum `eth`, Base `base`, Arbitrum `arb1`, Optimism **`oeth`** (`opt` is a 404), Base Sepolia **`basesep`**, Sepolia `sep`, Polygon **`pol`** (`matic` is a 404). Note: the client gateway reports `shortName: "matic"` but `transactionService: ".../tx-service/pol"`. | curl `/api/v1/about/` per name; `safe-client.safe.global/v1/chains/137` |
| Service version | Safe Transaction Service **6.11.0** | `GET /api/v1/about/` |
| API key | **Recommended and required by the SDK, but not enforced for reads.** <br>Docs: "Unauthenticated access is available for exploration only: **2 RPS** and **5,000 monthly requests**". Production needs a key from `https://developer.safe.global`. <br>Header: `Authorization: Bearer <JWT>`. Quota is enforced at the account level, not per key. 1 API unit = 1 HTTP request. Exceeding the quota returns **429** "Monthly quota exceeded"; an invalid or missing key on a protected tier returns 401. | https://docs.safe.global/core-api/how-to-use-api-keys ; https://docs.safe.global/core-api/api-authentication |
| Plans | Blog post, 2026-02-24: <br>• Unauthenticated: up to 2 RPS. <br>• Builder: 5 RPS. <br>• Growth: ~1M units/mo, 15 RPS. <br>• Scale: 3M units/mo, 50 RPS. <br>Unauthenticated restrictions started **24 Feb 2026**. Existing authenticated users had until 31 Mar 2026 to transition. A search snippet also listed monthly units and EUR prices (25k / 550k / 1M at €199 / 3M at €499), but that was **not confirmed on the fetched page**. | https://safe.global/blog/introducing-authenticated-api-access-and-usage-based-plans |
| Live unauthenticated test | Known DAO Safe (GnosisDAO treasury) `0x849D52316331967b6fF1198e5E32A0eB168D039d`. <br>`GET https://api.safe.global/tx-service/eth/api/v1/safes/0x849D…039d/` → **200**. <br>Headers: `x-ratelimit-limit: 5000`, `x-ratelimit-remaining: 4999`, `x-ratelimit-reset: 2592000` (30 days). The counter decremented across chains, so the quota is per IP and shared. <br>A request with a bogus `Authorization: Bearer` header still got 200 on `/about/`. <br>An unauthenticated `POST` with `{}` to the v2 propose endpoint returned **422** field-validation errors, not 401: proposing is technically possible without a key, but it consumes the 5k/month quota. | curl transcript (this session) |
| (a) Safe info | `GET /api/v1/safes/{address}/`. Response: `{address, nonce, threshold, owners[], masterCopy, modules[], fallbackHandler, guard, moduleGuard, version}`. The sample returned `version:"1.3.0"`, `guard:0x0…0`, `moduleGuard:0x0…0`. | live response |
| (b) Pending multisig txs | `GET /api/v2/safes/{address}/multisig-transactions/?executed=false&nonce__gte={currentNonce}&ordering=nonce`. Filters include `executed`, `nonce`, `nonce__gte`, `has_confirmations`, `trusted`, `safe_tx_hash` and `ordering`. v1 is **deprecated**; v2 returns `safeTxGas`, `nonce` etc. as **strings**. | OpenAPI at `https://api.safe.global/tx-service/eth/schema/` (saved as `tx-schema.raw`) |
| (c) Propose | `POST /api/v2/safes/{address}/multisig-transactions/`. Body `SafeMultisigTransaction`: `to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, nonce, contractTransactionHash, sender, signature, origin`. <br>Required (from the 422 response): `to, value, operation, safeTxGas, baseGas, gasPrice, nonce, contractTransactionHash, sender`. <br>Add more signatures with `POST /api/v1/multisig-transactions/{safe_tx_hash}/confirmations/`. | OpenAPI and the 422 response |
| (d) History | All: `GET /api/v2/safes/{address}/all-transactions/` (v1 deprecated). <br>Executed multisig: `GET /api/v2/safes/{address}/multisig-transactions/?executed=true`. <br>Module txs: `GET /api/v1/safes/{address}/module-transactions/`. <br>Transfers: `GET /api/v1/safes/{address}/transfers/`. | OpenAPI |
| (e) Balances | `GET /api/v2/safes/{address}/balances/?trusted=true&exclude_spam=true&limit=&offset=` returns a paginated `{count, next, results:[{tokenAddress, token:{name,symbol,decimals,logoUri}, balance}]}`. **No fiat values.** `/balances/usd/` now returns **404** on v1 and v2, so price assets yourself. Without the `trusted` and `exclude_spam` filters, the DAO Safe's list included scam tokens such as "+ $50 000 FOR FREE". | live responses |
| Other | `GET /api/v2/owners/{address}/safes/` (v1 deprecated); `GET /api/v1/safes/{address}/creation/`; `POST /api/v1/safes/{address}/multisig-transactions/estimations/` | OpenAPI |

**SDKs** (npm registry, 2026-10-11):

| Package | Version | Notes |
|---|---|---|
| `@safe-global/protocol-kit` | **8.0.7** | depends on `viem ^2.52.2` and `@safe-global/safe-deployments ^1.37.63`; `DEFAULT_SAFE_VERSION='1.4.1'` |
| `@safe-global/api-kit` | **5.0.3** | **`apiKey` is mandatory.** The constructor throws `"apiKey is mandatory when txServiceUrl is not defined…"`, and it also throws when `txServiceUrl` contains `api.safe.global` or `api.5afe.dev` without a key. You can omit the key only for a self-hosted tx-service URL. Methods: `getSafeInfo`, `getPendingTransactions`, `proposeTransaction`, `confirmTransaction`, `getAllTransactions`, `getMultisigTransactions`, `getModuleTransactions`, `getNextNonce`, `getSafesByOwner` and others. **There is no balances method.** |
| `@safe-global/types-kit` | 4.0.1 | |
| `@safe-global/safe-deployments` | 1.37.63 | |

Source: `packages/api-kit/src/SafeApiKit.ts` (safe-core-sdk main); releases `api-kit-v5.0.3` and `protocol-kit-v8.0.7` (2026-09-18).

---

## C. Zodiac Roles Modifier v2

| Item | Fact | Source |
|---|---|---|
| Repo | `github.com/gnosisguild/zodiac-modifier-roles`. Monorepo with `packages/evm` (contracts), `packages/sdk`, `packages/app` and `packages/docs`. LGPL-3.0. Last push 2026-08-25. v1 lives in `gnosisguild/zodiac-modifier-roles-v1`. | `gh api` |
| Contract version | `@gnosis-guild/zodiac-core-modifier-roles` **2.1.0** in `packages/evm/package.json`. Deployed mastercopies are **2.1.1 (current)** and 2.1.0. Solidity 0.8.21, EVM shanghai. `Roles.sol` pragma is `>=0.8.17 <0.9.0`. | README; `packages/evm/mastercopies.json`; `gnosisguild/zodiac` `src/contracts.ts` |
| **Roles mastercopy (current)** | **`0xF2964CE6161ce0e75964Fe7927cE114cb0B283D5`** (v2.1.1). The README was updated on 2026-06-19 in PR #487 "fix: update addresses". | README; `@gnosis-guild/zodiac` `CanonicalAddresses.roles["2.1.1"]` |
| Roles 2.1.0 mastercopy | `0x9646fDAD06d3e24444381f44362a3B0eB343D337`. **Listed under `FAULTY` in `@gnosis-guild/zodiac` v5.x**: `sanityCheckZodiacModuleAddress` throws for known-faulty addresses. I could not find a public writeup of the reason. **Do not deploy proxies of 2.1.0.** | `gnosisguild/zodiac/src/contracts.ts` (`FAULTY` map) |
| Libraries / adapters (README) | • Integrity `0x6a6Af4b16458Bc39817e4019fB02BD3b26d41049` <br>• Packer `0x869718C939652084BC491fBC5ce0D3C1d5B309F0` (README; `mastercopies.json` 2.1.0 lists `0x61C5B1bE435391fDd7BC6703F3740C0d11728a8C`) <br>• **MultiSendUnwrapper `0xB4Cd4bb764C089f20DA18700CE8bc5e49F369efD`** (2.1.1) <br>• MorphoBundler3Unwrapper `0x7533922A155DC6b4Cc0ae4E74D70a73bc86dD3E8` <br>• AvatarIsOwnerOfERC721 `0x91B1bd7BCC5E623d5CE76b0152253499a9C819d1` | README; `mastercopies.json` |
| Deterministic deployer | Mastercopies are deployed through the factory `0xce0042B868300000d44A59004Da54A005ffdcf9f` (Safe singleton factory) with salt 0. | `mastercopies.json` |
| **Module proxy factory** | Zodiac `ModuleProxyFactory` **1.2.0**: **`0x000000000000aDdB49795b0f9bA5BC298cDda236`**. Older versions: 1.1.0 `0x00000000000DC7F163742Eb4aBEf650037b1f588`, 1.0.0 `0x00000000062c52e29e8029Dc2413172f6D619d85`. Core contracts now live in `gnosisguild/zodiac-core` (npm `@gnosis-guild/zodiac-core`). | `gnosisguild/zodiac` `src/contracts.ts` and README |
| On-chain check | Roles 2.1.1, Roles 2.1.0, ModuleProxyFactory 1.2.0 and MultiSendUnwrapper 2.1.1 have code on **Ethereum, Base, Arbitrum, Optimism, Base Sepolia, Sepolia and Polygon** (`cast codesize`: 24409, 24401, 2046 and 2096 bytes). | `codecheck.txt` |
| Supported chains | README: Mainnet, Optimism, Gnosis, Polygon, Polygon zkEVM, Arbitrum One, Avalanche, BSC, **Base**, Celo, Sonic, Katana, Berachain, HyperEVM, World Chain, MegaETH, **Base Sepolia**, **Sepolia**. The SDK `chains.ts` adds Unichain, Mantle, Ink, BOB, Flare, Scroll and Plasma. | README; `packages/sdk/src/main/chains.ts` |
| Audits | `packages/evm/docs/`: <br>• G0 Group, Apr 2023 (v2) <br>• Omniscia, May 2023 (v2) <br>• Omniscia, Nov 2023 (v2.1) <br>• G0 Group, Nov 2023 (v2.1) <br>**No audit report found for the 2.1.1 delta.** | repo listing |
| Subgraph | `https://gnosisguild.squids.live/roles:production/api/graphql` | README |

**How permissions are expressed** (from `packages/evm/contracts/PermissionBuilder.sol`, `Roles.sol` and `Types.sol` on main):

- **Roles and members:**
  - `assignRoles(address module, bytes32[] roleKeys, bool[] memberOf)`
  - `setDefaultRole(address module, bytes32 roleKey)`
- **Targets:**
  - `allowTarget(bytes32 roleKey, address target, ExecutionOptions options)` allows any function on the target.
  - `scopeTarget(bytes32 roleKey, address target)` switches the target to function-level scoping.
  - `revokeTarget(...)` removes it.
- **Functions:**
  - `allowFunction(roleKey, target, bytes4 selector, ExecutionOptions)`
  - `scopeFunction(bytes32 roleKey, address target, bytes4 selector, ConditionFlat[] conditions, ExecutionOptions options)`
  - `revokeFunction(...)`
- **ExecutionOptions:** `None, Send, DelegateCall, Both`. Use `None`: no ETH value and no delegatecall.
- **Condition operators** (`enum Operator`):
  - `Pass`
  - Logical: `And`, `Or`, `Nor`
  - Structural: `Matches`, `ArraySome`, `ArrayEvery`, `ArraySubset`
  - `EqualToAvatar`
  - Comparison: `EqualTo`, `GreaterThan`, `LessThan`, `SignedIntGreaterThan`, `SignedIntLessThan`, `Bitmask`, `Custom`
  - Allowance: `WithinAllowance`, `EtherWithinAllowance`, `CallWithinAllowance`
- **Allowances:** `setAllowance(bytes32 key, uint128 balance, uint128 maxRefill, uint128 refill, uint64 period, uint64 timestamp)`.
  - Docs: `period` is "Duration of the refill interval in seconds, 0 for one-time allowance".
  - `WithinAllowance` debits a `uint` calldata field, `EtherWithinAllowance` debits `msg.value`, and `CallWithinAllowance` debits 1 per call.
  - Source: https://docs.roles.gnosisguild.org/general/allowances
- **Execution:** `execTransactionWithRole(address to, uint256 value, bytes data, Operation operation, bytes32 roleKey, bool shouldRevert)`, selector `0xc6fe8747`. Also `execTransactionFromModule` (default role). MultiSend batches are unwrapped through the MultiSendUnwrapper adapter, so each inner call is checked.

**SDK:**

- `zodiac-roles-sdk` **4.1.3** (2026-08-25; v4.0.0 shipped 2026-05-28). Exports `c` (condition builders), `forAll`, `processPermissions`, `reconstructPermissions`, `rolesAbi`, `encodeKey`/`decodeKey`, `postRole` and `fetchLicense`. It depends on **ethers ^6.13.5**, with peers `openapi-backend` and `@gnosis-guild/eth-sdk-client`.
- The docs' getting-started page now pairs it with **`@zodiac-os/sdk`** (1.12.1; `allow` kit, `constellation`, `push`). Source: https://docs.roles.gnosisguild.org/sdk/getting-started
- **Licensing:** the hosted app's `planApplyRole` calls `fetchLicense` (`https://app.zodiac.eco/system/get-plan/{prefix:address}`). Its `enforceLicenseTerms` blocks roles that **use allowances** unless the owner has a Zodiac OS account, and blocks all updates when the license is `blocked`. This is tooling-level only. The on-chain contract is LGPL and permissionless, so calling `scopeFunction` and `setAllowance` directly (for example from our own Safe tx builder) is not gated. Source: `packages/app/utils/plan/enforceLicenseTerms.ts`.

**Is it a reasonable dependency for "approve(USDC, vault) + vault.deposit/withdraw only"? Yes.**

It expresses exactly that scope without custom code:

1. `scopeTarget(role, USDC)` and `scopeFunction(role, USDC, 0x095ea7b3 /*approve*/, [Matches(calldata){ spender: EqualTo(vault), amount: Pass or WithinAllowance(key) }], None)`.
2. `scopeTarget(role, vault)`, then:
   - `deposit(uint256,address)` `0x6e553f65` with `receiver: EqualToAvatar`, amount optionally `WithinAllowance`;
   - `withdraw(uint256,address,address)` `0xb460af94` and/or `redeem(uint256,address,address)` `0xba087652` with `receiver: EqualToAvatar` and `owner: EqualToAvatar`.

Caveats:

1. Use the **2.1.1** mastercopy.
2. The `module` seen by a Safe 1.5.0 module guard is the Roles proxy, not the bot key.
3. Roles enforces call shape, not post-state invariants (for example a minimum USDC balance). That is why the custom module guard for the reserve floor is still needed.
4. Avoid depending on the hosted app or `planApplyRole` if allowances are needed without a Zodiac OS subscription. Encode the calls yourself.
5. The SDK pulls in ethers v6 alongside viem.

---

## D. Morpho

**Endpoint:** `https://api.morpho.org/graphql` (Apollo).

- No API key needed; the unauthenticated POSTs succeeded.
- Responses carry `extensions.maximumComplexity: 1000000`.
- Docs (https://docs.morpho.org/developers/api/get-started):
  - "750 requests/minute", with 429 and a 600 s retry.
  - Heavy abuse (~20,000 requests/hour) triggers a 604800 s cooldown.
  - GraphQL max complexity 1,000,000.
  - "provided as-is, without a Service Level Agreement (SLA)".
  - A REST API also exists.

**Root query fields** (introspected): `vaults`, `vaultByAddress`, `vaultV2s`, `vaultV2ByAddress`, `vaultPositions`, `vaultV2PositionByAddress`, `markets`, `marketById`, `assets`, `curators`, `chains`, `vaultV2transactions` and others.

**Filters and order:**

- **V1 `VaultFilters`:** `chainId_in`, `assetSymbol_in`, `assetAddress_in`, `listed`, `featured`, `curatorAddress_in`, `netApy_gte`, `totalAssetsUsd_gte` and more.
- **V1 `VaultOrderBy`:** `TotalAssetsUsd`, `NetApy`, `Apy` and others.
- **V2 `VaultV2sFilters`:** `chainId_in`, `assetAddress_in` (Address), `listed`, `type_in` (`MorphoVault | FeeWrapper`), `curatorAddress_in`, `liquidityUsd_gte`, `netApy_gte`, `performanceFee_lte` and more.
- **V2 `VaultV2OrderBy`:** adds `Liquidity`, `LiquidityUsd`, `RealAssets` and `IdleAssets`.

**"Whitelisted":** the `whitelisted` field is **removed**. Querying it returns `GRAPHQL_VALIDATION_FAILED: Cannot query field "whitelisted"… Did you mean "listed"?`. Use `listed`; the docs mark it as the replacement. `VaultWarning.type` also includes `not_whitelisted`.

### D.1 Working query: Vaults V1 (MetaMorpho), top USDC on Base + Ethereum

```graphql
query TopUsdcVaultsV1($chainIds: [Int!], $first: Int = 5) {
  vaults(first: $first, orderBy: TotalAssetsUsd, orderDirection: Desc,
         where: { chainId_in: $chainIds, assetSymbol_in: ["USDC"], listed: true }) {
    pageInfo { count countTotal }
    items {
      address name symbol listed featured
      chain { id network }
      asset { address symbol decimals }
      liquidity { underlying usd }
      warnings { type level }
      state {
        totalAssets totalAssetsUsd apy netApy netApyExcludingRewards fee timelock
        curator owner guardian
        curators { name verified }
        allRewards { asset { symbol address } supplyApr }
      }
    }
  }
}
# variables: {"chainIds":[8453,1],"first":6}
```

Abbreviated response (2026-10-11 ~18:30 UTC; `countTotal: 30` listed USDC V1 vaults on these two chains):

```json
{"data":{"vaults":{"pageInfo":{"count":6,"countTotal":30},"items":[{
  "address":"0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61","name":"Gauntlet USDC Prime","symbol":"gtUSDCp",
  "listed":true,"featured":true,"chain":{"id":8453,"network":"Base"},
  "asset":{"address":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","symbol":"USDC","decimals":6},
  "liquidity":{"underlying":182167086383618,"usd":182100856.02},"warnings":[],
  "state":{"totalAssets":414494979661198,"totalAssetsUsd":414344282.0,"apy":0.046183,"netApy":0.046183,
    "netApyExcludingRewards":0.046183,"fee":0,"timelock":604800,
    "curator":"0x9E33faAE38ff641094fa68c65c2cE600b3410585","owner":"0x5a4E19842e09000a582c20A4f524C26Fb48Dd4D0",
    "guardian":"0x7084bF4dB6c21e1834dD6482f6056a39A33584cD","curators":[{"name":"Gauntlet","verified":true}],"allRewards":[]}}]}}}
```

Top 6 (Base and Ethereum, V1):

| Vault | Chain | TVL | Liquidity | APY / net APY | Fee | Timelock |
|---|---|---|---|---|---|---|
| Gauntlet USDC Prime `0xeE8F…4b61` | Base | $414.3M | $182.1M | 4.62% / 4.62% | 0 | 7d |
| Spark USDC Vault `0x7BfA…F34A` | Base | $390.0M | $170.0M | 4.61% / 4.14% | 10% | 10d |
| Steakhouse USDC `0xbeeF…8183` | Base | $121.1M | $119.6M | 4.62% / 3.44% | 25% | 7d |
| Steakhouse USDC `0xBEEF…64CB` | Eth | $65.3M | $48.9M | 4.52% / 4.29% | 5% | 7d |
| Gauntlet USDC Prime `0xdd0f…490d` | Eth | $22.0M | $17.5M | 4.49% / 4.26% | 5% | 7d |
| Spark Blue Chip USDC `0x56A7…581D` | Eth | $18.8M | $18.8M | 4.49% / 4.44% | 1% | 10d |

### D.2 Working query: Vaults V2, top USDC on Base + Ethereum

```graphql
query TopUsdcVaultsV2($chainIds: [Int!], $assets: [Address!], $first: Int = 5) {
  vaultV2s(first: $first, orderBy: TotalAssetsUsd, orderDirection: Desc,
           where: { chainId_in: $chainIds, assetAddress_in: $assets, listed: true }) {
    pageInfo { count countTotal }
    items {
      address name symbol listed type
      chain { id network }
      asset { address symbol decimals }
      totalAssets totalAssetsUsd idleAssetsUsd liquidity liquidityUsd
      apy netApy netApyExcludingRewards performanceFee managementFee maxApy
      curators { items { name verified } }
      curator { address } owner { address }
      liquidityAdapter { address type }
      rewards { asset { symbol address } supplyApr }
      warnings { type level }
      timelocks { functionName duration }
    }
  }
}
# variables: {"chainIds":[8453,1],
#  "assets":["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],"first":6}
```

Abbreviated response (`countTotal: 84` listed USDC V2 vaults):

```json
{"data":{"vaultV2s":{"pageInfo":{"count":6,"countTotal":84},"items":[{
  "address":"0xbeef0e0834849aCC03f0089F01f4F1Eeb06873C9","name":"Steakhouse Prime USDC","symbol":"steakUSDC",
  "listed":true,"type":"MorphoVault","chain":{"id":8453,"network":"Base"},
  "asset":{"address":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","symbol":"USDC","decimals":6},
  "totalAssets":209401279774069,"totalAssetsUsd":209325147.89,"idleAssetsUsd":0,
  "liquidity":170097934523812,"liquidityUsd":170036092.13,"apy":0.046172,"netApy":0.046172,
  "performanceFee":0,"managementFee":0,"maxApy":6.389,
  "curators":{"items":[{"name":"Steakhouse Financial","verified":true}]},
  "curator":{"address":"0x827e86072B06674a077f592A531dcE4590aDeCdB"},"owner":{"address":"0x639bfA26472906Ccd40513408284a8aD292bC5D6"},
  "liquidityAdapter":{"address":"0xfDd31Cdf6712c47A4e67037D9F2E35587f5404C0","type":"MorphoMarketV1"},
  "rewards":[],"warnings":[],
  "timelocks":[{"functionName":"setIsAllocator","duration":0},{"functionName":"setReceiveSharesGate","duration":604800}, "…18 entries"]}]}}}
```

Top 6 (V2):

| Vault | Chain | TVL | Liquidity | APY / net APY | Perf. fee | Mgmt fee |
|---|---|---|---|---|---|---|
| Steakhouse High Yield USDC Edition `0xbeef…8845` | Base | $463.8M | **$38.2M** | 4.15% / 3.10% | 25% | 0 |
| Grove x Steakhouse USDC `0xbeef…e7c7` | Base | $262.0M | $170.0M | 4.62% / 4.62% | 0 | 0 |
| Steakhouse Prime USDC `0xbeef…73C9` | Base | $209.3M | $170.0M | 4.62% / 4.62% | 0 | 0 |
| Gauntlet USDC Prime `0x050c…56f0` | Base | $186.3M | $170.1M | 4.61% / 4.61% | 0 | 0 |
| Gauntlet USDC Prime `0x8c10…A3D0` | Eth | $120.2M | $33.3M | 4.49% / 4.49% | 0 | 0 |
| Steakhouse Prime USDC `0xbeef…0f51` | Eth | $112.9M | $33.3M | 4.52% / 4.52% | 0 | 0 |

Every V2 vault above reports `liquidityAdapter.type = MorphoMarketV1`.

**Warning / risk flags observed** (all vaults on chains 1 and 8453):

- **V1 `VaultWarning.type`:** `short_timelock`(RED), `deposit_disabled`(RED), `not_whitelisted`(YELLOW), `low_liquidity`(YELLOW), `unrecognized_deposit_asset`(YELLOW), `invalid_name`/`invalid_symbol`(RED), `oracle_unusable`(RED), `oracle_price_derivation`(RED), `custom`(RED).
- **V2 `VaultV2Warning.type`:** `timelock`(RED), `not_whitelisted`(YELLOW), `low_liquidity`(YELLOW), `multiple_vault_adapters`(YELLOW), `multiple_market_v1_adapters`(YELLOW), `unrecognized_asset`(YELLOW), `bad_debt_unrealized`(RED), `deposit_disabled`(RED), `oracle_price_derivation`(RED), `custom`(RED).
- Levels: V1 `YELLOW|RED`; V2 `YELLOW|RED|GREEN`.

**Rewards caveat:** the Morpho API returned `rewards: []` and `netApy` 3.10% for "Steakhouse High Yield USDC Edition" on Base. DefiLlama lists the same vault (`SIRLOINUSDC`, $463.7M) with `apyReward: 2.68`. External incentives (likely Merkl) are therefore **not** in the Morpho `rewards` field. Reconcile them separately or show "base APY" only.

### D.3 V1 vs V2 differences relevant to integration

Sources: https://docs.morpho.org/learn/concepts/vault-v2 ; morpho-org/vault-v2 `src/VaultV2.sol`; morpho-org/metamorpho `src/MetaMorpho.sol`.

| | Vault V1 (MetaMorpho / V1.1) | Vault V2 |
|---|---|---|
| Allocation | Morpho Blue markets via supply/withdraw queues | **Adapters** (Morpho market adapter, vault adapters, …); a single `liquidityAdapter` serves withdrawals |
| Roles | owner, curator, allocator, guardian | owner, curator, allocator, **sentinel** |
| Timelock | one vault `timelock` (API `state.timelock`, seconds) | **per-function** timelocks (API `timelocks{functionName,duration}`, 18 entries), 0–3 weeks, plus **abdication** |
| Fees | one performance `fee` | `performanceFee` (≤50%) plus `managementFee` (≤5%/yr) |
| Gates | none | optional send/receive share and asset gates (KYC/whitelist) |
| `maxDeposit/maxMint/maxWithdraw/maxRedeem` | Spec-compliant. `maxWithdraw(owner)` simulates withdrawing through the withdraw queue, so it returns **min(user assets, withdrawable market liquidity)** and "May be lower than the actual amount … due to conversion roundings". | **Always return 0** (`function maxWithdraw(address) external pure returns (uint256) { return 0; }`). On-chain: `maxDeposit(0x…01)` returned 0 on `0xbeef0e08…73C9` (Base), while V1 `0xeE8F…4b61` returned a non-zero value. Use the Morpho SDK `vaultData.maxWithdraw(userShares)` (returns `{value, limiter}`) or the API `liquidity`. |
| Exit when illiquid | wait for liquidity (queue) | idle assets plus liquidity adapter first. Otherwise anyone can call **`forceDeallocate(address adapter, bytes data, uint256 assets, address onBehalf)`** (`0xe4d38cd8`), which pays the curator-set penalty, and then withdraw. |
| Share decimals | `DECIMALS_OFFSET = 18 - asset.decimals`. USDC vault shares have **18 decimals** (confirmed `decimals()=18`). | 18 decimals (confirmed on `0xbeef0e…`) |
| Pragma | MetaMorpho `0.8.21` | `pragma solidity 0.8.28` |

**Withdrawal semantics.** Source: https://docs.morpho.org/developers/earn/tutorials/assets-flow

- "A withdrawal is paid from the vault's idle assets first, then from the liquidity adapter." Assets in other adapters are not available to plain withdrawals.
- Neither method checks gates, so simulate with `eth_call`.
- V1 withdrawals are instant when the queued markets have unborrowed liquidity.
- `liquidity`/`liquidityUsd` is **shared market liquidity** and not reserved for one depositor. For example, several Base USDC vaults show the same ~$170M because they share markets.

---

## E. Aave v3

**Addresses:** from **`aave-dao/aave-address-book`** (the GitHub repo moved from bgd-labs and was pushed 2026-10-11).

- The npm package is now **`@aave-dao/aave-address-book@4.73.2`**.
- `@bgd-labs/aave-address-book` is stale at 4.44.22 (last published 2026-02-19), but not marked deprecated.
- Files: `src/AaveV3{Ethereum,Base,Arbitrum,Optimism,Polygon,Sepolia,BaseSepolia}.sol`.

| Chain | Pool | PoolAddressesProvider | AaveProtocolDataProvider | UiPoolDataProviderV3 | UiIncentiveDataProviderV3 |
|---|---|---|---|---|---|
| Ethereum (Core) | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e` | `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` | `0x2dAd8162A989cd99D673dE4425Bb2298Db1E1aA2` | `0xe3dFf4052F0bF6134ACb73bEaE8fe2317d71F047` |
| Base | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` | `0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D` | `0x0F43731EB8d45A581f4a36DD74F5f358bc90C73A` | `0x0C6BC4a12039788be08F87e87Cff87FEDbd1D386` | `0x91E04cf78e53aEBe609e8a7f2003e7EECD743F2B` |
| Arbitrum | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb` | `0x243Aa95cAC2a25651eda86e80bEe66114413c43b` | `0x91E04cf78e53aEBe609e8a7f2003e7EECD743F2B` | `0x68100bD5345eA474D93577127C11F39FF8463e93` |
| Optimism | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb` | `0x243Aa95cAC2a25651eda86e80bEe66114413c43b` | `0x68100bD5345eA474D93577127C11F39FF8463e93` | `0x5c5228aC8BC1528482514aF3e27E692495148717` |
| Polygon | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb` | `0x243Aa95cAC2a25651eda86e80bEe66114413c43b` | `0x66E1aBdb06e7363a618D65a910c540dfED23754f` | `0x91E04cf78e53aEBe609e8a7f2003e7EECD743F2B` |
| Sepolia | `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951` | `0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A` | `0x3e9708d80f7B3e43118013075F7e95CE3AB31F31` | `0x69529987FA4A075D0C00B0128fa848dc9ebbE9CE` | `0xBA25de9a7DC623B30799F33B770d31B44c2C3b77` |
| Base Sepolia | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` | `0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00` | `0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b` | `0x3cB7B00B6C09B71998124196691e8bF2694De863` | `0xDB1412acf288D5bE057f8e90fd7b1BF4f84bB3B1` |

USDC reserves and aTokens (address book):

| Chain | USDC (address-book name) | aToken |
|---|---|---|
| Ethereum | USDC `0xA0b8…eB48` | `0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c` |
| Base | USDC `0x8335…2913` | `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB` |
| Arbitrum | `USDCn` `0xaf88…5831` | `0x724dc807b04555b71ed48a6896b6F41593b8C637` |
| Optimism | `USDCn` `0x0b2C…Ff85` | `0x38d693cE1dF5AaDF7bC62595A37D667aD57922e5` |
| Polygon | `USDCn` `0x3c49…3359` | `0xA4D94019934D8333Ef880ABFFbF2FDd611C762BD` |

Other notes:

- Aave also lists `USDCe` (bridged) reserves on Arbitrum, Optimism and Polygon.
- Base Sepolia and Sepolia use **Aave-specific test USDC**: `0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f` and `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8`. These are **not** Circle's testnet USDC.

### E.1 Supply APY from on-chain `liquidityRate`

`currentLiquidityRate` is an annualized APR in **RAY (1e27)**. Aave compounds per second:

```
APR = liquidityRate / 1e27
APY = (1 + APR / 31_536_000) ^ 31_536_000 − 1
```

Rates are in RAY and `SECONDS_PER_YEAR = 365 days` (Aave v3 `MathUtils`). The secondary source is the Aave docs page for the Interest Rate Strategy (`https://aave.com/docs/aave-v3/smart-contracts/interest-rate-strategy.md`).

**Live check on Base, 2026-10-11:**

- `Pool.getReserveData(USDC)` word 3 and `AaveProtocolDataProvider.getReserveData(USDC)` field 6 both returned `currentLiquidityRate = 41563949235092270501610553`.
- That gives APR **4.1564%** and APY **4.2440%**.
- The official Aave API returned `supplyInfo.apy.value = 0.042439822920742…`, an exact match. DefiLlama's `apy` for the same pool is 4.15059, which is effectively the APR.

### E.2 Official Aave API: **yes**

**`https://api.v3.aave.com/graphql`** ("AaveKit API"). It is public and keyless. The docs index says: "The APIs are permissionless: no keys and no sign-in of any kind".

- Read queries: `markets`, `market`, `reserve`, `supplyAPYHistory`, `borrowAPYHistory`, `userSupplies`, `userMarketState`, `usdExchangeRates`, …
- Transaction builders: `supply`, `withdraw`, `borrow`, `repay`, `vaultDeposit`, … These return `TransactionRequest` or `ExecutionPlan` objects.
- **Aave v4** also has `https://api.v4.aave.com/graphql`. It lists chains 1, 43114, 10, 5042 (Arc) and 8453.
- SDKs: `@aave/client` and `@aave/react` **6.7.0**.
- Sources: https://aave.com/docs/llms.txt ; https://aave.com/docs/aave-v3/getting-started/graphql.md

Working query (tested; returned the AaveV3Base, AaveV3Ethereum, EtherFi, Lido and Horizon markets):

```graphql
query AaveUsdcReserves($chainIds: [ChainId!]!) {
  markets(request: { chainIds: $chainIds }) {
    name address chain { chainId name }
    reserves {
      underlyingToken { symbol address decimals }
      aToken { address }
      isFrozen isPaused
      size { usd }
      supplyInfo { apy { value formatted } total { value } supplyCapReached }
      borrowInfo { apy { value } availableLiquidity { amount { value } usd } utilizationRate { value } }
    }
  }
}
# variables {"chainIds":[8453,1]}
```

Results:

- **AaveV3Base USDC:** sizeUsd 181.25M, supply APY 0.04244, available liquidity $17.39M, utilization 90.4%.
- **AaveV3Ethereum USDC:** $2.418B, supply APY 0.04470, available $134.3M, utilization 94.4%.
- **Rate limits:** not documented. Could not verify.

---

## F. Chainlink Data Feeds

**Source:** the Chainlink reference data directory JSON that backs `data.chain.link` and docs.chain.link: `https://reference-data-directory.vercel.app/feeds-{mainnet|ethereum-mainnet-base-1|ethereum-mainnet-arbitrum-1|ethereum-mainnet-optimism-1|matic-mainnet|ethereum-testnet-sepolia|ethereum-testnet-sepolia-base-1}.json`.

**Every proxy below was checked on-chain** (`cl/verify.txt`): `description()`, `decimals()` and `latestRoundData()` all matched, and every feed returned a fresh answer.

**Use the standard feeds, not the SVR ones.** Many pairs now have extra **SVR** ("Smart Value Recapture") proxies (`path` ending in `-svr` or `-shared-svr`, some with 18 decimals). Those are intended for specific liquidation protocols, so use the standard feed listed here.

**Base ETH/USD:** the standard proxy appears only as `secondaryProxyAddress` (`secondaryProxyEns: "eth-usd"`) on the Shared-SVR entry.

Heartbeats are in seconds; deviation is `threshold` in %.

| Chain | Pair | Proxy | Dec | Heartbeat | Deviation |
|---|---|---|---|---|---|
| Ethereum | USDC/USD | `0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6` | 8 | 82800 | 0.25 |
| Ethereum | USDT/USD | `0x3E7d1eAB13ad0104d2750B8863b489D65364e32D` | 8 | 86400 | 0.25 |
| Ethereum | DAI/USD | `0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9` | 8 | 3600 | 0.25 |
| Ethereum | USDS/USD | `0xfF30586cD0F29eD462364C7e81375FC0C71219b1` | 8 | 82800 | 0.3 (cat: medium) |
| Ethereum | ETH/USD | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` | 8 | 3600 | 0.5 |
| Ethereum | EURC/USD | `0x04F84020Fdf10d9ee64D1dcC2986EDF2F556DA11` | 8 | 86400 | 0.3 |
| **Base** | **USDC/USD** | **`0x7e860098F58bBFC8648a4311b374B1D669a2bc6B`** | 8 | 86400 | 0.3 |
| **Base** | **USDT/USD** | **`0xf19d560eB8d2ADf07BD6D13ed03e1D11215721F9`** | 8 | 86400 | 0.3 |
| **Base** | **DAI/USD** | **`0x591e79239a7d679378eC8c847e5038150364C78F`** | 8 | 86400 | 0.3 |
| **Base** | USDS/USD | `0x2330aaE3bca5F05169d5f4597964D44522F62930` | 8 | 86400 | 0.5 (medium) |
| **Base** | **ETH/USD** | **`0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70`** | 8 | 1200 | 0.15 |
| **Base** | **EURC/USD** | **`0xDAe398520e2B67cd3f27aeF9Cf14D93D927f8250`** | 8 | 86400 | 0.3 |
| Arbitrum | USDC/USD | `0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3` | 8 | 255 | 0.1 |
| Arbitrum | USDT/USD | `0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7` | 8 | 255 | 0.1 |
| Arbitrum | DAI/USD | `0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB` | 8 | 86400 | 0.1 |
| Arbitrum | USDS/USD | `0x37833E5b3fbbEd4D613a3e0C354eF91A42B81eeB` | 8 | 86400 | 0.5 (medium) |
| Arbitrum | ETH/USD | `0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612` | 8 | 1755 | 0.05 |
| Arbitrum | EURC/USD | `0xCF9752295D0ac9215461fA095faFEC1B854b849B` | 8 | 86400 | 0.3 |
| Optimism | USDC/USD | `0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3` | 8 | 86400 | 0.1 |
| Optimism | USDT/USD | `0xECef79E109e997bCA29c1c0897ec9d7b03647F5E` | 8 | 86400 | 0.1 |
| Optimism | DAI/USD | `0x8dBa75e83DA73cc766A7e5a0ee71F656BAb470d6` | 8 | 86400 | 0.1 |
| Optimism | ETH/USD | `0x13e3Ee699D1909E989722E753853AE30b17e08c5` | 8 | 1200 | 0.15 |
| Optimism | EURC/USD | `0xDb2A51a5DD73865F1b0d1c33F99a96E0e7ae742c` | 8 | 86400 | 0.5 |
| Polygon | USDC/USD | `0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7` | 8 | 27 | 0.005 |
| Polygon | USDT/USD | `0x0A6513e40db6EB1b165753AD52E80663aeA50545` | 8 | 27 | 0.005 |
| Polygon | DAI/USD | `0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D` | 8 | 27 | 0.01 |
| Polygon | ETH/USD | `0xF9680D99D6C9589e2a93a78A04A279e509205945` | 8 | 27 | 0.1 |
| Base Sepolia | USDC/USD | `0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165` | 8 | 86400 | 0.1 |
| Base Sepolia | USDT/USD | `0x3ec8593F930EA45ea58c968260e6e9FF53FC934f` | 8 | 86400 | 0.1 |
| Base Sepolia | DAI/USD | `0xD1092a65338d049DB68D7Be6bD89d17a0929945e` | 8 | 86400 | 0.1 |
| Base Sepolia | ETH/USD | `0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1` | 8 | 1200 | 0.15 |
| Sepolia | USDC/USD | `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E` | 8 | 86400 | 1 |
| Sepolia | ETH/USD | `0x694AA1769357215DE4FAC081bf1f309aDC325306` | 8 | 3600 | 1 |
| Sepolia | DAI/USD | `0x14866185B1962B63C3Ea9E03Bc1da838bab34C19` | 8 | 86400 | 1 |

Gaps in the directory:

- No USDT/USD or EURC/USD on Sepolia.
- No EURC/USD on Base Sepolia or Polygon.
- No Polygon EURC.

**L2 Sequencer Uptime Feeds: yes, check them on Base, Arbitrum and Optimism.** Docs: "Answer == 0: Sequencer is up", "Answer == 1: Sequencer is down". Check before consuming prices, and enforce a grace period after recovery: the example uses `GRACE_PERIOD_TIME = 3600` computed from `startedAt`. Source: https://docs.chain.link/data-feeds/l2-sequencer-feeds

| Chain | Sequencer Uptime Feed proxy | On-chain now |
|---|---|---|
| Base | `0xBCF85224fc0756B9Fa45aA7892530B47e10b6433` | answer 0 (up) |
| Arbitrum | `0xFdB631F5EE196F0ed6FAa767959853A9F217697D` | answer 0 (up) |
| Optimism | `0x371EAD81c9102C9BF4874A9075FFFf170F2Ee389` | answer 0 (up) |

**Staleness rule:** reject a price when `block.timestamp - updatedAt > heartbeat + buffer`. Stablecoin feeds on Base, Ethereum and OP use **82800–86400 s** heartbeats, so a 24 h-old USDC price is normal. Live ages ranged from about 1 minute (ETH) to about 23 h (OP USDC).

---

## G. Canonical stablecoin addresses

Sources:

- Circle USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses
- Circle EURC: https://developers.circle.com/stablecoins/eurc-contract-addresses
- Tether: https://tether.to/en/supported-protocols/ (Ethereum only for EVM L1/L2 here)
- USDT0: https://docs.usdt0.to/technical-documentation/deployments
- Sky chainlog (Ethereum DAI/USDS): https://chainlog.skyeco.com/api/mainnet/active.json (redirect target of chainlog.sky.money)
- Aave address book (bridged variants)

Every row was also checked on-chain for `symbol()`, `name()` and `decimals()` (`tokens.txt`).

| Chain | USDC (native, Circle) | USDT | DAI | USDS | EURC (Circle) |
|---|---|---|---|---|---|
| Ethereum | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (6) | `0xdAC17F958D2ee523a2206206994597C13D831ec7` (6; **no bool return on transfer**, use SafeERC20) | `0x6B175474E89094C44Da98b954EedeAC495271d0F` (18) | `0xdC035D45d973E3EC169d2276DDab16f1e407384F` (18) | `0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c` (6) |
| Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6) | none native from Tether. Bridged "Tether USD" `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` exists (on-chain only; **flag**) | bridged `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` (on-chain only) | `0x820C137fa70C8691f0e44Dc420a5e53c168921Dc` (on-chain "USDS Stablecoin"; not in an official doc I could fetch) | `0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42` (6) |
| Arbitrum | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` (6) | **USDT0** `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` (legacy USDT address upgraded in place; on-chain symbol **"USD₮0"**, with a Unicode ₮) | bridged `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1` | `0x6491c05A82219b8D1479057361ff1654749b876b` (on-chain only) | **not listed by Circle** (a Chainlink EURC/USD feed exists; flag) |
| Optimism | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` (6) | **USDT0** `0x01bFF41798a0BcF287b996046Ca68b395DbC1071`. The legacy bridged USDT `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58` still has the larger supply and is the Aave reserve. | bridged `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1` | `0x4F13a96EC5C4Cf34e442b46Bbd98a0791F20edC3` (on-chain only; tiny supply) | not listed by Circle |
| Polygon PoS | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` (6) | **USDT0** `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` (upgraded in place; symbol "USDT0") | bridged PoS DAI `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` | n/a | not listed by Circle |
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | none | none | none | `0x808456652fdb597867f38412077A9182bf77359F` |
| Sepolia | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | none | none | none | `0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4` |

**Bridged variants to flag in the UI:**

| Token | Chain | Address | Note |
|---|---|---|---|
| USDbC | Base | `0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA` | symbol `USDbC`, "USD Base Coin" |
| USDC.e | Arbitrum | `0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8` | symbol reads **`USDC`**, name "USD Coin (Arb1)" |
| USDC.e | Optimism | `0x7F5c764cBc14f9669B88837ca1490cCa17c31607` | symbol reads **`USDC`**, name "USD Coin". Indistinguishable by metadata, so **match on address**. |
| USDC.e | Polygon | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` | symbol `USDC`, name "USD Coin (PoS)" |
| USDT (legacy) | Optimism | `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58` | Bridged; USDT0 is the new one |
| USDT | Base | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | Bridged; not Tether-issued per Tether's list |

Testnet USDC used by Aave (`0xba50…4D5f` Base Sepolia, `0x94a9…E4C8` Sepolia) is different from Circle's testnet USDC.

---

## H. Public RPC endpoints (development reads and forking)

Tested 2026-10-11 with `eth_chainId`, `eth_getCode(multicall3)` and a historical `eth_getBalance` at block 1,000,000 (archive probe), plus a 30-request concurrent burst. Raw data: `rpc-test.txt`.

| Endpoint | Chain | Works | Archive / old state | Burst of 30 | Notes |
|---|---|---|---|---|---|
| `https://mainnet.base.org` | 8453 | ✅ | ✅ | **25×200, 5×429** | Official. Docs list it and `https://sepolia.base.org`. |
| `https://sepolia.base.org` | 84532 | ✅ | ✅ | n/t | |
| `https://base-rpc.publicnode.com` | 8453 | ✅ | ❌ "Archive requests require a personal token" | 30×200 | Fine for forking at latest; not for historical blocks |
| `https://base.drpc.org` | 8453 | ✅ | ✅ | 30×200 | |
| `https://ethereum-rpc.publicnode.com` | 1 | ✅ | ❌ (token required) | 30×200 | |
| `https://eth.drpc.org` | 1 | ✅ | ✅ | 30×200 | |
| `https://arb1.arbitrum.io/rpc` | 42161 | ✅ | ❌ "missing trie node" | 30×200 | Official |
| `https://arbitrum-one-rpc.publicnode.com` | 42161 | ✅ | ❌ (token) | n/t | |
| `https://mainnet.optimism.io` | 10 | ✅ | ✅ | 30×200 | Official |
| `https://optimism-rpc.publicnode.com` | 10 | ✅ | ❌ (token) | n/t | |
| `https://ethereum-sepolia-rpc.publicnode.com` | 11155111 | ✅ | ❌ (pruned) | n/t | |
| `https://sepolia.drpc.org` | 11155111 | ✅ | ✅ | n/t | |
| `https://polygon-bor-rpc.publicnode.com` | 137 | ✅ | ❌ (token) | n/t | |
| `https://eth.llamarpc.com`, `base.llamarpc.com`, `arbitrum.llamarpc.com`, `optimism.llamarpc.com` | — | ❌ | — | — | HTTP 525 or empty. **Unusable today.** |
| `https://cloudflare-eth.com` | 1 | chainId only | ❌ "Internal error" on `eth_getCode` | — | unusable |
| `https://eth.merkle.io` | 1 | ⚠️ | — | — | "Rate limit exceeded" on the 2nd call |
| `https://rpc.ankr.com/eth` | — | ❌ | — | — | "You must authenticate your request with an API key" |
| `https://1rpc.io/eth` | — | ❌ | — | — | 502 |
| `https://rpc.sepolia.org` | — | ❌ | — | — | 404 HTML |
| `https://polygon-rpc.com` | — | ❌ | — | — | "API key disabled, reason: tenant disabled" |

Recommendations:

- Use a keyed provider (Alchemy, Infura, QuickNode or dRPC paid) for production and for historical forks.
- For development reads, use `mainnet.base.org` with low concurrency (it throttles at roughly 25 concurrent requests), plus `drpc.org` or `publicnode`.

**Multicall3 at `0xcA11bde05977b3631167028862bE2a173976CA11`:**

- Code is present on all 7 chains (`eth_getCode` returned non-empty).
- viem's chain definitions hard-code it for `mainnet` (blockCreated 14353601), `base` (5022), `arbitrum` (7654707), `optimism` (4286263), `baseSepolia` (1059647), `sepolia` (751532) and `polygon` (25770160).
- The mds1/multicall3 README says it "is deployed on over 250 chains" at that address.
- Sources: `wevm/viem` `src/chains/definitions/*.ts`; https://github.com/mds1/multicall3

---

## I. DefiLlama

| API | Status (2026-10-11) | Notes |
|---|---|---|
| **Yields: `GET https://yields.llama.fi/pools`** | **Free, no key**, HTTP 200. 16,946 pools; response `{status:"success", data:[...]}`. | Each pool has: `pool` (UUID, **not** the vault address), `chain`, `project`, `symbol`, `tvlUsd`, `apy`, `apyBase`, `apyReward`, `rewardTokens`, `underlyingTokens`, `poolMeta`, `stablecoin`, `ilRisk`, `exposure`, `predictions{predictedClass,…}`, `mu`, `sigma`, `count`, `outlier`, `apyBase7d`, `apyMean30d`, `apyPct1D/7D/30D`, `il7d`, `apyBaseInception`, `volumeUsd1d/7d`. <br>Project slugs: `aave-v3` (182), `aave-v4` (40), `morpho-blue` (635; includes V1 and V2 vaults by symbol, e.g. `GTUSDCP`, `SIRLOINUSDC`). <br>For lending pools, `tvlUsd` is **supply minus borrows**: Aave Base USDC shows $17.4M against a $181M market size. |
| Yields chart: `GET https://yields.llama.fi/chart/{pool}` | Free; 946 daily points for Aave Base USDC | `{timestamp, tvlUsd, apy, apyBase, apyReward, il7d, apyBase7d, pricePerShare}` |
| **Coins: `GET https://coins.llama.fi/prices/current/{chain:addr,…}?searchWidth=4h`** | **Free**, HTTP 200 | `{coins:{"base:0x8335…":{decimals,symbol,price,timestamp,confidence}}}`. Also `coingecko:ethereum`. Historical: `/prices/historical/{unix}/{coins}`. Others: `/batchHistorical`, `/chart/{coins}`, `/percentage/{coins}`, `/prices/first/{coins}`, `/block/{chain}/{ts}`. |
| Pro | `https://pro-api.llama.fi/{API_KEY}/…`, "requires a paid API key ($300/mo)". It re-exposes the free endpoints with higher rate limits and adds `/yields/poolsOld` (includes `pool_old`, "usually contains pool address (but not guaranteed)") and `/yields/poolsBorrow`. | https://api-docs.defillama.com/llms-pro.txt , https://api-docs.defillama.com/llms-free.txt |

Free-tier rate limits are **not documented** in the fetched docs.

---

## J. ERC-7540 and ERC-4626 notes

**Status** (`ethereum/ERCs` master, front-matter):

| ERC | Title | Status | Notes |
|---|---|---|---|
| ERC-4626 | Tokenized Vaults | **Final** | |
| ERC-7540 | Asynchronous ERC-4626 Tokenized Vaults | **Final** | Requires 20, 165, 4626 and 7575 |
| ERC-7575 | Multi-Asset ERC-4626 Vaults | **Final** | |
| ERC-7887 | Cancelation for ERC-7540 Tokenized Vaults | Draft | |

**ERC-7540 for integrators:**

- Async deposit or redeem flows go `requestDeposit/requestRedeem` → pending → claimable → `deposit/redeem`.
- In async mode, `previewDeposit/previewMint` (and `previewRedeem/previewWithdraw`) **MUST revert**.
- ERC-165 IDs:
  - `0xe3bc4e65` (operator methods)
  - `0x2f0a18c5` (ERC-7575)
  - `0xce3bbe50` (async deposit)
  - `0x620ee8e4` (async redeem)
- Detect these IDs and do not treat such vaults as instant. None of the Morpho or Aave targets above are async.

**ERC-4626 rounding and inflation considerations:**

- **Rounding:** the spec says `convertTo*` and the `max*`/`preview*` functions "MUST round down" where specified. It favors the vault: round down shares minted and assets returned, round up shares burned and assets pulled. `previewRedeem` and `previewMint` are not interchangeable, so use the preview that matches the action.
- **Inflation or donation attack:** OpenZeppelin explains that "if you deposit <1 share worth of tokens, then you get 0 shares, and you basically made a donation". It mitigates this with a virtual offset and virtual shares. MetaMorpho uses `DECIMALS_OFFSET = 18 - assetDecimals` (USDC vault shares have 18 decimals), and Morpho documents "dead deposits" for new V1/V2 vaults.
- **Integrator rules:**
  1. Never deposit into empty or near-empty vaults.
  2. Compute `minShares = previewDeposit(assets) * (1 - slippage)` off-chain and check shares received after a simulated execution. Plain `deposit()` has no min-out, so use the Safe tx simulation, a router, or a guard post-check.
  3. On V2, do not use `max*` (they return 0).
  4. USDT approve-to-nonzero quirks don't apply to USDC, but use `approve(exact)` and reset to 0 after deposit if policy requires.
- Sources:
  - https://github.com/ethereum/ERCs/blob/master/ERCS/erc-4626.md
  - https://github.com/ethereum/ERCs/blob/master/ERCS/erc-7540.md
  - https://docs.openzeppelin.com/contracts/5.x/erc4626
  - https://docs.morpho.org/llms.txt ("Vault V1 Dead Deposit", "Vault V2 Dead Deposit")

---

## K. Package versions (npm registry `latest` dist-tag, 2026-10-11)

| Package | Version | Notes and breaking changes for a fresh build |
|---|---|---|
| next | **16.4.0** | **Next 16:** <br>• Node ≥20.9 and TS ≥5.1. <br>• **Turbopack is the default for `next dev` and `next build`**; a custom `webpack` config makes the build fail unless you pass `--webpack`. <br>• **Sync access to `cookies()`, `headers()`, `draftMode()`, `params` and `searchParams` is removed** (async only); OG/icon `params`/`id` and sitemap `id` are promises. <br>• **`middleware.ts` → `proxy.ts`** (exported `proxy()`), runtime **nodejs only**; keep `middleware` if you need edge. <br>• `next lint` is removed. <br>• `revalidateTag(tag, profile)` needs 2 args; `updateTag` and `refresh` added. <br>• `cacheComponents` replaces the PPR flags. <br>• Parallel routes need `default.js`. <br>• next/image defaults changed (`qualities:[75]`, `minimumCacheTTL` 4h, local-IP block, 3 max redirects). <br>• `serverRuntimeConfig` and `publicRuntimeConfig` removed. <br>• `next dev` outputs to `.next/dev`. <br>Source: https://nextjs.org/docs/app/guides/upgrading/version-16 (doc v16.4.0, updated 2026-10-02) |
| react / react-dom | **19.3.0** | Next 16 App Router uses React canary features (19.2+) |
| tailwindcss / @tailwindcss/postcss | **4.3.3 / 4.3.3** | **v4:** <br>• CSS-first config: `@import "tailwindcss"` plus `@theme`. <br>• `tailwind.config.js` is not auto-detected (use `@config`). <br>• PostCSS plugin is `@tailwindcss/postcss`; drop autoprefixer and postcss-import. <br>• Renamed utilities: `shadow-sm`→`shadow-xs`, `ring`→`ring-3`, `outline-none`→`outline-hidden`. <br>• Default border and ring colors are `currentColor`. <br>• Important modifier goes at the end (`flex!`). <br>• Safari 16.4+, Chrome 111+, Firefox 128+. <br>Source: https://tailwindcss.com/docs/upgrade-guide |
| motion | **14.1.0** | 14.0.0 (2026-10-02) removed internal APIs kept for framer-motion 13.0–13.4 compatibility. 13.0.0 dropped the optional `@emotion/is-prop-valid` dependency (use `<MotionConfig isValidProp>`). Import from `motion/react`. Source: motiondivision/motion CHANGELOG.md |
| @tanstack/react-query | **5.104.1** | v5 API |
| recharts | **3.10.1** | v3 line; the migration guide could not be fetched (see list at the end) |
| @radix-ui/react-dialog | **1.2.0** | |
| radix-ui (meta) | **1.7.0** | peers React 16.8–19 |
| lucide-react | **1.55.0** | **v1 (2026-03-23):** brand icons removed, `aria-hidden` on by default, no UMD (ESM/CJS only). Source: lucide release 1.0.1 |
| viem | **2.57.4** | `next` tag is 3.0.0-next.13 (v3 in prerelease). Built-in **`viem/siwe`** (`createSiweMessage`, `parseSiweMessage`, `validateSiweMessage`, `generateSiweNonce`) and `publicClient.verifySiweMessage`, which is **ERC-6492/1271 aware** (Safe owners and smart accounts). |
| wagmi | **3.7.7** | **v3:** <br>• All connector SDKs are **optional peer dependencies**; install them yourself, e.g. `@walletconnect/ethereum-provider`, `@coinbase/wallet-sdk`, `@base-org/account`, `@metamask/connect-evm`, `@safe-global/safe-apps-*`. <br>• `useAccount` → **`useConnection`**, `useAccountEffect` → `useConnectionEffect`, `useSwitchAccount` → `useSwitchConnection`. <br>• Mutation hooks return `mutate`/`mutateAsync`. <br>• `.connectors` and `.chains` moved to `useConnectors()`, `useConnections()` and `useChains()`. <br>• **TypeScript ≥5.9.3**; peer `@tanstack/react-query >=5`. <br>Source: https://wagmi.sh/react/guides/migrate-from-v2-to-v3 |
| @reown/appkit / @reown/appkit-adapter-wagmi | **1.8.24 / 1.8.24** | adapter peers `wagmi >=2.19.5`, `viem >=2.55.13`, `@wagmi/core >=2.21.2`, so wagmi 3 satisfies them by semver. Canary 2.0.0 exists. |
| @simplewebauthn/server / browser | **14.0.3 / 14.0.0** | **v14 (2026-09-02):** release notes say Node LTS 22+ (package `engines` still says `>=20`); ML-DSA (PQC) passkeys preferred at registration on supporting runtimes; browser `sendSignal()`. |
| siwe | **3.0.0** | **Peer `ethers ^5.6.8 \|\| ^6.0.8`.** Prefer `viem/siwe` in a viem stack. |
| prisma | ⚠️ **`latest` = 8.0.0-rc.22** (an RC, "Prisma 8", formerly "Prisma Next") | `npm i prisma` installs an **RC of a different ORM** (contracts, `prisma contract emit`, `@prisma/orm-postgres`, Node ≥22.18, ESM). Meanwhile `@prisma/client` `latest` = **7.10.0** and has no 8.x stable. **Pin `prisma@7.10.0` + `@prisma/client@7.10.0` + `@prisma/adapter-pg@7.10.0`** (the `prev` dist-tag is 7.10.0), or deliberately adopt Prisma 8 RC. 7.10.0 adds `@prisma/prisma7` for side-by-side installs. Sources: npm dist-tags; GitHub releases v8.0.0-rc.10 and 7.10.0 |
| @prisma/client | **7.10.0** | **Prisma 7:** <br>• generator `provider = "prisma-client"` (not `prisma-client-js`), and **`output` is required** (not generated into node_modules). <br>• **driver adapter required** (`@prisma/adapter-pg`). <br>• datasource `url` moves to **`prisma.config.ts`**. <br>• Ships as **ESM** (`"type":"module"`). <br>• **env vars not auto-loaded** (use dotenv). <br>• `$use` middleware removed (use extensions). <br>• no auto-seed in migrate dev/reset. <br>• Node ≥20.19 / 22.12 / 24, TS ≥5.4. <br>• MongoDB not supported in v7. <br>Source: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7 |
| @prisma/adapter-pg | 7.10.0 | deps `pg ^8.16.3` |
| fastify | **5.12.5** | v5 line; `next` tag is 6.0.0-alpha.4 |
| @fastify/cookie | **11.1.3** | |
| @fastify/rate-limit | **11.2.1** | |
| @fastify/swagger | **9.9.2** | |
| zod | **4.6.6** | **Zod 4:** <br>• `message` → `error`. <br>• `z.email()`/`z.uuid()` top-level (old `z.string().email()` deprecated). <br>• `z.strictObject`/`z.looseObject` replace `.strict()`/`.passthrough()`. <br>• `z.record(k, v)` needs 2 args. <br>• `.default` applies to the output. <br>• `ZodError.errors` removed (use `.issues`, `z.treeifyError`). <br>• `z.nativeEnum` deprecated. <br>• `z.function()` is no longer a schema. <br>Source: https://zod.dev/v4/changelog |
| fastify-type-provider-zod | **7.0.0** (2026-06-24) | peers `zod >=4.1.5`, `fastify ^5.5.0`, `@fastify/swagger >=9.5.1`, `openapi-types ^12.1.3`. v5 switched to the Zod v4 API; v6 handles OpenAPI 3.0/3.1 automatically. |
| pg-boss | **12.37.1** | **v12:** **ESM + TS, no default export** (`import { PgBoss } from 'pg-boss'`); **Node ≥22.12**; stricter queue-name validation. Source: GitHub release 12.0.0 |
| pino | **10.4.0** | v10 dropped Node 18 (only breaking change) |
| vitest | **5.0.3** | **Vitest 5 (2026-09-03):** <br>• **Node ≥22.12** and Vite ≥6.4. <br>• **mocks cleared before each test by default**. <br>• no config lookup in ancestor directories. <br>• `sequential` option removed. <br>• unawaited async assertions fail. <br>• `toHaveTextContent` strict. <br>• webdriverio package removed. <br>• `@types/node` ^22 or ≥24 peer. <br>Source: GitHub release v5.0.0 |
| @playwright/test | **1.64.0** | Node ≥20 |
| @axe-core/playwright | **4.13.0** | |
| fast-check | **4.10.2** | |
| decimal.js | **10.6.0** | |
| big.js | **7.0.1** | |
| @anthropic-ai/sdk | **0.133.0** | peer `zod ^3.25 \|\| ^4` |
| resend | **6.32.1** | Node ≥20; peer `@react-email/render` |
| nodemailer | **10.1.0** | **v10:** Node ≥20; rewritten in TS with ESM+CJS builds |
| @serwist/next (next-pwa successor) | **9.5.13** (`preview` 10.0.0-preview.14) | Main guide is webpack-based. For **Turbopack** (Next 16 default) follow Serwist's Turbopack guide (`@serwist/turbopack` 9.5.13) or configurator mode (`@serwist/cli`). Peers `next >=14`. `next-pwa` (5.6.0, 2022) and `@ducanh2912/next-pwa` (10.2.9, 2024) are unmaintained. Source: https://serwist.pages.dev/docs/next/getting-started |
| typescript | **7.0.2** | **TS 7.0 = native Go compiler** (announced 2026-07-08; "about 10 times faster than TypeScript 6.0"). TS 6.0 was the last JS-based release. Peer ranges (`>=5.9.3` wagmi, `>=5.4` Prisma) are satisfied by semver. Tooling compatibility (typescript-eslint, editor plugins) is not verified. Source: https://devblogs.microsoft.com/typescript/ |
| eslint | 10.12.0 | Next 16 docs: `eslint-config-next@16` requires ESLint 9. Pin ESLint 9 unless Next confirms v10. |
| @safe-global/protocol-kit / api-kit / types-kit | 8.0.7 / 5.0.3 / 4.0.1 | see B |
| @safe-global/safe-smart-account | 1.5.0 | see A |
| zodiac-roles-sdk / @zodiac-os/sdk / @gnosis-guild/zodiac | 4.1.3 / 1.12.1 / 5.0.1 | see C |
| @aave-dao/aave-address-book (use this, not @bgd-labs) | 4.73.2 | see E |
| @aave/client / @aave/react | 6.7.0 | |
| @morpho-org/blue-sdk / blue-sdk-viem / morpho-sdk | 7.2.0 / 6.2.0 / 6.6.0 | |

**Engine floor for this stack:** **Node 22.12+** (from vitest 5 and pg-boss 12). Prisma 8 RC would need 22.18+. **Use Node 24 LTS.**

---

## Could not verify / open items

1. **Why Zodiac Roles 2.1.0 (`0x9646…D337`) is marked `FAULTY`** in `@gnosis-guild/zodiac`. I found no advisory or PR description (PR #487's body is empty). No audit report covers the 2.1.1 delta either.
2. **Safe API paid plan prices and monthly unit quotas.** The fetched blog post gave RPS tiers but no prices. A search-result summary mentioned €199/€499 and 550k/1M/3M units, but I did not confirm it on a fetched page. The unauthenticated limits (2 RPS, 5,000/month) **are** confirmed by the docs and the live headers.
3. **Safe API auth enforcement details.** An invalid Bearer token still got 200 on `/about/`. Whether invalid keys are rejected on other endpoints, or just downgraded to unauthenticated, is untested.
4. **DefiLlama free-tier rate limits.** Not stated in the fetched docs.
5. **Aave API (`api.v3.aave.com`) rate limits or SLA.** Not documented in the fetched pages.
6. **USDS addresses on Base, Arbitrum and Optimism, and the bridged DAI/USDT on Base.** Verified only on-chain (symbol and name); I could not reach an official Sky L2 address registry (the chainlog only covers mainnet). Base "USDT" `0xfde4…bb2` is **not** Tether-issued.
7. **EURC on Arbitrum and Optimism.** Circle's page does not list them, but Chainlink has EURC/USD feeds there. Treat any EURC there as bridged/unverified.
8. **Recharts 2→3 migration specifics.** The GitHub wiki page failed to load.
9. **TypeScript 7 compatibility** with typescript-eslint, Next.js type-checking and the Prisma generator. Not tested.
10. **Morpho rewards.** The API `rewards` was empty while DefiLlama shows a 2.68% reward APR for the Steakhouse High Yield V2 vault. I did not fetch the Morpho rewards or Merkl API to reconcile.
11. **Exact Aave v3 source line for `SECONDS_PER_YEAR`/compounding.** Not re-read in source this session. The formula is confirmed numerically against the official API (4.2440% on both).
12. **`safe-client.safe.global` returns 403 to non-browser user agents.** Server-side use may need the documented tx-service API instead.

## Address checksum note

Every address in this file was re-validated with `cast to-check-sum-address`; the script output is in `checksum-check.txt`.
