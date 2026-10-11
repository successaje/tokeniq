// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {Safe} from "@safe-global/safe-smart-account/contracts/Safe.sol";

import {TreasuryReserveGuard} from "../../src/TreasuryReserveGuard.sol";
import {DeployTreasuryReserveGuard} from "../../script/DeployTreasuryReserveGuard.s.sol";
import {SafeTestBase} from "../utils/SafeTestBase.sol";
import {TestModule} from "../mocks/TestModule.sol";
import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";

interface IERC20Min {
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
    function allowance(address, address) external view returns (uint256);
}

interface IERC4626Min {
    function asset() external view returns (address);
    function balanceOf(address) external view returns (uint256);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function maxWithdraw(address owner) external view returns (uint256);
    function MORPHO() external view returns (address);
}

/// @notice Base mainnet (8453) fork test against the CANONICAL Safe v1.5.0 deployment (bytecode
///         built by Safe with solc 0.7.6; code hashes asserted against safe-deployments) and a live
///         Morpho MetaMorpho V1 USDC vault. Skips (does not fail) when no Base RPC is reachable.
///
///         RPC: env BASE_RPC_URL (default https://mainnet.base.org), then env BASE_RPC_FALLBACK_URL
///         (default https://base-rpc.publicnode.com). Optional env BASE_FORK_BLOCK pins a block.
contract BaseMorphoForkTest is SafeTestBase {
    // Circle USDC on Base
    address internal constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    // Gauntlet USDC Prime — MetaMorpho V1 (ERC-4626, asset() == USDC, MORPHO() == Morpho Blue).
    // Verified 2026-10-11 via api.morpho.org (listed, no warnings) and on-chain calls.
    address internal constant VAULT = 0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61;
    address internal constant MORPHO_BLUE = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;

    // Canonical Safe v1.5.0 (safe-deployments src/assets/v1.5.0/*.json, networkAddresses["8453"] = canonical)
    address internal constant SAFE_L2_150 = 0xEdd160fEBBD92E350D4D398fb636302fccd67C7e;
    address internal constant SAFE_FACTORY_150 = 0x14F2982D601c9458F93bd70B218933A6f8165e7b;
    address internal constant FALLBACK_HANDLER_150 = 0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4;
    bytes32 internal constant SAFE_L2_150_CODEHASH = 0x180193227186ccb85316c94db1f0d156ed932b14712cfaac78901899178572dc;
    bytes32 internal constant SAFE_FACTORY_150_CODEHASH =
        0x967dae4cda22b0c9ef7f31b010bdc1ceb0af9904b0c3dc060b5302e4c18a4529;
    bytes32 internal constant FALLBACK_HANDLER_150_CODEHASH =
        0x3c6a85bcf7b563daa624b884b4e9a1b9fa5371edde7be945d998071a48f28bbc;

    // Canonical Safe v1.4.1 (safe-deployments src/assets/v1.4.1) — has NO module guard support.
    address internal constant SAFE_L2_141 = 0x29fcB43b46531BcA003ddC8FCB67FFE91900C762;
    address internal constant SAFE_FACTORY_141 = 0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67;
    bytes32 internal constant SAFE_L2_141_CODEHASH = 0xb1f926978a0f44a2c0ec8fe822418ae969bd8c3f18d61e5103100339894f81ff;
    bytes32 internal constant SAFE_FACTORY_141_CODEHASH =
        0x50c3cdc4074750a7a974204a716c999edd37482f907608d960b2b025ee0b3317;

    uint256 internal constant START_USDC = 10_000e6;
    uint256 internal constant FLOOR_USDC = 4_000e6;

    bool internal forkReady;

    modifier onlyFork() {
        if (!forkReady) {
            vm.skip(true);
            return;
        }
        _;
    }

    function setUp() public {
        string memory primary = vm.envOr("BASE_RPC_URL", string("https://mainnet.base.org"));
        string memory fallbackUrl = vm.envOr("BASE_RPC_FALLBACK_URL", string("https://base-rpc.publicnode.com"));
        forkReady = _tryFork(primary) || _tryFork(fallbackUrl);
        if (!forkReady) return;
        emit log_named_uint("Base fork block", block.number);

        // The deployed Safe v1.5.0 contracts must be byte-for-byte the canonical ones.
        assertEq(SAFE_L2_150.codehash, SAFE_L2_150_CODEHASH, "SafeL2 1.5.0 codehash");
        assertEq(SAFE_FACTORY_150.codehash, SAFE_FACTORY_150_CODEHASH, "SafeProxyFactory 1.5.0 codehash");
        assertEq(FALLBACK_HANDLER_150.codehash, FALLBACK_HANDLER_150_CODEHASH, "CompatibilityFallbackHandler codehash");
        assertEq(IERC4626Min(VAULT).asset(), USDC, "vault asset");
        assertEq(IERC4626Min(VAULT).MORPHO(), MORPHO_BLUE, "MetaMorpho V1");

        _initOwners();
        uint256 salt = uint256(keccak256(abi.encode("tokeniq.fork-test", block.number, address(this))));
        safe = _createSafe(SAFE_L2_150, SAFE_FACTORY_150, FALLBACK_HANDLER_150, salt);
        assertEq(safe.VERSION(), "1.5.0");
        _installGuardAndModule();

        deal(USDC, address(safe), START_USDC);
        assertEq(IERC20Min(USDC).balanceOf(address(safe)), START_USDC, "dealt USDC");

        _configure(abi.encodeCall(guard.setFloor, (USDC, FLOOR_USDC)));
        _configure(abi.encodeCall(guard.setSpenderAllowed, (USDC, VAULT, true)));
    }

    function _tryFork(string memory url) internal returns (bool) {
        uint256 pinned = vm.envOr("BASE_FORK_BLOCK", uint256(0));
        if (pinned != 0) {
            try vm.createSelectFork(url, pinned) returns (uint256) {
                return block.chainid == 8453;
            } catch {
                return false;
            }
        }
        try vm.createSelectFork(url) returns (uint256) {
            return block.chainid == 8453;
        } catch {
            return false;
        }
    }

    // ------------------------------------------------------------------ tests

    function test_Fork_CanonicalSafe150_GuardInstalled() public onlyFork {
        assertTrue(guard.isActiveOnSafe());
        assertTrue(safe.isModuleEnabled(address(module)));
    }

    function test_Fork_DepositWithinFloor_ReceivesShares_ThenWithdrawRestores() public onlyFork {
        _moduleApprove(5_000e6);
        assertTrue(_moduleCall(VAULT, 0, abi.encodeCall(IERC4626Min.deposit, (5_000e6, address(safe)))), "deposit");

        uint256 shares = IERC4626Min(VAULT).balanceOf(address(safe));
        assertGt(shares, 0, "shares received");
        assertEq(IERC20Min(USDC).balanceOf(address(safe)), 5_000e6, "liquid USDC");
        assertGe(IERC20Min(USDC).balanceOf(address(safe)), FLOOR_USDC);

        uint256 maxW = IERC4626Min(VAULT).maxWithdraw(address(safe));
        assertGt(maxW, 0, "maxWithdraw > 0");
        assertApproxEqAbs(maxW, 5_000e6, 2, "position value ~ deposit");

        assertTrue(
            _moduleCall(VAULT, 0, abi.encodeCall(IERC4626Min.withdraw, (maxW, address(safe), address(safe)))),
            "withdraw"
        );
        assertApproxEqAbs(IERC20Min(USDC).balanceOf(address(safe)), START_USDC, 2, "balance restored");
    }

    function test_Fork_DepositBreachingFloor_Reverts() public onlyFork {
        _moduleApprove(6_001e6);
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryReserveGuard.ReserveFloorBreached.selector, USDC, START_USDC - 6_001e6, FLOOR_USDC
            )
        );
        _moduleCall(VAULT, 0, abi.encodeCall(IERC4626Min.deposit, (6_001e6, address(safe))));
        assertEq(IERC20Min(USDC).balanceOf(address(safe)), START_USDC);
        assertEq(IERC4626Min(VAULT).balanceOf(address(safe)), 0);
    }

    function test_Fork_ApproveToUnlistedSpender_Reverts() public onlyFork {
        address stranger = address(0xBAD);
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.SpenderNotAllowed.selector, USDC, stranger));
        _moduleCall(USDC, 0, abi.encodeCall(IERC20Min.approve, (stranger, 1)));
    }

    function test_Fork_OutflowLimit_AppliesToDeposits_AndWithdrawalsDoNotCreateAllowance() public onlyFork {
        _configure(abi.encodeCall(guard.setOutflowLimit, (USDC, 3_000e6, 1 days)));
        _moduleApprove(type(uint256).max);
        assertTrue(_moduleCall(VAULT, 0, abi.encodeCall(IERC4626Min.deposit, (3_000e6, address(safe)))));

        // pull everything back (an inflow) — must not refill the window
        uint256 maxW = IERC4626Min(VAULT).maxWithdraw(address(safe));
        assertTrue(_moduleCall(VAULT, 0, abi.encodeCall(IERC4626Min.withdraw, (maxW, address(safe), address(safe)))));

        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.OutflowLimitExceeded.selector, USDC, 3_000e6 + 1, 3_000e6)
        );
        _moduleCall(VAULT, 0, abi.encodeCall(IERC4626Min.deposit, (1, address(safe))));
    }

    /// Safe v1.4.1 has no module guards. With no fallback handler, `setModuleGuard` even "succeeds"
    /// (unknown selector -> empty fallback) while nothing is enforced. Detect the version off-chain.
    function test_Fork_Safe141_SetModuleGuardIsSilentNoOp_VersionMustBeCheckedOffChain() public onlyFork {
        assertEq(SAFE_L2_141.codehash, SAFE_L2_141_CODEHASH, "SafeL2 1.4.1 codehash");
        assertEq(SAFE_FACTORY_141.codehash, SAFE_FACTORY_141_CODEHASH, "SafeProxyFactory 1.4.1 codehash");
        Safe safe150 = safe;
        safe = _createSafe(SAFE_L2_141, SAFE_FACTORY_141, address(0), uint256(keccak256("tokeniq.fork-141")));
        assertEq(safe.VERSION(), "1.4.1");

        TreasuryReserveGuard g = new TreasuryReserveGuard(address(safe));
        TestModule m = new TestModule(address(safe));
        assertTrue(_execSafe(address(safe), 0, abi.encodeCall(safe.enableModule, (address(m)))));
        assertTrue(_execSafe(address(g), 0, abi.encodeCall(g.setModuleAllowed, (address(m), true))));
        assertTrue(_execSafe(address(g), 0, abi.encodeCall(g.setFloor, (USDC, FLOOR_USDC))));
        // The owner tx "succeeds" ...
        assertTrue(_execSafe(address(safe), 0, abi.encodeWithSignature("setModuleGuard(address)", address(g))));
        // ... but the guard is not installed and module txs are NOT checked:
        assertFalse(g.isActiveOnSafe(), "isActiveOnSafe() exposes the mismatch");
        deal(USDC, address(safe), START_USDC);
        assertTrue(
            m.exec(
                USDC,
                0,
                abi.encodeWithSignature("transfer(address,uint256)", address(0xBEEF), 9_000e6),
                Enum.Operation.Call
            )
        );
        assertEq(IERC20Min(USDC).balanceOf(address(safe)), 1_000e6, "went below the floor unchecked");

        // The deploy script refuses such a Safe up front.
        DeployTreasuryReserveGuard script = new DeployTreasuryReserveGuard();
        vm.expectRevert(bytes("SAFE must be Safe v1.5.0 (older Safes have no module guard support)"));
        script.requireSafe150(address(safe));
        safe = safe150;
    }

    // ------------------------------------------------------------------ helpers

    function _moduleApprove(uint256 amount) internal {
        assertTrue(_moduleCall(USDC, 0, abi.encodeCall(IERC20Min.approve, (VAULT, amount))), "approve");
        assertEq(IERC20Min(USDC).allowance(address(safe), VAULT), amount);
    }
}
