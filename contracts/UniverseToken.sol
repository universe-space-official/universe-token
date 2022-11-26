// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/finance/VestingWallet.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//Tests
import "hardhat/console.sol";

contract UniverseToken is ERC20, Ownable {
    AggregatorV3Interface internal priceFeed;

    event TransferFeeSet(uint256 fee);
    mapping(address => bool) public stableTokensAccepted;
    event TokensClaimed(uint256 amount);
    event AddedStableCoin(address stableCoinAddress);
    event RemovedStableCoin(address stableCoinAddress);

    // Value of univToken in dollars (18 decimals)
    uint256 public univTokenUSD;

    // Boolean that checks if buys are allowed or not
    bool public buysPaused;

    // Transfer fee when someone transfers univToken
    uint256 public transferFee;

    // Need to specify how much tokens we want to sell

    // Need to specify recipient addresses for vesting

    struct VestingInfo {
        address beneficiaryAddress;
        uint64 startTimestamp;
        uint64 durationSeconds;
    }

    constructor(
        address owner,
        address priceFeedAddress,
        uint256 _univTokenUSD
    ) ERC20("Universe Token", "UNIV") {
        // We can define here who is going to be the owner of this ERC20 who will be able to mint more tokens
        // Or withdraw tokens
        // Could be a multisigwallet
        transferOwnership(owner);

        // To calculate price in dollars of native coin
        priceFeed = AggregatorV3Interface(priceFeedAddress);

        //We mint all the tokens to this contract

        //1%  of tokens for private sale 10 millions
        _mint(address(this), 10000000 ether);

        transferFee = 0;

        univTokenUSD = _univTokenUSD;
        buysPaused = false;

        //Deploying Vesting wallets

        _mint(address(this), 10000000 ether);
    }

    // //Back door functions to mint more tokens

    // function mint(uint256 amount) external onlyOwner {
    //     _mint(msg.sender, amount);
    // }

    // Owner functions

    function withdrawTokens(IERC20 token) external onlyOwner {
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function withdrawMatic() external payable onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");

        require(success, "Withdrawal failed.");
    }

    function pauseBuys(bool status) external onlyOwner {
        buysPaused = status;
    }

    function setTransferFee(uint256 fee) external onlyOwner {
        transferFee = fee;
        emit TransferFeeSet(fee);
    }

    function setUnivTokenPrice(uint256 price) external onlyOwner {
        univTokenUSD = price;
    }

    function addAcceptedStableCoin(address erc20) external onlyOwner {
        stableTokensAccepted[erc20] = true;
        emit AddedStableCoin(erc20);
    }

    function removeAcceptedStableCoin(address erc20) external onlyOwner {
        stableTokensAccepted[erc20] = false;
        emit RemovedStableCoin(erc20);
    }

    // Transfer functions

    function transfer(address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        if (_msgSender() == owner()) {
            _transfer(_msgSender(), to, amount);
        } else {
            _transferWithFees(_msgSender(), to, amount);
        }

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        if (from == owner()) {
            _transfer(from, to, amount);
        } else {
            _transferWithFees(from, to, amount);
        }

        uint256 currentAllowance = allowance(from, _msgSender());
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );
        _approve(from, _msgSender(), currentAllowance - amount);

        emit Transfer(from, to, amount);

        return true;
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

    // Buy functions

    function buyTokensWithStable(address erc20, uint256 amount) external {
        require(!buysPaused, "Buys are paused");

        require(stableTokensAccepted[erc20], "Token not allowed");

        uint256 univTokens = (amount * 10**18) / univTokenUSD;

        // Transfer stable token
        IERC20(erc20).transferFrom(_msgSender(), owner(), amount);
        IERC20(address(this)).transfer(_msgSender(), univTokens);

        emit TokensClaimed(univTokens);
    }

    function buyTokensWithNative() external payable {
        require(!buysPaused, "Buys are paused");
        uint256 srgTokens = getAmountOfTokens(msg.value);

        IERC20(address(this)).transfer(_msgSender(), srgTokens);

        emit TokensClaimed(srgTokens);
    }

    // View function to get amount of tokens per eth

    function getAmountOfTokens(uint256 nativeAmount)
        public
        view
        returns (uint256)
    {
        (, int256 price, , , ) = priceFeed.latestRoundData();

        uint256 adjustedPrice = uint256(price) * 10**10; // 18 decimals

        uint256 amountOfTokens = (nativeAmount * adjustedPrice) / univTokenUSD;
        return amountOfTokens;
    }

    // This function funds all wallets
    // Owner defines the beneficiary address, startingTimestamp (if applicable) and duration (if applicable)

    function fundWallets(
        // Vesting wallets
        VestingInfo memory viFounders,
        VestingInfo memory viDevsEmployees,
        VestingInfo memory viKeyPartnersAdv,
        VestingInfo memory viDevAdoptionPrg,
        VestingInfo memory viStrategicFunding,
        VestingInfo memory viSeedFunding,
        VestingInfo memory viFutureEmployee,
        VestingInfo memory viEarlyBackers,
        // Normal beneficiaries
        address liqPool,
        address stakingRewards,
        address liquidityPrograms,
        address longTermProtocol
    ) external onlyOwner {
        VestingWallet foundersWallet = new VestingWallet(
            viFounders.beneficiaryAddress,
            viFounders.startTimestamp,
            viFounders.durationSeconds
        );
        VestingWallet devsEmployeeWallet = new VestingWallet(
            viDevsEmployees.beneficiaryAddress,
            viDevsEmployees.startTimestamp,
            viDevsEmployees.durationSeconds
        );
        VestingWallet keyPartnersAdvWallet = new VestingWallet(
            viKeyPartnersAdv.beneficiaryAddress,
            viKeyPartnersAdv.startTimestamp,
            viKeyPartnersAdv.durationSeconds
        );
        VestingWallet devAdoptionPrgWallet = new VestingWallet(
            viDevAdoptionPrg.beneficiaryAddress,
            viDevAdoptionPrg.startTimestamp,
            viDevAdoptionPrg.durationSeconds
        );
        VestingWallet strategicFundingWallet = new VestingWallet(
            viStrategicFunding.beneficiaryAddress,
            viStrategicFunding.startTimestamp,
            viStrategicFunding.durationSeconds
        );
        VestingWallet seedFundingWallet = new VestingWallet(
            viSeedFunding.beneficiaryAddress,
            viSeedFunding.startTimestamp,
            viSeedFunding.durationSeconds
        );
        VestingWallet futureEmplyeeWallet = new VestingWallet(
            viFutureEmployee.beneficiaryAddress,
            viFutureEmployee.startTimestamp,
            viFutureEmployee.durationSeconds
        );
        VestingWallet earlyBackersWallet = new VestingWallet(
            viEarlyBackers.beneficiaryAddress,
            viEarlyBackers.startTimestamp,
            viEarlyBackers.durationSeconds
        );

        VestingWallet communityEventWallet = new VestingWallet(
            viEarlyBackers.beneficiaryAddress,
            viEarlyBackers.startTimestamp,
            viEarlyBackers.durationSeconds
        );

        //Transfering amounts to wallets

        _mint(liqPool, 200000000 ether);
        _mint(stakingRewards, 230000000 ether);
        _mint(liquidityPrograms, 90000000 ether);
        _mint(address(foundersWallet), 150000000 ether);
        _mint(address(devsEmployeeWallet), 60000000 ether);
        _mint(address(keyPartnersAdvWallet), 10000000 ether);
        _mint(address(devAdoptionPrgWallet), 30000000 ether);
        _mint(address(strategicFundingWallet), 10000000 ether);
        _mint(address(seedFundingWallet), 20000000 ether);
        _mint(address(futureEmplyeeWallet), 50000000 ether);
        _mint(address(earlyBackersWallet), 20000000 ether);
        _mint(address(communityEventWallet), 70000000 ether);
        _mint(longTermProtocol, 60000000 ether);
    }
}
