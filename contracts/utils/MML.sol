// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MMLtoken is ERC20 {
    address owner;

    constructor() ERC20("MML", "MML") {
        owner = msg.sender;
        _mint(owner, 1000e20);
    }

    function mint(address to) public {
        uint amount = 1000e20;
        _mint(to, amount);
    }

    function approve_BUSD(address spender) public {
        uint amount = 1000e20;
        _approve(owner, spender, amount);
    }
}
