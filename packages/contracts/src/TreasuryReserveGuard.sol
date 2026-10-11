// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {IModuleGuard} from "@safe-global/safe-smart-account/contracts/base/ModuleManager.sol";
import {IERC165} from "@safe-global/safe-smart-account/contracts/interfaces/IERC165.sol";
import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";

/// @dev Minimal view surface of Safe's StorageAccessible (present in Safe v1.5.0).
interface ISafeStorageReader {
    function getStorageAt(uint256 offset, uint256 length) external view returns (bytes memory);
}

/**
 * @title TreasuryReserveGuard
 * @author TokenIQ
 * @notice A Safe v1.5.0 MODULE guard that bounds what automation may do to a treasury Safe.
 *
 *         Automation (for example an agent key acting through a Zodiac Roles Modifier v2 that is
 *         enabled as a module on the Safe) reaches the Safe through `execTransactionFromModule`.
 *         Safe v1.5.0 calls this guard before (`checkModuleTransaction`) and after
 *         (`checkAfterModuleExecution`) every such module transaction. Owner-signed multisig
 *         transactions (`execTransaction`) never reach this contract: it is deliberately NOT a
 *         transaction guard, so the humans keep full, unconditional authority over the Safe —
 *         including removing this guard with `setModuleGuard(address(0))`.
 *
 *         Division of labour with Zodiac Roles: Roles scopes WHAT the automation key may call
 *         (targets, selectors, parameters). This guard enforces HOW MUCH must remain in the Safe
 *         and HOW FAST value may leave it, and provides an instant pause.
 *
 * TRUST MODEL
 * -----------
 * What it protects (for every module transaction, whichever module sends it):
 *  - Reserve floors: after the transaction the Safe's liquid balance of every configured token
 *    (address(0) = native ETH) is >= its floor, otherwise the whole module transaction reverts.
 *  - Outflow limits: the net outflow of a configured token (pre-balance minus post-balance,
 *    measured around each module transaction) is accumulated per fixed window; exceeding the
 *    per-window limit reverts. Inflows never create extra allowance.
 *  - Module allowlist: only modules explicitly allowed by the Safe may execute at all.
 *  - Pause: the Safe or any guardian it designates can pause instantly (one signature for a
 *    guardian); only the Safe can unpause. While paused every module transaction reverts.
 *  - No self-escalation: module transactions may not CALL the Safe itself, this guard, any
 *    allowlisted module (e.g. the Roles modifier, whose owner is the Safe), the Safe's fallback
 *    handler or its transaction guard; may not use DELEGATECALL unless the Safe allowlisted that
 *    exact target; cannot be nested; and cannot change this guard's configuration while in
 *    flight. Inner calls of a `multiSend(bytes)` batch are parsed and held to the same rules.
 *    After every module transaction the guard verifies it is still the installed module guard.
 *  - Approval leak: for configured ERC-20 tokens, module calls to `approve`, `increaseAllowance`,
 *    `increaseApproval` (non-zero amount) and ERC-777 `authorizeOperator` are rejected unless the
 *    spender is allowlisted for that token. Otherwise an approval granted by a module transaction
 *    could be spent later, outside any module transaction, bypassing floors and limits.
 *
 * What it does NOT protect:
 *  - Owner-signed multisig transactions: unrestricted by design (they can go below floors).
 *  - Tokens that are not configured (no floor and no limit): they are invisible to the guard.
 *  - Value held in positions: floors measure the Safe's LIQUID balance only (e.g. USDC, not
 *    vault shares). Shares/receipt tokens are only protected if configured as tokens themselves.
 *    No oracle or price is used anywhere; limits are in token units, per token.
 *  - A malicious or compromised allowlisted module can still move funds WITHIN the floors and
 *    limits (to any destination its own permissions allow). Scope destinations with Roles.
 *  - Code run via an allowlisted DELEGATECALL target executes as the Safe. MultiSend batches are
 *    parsed (above); any other delegatecall payload is opaque: beyond the post-checks (balances,
 *    guard still installed, guard config locked) it could change other Safe state (owners,
 *    modules, fallback handler) or grant approvals. Allowlist only audited targets such as
 *    Safe's MultiSendCallOnly and keep Roles scoping every call.
 *  - Authorization grants on OTHER contracts (e.g. Morpho `setAuthorization`, Aave credit
 *    delegation, Permit2 sub-allowances, operator approvals on vault shares/NFTs) are not
 *    recognised. They can expose positions; Roles must never permit them.
 *  - Approval-like functions other than the four listed above, ERC-2612 permits produced by
 *    owners, and allowances that existed before a token was configured.
 *  - Liveness: a misbehaving configured token (reverting `balanceOf`), a guardian that keeps
 *    pausing, or owners spending a token below its floor (floors are strict post-conditions)
 *    blocks automation; owners fix it with a multisig transaction.
 *  - Module-based recovery: because module transactions may not call the Safe, social-recovery
 *    style modules (swapOwner via execTransactionFromModule) cannot act while this guard is
 *    installed. Do not rely on them alongside this guard.
 *  - It relies on correct Safe v1.5.0 module-guard semantics. Safes older than 1.5.0 (e.g.
 *    1.4.1) have NO module guard: setting it there does nothing. Check `VERSION()` off-chain and
 *    confirm `isActiveOnSafe()` after installation.
 *  - It needs EIP-1153 transient storage (Cancun). Do not deploy on chains without it.
 *
 * Window semantics: a window opens at the first outflow after the previous one expired and lasts
 * `windowSeconds`. Over any interval of length `windowSeconds`, at most 2x the limit can leave
 * (end of one window + start of the next). Lowering a limit keeps the amount already spent in
 * the current window.
 */
contract TreasuryReserveGuard is IModuleGuard {
    // ------------------------------------------------------------------ Types

    /// @notice Per-token policy. `windowSeconds == 0` means the outflow limit is disabled.
    struct TokenPolicy {
        uint256 floor; // minimum balance the Safe must hold after any module transaction
        uint256 outflowLimit; // maximum net outflow per window (only if windowSeconds != 0)
        uint256 spentInWindow; // net outflow already accounted in the current window
        uint64 windowSeconds; // window length; 0 = outflow limit disabled
        uint64 windowStart; // start timestamp of the current window
        uint8 indexPlusOne; // 1-based index into the tracked-token list; 0 = not tracked
    }

    // ------------------------------------------------------------------ Constants

    /// @notice Token key used for the chain's native currency (ETH).
    address public constant NATIVE_TOKEN = address(0);
    /// @notice Upper bound on configured tokens; bounds the gas of every module transaction.
    uint256 public constant MAX_TRACKED_TOKENS = 16;
    /// @notice Longest allowed outflow window.
    uint256 public constant MAX_WINDOW_SECONDS = 365 days;
    /// @dev Safe v1.5.0 ModuleManager storage slot: keccak256("module_manager.module_guard.address").
    uint256 internal constant SAFE_MODULE_GUARD_STORAGE_SLOT =
        0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947;
    /// @dev Safe v1.5.0 FallbackManager storage slot: keccak256("fallback_manager.handler.address").
    uint256 internal constant SAFE_FALLBACK_HANDLER_STORAGE_SLOT =
        0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5;
    /// @dev Safe v1.5.0 GuardManager storage slot: keccak256("guard_manager.guard.address").
    uint256 internal constant SAFE_TRANSACTION_GUARD_STORAGE_SLOT =
        0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8;

    // ABI / MultiSend layout sizes (bytes)
    uint256 private constant _WORD = 32;
    uint256 private constant _SELECTOR_SIZE = 4;
    uint256 private constant _CALL_1_ARG_SIZE = 36; // selector + 1 static argument
    uint256 private constant _CALL_2_ARGS_SIZE = 68; // selector + 2 static arguments
    uint256 private constant _MULTISEND_HEADER_SIZE = 68; // selector + bytes offset + bytes length
    uint256 private constant _MULTISEND_ENTRY_HEADER_SIZE = 85; // operation 1 + to 20 + value 32 + length 32
    uint256 private constant _META_SELECTOR_SHIFT = 8; // _T_META = selector << 8 | operation

    bytes4 private constant _BALANCE_OF = 0x70a08231; // balanceOf(address)
    bytes4 private constant _MULTI_SEND = 0x8d80ff0a; // multiSend(bytes) (Safe MultiSend / MultiSendCallOnly)
    bytes4 private constant _APPROVE = 0x095ea7b3; // approve(address,uint256)
    bytes4 private constant _INCREASE_ALLOWANCE = 0x39509351; // increaseAllowance(address,uint256)
    bytes4 private constant _INCREASE_APPROVAL = 0xd73dd623; // increaseApproval(address,uint256)
    bytes4 private constant _AUTHORIZE_OPERATOR = 0x959b8c3f; // authorizeOperator(address) (ERC-777)

    // Transient storage slots (EIP-1153). Cleared at the end of every module transaction and,
    // in any case, at the end of the enclosing EVM transaction.
    bytes32 private constant _T_TX_HASH = keccak256("tokeniq.treasury-reserve-guard.transient.tx-hash");
    bytes32 private constant _T_MODULE = keccak256("tokeniq.treasury-reserve-guard.transient.module");
    bytes32 private constant _T_TARGET = keccak256("tokeniq.treasury-reserve-guard.transient.target");
    bytes32 private constant _T_META = keccak256("tokeniq.treasury-reserve-guard.transient.meta");
    bytes32 private constant _T_SNAPSHOT_BASE = keccak256("tokeniq.treasury-reserve-guard.transient.snapshot");

    // ------------------------------------------------------------------ Storage

    /// @notice The Safe this guard serves. All configuration must come from it.
    address public immutable safe;
    /// @notice When true every module transaction reverts.
    bool public paused;
    /// @notice Modules (e.g. a Zodiac Roles modifier) allowed to execute through the Safe.
    mapping(address module => bool allowed) public isModuleAllowed;
    /// @notice Accounts that may pause (but never unpause or configure).
    mapping(address guardian => bool allowed) public isGuardian;
    /// @notice Targets a module may DELEGATECALL into.
    mapping(address target => bool allowed) public isDelegateCallAllowed;
    /// @notice Spenders a module may grant an allowance to, per configured token.
    mapping(address token => mapping(address spender => bool allowed)) public isSpenderAllowed;

    mapping(address token => TokenPolicy policy) private _policies;
    address[] private _trackedTokens;

    // ------------------------------------------------------------------ Events

    event FloorSet(address indexed token, uint256 floor);
    event OutflowLimitSet(address indexed token, uint256 amountPerWindow, uint256 windowSeconds);
    event TokenTracked(address indexed token);
    event TokenUntracked(address indexed token);
    event ModuleAllowedSet(address indexed module, bool allowed);
    event GuardianSet(address indexed guardian, bool allowed);
    event DelegateCallAllowedSet(address indexed target, bool allowed);
    event SpenderAllowedSet(address indexed token, address indexed spender, bool allowed);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    /// @notice Net outflow accounted against a token's window during a module transaction.
    event OutflowRecorded(address indexed token, uint256 amount, uint256 spentInWindow, uint256 windowStart);
    /// @notice Evidence record for every module transaction that passed the guard.
    event ModuleTransactionChecked(
        address indexed module,
        address indexed to,
        bytes4 indexed selector,
        Enum.Operation operation,
        bool success,
        bytes32 moduleTxHash
    );

    // ------------------------------------------------------------------ Errors

    error ZeroAddress();
    error NotAContract(address account);
    error CallerNotSafe(address caller);
    error CallerNotSafeOrGuardian(address caller);
    error ConfigLockedDuringModuleExecution();
    error GuardIsPaused();
    error ModuleNotAllowed(address module);
    error ForbiddenTarget(address target);
    error DelegateCallNotAllowed(address target);
    error SpenderNotAllowed(address token, address spender);
    error MalformedApprovalCalldata(address token, bytes4 selector);
    error NestedModuleExecution();
    error MalformedMultiSend();
    error UnsupportedBatchOperation(uint256 operation, address target);
    error NoModuleTransactionInFlight();
    error ModuleTxHashMismatch(bytes32 expected, bytes32 actual);
    error ModuleGuardChanged(address installedGuard);
    error ReserveFloorBreached(address token, uint256 balance, uint256 floor);
    error OutflowLimitExceeded(address token, uint256 spentInWindow, uint256 limit);
    error TooManyTrackedTokens(uint256 max);
    error InvalidOutflowWindow(uint256 windowSeconds);
    error BalanceQueryFailed(address token);
    error SafeStorageQueryFailed();

    // ------------------------------------------------------------------ Modifiers

    /// @dev Configuration is only accepted from the Safe itself (a multisig transaction) and
    ///      never while a module transaction is in flight (prevents self-escalation through
    ///      delegatecall targets or nested owner transactions).
    modifier onlySafeConfig() {
        if (msg.sender != safe) revert CallerNotSafe(msg.sender);
        if (_tload(_T_TX_HASH) != 0) revert ConfigLockedDuringModuleExecution();
        _;
    }

    /// @dev Guard hooks are only meaningful when invoked by the Safe.
    modifier onlySafe() {
        if (msg.sender != safe) revert CallerNotSafe(msg.sender);
        _;
    }

    // ------------------------------------------------------------------ Constructor

    /// @param safe_ The Safe (v1.5.0+) whose module transactions this guard checks.
    constructor(address safe_) {
        if (safe_ == address(0)) revert ZeroAddress();
        if (safe_.code.length == 0) revert NotAContract(safe_);
        safe = safe_;
    }

    // ------------------------------------------------------------------ Configuration (Safe only)

    /// @notice Set the minimum liquid balance of `token` (address(0) = ETH) that must remain in
    ///         the Safe after every module transaction. 0 removes the floor.
    function setFloor(address token, uint256 floor) external onlySafeConfig {
        TokenPolicy storage p = _policies[token];
        p.floor = floor;
        emit FloorSet(token, floor);
        _syncTracking(token, p);
    }

    /// @notice Limit the net outflow of `token` to `amountPerWindow` per `windowSeconds`.
    ///         `windowSeconds == 0` (with `amountPerWindow == 0`) disables the limit.
    ///         `amountPerWindow == 0` with a non-zero window forbids any module outflow.
    function setOutflowLimit(address token, uint256 amountPerWindow, uint256 windowSeconds) external onlySafeConfig {
        if (windowSeconds > MAX_WINDOW_SECONDS || (windowSeconds == 0 && amountPerWindow != 0)) {
            revert InvalidOutflowWindow(windowSeconds);
        }
        TokenPolicy storage p = _policies[token];
        if (windowSeconds == 0) {
            p.outflowLimit = 0;
            p.windowSeconds = 0;
            p.windowStart = 0;
            p.spentInWindow = 0;
        } else {
            if (p.windowSeconds == 0) {
                // Newly enabled: open a fresh window.
                p.windowStart = uint64(block.timestamp);
                p.spentInWindow = 0;
            }
            p.outflowLimit = amountPerWindow;
            // forge-lint: disable-next-line(unsafe-typecast) -- windowSeconds <= MAX_WINDOW_SECONDS (checked above)
            p.windowSeconds = uint64(windowSeconds);
        }
        emit OutflowLimitSet(token, amountPerWindow, windowSeconds);
        _syncTracking(token, p);
    }

    /// @notice Allow or disallow a Safe module (e.g. the Zodiac Roles modifier) to execute.
    function setModuleAllowed(address module, bool allowed) external onlySafeConfig {
        if (module == address(0)) revert ZeroAddress();
        isModuleAllowed[module] = allowed;
        emit ModuleAllowedSet(module, allowed);
    }

    /// @notice Designate an account that may pause module execution without other signatures.
    function setGuardian(address guardian, bool allowed) external onlySafeConfig {
        if (guardian == address(0)) revert ZeroAddress();
        isGuardian[guardian] = allowed;
        emit GuardianSet(guardian, allowed);
    }

    /// @notice Allow module transactions to DELEGATECALL into `target` (e.g. MultiSendCallOnly).
    function setDelegateCallAllowed(address target, bool allowed) external onlySafeConfig {
        if (target == address(0)) revert ZeroAddress();
        if (target == safe || target == address(this)) revert ForbiddenTarget(target);
        isDelegateCallAllowed[target] = allowed;
        emit DelegateCallAllowedSet(target, allowed);
    }

    /// @notice Allow module transactions to grant `spender` an allowance on configured `token`.
    function setSpenderAllowed(address token, address spender, bool allowed) external onlySafeConfig {
        if (token == NATIVE_TOKEN || spender == address(0)) revert ZeroAddress();
        isSpenderAllowed[token][spender] = allowed;
        emit SpenderAllowedSet(token, spender, allowed);
    }

    /// @notice Stop all module transactions. Callable by the Safe or by any guardian.
    function pause() external {
        if (msg.sender != safe && !isGuardian[msg.sender]) revert CallerNotSafeOrGuardian(msg.sender);
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Resume module transactions. Only the Safe (a multisig transaction) can unpause.
    function unpause() external onlySafeConfig {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ------------------------------------------------------------------ Safe v1.5.0 module guard hooks

    /// @inheritdoc IModuleGuard
    /// @dev Called by the Safe before executing a module transaction. Validates the module, the
    ///      target and the operation, then snapshots balances of all configured tokens into
    ///      transient storage and marks a module transaction as in flight.
    function checkModuleTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        address module
    ) external override onlySafe returns (bytes32 moduleTxHash) {
        if (_tload(_T_TX_HASH) != 0) revert NestedModuleExecution();
        if (paused) revert GuardIsPaused();
        if (!isModuleAllowed[module]) revert ModuleNotAllowed(module);
        if (operation == Enum.Operation.DelegateCall) {
            if (!isDelegateCallAllowed[to]) revert DelegateCallNotAllowed(to);
            // A MultiSend batch runs its inner CALLs as the Safe: hold each to the same rules.
            if (_selectorOf(data) == _MULTI_SEND) _checkMultiSendBatch(data);
        } else {
            _checkCall(
                to,
                data,
                _safeSlotAddress(SAFE_FALLBACK_HANDLER_STORAGE_SLOT),
                _safeSlotAddress(SAFE_TRANSACTION_GUARD_STORAGE_SLOT)
            );
        }

        moduleTxHash =
            keccak256(abi.encode(block.chainid, address(this), module, to, value, keccak256(data), operation));

        uint256 n = _trackedTokens.length;
        for (uint256 i = 0; i < n; ++i) {
            _tstore(_snapshotSlot(i), _balanceOf(_trackedTokens[i]));
        }
        _tstore(_T_MODULE, uint256(uint160(module)));
        _tstore(_T_TARGET, uint256(uint160(to)));
        _tstore(_T_META, (uint256(uint32(_selectorOf(data))) << _META_SELECTOR_SHIFT) | uint256(uint8(operation)));
        _tstore(_T_TX_HASH, uint256(moduleTxHash));
    }

    /// @inheritdoc IModuleGuard
    /// @dev Called by the Safe after a module transaction (also when the inner call failed).
    ///      Enforces floors and outflow limits on post-balances, verifies the guard is still
    ///      installed, emits evidence and clears all transient state. Reverting here reverts
    ///      the whole module transaction.
    function checkAfterModuleExecution(bytes32 txHash, bool success) external override onlySafe {
        bytes32 expected = bytes32(_tload(_T_TX_HASH));
        if (expected == bytes32(0)) revert NoModuleTransactionInFlight();
        if (txHash != expected) revert ModuleTxHashMismatch(expected, txHash);

        address installed = _safeSlotAddress(SAFE_MODULE_GUARD_STORAGE_SLOT);
        if (installed != address(this)) revert ModuleGuardChanged(installed);

        uint256 n = _trackedTokens.length;
        for (uint256 i = 0; i < n; ++i) {
            address token = _trackedTokens[i];
            bytes32 slot = _snapshotSlot(i);
            uint256 pre = _tload(slot);
            _tstore(slot, 0);
            uint256 post = _balanceOf(token);
            TokenPolicy storage p = _policies[token];
            if (post < p.floor) revert ReserveFloorBreached(token, post, p.floor);
            if (p.windowSeconds != 0 && post < pre) _recordOutflow(token, p, pre - post);
        }

        address module = address(uint160(_tload(_T_MODULE)));
        address to = address(uint160(_tload(_T_TARGET)));
        uint256 meta = _tload(_T_META);
        // meta = (uint32 selector << 8) | uint8 operation, packed by checkModuleTransaction.
        // forge-lint: disable-next-line(unsafe-typecast) -- bits 8..39 hold a bytes4 written by this contract
        bytes4 selector = bytes4(uint32(meta >> _META_SELECTOR_SHIFT));
        // forge-lint: disable-next-line(unsafe-typecast) -- low byte holds Enum.Operation (0 or 1)
        Enum.Operation operation = Enum.Operation(uint8(meta));
        _tstore(_T_MODULE, 0);
        _tstore(_T_TARGET, 0);
        _tstore(_T_META, 0);
        _tstore(_T_TX_HASH, 0);

        emit ModuleTransactionChecked(module, to, selector, operation, success, txHash);
    }

    /// @inheritdoc IERC165
    /// @dev Advertises IModuleGuard (0x58401ed8) and IERC165 only. It intentionally does NOT
    ///      advertise ITransactionGuard, so Safe's `setGuard` refuses it and it can never block
    ///      owner-signed transactions.
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IModuleGuard).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    // ------------------------------------------------------------------ Views

    /// @notice Tokens currently configured with a floor and/or an outflow limit.
    function trackedTokens() external view returns (address[] memory) {
        return _trackedTokens;
    }

    /// @notice Full policy for `token`.
    function policyOf(address token) external view returns (TokenPolicy memory) {
        return _policies[token];
    }

    /// @notice Net outflow of `token` a module could still cause in the current window
    ///         (type(uint256).max if no limit). Does not account for the floor.
    function remainingOutflow(address token) external view returns (uint256) {
        TokenPolicy storage p = _policies[token];
        if (p.windowSeconds == 0) return type(uint256).max;
        // forge-lint: disable-next-line(block-timestamp) -- window bookkeeping; second-level skew is irrelevant at window scale
        uint256 spent = block.timestamp >= uint256(p.windowStart) + p.windowSeconds ? 0 : p.spentInWindow;
        return spent >= p.outflowLimit ? 0 : p.outflowLimit - spent;
    }

    /// @notice True while a module transaction is between its pre- and post-check.
    function moduleTransactionInFlight() external view returns (bool) {
        return _tload(_T_TX_HASH) != 0;
    }

    /// @notice True if the Safe's module-guard storage slot points at this contract. Use this
    ///         after installation: on a Safe without module-guard support it returns false.
    function isActiveOnSafe() external view returns (bool) {
        return _safeSlotAddress(SAFE_MODULE_GUARD_STORAGE_SLOT) == address(this);
    }

    // ------------------------------------------------------------------ Internals

    function _recordOutflow(address token, TokenPolicy storage p, uint256 outflow) private {
        uint256 start = p.windowStart;
        uint256 spent = p.spentInWindow;
        // Fixed window: a new window opens at the first outflow after the previous one expired.
        // forge-lint: disable-next-line(block-timestamp) -- window bookkeeping; second-level skew is irrelevant at window scale
        if (block.timestamp >= start + p.windowSeconds) {
            start = block.timestamp;
            spent = 0;
        }
        spent += outflow;
        if (spent > p.outflowLimit) revert OutflowLimitExceeded(token, spent, p.outflowLimit);
        // forge-lint: disable-next-line(unsafe-typecast) -- start is a block timestamp (< 2^64 for ~5e11 years)
        p.windowStart = uint64(start);
        p.spentInWindow = spent;
        emit OutflowRecorded(token, outflow, spent, start);
    }

    /// @dev Keeps `_trackedTokens` equal to the set of tokens with a floor or a limit.
    function _syncTracking(address token, TokenPolicy storage p) private {
        bool shouldTrack = p.floor != 0 || p.windowSeconds != 0;
        uint256 indexPlusOne = p.indexPlusOne;
        if (shouldTrack && indexPlusOne == 0) {
            uint256 len = _trackedTokens.length;
            if (len >= MAX_TRACKED_TOKENS) revert TooManyTrackedTokens(MAX_TRACKED_TOKENS);
            // Fail fast on addresses that cannot report a balance (would brick module txs).
            // Skipped on removal so a broken token can always be unconfigured.
            _balanceOf(token);
            _trackedTokens.push(token);
            // forge-lint: disable-next-line(unsafe-typecast) -- len < MAX_TRACKED_TOKENS (16)
            p.indexPlusOne = uint8(len + 1);
            emit TokenTracked(token);
        } else if (!shouldTrack && indexPlusOne != 0) {
            uint256 lastIndex = _trackedTokens.length - 1;
            if (indexPlusOne - 1 != lastIndex) {
                address moved = _trackedTokens[lastIndex];
                _trackedTokens[indexPlusOne - 1] = moved;
                // forge-lint: disable-next-line(unsafe-typecast) -- indexPlusOne <= MAX_TRACKED_TOKENS (16)
                _policies[moved].indexPlusOne = uint8(indexPlusOne);
            }
            _trackedTokens.pop();
            p.indexPlusOne = 0;
            emit TokenUntracked(token);
        }
    }

    /// @dev Rules for one CALL executed with the Safe as msg.sender (top level or inside a batch).
    ///      Forbidden targets are contracts that grant authority to "the Safe": the Safe itself
    ///      (owners, modules, guards, threshold), this guard (its configuration), any allowlisted
    ///      module (e.g. Roles, whose owner is the Safe: no self-escalation), the Safe's fallback
    ///      handler (ExtensibleFallbackHandler trusts the last 20 calldata bytes as the sender, so a
    ///      direct call could install an EIP-1271 verifier and enable permits outside any module
    ///      transaction) and the Safe's transaction guard (owner-side controls).
    function _checkCall(address to, bytes memory data, address fallbackHandler, address txGuard) private view {
        if (
            to == safe || to == address(this) || isModuleAllowed[to]
                || (to != address(0) && (to == fallbackHandler || to == txGuard))
        ) revert ForbiddenTarget(to);
        _checkApproval(to, data);
    }

    /// @dev Strictly parses `multiSend(bytes)` calldata exactly as Safe's MultiSend(CallOnly)
    ///      executes it and applies `_checkCall` to every inner transaction. Accepts only the
    ///      standard ABI offset (0x20) and packed entries that tile the payload exactly, so the
    ///      set of entries checked here is the set MultiSend executes. Inner DELEGATECALLs (and
    ///      any operation other than CALL) are rejected; inner `to == address(0)` means the Safe.
    function _checkMultiSendBatch(bytes memory data) private view {
        // calldata: selector (4) | offset (32) | length (32) | packed entries
        if (data.length < _MULTISEND_HEADER_SIZE) revert MalformedMultiSend();
        uint256 offset;
        uint256 len;
        assembly ("memory-safe") {
            offset := mload(add(data, 0x24))
            len := mload(add(data, 0x44))
        }
        if (offset != _WORD || len > data.length - _MULTISEND_HEADER_SIZE) revert MalformedMultiSend();

        address fallbackHandler = _safeSlotAddress(SAFE_FALLBACK_HANDLER_STORAGE_SLOT);
        address txGuard = _safeSlotAddress(SAFE_TRANSACTION_GUARD_STORAGE_SLOT);
        uint256 pos = 0;
        while (pos < len) {
            // entry: operation (1) | to (20) | value (32) | dataLength (32) | data (dataLength)
            if (len - pos < _MULTISEND_ENTRY_HEADER_SIZE) revert MalformedMultiSend();
            uint256 op;
            address to;
            uint256 innerLength;
            assembly ("memory-safe") {
                let p := add(add(data, 0x64), pos)
                op := shr(248, mload(p))
                to := shr(96, mload(add(p, 0x01)))
                innerLength := mload(add(p, 0x35))
            }
            if (innerLength > len - pos - _MULTISEND_ENTRY_HEADER_SIZE) revert MalformedMultiSend();
            if (op != 0) revert UnsupportedBatchOperation(op, to);
            if (to == address(0)) to = safe; // MultiSend maps address(0) to address(this) == the Safe
            uint256 innerStart = _MULTISEND_HEADER_SIZE + pos + _MULTISEND_ENTRY_HEADER_SIZE;
            _checkCall(to, _slice(data, innerStart, innerLength), fallbackHandler, txGuard);
            pos += _MULTISEND_ENTRY_HEADER_SIZE + innerLength;
        }
    }

    /// @dev Rejects allowance grants on configured ERC-20s to non-allowlisted spenders.
    function _checkApproval(address to, bytes memory data) private view {
        if (to == NATIVE_TOKEN || _policies[to].indexPlusOne == 0 || data.length < _SELECTOR_SIZE) return;
        // forge-lint: disable-next-line(unsafe-typecast) -- intentional: take the 4-byte selector (length checked above)
        bytes4 selector = bytes4(data);
        bool hasAmount = selector == _APPROVE || selector == _INCREASE_ALLOWANCE || selector == _INCREASE_APPROVAL;
        if (!hasAmount && selector != _AUTHORIZE_OPERATOR) return;
        if (data.length < (hasAmount ? _CALL_2_ARGS_SIZE : _CALL_1_ARG_SIZE)) {
            revert MalformedApprovalCalldata(to, selector);
        }

        address spender;
        assembly ("memory-safe") {
            spender := and(mload(add(data, 0x24)), 0xffffffffffffffffffffffffffffffffffffffff)
        }
        if (hasAmount) {
            uint256 amount;
            assembly ("memory-safe") {
                amount := mload(add(data, 0x44))
            }
            if (amount == 0) return; // revoking (or a no-op increase) is always allowed
        }
        if (!isSpenderAllowed[to][spender]) revert SpenderNotAllowed(to, spender);
    }

    /// @dev Balance of the Safe. Uses a raw STATICCALL that copies at most 32 bytes of return
    ///      data (no return-data bombs, no state changes possible by the token).
    function _balanceOf(address token) private view returns (uint256 amount) {
        address account = safe;
        if (token == NATIVE_TOKEN) return account.balance;
        bytes memory payload = abi.encodeWithSelector(_BALANCE_OF, account);
        bool ok;
        uint256 size;
        assembly ("memory-safe") {
            ok := staticcall(gas(), token, add(payload, 0x20), mload(payload), 0x00, 0x20)
            size := returndatasize()
            amount := mload(0x00)
        }
        if (!ok || size < _WORD) revert BalanceQueryFailed(token);
    }

    /// @dev Reads an address-valued Safe storage slot through StorageAccessible.getStorageAt.
    function _safeSlotAddress(uint256 slot) private view returns (address) {
        bytes memory word = ISafeStorageReader(safe).getStorageAt(slot, 1);
        if (word.length != _WORD) revert SafeStorageQueryFailed();
        // forge-lint: disable-next-line(unsafe-typecast) -- word.length == 32 checked above; slot stores an address
        return address(uint160(uint256(bytes32(word))));
    }

    function _slice(bytes memory data, uint256 start, uint256 length) private pure returns (bytes memory out) {
        out = new bytes(length);
        assembly ("memory-safe") {
            mcopy(add(out, 0x20), add(add(data, 0x20), start), length)
        }
    }

    function _selectorOf(bytes memory data) private pure returns (bytes4) {
        // forge-lint: disable-next-line(unsafe-typecast) -- intentional: take the 4-byte selector (length checked)
        return data.length < _SELECTOR_SIZE ? bytes4(0) : bytes4(data);
    }

    function _snapshotSlot(uint256 index) private pure returns (bytes32) {
        return bytes32(uint256(_T_SNAPSHOT_BASE) + index);
    }

    function _tload(bytes32 slot) private view returns (uint256 value) {
        assembly ("memory-safe") {
            value := tload(slot)
        }
    }

    function _tstore(bytes32 slot, uint256 value) private {
        assembly ("memory-safe") {
            tstore(slot, value)
        }
    }
}
