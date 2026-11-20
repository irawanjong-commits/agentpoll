// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Test-only stand-in for the Agent ID contract.
contract MockAgentID {
    mapping(address => uint256) private _balances;
    function setHolder(address account, uint256 amount) external {
        _balances[account] = amount;
    }
    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }
}
