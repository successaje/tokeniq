// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.28;

/// @notice TEST ONLY. Minimal ERC-20 with open minting and an optional transfer fee
///         (fee-on-transfer behaviour), used to exercise TreasuryReserveGuard balance accounting.
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public totalSupply;
    /// @notice Fee in basis points burned on every transfer (0 = plain ERC-20).
    uint256 public feeBps;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
    }

    function setFeeBps(uint256 feeBps_) external {
        require(feeBps_ <= 10_000, "fee");
        feeBps = feeBps_;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 added) external returns (bool) {
        allowance[msg.sender][spender] += added;
        emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "allowance");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "balance");
        uint256 fee = (amount * feeBps) / 10_000;
        balanceOf[from] -= amount;
        balanceOf[to] += amount - fee;
        totalSupply -= fee;
        emit Transfer(from, to, amount - fee);
        if (fee != 0) emit Transfer(from, address(0), fee);
    }
}

/// @notice TEST ONLY. A token whose balanceOf can be made to revert (liveness tests).
contract BrokenBalanceToken {
    bool public broken;

    function setBroken(bool broken_) external {
        broken = broken_;
    }

    function balanceOf(address) external view returns (uint256) {
        require(!broken, "broken");
        return 1;
    }
}
