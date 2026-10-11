// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Safe} from "@safe-global/safe-smart-account/contracts/Safe.sol";
import {SafeProxyFactory} from "@safe-global/safe-smart-account/contracts/proxies/SafeProxyFactory.sol";
import {
    CompatibilityFallbackHandler
} from "@safe-global/safe-smart-account/contracts/handler/CompatibilityFallbackHandler.sol";
import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";

import {TreasuryReserveGuard} from "../../src/TreasuryReserveGuard.sol";
import {TestModule} from "../mocks/TestModule.sol";

/// @notice Deploys a REAL Safe v1.5.0 (singleton + proxy factory + fallback handler, compiled
///         from the vendored v1.5.0 sources), sets it up as a 2-of-3 with the public Foundry/anvil
///         default test keys, and drives it with properly EIP-712-signed owner transactions.
abstract contract SafeTestBase is Test {
    // Foundry/anvil default dev keys (public, TEST ONLY — never hold value with these).
    uint256 internal constant ANVIL_PK_0 = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 internal constant ANVIL_PK_1 = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 internal constant ANVIL_PK_2 = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 internal constant THRESHOLD = 2;

    Safe internal safe;
    TreasuryReserveGuard internal guard;
    TestModule internal module;

    /// @dev Owners sorted ascending by address (Safe requires sorted signatures).
    address[] internal owners;
    uint256[] internal ownerKeys;

    // ---------------------------------------------------------------- setup helpers

    function _initOwners() internal {
        uint256[3] memory keys = [ANVIL_PK_0, ANVIL_PK_1, ANVIL_PK_2];
        // simple insertion sort by derived address
        for (uint256 i = 1; i < 3; ++i) {
            uint256 k = keys[i];
            uint256 j = i;
            while (j > 0 && vm.addr(keys[j - 1]) > vm.addr(k)) {
                keys[j] = keys[j - 1];
                --j;
            }
            keys[j] = k;
        }
        delete owners;
        delete ownerKeys;
        for (uint256 i; i < 3; ++i) {
            owners.push(vm.addr(keys[i]));
            ownerKeys.push(keys[i]);
        }
    }

    /// @notice Deploy Safe v1.5.0 infrastructure locally and create a 2-of-3 Safe proxy.
    function _deployLocalSafe() internal returns (Safe s) {
        Safe singleton = new Safe();
        SafeProxyFactory factory = new SafeProxyFactory();
        CompatibilityFallbackHandler handler = new CompatibilityFallbackHandler();
        s = _createSafe(address(singleton), address(factory), address(handler), 0);
    }

    function _createSafe(address singleton, address factory, address fallbackHandler, uint256 saltNonce)
        internal
        returns (Safe s)
    {
        if (owners.length == 0) _initOwners();
        bytes memory initializer = abi.encodeCall(
            Safe.setup, (owners, THRESHOLD, address(0), "", fallbackHandler, address(0), 0, payable(address(0)))
        );
        s = Safe(payable(address(SafeProxyFactory(factory).createProxyWithNonce(singleton, initializer, saltNonce))));
    }

    /// @notice Deploy the guard + a test module, enable the module, allowlist it in the guard and
    ///         install the guard as module guard — all through signed Safe transactions.
    function _installGuardAndModule() internal {
        guard = new TreasuryReserveGuard(address(safe));
        module = new TestModule(address(safe));
        assertTrue(_execSafe(address(safe), 0, abi.encodeCall(safe.enableModule, (address(module)))), "enableModule");
        assertTrue(
            _execSafe(address(guard), 0, abi.encodeCall(guard.setModuleAllowed, (address(module), true))),
            "setModuleAllowed"
        );
        assertTrue(_execSafe(address(safe), 0, abi.encodeCall(safe.setModuleGuard, (address(guard)))), "setModuleGuard");
        assertTrue(guard.isActiveOnSafe(), "guard active");
    }

    // ---------------------------------------------------------------- owner (multisig) transactions

    function _execSafe(address to, uint256 value, bytes memory data) internal returns (bool) {
        return _execSafeOp(to, value, data, Enum.Operation.Call);
    }

    function _execSafeOp(address to, uint256 value, bytes memory data, Enum.Operation operation)
        internal
        returns (bool)
    {
        bytes32 txHash = safe.getTransactionHash(
            to, value, data, operation, 0, 0, 0, address(0), address(0), safe.nonce()
        );
        bytes memory signatures = _sign(txHash, THRESHOLD);
        return safe.execTransaction(to, value, data, operation, 0, 0, 0, address(0), payable(address(0)), signatures);
    }

    /// @dev Signs first, then arms `expectRevert` so it applies to `execTransaction` itself.
    function _execSafeExpectRevert(address to, uint256 value, bytes memory data, bytes memory revertData) internal {
        bytes32 txHash = safe.getTransactionHash(
            to, value, data, Enum.Operation.Call, 0, 0, 0, address(0), address(0), safe.nonce()
        );
        bytes memory signatures = _sign(txHash, THRESHOLD);
        vm.expectRevert(revertData);
        safe.execTransaction(to, value, data, Enum.Operation.Call, 0, 0, 0, address(0), payable(address(0)), signatures);
    }

    /// @dev Configure the guard through a signed Safe transaction (the only accepted path).
    function _configure(bytes memory guardCall) internal {
        assertTrue(_execSafe(address(guard), 0, guardCall), "guard config tx");
    }

    function _sign(bytes32 hash, uint256 count) internal view returns (bytes memory signatures) {
        for (uint256 i; i < count; ++i) {
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerKeys[i], hash);
            signatures = abi.encodePacked(signatures, r, s, v);
        }
    }

    // ---------------------------------------------------------------- module transactions

    function _moduleCall(address to, uint256 value, bytes memory data) internal returns (bool) {
        return module.exec(to, value, data, Enum.Operation.Call);
    }

    function _moduleTransfer(address token, address to, uint256 amount) internal returns (bool) {
        return _moduleCall(token, 0, abi.encodeWithSignature("transfer(address,uint256)", to, amount));
    }

    function _moduleSendEth(address to, uint256 amount) internal returns (bool) {
        return _moduleCall(to, amount, "");
    }
}
