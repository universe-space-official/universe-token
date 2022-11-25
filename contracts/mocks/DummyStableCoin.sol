pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DummyStableCoin is ERC20 {
    constructor(string memory stableCoinName, string memory stableCoinSymbol)
        ERC20(stableCoinName, stableCoinSymbol)
    {
        _mint(msg.sender, 10000 ether);
    }
}
