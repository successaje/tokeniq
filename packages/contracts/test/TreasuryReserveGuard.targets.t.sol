// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";
import {MultiSendCallOnly} from "@safe-global/safe-smart-account/contracts/libraries/MultiSendCallOnly.sol";
import {
    ExtensibleFallbackHandler
} from "@safe-global/safe-smart-account/contracts/handler/ExtensibleFallbackHandler.sol";
import {
    DelegateCallTransactionGuard
} from "@safe-global/safe-smart-account/contracts/examples/guards/DelegateCallTransactionGuard.sol";

import {TreasuryReserveGuard} from "../src/TreasuryReserveGuard.sol";
import {SafeTestBase} from "./utils/SafeTestBase.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @notice Forbidden "Safe-authority" targets and strict MultiSend batch parsing.
contract TreasuryReserveGuardTargetsTest is SafeTestBase {
    bytes32 internal constant FALLBACK_HANDLER_SLOT = keccak256("fallback_manager.handler.address");
    address internal constant RECIPIENT = address(0xBEEF);
    address internal constant VAULT = address(0x7A017);

    MockERC20 internal usdc;
    MockERC20 internal weth;
    MultiSendCallOnly internal multiSend;

    function setUp() public {
        _initOwners();
        safe = _deployLocalSafe();
        _installGuardAndModule();
        usdc = new MockERC20("USD Coin", "USDC", 6);
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc.mint(address(safe), 1_000_000e6);
        weth.mint(address(safe), 100 ether);

        multiSend = new MultiSendCallOnly();
        _configure(abi.encodeCall(guard.setDelegateCallAllowed, (address(multiSend), true)));
        _configure(abi.encodeCall(guard.setFloor, (address(usdc), 1)));
        _configure(abi.encodeCall(guard.setSpenderAllowed, (address(usdc), VAULT, true)));
    }

    // =====================================================================
    // Forbidden Safe-authority targets (top-level CALL)
    // =====================================================================

    function test_ModuleTx_CannotCallAllowlistedModule_NoRolesSelfEscalation() public {
        // Roles' owner is the Safe, so a module tx calling Roles admin functions would pass Roles'
        // onlyOwner. Calling any allowlisted module through the Safe is therefore forbidden.
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(module)));
        _moduleCall(address(module), 0, abi.encodeWithSignature("assignRoles(address,bytes32[],bool[])"));
    }

    function test_ModuleTx_CannotCallFallbackHandler() public {
        address handler = address(uint160(uint256(vm.load(address(safe), FALLBACK_HANDLER_SLOT))));
        assertTrue(handler != address(0));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, handler));
        _moduleCall(handler, 0, "");
    }

    /// The ExtensibleFallbackHandler `onlySelf` check trusts the last 20 calldata bytes. A module tx
    /// calling the handler DIRECTLY with the Safe address appended passes it and could register an
    /// EIP-1271 domain verifier (=> permits outside any module tx). Shown real without the guard,
    /// blocked with it.
    function test_ExtensibleFallbackHandler_SpoofedSelfCall_IsRealAndBlocked() public {
        ExtensibleFallbackHandler efh = new ExtensibleFallbackHandler();
        assertTrue(_execSafe(address(safe), 0, abi.encodeCall(safe.setFallbackHandler, (address(efh)))));
        bytes32 domain = keccak256("some EIP-712 domain, e.g. USDC permit");
        address evilVerifier = address(0xE71);
        bytes memory spoofed = abi.encodePacked(
            abi.encodeWithSignature("setDomainVerifier(bytes32,address)", domain, evilVerifier), address(safe)
        );

        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(efh)));
        _moduleCall(address(efh), 0, spoofed);

        // also blocked when hidden inside a MultiSend batch
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(efh)));
        _batch(abi.encodePacked(_entry(0, address(efh), spoofed)));

        // without the guard, the spoof works — this is why the target is forbidden
        assertTrue(_execSafe(address(safe), 0, abi.encodeCall(safe.setModuleGuard, (address(0)))));
        assertTrue(_moduleCall(address(efh), 0, spoofed));
        assertEq(address(efh.domainVerifiers(safe, domain)), evilVerifier);
    }

    function test_ModuleTx_CannotCallTransactionGuard() public {
        DelegateCallTransactionGuard txGuard = new DelegateCallTransactionGuard(address(0));
        assertTrue(_execSafe(address(safe), 0, abi.encodeCall(safe.setGuard, (address(txGuard)))));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(txGuard)));
        _moduleCall(address(txGuard), 0, "");
    }

    // =====================================================================
    // MultiSend batch parsing
    // =====================================================================

    function test_Batch_ValidApproveAndTransfer_Executes() public {
        bytes memory batch = abi.encodePacked(
            _entry(0, address(usdc), abi.encodeCall(MockERC20.approve, (VAULT, 10e6))),
            _entry(0, address(usdc), abi.encodeCall(MockERC20.transfer, (RECIPIENT, 5e6)))
        );
        assertTrue(_batch(batch));
        assertEq(usdc.allowance(address(safe), VAULT), 10e6);
        assertEq(usdc.balanceOf(RECIPIENT), 5e6);
    }

    function test_Batch_InnerApproveToNonAllowlistedSpender_Rejected() public {
        bytes memory batch = abi.encodePacked(
            _entry(0, address(usdc), abi.encodeCall(MockERC20.transfer, (RECIPIENT, 1))),
            _entry(0, address(usdc), abi.encodeCall(MockERC20.approve, (RECIPIENT, type(uint256).max)))
        );
        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.SpenderNotAllowed.selector, address(usdc), RECIPIENT)
        );
        _batch(batch);
    }

    function test_Batch_InnerCallToSafeOrGuardOrModule_Rejected() public {
        bytes memory toSafe = _entry(0, address(safe), abi.encodeCall(safe.setModuleGuard, (address(0))));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(safe)));
        _batch(toSafe);

        // MultiSend maps `to == address(0)` to the Safe itself
        bytes memory toZero = _entry(0, address(0), abi.encodeCall(safe.enableModule, (address(0xBAD))));
        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(safe)));
        _batch(toZero);

        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(guard)));
        _batch(_entry(0, address(guard), abi.encodeCall(guard.unpause, ())));

        vm.expectRevert(abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, address(module)));
        _batch(_entry(0, address(module), ""));
    }

    function test_Batch_InnerDelegateCall_Rejected() public {
        vm.expectRevert(
            abi.encodeWithSelector(TreasuryReserveGuard.UnsupportedBatchOperation.selector, 1, address(usdc))
        );
        _batch(_entry(1, address(usdc), ""));
    }

    function test_Batch_Malformed_Rejected() public {
        bytes memory good = _entry(0, address(usdc), abi.encodeCall(MockERC20.transfer, (RECIPIENT, 1)));

        // truncated: entry header shorter than 85 bytes
        _expectMalformed(abi.encodeCall(MultiSendCallOnly.multiSend, (_truncate(good, 84))));
        // declared inner length larger than what remains
        _expectMalformed(abi.encodeCall(MultiSendCallOnly.multiSend, (_truncate(good, good.length - 1))));
        // trailing garbage after a complete entry (MultiSend could skip or misread it)
        _expectMalformed(abi.encodeCall(MultiSendCallOnly.multiSend, (abi.encodePacked(good, bytes1(0x00)))));
        // non-standard ABI offset
        bytes memory nonStandard = abi.encodePacked(
            MultiSendCallOnly.multiSend.selector, uint256(0x40), uint256(0), uint256(good.length), good
        );
        _expectMalformed(nonStandard);
        // shorter than selector + offset + length
        _expectMalformed(abi.encodePacked(MultiSendCallOnly.multiSend.selector, uint256(0x20)));
        // declared bytes length beyond calldata
        _expectMalformed(
            abi.encodePacked(MultiSendCallOnly.multiSend.selector, uint256(0x20), uint256(good.length + 1), good)
        );
    }

    function test_Batch_Empty_IsAllowed() public {
        assertTrue(_batch(""));
    }

    /// Structured differential fuzz: random batches over a set of interesting targets; the guard's
    /// decision must equal an independent model of the rules (first violating entry wins).
    function testFuzz_Batch_DecisionMatchesModel(uint8 count, uint256 seed) public {
        count = uint8(bound(count, 1, 4));
        address[8] memory targets = [
            address(usdc),
            address(weth),
            address(safe),
            address(guard),
            address(module),
            address(0),
            RECIPIENT,
            address(uint160(uint256(vm.load(address(safe), FALLBACK_HANDLER_SLOT))))
        ];
        bytes memory packed;
        bytes memory expectedRevert;
        for (uint256 i; i < count; ++i) {
            uint256 r = uint256(keccak256(abi.encode(seed, i)));
            uint256 op = (r >> 8) % 7 == 0 ? 1 : 0;
            address to = targets[r % 8];
            bool isApprove = (r >> 16) % 2 == 0;
            address spender = (r >> 24) % 2 == 0 ? VAULT : RECIPIENT;
            uint256 amount = (r >> 32) % 3 == 0 ? 0 : 1e6;
            bytes memory data = isApprove
                ? abi.encodeCall(MockERC20.approve, (spender, amount))
                : abi.encodeCall(MockERC20.transfer, (RECIPIENT, 1));
            packed = abi.encodePacked(packed, _entry(op, to, data));

            if (expectedRevert.length == 0) {
                if (op != 0) {
                    expectedRevert =
                        abi.encodeWithSelector(TreasuryReserveGuard.UnsupportedBatchOperation.selector, op, to);
                } else {
                    address eff = to == address(0) ? address(safe) : to;
                    if (eff == address(safe) || eff == address(guard) || eff == address(module) || eff == targets[7]) {
                        expectedRevert = abi.encodeWithSelector(TreasuryReserveGuard.ForbiddenTarget.selector, eff);
                    } else if (eff == address(usdc) && isApprove && amount != 0 && spender != VAULT) {
                        expectedRevert = abi.encodeWithSelector(
                            TreasuryReserveGuard.SpenderNotAllowed.selector, address(usdc), spender
                        );
                    }
                }
            }
        }
        if (expectedRevert.length != 0) {
            vm.expectRevert(expectedRevert);
            _batch(packed);
        } else {
            assertTrue(_batch(packed), "model says allowed: batch must execute");
        }
    }

    /// Arbitrary bytes never make the parser panic (no out-of-bounds read / overflow).
    function testFuzz_Batch_ParserNeverPanics(bytes calldata packed) public {
        try module.exec(
            address(multiSend), 0, abi.encodeCall(MultiSendCallOnly.multiSend, (packed)), Enum.Operation.DelegateCall
        ) returns (
            bool
        ) {}
        catch (bytes memory err) {
            assertTrue(err.length >= 4, "revert without reason");
            // forge-lint: disable-next-line(unsafe-typecast) -- intentional: selector of the revert data
            bytes4 sel = bytes4(err);
            assertTrue(sel != bytes4(0x4e487b71), "Panic");
            assertTrue(
                sel == TreasuryReserveGuard.MalformedMultiSend.selector
                    || sel == TreasuryReserveGuard.UnsupportedBatchOperation.selector
                    || sel == TreasuryReserveGuard.ForbiddenTarget.selector
                    || sel == TreasuryReserveGuard.SpenderNotAllowed.selector
                    || sel == TreasuryReserveGuard.MalformedApprovalCalldata.selector
                    || sel == TreasuryReserveGuard.ReserveFloorBreached.selector,
                "unexpected revert"
            );
        }
        assertFalse(guard.moduleTransactionInFlight());
    }

    // =====================================================================
    // helpers
    // =====================================================================

    function _entry(uint256 op, address to, bytes memory data) internal pure returns (bytes memory) {
        // forge-lint: disable-next-line(unsafe-typecast) -- op is 0 or 1 in every caller
        return abi.encodePacked(uint8(op), to, uint256(0), uint256(data.length), data);
    }

    function _batch(bytes memory packed) internal returns (bool) {
        return module.exec(
            address(multiSend), 0, abi.encodeCall(MultiSendCallOnly.multiSend, (packed)), Enum.Operation.DelegateCall
        );
    }

    function _expectMalformed(bytes memory callData) internal {
        vm.expectRevert(TreasuryReserveGuard.MalformedMultiSend.selector);
        module.exec(address(multiSend), 0, callData, Enum.Operation.DelegateCall);
    }

    function _truncate(bytes memory b, uint256 n) internal pure returns (bytes memory out) {
        out = new bytes(n);
        for (uint256 i; i < n; ++i) {
            out[i] = b[i];
        }
    }
}
