// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

import {Enum} from "@safe-global/safe-smart-account/contracts/libraries/Enum.sol";

interface ISafeModuleExec {
    function execTransactionFromModule(address to, uint256 value, bytes calldata data, Enum.Operation operation)
        external
        returns (bool success);

    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success, bytes memory returnData);
}

/// @notice TEST ONLY — NO ACCESS CONTROL. Stands in for an automation module (in production a
///         Zodiac Roles Modifier v2 instance) and forwards calls to the Safe's
///         execTransactionFromModule entry points.
contract TestModule {
    address public immutable safe;

    constructor(address safe_) {
        safe = safe_;
    }

    function exec(address to, uint256 value, bytes calldata data, Enum.Operation operation)
        external
        returns (bool success)
    {
        return ISafeModuleExec(safe).execTransactionFromModule(to, value, data, operation);
    }

    function execReturnData(address to, uint256 value, bytes calldata data, Enum.Operation operation)
        external
        returns (bool success, bytes memory returnData)
    {
        return ISafeModuleExec(safe).execTransactionFromModuleReturnData(to, value, data, operation);
    }
}

/// @notice TEST ONLY. Called by the Safe during a module transaction; tries to start a second
///         (nested) module transaction through `module`, bubbling any revert.
contract NestedExecutor {
    function reenter(TestModule module, address to, uint256 value, bytes calldata data) external {
        module.exec(to, value, data, Enum.Operation.Call);
    }
}

/// @notice TEST ONLY. Library-style contract meant to be DELEGATECALLed by the Safe. Each
///         function models something a delegatecall target can do in the Safe's context.
contract DelegateCallTarget {
    /// @dev keccak256("module_manager.module_guard.address") — Safe v1.5.0 module guard slot.
    bytes32 internal constant MODULE_GUARD_SLOT = 0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947;

    /// @notice Plain token transfer executed as the Safe.
    function transferToken(address token, address to, uint256 amount) external {
        (bool ok,) = token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        require(ok, "transfer failed");
    }

    /// @notice Overwrites the Safe's module guard slot (uninstalls the guard behind its back).
    function clearModuleGuard() external {
        bytes32 slot = MODULE_GUARD_SLOT;
        assembly {
            sstore(slot, 0)
        }
    }

    /// @notice Calls the guard as the Safe to try to lower a floor mid-transaction.
    function lowerFloor(address guard, address token) external {
        (bool ok, bytes memory ret) = guard.call(abi.encodeWithSignature("setFloor(address,uint256)", token, 0));
        if (!ok) {
            assembly {
                revert(add(ret, 0x20), mload(ret))
            }
        }
    }
}
