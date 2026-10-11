// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";
import {MultiSendCallOnly} from "@safe-global/safe-smart-account/contracts/libraries/MultiSendCallOnly.sol";

import {TreasuryReserveGuard} from "../src/TreasuryReserveGuard.sol";
import {DeployTreasuryReserveGuard} from "../script/DeployTreasuryReserveGuard.s.sol";
import {SafeTestBase} from "./utils/SafeTestBase.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {TestModule} from "./mocks/TestModule.sol";

contract FakeSafe141 {
    string public constant VERSION = "1.4.1";
}

/// @notice The deploy script's printed transactions, executed by the owners, must install and
///         configure the guard exactly as requested.
contract DeployScriptTest is SafeTestBase {
    DeployTreasuryReserveGuard internal script;
    MockERC20 internal usdc;

    function setUp() public {
        _initOwners();
        safe = _deployLocalSafe();
        script = new DeployTreasuryReserveGuard();
        usdc = new MockERC20("USD Coin", "USDC", 6);
        usdc.mint(address(safe), 1_000_000e6);
        module = new TestModule(address(safe));
        _execSafe(address(safe), 0, abi.encodeCall(safe.enableModule, (address(module))));
        // make the canonical MultiSendCallOnly address usable on the local chain
        vm.etch(script.MULTISEND_CALL_ONLY_150(), address(new MultiSendCallOnly()).code);
    }

    function _config() internal view returns (DeployTreasuryReserveGuard.Config memory cfg) {
        cfg.safe = address(safe);
        cfg.modules = _one(address(module));
        cfg.guardians = _one(address(0x6A2D));
        cfg.floorTokens = new address[](2);
        cfg.floorTokens[0] = address(usdc);
        cfg.floorTokens[1] = address(0);
        cfg.floorAmounts = new uint256[](2);
        cfg.floorAmounts[0] = 250_000e6;
        cfg.floorAmounts[1] = 1 ether;
        cfg.outflowTokens = _one(address(usdc));
        cfg.outflowAmounts = new uint256[](1);
        cfg.outflowAmounts[0] = 50_000e6;
        cfg.outflowWindows = new uint256[](1);
        cfg.outflowWindows[0] = 1 days;
        cfg.spenderTokens = _one(address(usdc));
        cfg.spenders = _one(address(0x7A017));
        cfg.delegateCallTargets = _one(script.MULTISEND_CALL_ONLY_150());
    }

    function test_Script_RunFromEnv_DeploysGuardAndBuildsTxs() public {
        vm.setEnv("SAFE", vm.toString(address(safe)));
        vm.setEnv("MODULES", vm.toString(address(module)));
        vm.setEnv("FLOOR_TOKENS", vm.toString(address(usdc)));
        vm.setEnv("FLOOR_AMOUNTS", "250000000000");
        (TreasuryReserveGuard guard_, DeployTreasuryReserveGuard.SafeTx[] memory txs) = script.run();
        assertEq(guard_.safe(), address(safe));
        assertEq(txs.length, 3);
        assertEq(txs[2].to, address(safe), "setModuleGuard is last");
        assertFalse(guard_.isActiveOnSafe(), "script must not touch the Safe");
    }

    function test_Script_PrintedTxs_OneByOne_InstallAndConfigure() public {
        DeployTreasuryReserveGuard.Config memory cfg = _config();
        guard = new TreasuryReserveGuard(address(safe));
        DeployTreasuryReserveGuard.SafeTx[] memory txs = script.buildSafeTransactions(address(guard), cfg);
        assertEq(txs.length, 8);
        for (uint256 i; i < txs.length; ++i) {
            assertTrue(_execSafeOp(txs[i].to, txs[i].value, txs[i].data, Enum.Operation(txs[i].operation)));
        }
        _assertConfigured(cfg);
    }

    function test_Script_MultiSendBatch_InstallsAtomically() public {
        DeployTreasuryReserveGuard.Config memory cfg = _config();
        guard = new TreasuryReserveGuard(address(safe));
        bytes memory batch = script.encodeMultiSend(script.buildSafeTransactions(address(guard), cfg));
        assertTrue(_execSafeOp(script.MULTISEND_CALL_ONLY_150(), 0, batch, Enum.Operation.DelegateCall));
        _assertConfigured(cfg);
    }

    function test_Script_RejectsNon150Safe() public {
        FakeSafe141 old = new FakeSafe141();
        vm.expectRevert(bytes("SAFE must be Safe v1.5.0 (older Safes have no module guard support)"));
        script.requireSafe150(address(old));
        vm.expectRevert(bytes("SAFE has no code on this chain"));
        script.requireSafe150(address(0x1234));
        script.requireSafe150(address(safe)); // real 1.5.0 passes
    }

    function test_Script_RejectsMismatchedLists() public {
        DeployTreasuryReserveGuard.Config memory cfg = _config();
        cfg.floorAmounts = new uint256[](1);
        vm.expectRevert(bytes("FLOOR_TOKENS/FLOOR_AMOUNTS length mismatch"));
        script.validateConfig(cfg);
    }

    function _assertConfigured(DeployTreasuryReserveGuard.Config memory cfg) internal {
        assertTrue(guard.isActiveOnSafe());
        assertTrue(guard.isModuleAllowed(address(module)));
        assertTrue(guard.isGuardian(address(0x6A2D)));
        assertEq(guard.policyOf(address(usdc)).floor, 250_000e6);
        assertEq(guard.policyOf(address(0)).floor, 1 ether);
        assertEq(guard.policyOf(address(usdc)).outflowLimit, 50_000e6);
        assertTrue(guard.isSpenderAllowed(address(usdc), address(0x7A017)));
        assertTrue(guard.isDelegateCallAllowed(cfg.delegateCallTargets[0]));
        // and it is live: a module tx over the limit is rejected
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.OutflowLimitExceeded.selector, address(usdc), 50_000e6 + 1, 50_000e6
            )
        );
        module.exec(
            address(usdc), 0, abi.encodeCall(MockERC20.transfer, (address(1), 50_000e6 + 1)), Enum.Operation.Call
        );
    }

    function _one(address a) internal pure returns (address[] memory arr) {
        arr = new address[](1);
        arr[0] = a;
    }
}
