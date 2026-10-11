// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {TreasuryReserveGuard} from "../src/TreasuryReserveGuard.sol";

interface ISafeVersion {
    function VERSION() external view returns (string memory);
}

/**
 * @title DeployTreasuryReserveGuard
 * @notice Deploys a TreasuryReserveGuard for an existing Safe v1.5.0 and PRINTS the Safe
 *         transactions the owners must review, sign and execute to configure and install it.
 *         The script never calls the Safe: installing a guard is an owner decision.
 *
 * Environment (comma-separated lists; all lists optional except SAFE):
 *   SAFE                    Safe v1.5.0 address (required)
 *   MODULES                 modules to allowlist, e.g. the Zodiac Roles modifier proxy
 *   GUARDIANS               accounts allowed to pause
 *   FLOOR_TOKENS            tokens (0x0000000000000000000000000000000000000000 = native ETH)
 *   FLOOR_AMOUNTS           floors in token base units, same length as FLOOR_TOKENS
 *   OUTFLOW_TOKENS          tokens with an outflow limit
 *   OUTFLOW_AMOUNTS         max net outflow per window (base units)
 *   OUTFLOW_WINDOWS         window lengths in seconds (1 .. 31536000)
 *   SPENDER_TOKENS          tokens for which a spender may receive allowances
 *   SPENDERS                spenders (e.g. an ERC-4626 vault), same length as SPENDER_TOKENS
 *   DELEGATECALL_TARGETS    delegatecall targets to allow (e.g. MultiSendCallOnly 1.5.0)
 *
 * Usage (simulation only — prints everything, sends nothing):
 *   SAFE=0x... FLOOR_TOKENS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 FLOOR_AMOUNTS=250000000000 \
 *     forge script script/DeployTreasuryReserveGuard.s.sol --rpc-url $RPC_URL
 * Broadcasting the guard deployment (owner-authorized only) additionally needs
 *   --broadcast plus a signer (--account / --ledger); never put a private key in this repo.
 */
contract DeployTreasuryReserveGuard is Script {
    /// @notice Canonical Safe v1.5.0 MultiSendCallOnly (same address on every supported chain).
    address public constant MULTISEND_CALL_ONLY_150 = 0xA83c336B20401Af773B6219BA5027174338D1836;

    struct SafeTx {
        address to;
        uint256 value;
        bytes data;
        uint8 operation; // 0 = CALL
        string description;
    }

    struct Config {
        address safe;
        address[] modules;
        address[] guardians;
        address[] floorTokens;
        uint256[] floorAmounts;
        address[] outflowTokens;
        uint256[] outflowAmounts;
        uint256[] outflowWindows;
        address[] spenderTokens;
        address[] spenders;
        address[] delegateCallTargets;
    }

    function run() external returns (TreasuryReserveGuard guard, SafeTx[] memory txs) {
        Config memory cfg = readConfig();
        requireSafe150(cfg.safe);

        vm.startBroadcast();
        guard = new TreasuryReserveGuard(cfg.safe);
        vm.stopBroadcast();

        txs = buildSafeTransactions(address(guard), cfg);
        _print(guard, cfg, txs);
    }

    // ------------------------------------------------------------------ config

    function readConfig() public view returns (Config memory cfg) {
        address[] memory noAddrs = new address[](0);
        uint256[] memory noUints = new uint256[](0);
        cfg.safe = vm.envAddress("SAFE");
        cfg.modules = vm.envOr("MODULES", ",", noAddrs);
        cfg.guardians = vm.envOr("GUARDIANS", ",", noAddrs);
        cfg.floorTokens = vm.envOr("FLOOR_TOKENS", ",", noAddrs);
        cfg.floorAmounts = vm.envOr("FLOOR_AMOUNTS", ",", noUints);
        cfg.outflowTokens = vm.envOr("OUTFLOW_TOKENS", ",", noAddrs);
        cfg.outflowAmounts = vm.envOr("OUTFLOW_AMOUNTS", ",", noUints);
        cfg.outflowWindows = vm.envOr("OUTFLOW_WINDOWS", ",", noUints);
        cfg.spenderTokens = vm.envOr("SPENDER_TOKENS", ",", noAddrs);
        cfg.spenders = vm.envOr("SPENDERS", ",", noAddrs);
        cfg.delegateCallTargets = vm.envOr("DELEGATECALL_TARGETS", ",", noAddrs);
        validateConfig(cfg);
    }

    function validateConfig(Config memory cfg) public pure {
        require(cfg.safe != address(0), "SAFE is required");
        require(cfg.floorTokens.length == cfg.floorAmounts.length, "FLOOR_TOKENS/FLOOR_AMOUNTS length mismatch");
        require(
            cfg.outflowTokens.length == cfg.outflowAmounts.length
                && cfg.outflowTokens.length == cfg.outflowWindows.length,
            "OUTFLOW_TOKENS/AMOUNTS/WINDOWS length mismatch"
        );
        require(cfg.spenderTokens.length == cfg.spenders.length, "SPENDER_TOKENS/SPENDERS length mismatch");
    }

    /// @notice Module guards only exist from Safe v1.5.0. On 1.4.1 a `setModuleGuard` call can even
    ///         "succeed" silently via the fallback path, so refuse anything that is not 1.5.0.
    function requireSafe150(address safe) public view {
        require(safe.code.length != 0, "SAFE has no code on this chain");
        string memory version = ISafeVersion(safe).VERSION();
        require(
            keccak256(bytes(version)) == keccak256(bytes("1.5.0")),
            "SAFE must be Safe v1.5.0 (older Safes have no module guard support)"
        );
    }

    // ------------------------------------------------------------------ transaction builder

    /// @notice Owner transactions, in execution order. Configuration first, `setModuleGuard` LAST,
    ///         so the guard is never live with a half-applied policy.
    function buildSafeTransactions(address guard, Config memory cfg) public pure returns (SafeTx[] memory txs) {
        uint256 n = cfg.modules.length + cfg.guardians.length + cfg.floorTokens.length + cfg.outflowTokens.length
            + cfg.spenderTokens.length + cfg.delegateCallTargets.length + 1;
        txs = new SafeTx[](n);
        uint256 k;
        for (uint256 i; i < cfg.modules.length; ++i) {
            txs[k++] = _call(
                guard,
                abi.encodeCall(TreasuryReserveGuard.setModuleAllowed, (cfg.modules[i], true)),
                "guard.setModuleAllowed(module, true)"
            );
        }
        for (uint256 i; i < cfg.guardians.length; ++i) {
            txs[k++] = _call(
                guard,
                abi.encodeCall(TreasuryReserveGuard.setGuardian, (cfg.guardians[i], true)),
                "guard.setGuardian(guardian, true)"
            );
        }
        for (uint256 i; i < cfg.floorTokens.length; ++i) {
            txs[k++] = _call(
                guard,
                abi.encodeCall(TreasuryReserveGuard.setFloor, (cfg.floorTokens[i], cfg.floorAmounts[i])),
                "guard.setFloor(token, floor)"
            );
        }
        for (uint256 i; i < cfg.outflowTokens.length; ++i) {
            txs[k++] = _call(
                guard,
                abi.encodeCall(
                    TreasuryReserveGuard.setOutflowLimit,
                    (cfg.outflowTokens[i], cfg.outflowAmounts[i], cfg.outflowWindows[i])
                ),
                "guard.setOutflowLimit(token, amountPerWindow, windowSeconds)"
            );
        }
        for (uint256 i; i < cfg.spenderTokens.length; ++i) {
            txs[k++] = _call(
                guard,
                abi.encodeCall(TreasuryReserveGuard.setSpenderAllowed, (cfg.spenderTokens[i], cfg.spenders[i], true)),
                "guard.setSpenderAllowed(token, spender, true)"
            );
        }
        for (uint256 i; i < cfg.delegateCallTargets.length; ++i) {
            txs[k++] = _call(
                guard,
                abi.encodeCall(TreasuryReserveGuard.setDelegateCallAllowed, (cfg.delegateCallTargets[i], true)),
                "guard.setDelegateCallAllowed(target, true)"
            );
        }
        txs[k++] = _call(
            cfg.safe, abi.encodeWithSignature("setModuleGuard(address)", guard), "safe.setModuleGuard(guard) -- LAST"
        );
    }

    /// @notice Calldata for ONE owner transaction that applies `txs` atomically:
    ///         to = MULTISEND_CALL_ONLY_150, value = 0, operation = 1 (DELEGATECALL).
    function encodeMultiSend(SafeTx[] memory txs) public pure returns (bytes memory) {
        bytes memory packed;
        for (uint256 i; i < txs.length; ++i) {
            packed = abi.encodePacked(
                packed, uint8(txs[i].operation), txs[i].to, txs[i].value, uint256(txs[i].data.length), txs[i].data
            );
        }
        return abi.encodeWithSignature("multiSend(bytes)", packed);
    }

    function _call(address to, bytes memory data, string memory description) internal pure returns (SafeTx memory) {
        return SafeTx({to: to, value: 0, data: data, operation: 0, description: description});
    }

    // ------------------------------------------------------------------ output

    function _print(TreasuryReserveGuard guard, Config memory cfg, SafeTx[] memory txs) internal view {
        console2.log("==============================================================");
        console2.log("TreasuryReserveGuard deployed (or simulated) at:", address(guard));
        console2.log("chainId:", block.chainid);
        console2.log("Safe:", cfg.safe);
        console2.log("Constructor arg (safe):", cfg.safe);
        console2.log("--------------------------------------------------------------");
        console2.log("The script did NOT touch the Safe. Owners must review, sign and execute");
        console2.log("the following Safe transactions (Safe{Wallet} > Transaction Builder):");
        for (uint256 i; i < txs.length; ++i) {
            console2.log("");
            console2.log(string.concat("#", vm.toString(i + 1), " ", txs[i].description));
            console2.log("  to:       ", txs[i].to);
            console2.log("  value:    ", txs[i].value);
            console2.log("  operation:", uint256(txs[i].operation));
            console2.log("  data:");
            console2.logBytes(txs[i].data);
        }
        console2.log("");
        console2.log("--------------------------------------------------------------");
        console2.log("Alternative: ONE atomic owner transaction via MultiSendCallOnly v1.5.0");
        console2.log("  to:        ", MULTISEND_CALL_ONLY_150);
        console2.log("  value:      0");
        console2.log("  operation:  1 (DELEGATECALL)");
        console2.log("  data:");
        console2.logBytes(encodeMultiSend(txs));
        console2.log("--------------------------------------------------------------");
        console2.log("After execution verify: guard.isActiveOnSafe() == true, guard.trackedTokens(),");
        console2.log("and record deployments/<chainId>.json (see deployments/README.md).");
        console2.log("==============================================================");
    }
}
