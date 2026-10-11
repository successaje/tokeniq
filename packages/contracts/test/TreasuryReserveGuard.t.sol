// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";
import {IModuleGuard} from "@safe-global/safe-smart-account/contracts/base/ModuleManager.sol";
import {ITransactionGuard} from "@safe-global/safe-smart-account/contracts/base/GuardManager.sol";
import {IERC165} from "@safe-global/safe-smart-account/contracts/interfaces/IERC165.sol";
import {MultiSendCallOnly} from "@safe-global/safe-smart-account/contracts/libraries/MultiSendCallOnly.sol";
import {
    CompatibilityFallbackHandler
} from "@safe-global/safe-smart-account/contracts/handler/CompatibilityFallbackHandler.sol";

import {TreasuryReserveGuard} from "../src/TreasuryReserveGuard.sol";
import {SafeTestBase} from "./utils/SafeTestBase.sol";
import {MockERC20, BrokenBalanceToken} from "./mocks/MockERC20.sol";
import {TestModule, NestedExecutor, DelegateCallTarget} from "./mocks/TestModule.sol";

/// @dev A "Safe" whose StorageAccessible returns malformed data (not a real Safe v1.5.0).
contract MalformedStorageSafe {
    function getStorageAt(uint256, uint256) external pure returns (bytes memory) {
        return "";
    }
}


/// @dev Stand-in Safe that drives both module-guard hooks inside ONE call, as a real Safe does
///      within execTransactionFromModule. Transient storage only lives for one transaction, so a
///      test that calls the hooks as separate top-level calls is not representative (and newer
///      Foundry versions clear transient storage between top-level test calls).
contract HookSequenceSafe {
    uint256 internal constant MODULE_GUARD_SLOT = 0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947;
    TreasuryReserveGuard public guard;
    address public moduleAddr;

    function init(TreasuryReserveGuard g, address module_) external {
        guard = g;
        moduleAddr = module_;
        g.setModuleAllowed(module_, true);
    }

    /// StorageAccessible-compatible: only the module guard slot is set.
    function getStorageAt(uint256 offset, uint256) external view returns (bytes memory) {
        if (offset == MODULE_GUARD_SLOT) return abi.encode(address(guard));
        return abi.encode(bytes32(0));
    }

    function run(address target)
        external
        returns (bytes32 h, bytes memory mismatchRevert, bytes memory configRevert, bool inFlightBefore, bool inFlightAfter)
    {
        h = guard.checkModuleTransaction(target, 0, "", Enum.Operation.Call, moduleAddr);
        inFlightBefore = guard.moduleTransactionInFlight();
        try guard.checkAfterModuleExecution(bytes32(0), true) {} catch (bytes memory r) {
            mismatchRevert = r;
        }
        try guard.setFloor(target, 0) {} catch (bytes memory r) {
            configRevert = r;
        }
        guard.checkAfterModuleExecution(h, true);
        inFlightAfter = guard.moduleTransactionInFlight();
    }
}

contract TreasuryReserveGuardTest is SafeTestBase {
    address internal constant ETH = address(0);
    address internal constant RECIPIENT = address(0xBEEF);
    address internal constant GUARDIAN = address(0x6A2D);

    MockERC20 internal usdc;
    MockERC20 internal weth;

    function setUp() public {
        _initOwners();
        safe = _deployLocalSafe();
        _installGuardAndModule();

        usdc = new MockERC20("USD Coin", "USDC", 6);
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc.mint(address(safe), 1_000_000e6);
        weth.mint(address(safe), 500 ether);
        vm.deal(address(safe), 100 ether);
    }

    // =====================================================================
    // Installation, ERC-165 and removal
    // =====================================================================

    function test_InterfaceIds_MatchSafe150() public view {
        assertEq(type(IModuleGuard).interfaceId, bytes4(0x58401ed8));
        assertEq(type(ITransactionGuard).interfaceId, bytes4(0xe6d7a83a));
        assertTrue(guard.supportsInterface(0x58401ed8), "IModuleGuard");
        assertTrue(guard.supportsInterface(type(IERC165).interfaceId), "IERC165");
        assertFalse(guard.supportsInterface(0xe6d7a83a), "must not claim ITransactionGuard");
        assertFalse(guard.supportsInterface(0xffffffff));
    }

    function test_SetModuleGuard_Succeeds_AndSlotPointsToGuard() public view {
        bytes32 slot = keccak256("module_manager.module_guard.address");
        assertEq(address(uint160(uint256(vm.load(address(safe), slot)))), address(guard));
        assertTrue(guard.isActiveOnSafe());
        assertEq(guard.safe(), address(safe));
    }

    function test_SetModuleGuard_RequiresErc165ModuleGuardInterface() public {
        // Safe 1.5.0 asks supportsInterface(IModuleGuard). A contract answering `false` -> GS301.
        CompatibilityFallbackHandler erc165ButNotGuard = new CompatibilityFallbackHandler();
        _execSafeExpectRevert(
            address(safe), 0, abi.encodeCall(safe.setModuleGuard, (address(erc165ButNotGuard))), bytes("GS301")
        );
        // A contract without supportsInterface at all makes the probe itself revert (empty data).
        _execSafeExpectRevert(address(safe), 0, abi.encodeCall(safe.setModuleGuard, (address(usdc))), "");
        assertTrue(guard.isActiveOnSafe(), "previous guard untouched");
    }

    function test_CannotBeInstalledAsTransactionGuard_SoOwnerTxsAreNeverBlocked() public {
        _execSafeExpectRevert(address(safe), 0, abi.encodeCall(safe.setGuard, (address(guard))), bytes("GS300"));
    }

    function test_OwnersCanAlwaysRemoveGuard_EvenWhilePaused() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 900_000e6)));
        vm.prank(address(safe));
        guard.pause();

        assertTrue(_execSafe(address(safe), 0, abi.encodeCall(safe.setModuleGuard, (address(0)))));
        assertFalse(guard.isActiveOnSafe());

        // With the guard removed, module transactions are no longer checked at all.
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 500_000e6));
        assertEq(usdc.balanceOf(address(safe)), 500_000e6);
    }

    function test_IsActiveOnSafe_RevertsOnMalformedStorageRead() public {
        TreasuryReserveGuard g = new TreasuryReserveGuard(address(new MalformedStorageSafe()));
        vm.expectRevert(TreasuryReserveGuard.SafeStorageQueryFailed.selector);
        g.isActiveOnSafe();
    }

    function test_Constructor_RejectsZeroAndNonContract() public {
        vm.expectRevert(TreasuryReserveGuard.ZeroAddress.selector);
        new TreasuryReserveGuard(address(0));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.NotAContract.selector, address(0x1234)));
        new TreasuryReserveGuard(address(0x1234));
    }

    // =====================================================================
    // Reserve floors
    // =====================================================================

    function test_ModuleTx_WithinFloor_Passes() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 600_000e6)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 300_000e6));
        assertEq(usdc.balanceOf(address(safe)), 700_000e6);
    }

    function test_ModuleTx_LeavingExactlyFloor_Passes() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 600_000e6)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 400_000e6));
        assertEq(usdc.balanceOf(address(safe)), 600_000e6);
    }

    function test_ModuleTx_BreachingFloor_Reverts() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 600_000e6)));
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.ReserveFloorBreached.selector, address(usdc), 599_999_999_999, 600_000e6
            )
        );
        _moduleTransfer(address(usdc), RECIPIENT, 400_000e6 + 1);
        assertEq(usdc.balanceOf(address(safe)), 1_000_000e6, "nothing moved");
    }

    function test_NativeEthFloor_Enforced() public {
        _configure(abi.encodeCall(guard.setFloor, (ETH, 60 ether)));
        assertTrue(_moduleSendEth(RECIPIENT, 40 ether));
        assertEq(address(safe).balance, 60 ether);

        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.ReserveFloorBreached.selector, ETH, 60 ether - 1, 60 ether)
        );
        _moduleSendEth(RECIPIENT, 1);
    }

    function test_OwnerSignedTx_CanGoBelowFloor_ByDesign() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 900_000e6)));
        // A 2-of-3 owner transaction is not a module transaction: the guard is not consulted.
        assertTrue(_execSafe(address(usdc), 0, abi.encodeCall(MockERC20.transfer, (RECIPIENT, 950_000e6))));
        assertEq(usdc.balanceOf(address(safe)), 50_000e6);
    }

    function test_StrictFloor_BlocksEveryModuleTxWhileAConfiguredTokenIsBelowFloor() public {
        // Documented liveness trade-off: once owners take a token below its floor, ALL module txs
        // revert until owners restore the balance or lower the floor.
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 900_000e6)));
        _execSafe(address(usdc), 0, abi.encodeCall(MockERC20.transfer, (RECIPIENT, 200_000e6)));
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.ReserveFloorBreached.selector, address(usdc), 800_000e6, 900_000e6
            )
        );
        _moduleTransfer(address(weth), RECIPIENT, 1 ether); // unrelated token
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 800_000e6)));
        assertTrue(_moduleTransfer(address(weth), RECIPIENT, 1 ether));
    }

    function test_FeeOnTransferToken_OutflowMeasuredByBalanceDelta() public {
        MockERC20 fot = new MockERC20("Fee", "FOT", 18);
        fot.mint(address(safe), 1000 ether);
        fot.setFeeBps(100); // 1% burned on transfer, but the Safe's balance drops by the full amount
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(fot), 100 ether, 1 days)));
        assertTrue(_moduleTransfer(address(fot), RECIPIENT, 60 ether));
        assertEq(guard.policyOf(address(fot)).spentInWindow, 60 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.OutflowLimitExceeded.selector, address(fot), 101 ether, 100 ether
            )
        );
        _moduleTransfer(address(fot), RECIPIENT, 41 ether);
    }

    function test_FailedInnerCall_IsStillCheckedAndRecorded() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 1)));
        bytes memory data = abi.encodeCall(MockERC20.transfer, (RECIPIENT, 2_000_000e6)); // more than balance
        bytes32 h = _moduleTxHash(address(usdc), 0, data, Enum.Operation.Call);
        vm.expectEmit(true, true, true, true, address(guard));
        emit TreasuryReserveGuard.ModuleTransactionChecked(
            address(module), address(usdc), MockERC20.transfer.selector, Enum.Operation.Call, false, h
        );
        assertFalse(_moduleCall(address(usdc), 0, data));
        assertFalse(guard.moduleTransactionInFlight());
    }

    // =====================================================================
    // Outflow limits
    // =====================================================================

    function test_OutflowLimit_AccumulatesAcrossTxsWithinWindow() public {
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 100_000e6, 1 days)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 40_000e6));
        vm.warp(block.timestamp + 6 hours);
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 60_000e6));
        assertEq(guard.remainingOutflow(address(usdc)), 0);

        vm.warp(block.timestamp + 6 hours);
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.OutflowLimitExceeded.selector, address(usdc), 100_000e6 + 1, 100_000e6
            )
        );
        _moduleTransfer(address(usdc), RECIPIENT, 1);
    }

    function test_OutflowLimit_ResetsAfterWindow() public {
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 100_000e6, 1 days)));
        uint256 t0 = block.timestamp;
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 100_000e6));

        vm.warp(t0 + 1 days - 1);
        vm.expectRevert();
        _moduleTransfer(address(usdc), RECIPIENT, 1);

        vm.warp(t0 + 1 days);
        assertEq(guard.remainingOutflow(address(usdc)), 100_000e6);
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 100_000e6));
        TreasuryReserveGuard.TokenPolicy memory p = guard.policyOf(address(usdc));
        assertEq(p.windowStart, t0 + 1 days);
        assertEq(p.spentInWindow, 100_000e6);
    }

    function test_Inflows_DoNotCreateAllowance() public {
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 100_000e6, 1 days)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 100_000e6));

        // Someone sends funds to the Safe (outside any module tx) ...
        usdc.mint(address(safe), 500_000e6);
        // ... and a module tx that is a net INFLOW (pulls tokens in) does not reduce `spent` either.
        usdc.mint(address(this), 10_000e6);
        usdc.approve(address(safe), 10_000e6);
        assertTrue(
            _moduleCall(
                address(usdc), 0, abi.encodeCall(MockERC20.transferFrom, (address(this), address(safe), 10_000e6))
            )
        );
        assertEq(guard.policyOf(address(usdc)).spentInWindow, 100_000e6);

        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.OutflowLimitExceeded.selector, address(usdc), 100_000e6 + 1, 100_000e6
            )
        );
        _moduleTransfer(address(usdc), RECIPIENT, 1);
    }

    function test_OutflowLimit_ZeroAmountFreezesModuleOutflow() public {
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 0, 1 hours)));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.OutflowLimitExceeded.selector, address(usdc), 1, 0));
        _moduleTransfer(address(usdc), RECIPIENT, 1);
    }

    function test_OutflowLimit_NativeEth() public {
        _configure(abi.encodeCall(guard.setOutflowLimit, (ETH, 5 ether, 1 days)));
        assertTrue(_moduleSendEth(RECIPIENT, 5 ether));
        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.OutflowLimitExceeded.selector, ETH, 5 ether + 1, 5 ether)
        );
        _moduleSendEth(RECIPIENT, 1);
    }

    function test_LoweringLimit_KeepsAmountAlreadySpent() public {
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 100_000e6, 1 days)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 80_000e6));
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 50_000e6, 1 days)));
        assertEq(guard.remainingOutflow(address(usdc)), 0);
        vm.expectRevert();
        _moduleTransfer(address(usdc), RECIPIENT, 1);
    }

    function test_DisablingLimit_ClearsAccounting() public {
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 100_000e6, 1 days)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 80_000e6));
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 0, 0)));
        assertEq(guard.remainingOutflow(address(usdc)), type(uint256).max);
        assertEq(guard.trackedTokens().length, 0);
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 500_000e6));
    }

    function test_SetOutflowLimit_RejectsInvalidWindow() public {
        uint256 tooLong = 365 days + 1;
        _execSafeExpectRevert(
            address(guard),
            0,
            abi.encodeCall(guard.setOutflowLimit, (address(usdc), 1, tooLong)),
            abi.encodeWithSelector(TreasuryReserveGuard.InvalidOutflowWindow.selector, tooLong)
        );
        _execSafeExpectRevert(
            address(guard),
            0,
            abi.encodeCall(guard.setOutflowLimit, (address(usdc), 1, 0)),
            abi.encodeWithSelector(TreasuryReserveGuard.InvalidOutflowWindow.selector, 0)
        );
    }

    // =====================================================================
    // Module allowlist
    // =====================================================================

    function test_NonAllowlistedModule_Blocked() public {
        TestModule rogue = new TestModule(address(safe));
        _execSafe(address(safe), 0, abi.encodeCall(safe.enableModule, (address(rogue))));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ModuleNotAllowed.selector, address(rogue)));
        rogue.exec(address(usdc), 0, abi.encodeCall(MockERC20.transfer, (RECIPIENT, 1)), Enum.Operation.Call);
    }

    function test_AllowlistedModule_Passes_AndCanBeRevoked() public {
        assertTrue(guard.isModuleAllowed(address(module)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 1));
        _configure(abi.encodeCall(guard.setModuleAllowed, (address(module), false)));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ModuleNotAllowed.selector, address(module)));
        _moduleTransfer(address(usdc), RECIPIENT, 1);
    }

    // =====================================================================
    // Pause
    // =====================================================================

    function test_Guardian_CanPause_AndPauseBlocksModuleTxs() public {
        _configure(abi.encodeCall(guard.setGuardian, (GUARDIAN, true)));
        vm.expectEmit(true, false, false, false, address(guard));
        emit TreasuryReserveGuard.Paused(GUARDIAN);
        vm.prank(GUARDIAN);
        guard.pause();
        assertTrue(guard.paused());
        vm.expectRevert(TreasuryReserveGuard.GuardIsPaused.selector);
        _moduleTransfer(address(usdc), RECIPIENT, 1);
    }

    function test_NonGuardian_CannotPause() public {
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.CallerNotSafeOrGuardian.selector, owners[0]));
        vm.prank(owners[0]); // an owner acting alone is not a guardian unless designated
        guard.pause();
    }

    function test_RevokedGuardian_CannotPause() public {
        _configure(abi.encodeCall(guard.setGuardian, (GUARDIAN, true)));
        _configure(abi.encodeCall(guard.setGuardian, (GUARDIAN, false)));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.CallerNotSafeOrGuardian.selector, GUARDIAN));
        vm.prank(GUARDIAN);
        guard.pause();
    }

    function test_Safe_CanPauseViaMultisig() public {
        _configure(abi.encodeCall(guard.pause, ()));
        assertTrue(guard.paused());
    }

    function test_OnlySafe_CanUnpause() public {
        _configure(abi.encodeCall(guard.setGuardian, (GUARDIAN, true)));
        vm.prank(GUARDIAN);
        guard.pause();

        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.CallerNotSafe.selector, GUARDIAN));
        vm.prank(GUARDIAN);
        guard.unpause();

        _configure(abi.encodeCall(guard.unpause, ()));
        assertFalse(guard.paused());
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 1));
    }

    // =====================================================================
    // Configuration access control
    // =====================================================================

    function test_OnlySafe_CanConfigure_DirectCallsFromOwnersRevert() public {
        bytes[] memory calls = _allConfigCalls();
        for (uint256 i; i < owners.length; ++i) {
            for (uint256 j; j < calls.length; ++j) {
                vm.prank(owners[i]);
                (bool ok, bytes memory ret) = address(guard).call(calls[j]);
                assertFalse(ok, "direct config call must fail");
                assertEq(ret, abi.encodeWithSelector(TreasuryReserveGuard.CallerNotSafe.selector, owners[i]));
            }
        }
    }

    function testFuzz_OnlySafe_CanConfigure(address caller) public {
        vm.assume(caller != address(safe));
        bytes[] memory calls = _allConfigCalls();
        for (uint256 j; j < calls.length; ++j) {
            vm.prank(caller);
            (bool ok,) = address(guard).call(calls[j]);
            assertFalse(ok);
        }
    }

    function test_ConfigChanges_EmitEvents() public {
        vm.expectEmit(true, false, false, true, address(guard));
        emit TreasuryReserveGuard.FloorSet(address(usdc), 1e6);
        vm.expectEmit(true, false, false, false, address(guard));
        emit TreasuryReserveGuard.TokenTracked(address(usdc));
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 1e6)));

        vm.expectEmit(true, false, false, true, address(guard));
        emit TreasuryReserveGuard.OutflowLimitSet(address(usdc), 5e6, 1 hours);
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 5e6, 1 hours)));

        vm.expectEmit(true, false, false, true, address(guard));
        emit TreasuryReserveGuard.GuardianSet(GUARDIAN, true);
        _configure(abi.encodeCall(guard.setGuardian, (GUARDIAN, true)));

        vm.expectEmit(true, false, false, true, address(guard));
        emit TreasuryReserveGuard.DelegateCallAllowedSet(address(0xD0), true);
        _configure(abi.encodeCall(guard.setDelegateCallAllowed, (address(0xD0), true)));

        vm.expectEmit(true, true, false, true, address(guard));
        emit TreasuryReserveGuard.SpenderAllowedSet(address(usdc), address(0x5E), true);
        _configure(abi.encodeCall(guard.setSpenderAllowed, (address(usdc), address(0x5E), true)));

        vm.expectEmit(true, false, false, true, address(guard));
        emit TreasuryReserveGuard.ModuleAllowedSet(address(0x40D), true);
        _configure(abi.encodeCall(guard.setModuleAllowed, (address(0x40D), true)));

        vm.expectEmit(true, false, false, false, address(guard));
        emit TreasuryReserveGuard.Unpaused(address(safe));
        _configure(abi.encodeCall(guard.unpause, ()));

        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 0))); // still tracked: limit remains
        assertEq(guard.trackedTokens().length, 1);
        vm.expectEmit(true, false, false, false, address(guard));
        emit TreasuryReserveGuard.TokenUntracked(address(usdc));
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 0, 0)));
        assertEq(guard.trackedTokens().length, 0);
    }

    function test_ConfigSetters_RejectZeroAddresses() public {
        vm.startPrank(address(safe));
        vm.expectRevert(TreasuryReserveGuard.ZeroAddress.selector);
        guard.setModuleAllowed(address(0), true);
        vm.expectRevert(TreasuryReserveGuard.ZeroAddress.selector);
        guard.setGuardian(address(0), true);
        vm.expectRevert(TreasuryReserveGuard.ZeroAddress.selector);
        guard.setDelegateCallAllowed(address(0), true);
        vm.expectRevert(TreasuryReserveGuard.ZeroAddress.selector);
        guard.setSpenderAllowed(ETH, address(1), true);
        vm.expectRevert(TreasuryReserveGuard.ZeroAddress.selector);
        guard.setSpenderAllowed(address(usdc), address(0), true);
        vm.stopPrank();
    }

    // =====================================================================
    // Forbidden targets / self-escalation
    // =====================================================================

    function test_ModuleTx_CannotTargetSafe_EgRemoveGuardOrEnableModule() public {
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(safe)));
        _moduleCall(address(safe), 0, abi.encodeCall(safe.setModuleGuard, (address(0))));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(safe)));
        _moduleCall(address(safe), 0, abi.encodeCall(safe.enableModule, (address(0xBAD))));
        assertTrue(guard.isActiveOnSafe());
    }

    function test_ModuleTx_CannotTargetGuard() public {
        vm.prank(address(safe));
        guard.pause();
        vm.expectRevert(TreasuryReserveGuard.GuardIsPaused.selector); // paused check comes first
        _moduleCall(address(guard), 0, abi.encodeCall(guard.unpause, ()));

        _configure(abi.encodeCall(guard.unpause, ()));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(guard)));
        _moduleCall(address(guard), 0, abi.encodeCall(guard.setFloor, (address(usdc), 0)));
    }

    // =====================================================================
    // DELEGATECALL restrictions
    // =====================================================================

    function test_DelegateCall_RejectedByDefault() public {
        DelegateCallTarget lib = new DelegateCallTarget();
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.DelegateCallNotAllowed.selector, address(lib)));
        module.exec(
            address(lib),
            0,
            abi.encodeCall(DelegateCallTarget.transferToken, (address(usdc), RECIPIENT, 1)),
            Enum.Operation.DelegateCall
        );
    }

    function test_DelegateCall_AllowedTarget_IsStillBalanceChecked() public {
        DelegateCallTarget lib = new DelegateCallTarget();
        _configure(abi.encodeCall(guard.setDelegateCallAllowed, (address(lib), true)));
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 600_000e6)));

        assertTrue(
            module.exec(
                address(lib),
                0,
                abi.encodeCall(DelegateCallTarget.transferToken, (address(usdc), RECIPIENT, 400_000e6)),
                Enum.Operation.DelegateCall
            )
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.ReserveFloorBreached.selector, address(usdc), 600_000e6 - 1, 600_000e6
            )
        );
        module.exec(
            address(lib),
            0,
            abi.encodeCall(DelegateCallTarget.transferToken, (address(usdc), RECIPIENT, 1)),
            Enum.Operation.DelegateCall
        );
    }

    function test_DelegateCall_CannotUninstallGuardBehindItsBack() public {
        DelegateCallTarget lib = new DelegateCallTarget();
        _configure(abi.encodeCall(guard.setDelegateCallAllowed, (address(lib), true)));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ModuleGuardChanged.selector, address(0)));
        module.exec(
            address(lib), 0, abi.encodeCall(DelegateCallTarget.clearModuleGuard, ()), Enum.Operation.DelegateCall
        );
        assertTrue(guard.isActiveOnSafe());
    }

    function test_DelegateCall_CannotReconfigureGuardMidTransaction() public {
        DelegateCallTarget lib = new DelegateCallTarget();
        _configure(abi.encodeCall(guard.setDelegateCallAllowed, (address(lib), true)));
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 600_000e6)));

        (bool success, bytes memory ret) = module.execReturnData(
            address(lib),
            0,
            abi.encodeCall(DelegateCallTarget.lowerFloor, (address(guard), address(usdc))),
            Enum.Operation.DelegateCall
        );
        assertFalse(success);
        assertEq(ret, abi.encodeWithSelector(TreasuryReserveGuard.ConfigLockedDuringModuleExecution.selector));
        assertEq(guard.policyOf(address(usdc)).floor, 600_000e6);
    }

    function test_DelegateCall_MultiSendCallOnlyBatch_CountsCumulativeOutflow() public {
        MultiSendCallOnly multiSend = new MultiSendCallOnly();
        _configure(abi.encodeCall(guard.setDelegateCallAllowed, (address(multiSend), true)));
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 100_000e6, 1 days)));

        bytes memory transfer60 = abi.encodeCall(MockERC20.transfer, (RECIPIENT, 60_000e6));
        bytes memory batch = abi.encodePacked(
            abi.encodePacked(uint8(0), address(usdc), uint256(0), uint256(transfer60.length), transfer60),
            abi.encodePacked(uint8(0), address(usdc), uint256(0), uint256(transfer60.length), transfer60)
        );
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.OutflowLimitExceeded.selector, address(usdc), 120_000e6, 100_000e6
            )
        );
        module.exec(
            address(multiSend), 0, abi.encodeCall(MultiSendCallOnly.multiSend, (batch)), Enum.Operation.DelegateCall
        );
    }

    function test_SetDelegateCallAllowed_RejectsSafeAndGuard() public {
        vm.startPrank(address(safe));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(safe)));
        guard.setDelegateCallAllowed(address(safe), true);
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(guard)));
        guard.setDelegateCallAllowed(address(guard), true);
        vm.stopPrank();
    }

    // =====================================================================
    // Nesting / hook access
    // =====================================================================

    function test_NestedModuleExecution_Rejected() public {
        NestedExecutor nested = new NestedExecutor();
        bytes memory inner = abi.encodeCall(MockERC20.transfer, (RECIPIENT, 1));
        (bool success, bytes memory ret) = module.execReturnData(
            address(nested),
            0,
            abi.encodeCall(NestedExecutor.reenter, (module, address(usdc), 0, inner)),
            Enum.Operation.Call
        );
        assertFalse(success, "outer call must observe the nested failure");
        assertEq(ret, abi.encodeWithSelector(TreasuryReserveGuard.NestedModuleExecution.selector));
        assertEq(usdc.balanceOf(RECIPIENT), 0);
        assertFalse(guard.moduleTransactionInFlight(), "state cleared after the outer tx");
    }

    function test_GuardHooks_OnlyCallableBySafe() public {
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.CallerNotSafe.selector, address(this)));
        guard.checkModuleTransaction(address(usdc), 0, "", Enum.Operation.Call, address(module));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.CallerNotSafe.selector, address(this)));
        guard.checkAfterModuleExecution(bytes32(uint256(1)), true);
    }

    function test_CheckAfter_WithoutPreCheck_Reverts() public {
        vm.prank(address(safe));
        vm.expectRevert(TreasuryReserveGuard.NoModuleTransactionInFlight.selector);
        guard.checkAfterModuleExecution(bytes32(uint256(1)), true);
    }

    function test_CheckAfter_HashMismatch_Reverts() public {
        HookSequenceSafe fakeSafe = new HookSequenceSafe();
        TreasuryReserveGuard g = new TreasuryReserveGuard(address(fakeSafe));
        fakeSafe.init(g, address(module));
        (bytes32 h, bytes memory mismatchRevert, bytes memory configRevert, bool inFlightBefore, bool inFlightAfter) =
            fakeSafe.run(address(usdc));
        assertTrue(inFlightBefore);
        assertEq(mismatchRevert, abi.encodeWithSelector(TreasuryReserveGuard.ModuleTxHashMismatch.selector, h, bytes32(0)));
        // config is locked while a module tx is in flight
        assertEq(configRevert, abi.encodeWithSelector(TreasuryReserveGuard.ConfigLockedDuringModuleExecution.selector));
        assertFalse(inFlightAfter);
    }

    // =====================================================================
    // Approval leak protection
    // =====================================================================

    function test_Approve_ToNonAllowlistedSpender_Rejected() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 600_000e6)));
        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.SpenderNotAllowed.selector, address(usdc), RECIPIENT)
        );
        _moduleCall(address(usdc), 0, abi.encodeCall(MockERC20.approve, (RECIPIENT, type(uint256).max)));
        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.SpenderNotAllowed.selector, address(usdc), RECIPIENT)
        );
        _moduleCall(address(usdc), 0, abi.encodeCall(MockERC20.increaseAllowance, (RECIPIENT, 1)));
        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.SpenderNotAllowed.selector, address(usdc), RECIPIENT)
        );
        _moduleCall(address(usdc), 0, abi.encodeWithSelector(bytes4(0xd73dd623), RECIPIENT, 1)); // increaseApproval
        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.SpenderNotAllowed.selector, address(usdc), RECIPIENT)
        );
        _moduleCall(address(usdc), 0, abi.encodeWithSignature("authorizeOperator(address)", RECIPIENT));
    }

    function test_Approve_ToAllowlistedSpender_Allowed_AndRevokeAlwaysAllowed() public {
        address vault = address(0x7A017);
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 600_000e6)));
        _configure(abi.encodeCall(guard.setSpenderAllowed, (address(usdc), vault, true)));
        assertTrue(_moduleCall(address(usdc), 0, abi.encodeCall(MockERC20.approve, (vault, 100_000e6))));
        assertEq(usdc.allowance(address(safe), vault), 100_000e6);
        // revoking is allowed even for a spender that is not allowlisted
        assertTrue(_moduleCall(address(usdc), 0, abi.encodeCall(MockERC20.approve, (RECIPIENT, 0))));
    }

    function test_Approve_UnconfiguredToken_NotGated() public {
        assertTrue(_moduleCall(address(weth), 0, abi.encodeCall(MockERC20.approve, (RECIPIENT, 1 ether))));
    }

    function test_Approve_MalformedCalldata_Rejected() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 1)));
        bytes memory short = abi.encodePacked(MockERC20.approve.selector, bytes32(uint256(uint160(RECIPIENT))));
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.MalformedApprovalCalldata.selector, address(usdc), MockERC20.approve.selector
            )
        );
        _moduleCall(address(usdc), 0, short);
    }

    // =====================================================================
    // Token tracking & gas bounds
    // =====================================================================

    function test_TrackedTokens_AddAndRemove_KeepsIndexConsistent() public {
        MockERC20 a = new MockERC20("A", "A", 18);
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 1)));
        _configure(abi.encodeCall(guard.setFloor, (address(weth), 1)));
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(a), 1, 1 hours)));
        _configure(abi.encodeCall(guard.setFloor, (ETH, 1)));
        assertEq(guard.trackedTokens().length, 4);

        _configure(abi.encodeCall(guard.setFloor, (address(weth), 0))); // remove middle
        address[] memory list = guard.trackedTokens();
        assertEq(list.length, 3);
        for (uint256 i; i < list.length; ++i) {
            assertEq(guard.policyOf(list[i]).indexPlusOne, i + 1);
            assertTrue(list[i] != address(weth));
        }
        assertEq(guard.policyOf(address(weth)).indexPlusOne, 0);
    }

    function test_MaxTrackedTokens_Enforced() public {
        for (uint256 i; i < guard.MAX_TRACKED_TOKENS(); ++i) {
            MockERC20 t = new MockERC20("T", "T", 18);
            vm.prank(address(safe));
            guard.setFloor(address(t), 1);
        }
        MockERC20 extra = new MockERC20("X", "X", 18);
        vm.prank(address(safe));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.TooManyTrackedTokens.selector, 16));
        guard.setFloor(address(extra), 1);
    }

    function test_GasBound_ModuleTxWith16ConfiguredTokens() public {
        for (uint256 i; i < guard.MAX_TRACKED_TOKENS() - 1; ++i) {
            MockERC20 t = new MockERC20("T", "T", 18);
            t.mint(address(safe), 10);
            vm.startPrank(address(safe));
            guard.setFloor(address(t), 1);
            guard.setOutflowLimit(address(t), 5, 1 days);
            vm.stopPrank();
        }
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 100e6, 1 days)));
        uint256 g = gasleft();
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 1e6));
        uint256 used = g - gasleft();
        emit log_named_uint("gas: module transfer, 16 configured tokens (incl. Safe + token)", used);
        assertLt(used, 400_000);
    }

    function test_GasOverhead_OneConfiguredToken() public {
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 1)));
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 500_000e6, 1 days)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 1)); // warm up recipient + window slots

        uint256 g = gasleft();
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 1e6));
        uint256 guarded = g - gasleft();

        _execSafe(address(safe), 0, abi.encodeCall(safe.setModuleGuard, (address(0))));
        g = gasleft();
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 1e6));
        uint256 unguarded = g - gasleft();

        emit log_named_uint("gas: module transfer WITH guard (1 token: floor + limit)", guarded);
        emit log_named_uint("gas: module transfer WITHOUT guard", unguarded);
        emit log_named_uint("gas: guard overhead", guarded - unguarded);
        assertLt(guarded - unguarded, 60_000);
    }

    function test_SetFloor_OnNonToken_Reverts() public {
        vm.prank(address(safe));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.BalanceQueryFailed.selector, address(0xDEAD)));
        guard.setFloor(address(0xDEAD), 1);
    }

    function test_BrokenToken_BlocksModuleTxs_UntilOwnersRemoveIt() public {
        BrokenBalanceToken broken = new BrokenBalanceToken();
        _configure(abi.encodeCall(guard.setFloor, (address(broken), 1)));
        broken.setBroken(true);
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.BalanceQueryFailed.selector, address(broken)));
        _moduleTransfer(address(usdc), RECIPIENT, 1);
        // Removal never queries the token, so a broken token can always be unconfigured.
        _configure(abi.encodeCall(guard.setFloor, (address(broken), 0)));
        assertTrue(_moduleTransfer(address(usdc), RECIPIENT, 1));
    }

    // =====================================================================
    // Evidence events
    // =====================================================================

    function test_ModuleTx_EmitsEvidenceAndOutflowEvents() public {
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), 100e6, 1 days)));
        bytes memory data = abi.encodeCall(MockERC20.transfer, (RECIPIENT, 7e6));
        bytes32 h = _moduleTxHash(address(usdc), 0, data, Enum.Operation.Call);

        vm.expectEmit(true, false, false, true, address(guard));
        emit TreasuryReserveGuard.OutflowRecorded(address(usdc), 7e6, 7e6, block.timestamp);
        vm.expectEmit(true, true, true, true, address(guard));
        emit TreasuryReserveGuard.ModuleTransactionChecked(
            address(module), address(usdc), MockERC20.transfer.selector, Enum.Operation.Call, true, h
        );
        assertTrue(_moduleCall(address(usdc), 0, data));
    }

    // =====================================================================
    // Fuzz
    // =====================================================================

    function testFuzz_FloorEnforced(uint256 floor, uint256 amount) public {
        uint256 bal = usdc.balanceOf(address(safe));
        floor = bound(floor, 0, 2 * bal);
        amount = bound(amount, 0, bal);
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), floor)));

        if (bal - amount >= floor) {
            assertTrue(_moduleTransfer(address(usdc), RECIPIENT, amount));
            assertEq(usdc.balanceOf(address(safe)), bal - amount);
        } else {
            vm.expectRevert(
                abi.encodeWithSelector(
                    TreasuryReserveGuard.ReserveFloorBreached.selector, address(usdc), bal - amount, floor
                )
            );
            _moduleTransfer(address(usdc), RECIPIENT, amount);
        }
        assertGe(usdc.balanceOf(address(safe)), floor > bal ? 0 : floor);
    }

    function testFuzz_EthFloorEnforced(uint256 floor, uint256 amount) public {
        uint256 bal = address(safe).balance;
        floor = bound(floor, 0, bal);
        amount = bound(amount, 0, bal);
        _configure(abi.encodeCall(guard.setFloor, (ETH, floor)));
        if (bal - amount >= floor) {
            assertTrue(_moduleSendEth(RECIPIENT, amount));
        } else {
            vm.expectRevert(
                abi.encodeWithSelector(TreasuryReserveGuard.ReserveFloorBreached.selector, ETH, bal - amount, floor)
            );
            _moduleSendEth(RECIPIENT, amount);
        }
        assertGe(address(safe).balance, floor);
    }

    function testFuzz_OutflowLimitMatchesModel(
        uint256 limit,
        uint256 windowSeconds,
        uint256[4] memory amounts,
        uint256[4] memory gaps
    ) public {
        limit = bound(limit, 0, 400_000e6);
        windowSeconds = bound(windowSeconds, 1, 7 days);
        _configure(abi.encodeCall(guard.setOutflowLimit, (address(usdc), limit, windowSeconds)));

        uint256 start = block.timestamp;
        uint256 spent;
        for (uint256 i; i < 4; ++i) {
            vm.warp(block.timestamp + bound(gaps[i], 0, 2 * windowSeconds));
            uint256 amount = bound(amounts[i], 0, 250_000e6);
            bool expectRevert;
            if (amount != 0) {
                uint256 s = spent;
                uint256 st = start;
                // forge-lint: disable-next-line(block-timestamp) -- reference model of the guard's window rule
                if (block.timestamp >= st + windowSeconds) {
                    st = block.timestamp;
                    s = 0;
                }
                if (s + amount > limit) {
                    expectRevert = true;
                } else {
                    spent = s + amount;
                    start = st;
                }
            }
            if (expectRevert) {
                vm.expectRevert();
                _moduleTransfer(address(usdc), RECIPIENT, amount);
            } else {
                assertTrue(_moduleTransfer(address(usdc), RECIPIENT, amount));
            }
            TreasuryReserveGuard.TokenPolicy memory p = guard.policyOf(address(usdc));
            assertEq(p.spentInWindow, spent, "spent");
            assertEq(p.windowStart, start, "start");
            assertLe(p.spentInWindow, limit, "never above limit");
        }
    }

    // =====================================================================
    // helpers
    // =====================================================================

    function _moduleTxHash(address to, uint256 value, bytes memory data, Enum.Operation op)
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(block.chainid, address(guard), address(module), to, value, keccak256(data), op));
    }

    function _allConfigCalls() internal view returns (bytes[] memory calls) {
        calls = new bytes[](7);
        calls[0] = abi.encodeCall(guard.setFloor, (address(usdc), 0));
        calls[1] = abi.encodeCall(guard.setOutflowLimit, (address(usdc), 0, 0));
        calls[2] = abi.encodeCall(guard.setModuleAllowed, (address(0xBAD), true));
        calls[3] = abi.encodeCall(guard.setGuardian, (address(0xBAD), true));
        calls[4] = abi.encodeCall(guard.setDelegateCallAllowed, (address(0xBAD), true));
        calls[5] = abi.encodeCall(guard.setSpenderAllowed, (address(usdc), address(0xBAD), true));
        calls[6] = abi.encodeCall(guard.unpause, ());
    }
}
