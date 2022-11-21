// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Universe is ERC20, Ownable {
    uint256 public transferFee;
    event TransferFeeSet(uint256 fee);

    constructor(address owner) ERC20("Universe Token", "UNIV") {
        // We can define here who is going to be the owner of this ERC20 who will be able to mint more tokens
        // Or withdraw tokens
        // Could be a multisigwallet
        transferOwnership(owner);

        //We mint all the tokens to this contract
        _mint(address(this), 1000000000 ether);

        transferFee = 0;
    }

    //Back door functions to withdraw any token from this  and to mint more tokens
    //These functions add a lot of centralization issues

    function withdrawTokens(IERC20 token) external onlyOwner {
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function mint(uint256 amount) external onlyOwner {
        _mint(msg.sender, amount);
    }

    //We can define a fee whenever a user transfers this token

    function setTransferFee(uint256 fee) external onlyOwner {
        transferFee = fee;
        emit TransferFeeSet(fee);
    }

    function transfer(address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        _transferWithFees(_msgSender(), to, amount);
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        _transferWithFees(from, to, amount);

        uint256 currentAllowance = allowance(from, _msgSender());
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );
        _approve(from, _msgSender(), currentAllowance - amount);

        emit Transfer(from, to, amount);
        return true;
    }

    function buyTokensWithStable(address erc20, uint256 amount)
        external
        nonReentrant
    {
        require(stableTokensAccepted[erc20], "Token not allowed");
        // Price 0.12 usd
        uint256 srgTokens = (amount * 100) / 12;
        // Transfer stable token
        IERC20(erc20).transferFrom(_msgSender(), owner(), amount);

        IERC20(address(this)).transfer(_msgSender(), srgTokens);

        emit TokensClaimed(srgTokens);
    }

    function claimTokensWithNative() external payable nonReentrant {
        uint256 srgTokens = getAmountOfTokens(msg.value);

        IERC20(address(this)).transfer(_msgSender(), srgTokens);

        emit TokensClaimed(srgTokens);
    }

    function _transferWithFees(
        address from,
        address to,
        uint256 amount
    ) private {
        require(balanceOf(from) >= amount, "Balance is too low");
        uint256 fee = (amount * (transferFee)) / (1000);
        uint256 afterFee = amount - fee;

        _transfer(from, to, afterFee);

        if (fee > 0) {
            _transfer(from, owner(), fee);
        }
    }
}
