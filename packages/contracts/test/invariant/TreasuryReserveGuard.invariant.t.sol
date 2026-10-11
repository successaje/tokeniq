// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Safe} from "@safe-global/safe-smart-account/contracts/Safe.sol";
import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";

import {TreasuryReserveGuard} from "../../src/TreasuryReserveGuard.sol";
import {SafeTestBase} from "../utils/SafeTestBase.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {TestModule} from "../mocks/TestModule.sol";

/// @notice Drives random module transfers, inflows, owner withdrawals, config changes and time
///         against a real Safe v1.5.0 + TreasuryReserveGuard, and records any violation the moment
///         a module transaction SUCCEEDS. Ghost window accounting is an independent model of the
///         guard's fixed-window rule.
contract GuardHandler is Test {
    Safe internal immutable safe;
    TreasuryReserveGuard internal immutable guard;
    TestModule internal immutable module;
    address[3] internal assets; // [tokenA, tokenB, native ETH]

    address internal constant SINK = address(0x51A4);

    // ghost model of the outflow window, per asset
    mapping(address => uint256) public ghostStart;
    mapping(address => uint256) public ghostSpent;

    uint256 public floorViolations;
    uint256 public limitViolations;
    uint256 public modelMismatches;
    uint256 public successfulModuleTxs;
    uint256 public blockedModuleTxs;

    constructor(Safe safe_, TreasuryReserveGuard guard_, TestModule module_, address tokenA, address tokenB) {
        safe = safe_;
        guard = guard_;
        module = module_;
        assets = [tokenA, tokenB, address(0)];
        // mirror windows that were already opened before the handler existed
        for (uint256 i; i < 3; ++i) {
            TreasuryReserveGuard.TokenPolicy memory p = guard_.policyOf(assets[i]);
            ghostStart[assets[i]] = p.windowStart;
            ghostSpent[assets[i]] = p.spentInWindow;
        }
    }

    // ------------------------------------------------------------ actions

    function moduleTransfer(uint256 assetSeed, uint256 amount) external {
        address asset = assets[assetSeed % 3];
        uint256 bal = _balance(asset);
        // mostly realistic small transfers; 1 in 4 may exceed limits or even the balance
        // (the latter makes the inner call fail: the success=false path)
        amount = amount % 4 == 0 ? bound(amount, 0, bal + bal / 8 + 1) : bound(amount, 0, bal / 20);
        uint256[3] memory pre = _balances();

        bool ok;
        if (asset == address(0)) {
            try module.exec(SINK, amount, "", Enum.Operation.Call) returns (bool s) {
                ok = true;
                s;
            } catch {}
        } else {
            try module.exec(asset, 0, abi.encodeCall(MockERC20.transfer, (SINK, amount)), Enum.Operation.Call) returns (
                bool s
            ) {
                ok = true;
                s;
            } catch {}
        }

        if (ok) {
            ++successfulModuleTxs;
            _checkAfterSuccess(pre);
        } else {
            ++blockedModuleTxs;
        }
    }

    function donate(uint256 assetSeed, uint256 amount) external {
        address asset = assets[assetSeed % 3];
        amount = bound(amount, 0, 1_000_000 ether);
        if (asset == address(0)) vm.deal(address(safe), address(safe).balance + amount);
        else MockERC20(asset).mint(address(safe), amount);
    }

    /// @dev Models an owner-signed transaction (not checked by the guard): may go below floors.
    function ownerWithdraw(uint256 assetSeed, uint256 amount) external {
        address asset = assets[assetSeed % 3];
        amount = bound(amount, 0, _balance(asset));
        if (asset == address(0)) {
            vm.deal(address(safe), address(safe).balance - amount);
        } else {
            vm.prank(address(safe));
            require(MockERC20(asset).transfer(SINK, amount), "owner transfer");
        }
    }

    function setFloor(uint256 assetSeed, uint256 floor) external {
        address asset = assets[assetSeed % 3];
        floor = bound(floor, 0, _balance(asset) + 1);
        vm.prank(address(safe)); // == the inner CALL of an owner-signed Safe tx
        guard.setFloor(asset, floor);
    }

    function setOutflowLimit(uint256 assetSeed, uint256 amount, uint256 windowSeed) external {
        address asset = assets[assetSeed % 3];
        uint256[3] memory windows = [uint256(0), 1 hours, 1 days];
        uint256 windowSeconds = windows[windowSeed % 3];
        amount = windowSeconds == 0 ? 0 : bound(amount, 0, _balance(asset));

        // mirror the guard's documented semantics in the ghost model
        TreasuryReserveGuard.TokenPolicy memory before = guard.policyOf(asset);
        if (windowSeconds == 0) {
            ghostStart[asset] = 0;
            ghostSpent[asset] = 0;
        } else if (before.windowSeconds == 0) {
            ghostStart[asset] = block.timestamp;
            ghostSpent[asset] = 0;
        }
        vm.prank(address(safe));
        guard.setOutflowLimit(asset, amount, windowSeconds);
    }

    function warp(uint256 secondsForward) external {
        vm.warp(block.timestamp + bound(secondsForward, 0, 2 days));
    }

    // ------------------------------------------------------------ checks

    function _checkAfterSuccess(uint256[3] memory pre) internal {
        for (uint256 i; i < 3; ++i) {
            address asset = assets[i];
            uint256 post = _balance(asset);
            TreasuryReserveGuard.TokenPolicy memory p = guard.policyOf(asset);

            if (post < p.floor) ++floorViolations;

            if (p.windowSeconds != 0 && post < pre[i]) {
                // forge-lint: disable-next-line(block-timestamp) -- reference model of the guard's window rule
                if (block.timestamp >= ghostStart[asset] + p.windowSeconds) {
                    ghostStart[asset] = block.timestamp;
                    ghostSpent[asset] = 0;
                }
                ghostSpent[asset] += pre[i] - post;
                if (ghostSpent[asset] > p.outflowLimit) ++limitViolations;
            }
            if (p.windowSeconds != 0 && (ghostSpent[asset] != p.spentInWindow || ghostStart[asset] != p.windowStart)) {
                ++modelMismatches;
            }
        }
    }

    function _balances() internal view returns (uint256[3] memory b) {
        for (uint256 i; i < 3; ++i) {
            b[i] = _balance(assets[i]);
        }
    }

    function _balance(address asset) internal view returns (uint256) {
        return asset == address(0) ? address(safe).balance : MockERC20(asset).balanceOf(address(safe));
    }

    function assetAt(uint256 i) external view returns (address) {
        return assets[i];
    }
}

contract TreasuryReserveGuardInvariantTest is SafeTestBase {
    GuardHandler internal handler;
    MockERC20 internal tokenA;
    MockERC20 internal tokenB;

    function setUp() public {
        _initOwners();
        safe = _deployLocalSafe();
        _installGuardAndModule();

        tokenA = new MockERC20("Token A", "A", 6);
        tokenB = new MockERC20("Token B", "B", 18);
        tokenA.mint(address(safe), 1_000_000e6);
        tokenB.mint(address(safe), 1_000 ether);
        vm.deal(address(safe), 100 ether);

        // start with a meaningful policy so early calls exercise the guard
        vm.startPrank(address(safe));
        guard.setFloor(address(tokenA), 400_000e6);
        guard.setOutflowLimit(address(tokenA), 150_000e6, 1 days);
        guard.setFloor(address(0), 10 ether);
        guard.setOutflowLimit(address(tokenB), 100 ether, 1 hours);
        vm.stopPrank();

        handler = new GuardHandler(safe, guard, module, address(tokenA), address(tokenB));
        targetContract(address(handler));
    }

    /// Deterministic smoke run: the handler really exercises both the allowed and blocked paths.
    function test_HandlerSmoke_HitsAllowedAndBlockedPaths() public {
        handler.moduleTransfer(0, 100_000e6); // tokenA: within floor & limit -> allowed
        handler.moduleTransfer(0, 100_000e6); // exceeds 150k/day limit -> blocked
        handler.moduleTransfer(2, 95 ether); // ETH: below 10 ETH floor -> blocked
        handler.warp(1 days);
        handler.moduleTransfer(0, 100_000e6); // new window -> allowed
        assertEq(handler.successfulModuleTxs(), 2);
        assertEq(handler.blockedModuleTxs(), 2);
        assertEq(handler.floorViolations() + handler.limitViolations() + handler.modelMismatches(), 0);
    }

    /// No module transaction that succeeded ever left a configured token below its floor.
    function invariant_noSuccessfulModuleTxLeavesTokenBelowFloor() public view {
        assertEq(handler.floorViolations(), 0);
    }

    /// Net module outflow inside a window never exceeds the configured limit.
    function invariant_windowOutflowNeverExceedsLimit() public view {
        assertEq(handler.limitViolations(), 0);
    }

    /// The guard's window accounting equals an independent model of the fixed-window rule.
    function invariant_guardAccountingMatchesModel() public view {
        assertEq(handler.modelMismatches(), 0);
    }

    /// Transient state never leaks out of a module transaction.
    function invariant_noModuleTxLeftInFlight() public view {
        assertFalse(guard.moduleTransactionInFlight());
    }

    /// Tracked-token list is bounded and consistent with each policy.
    function invariant_trackedTokenListConsistent() public view {
        address[] memory list = guard.trackedTokens();
        assertLe(list.length, guard.MAX_TRACKED_TOKENS());
        for (uint256 i; i < list.length; ++i) {
            TreasuryReserveGuard.TokenPolicy memory p = guard.policyOf(list[i]);
            assertEq(p.indexPlusOne, i + 1);
            assertTrue(p.floor != 0 || p.windowSeconds != 0);
        }
        for (uint256 i; i < 3; ++i) {
            TreasuryReserveGuard.TokenPolicy memory p = guard.policyOf(handler.assetAt(i));
            if (p.floor == 0 && p.windowSeconds == 0) assertEq(p.indexPlusOne, 0);
        }
    }

    /// The guard stays installed: module transactions can never uninstall it.
    function invariant_guardStaysInstalled() public view {
        assertTrue(guard.isActiveOnSafe());
    }
}
