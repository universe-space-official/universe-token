//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking {
    IERC20 public immutable univToken;

    struct Stake {
        uint256 stakeId;
        address stakerAddress;
        uint256 amountStaked;
        uint256 finalReward;
        uint256 deadline;
    }

    event NewStake(
        uint256 stakeId,
        address indexed stakerAddress,
        uint256 amountStaked,
        uint256 deadline
    );

    event StakePaid(
        uint256 stakeId,
        address indexed stakerAddress,
        uint256 amountStaked,
        uint256 deadline
    );

    mapping(uint256 => Stake) public stakes;

    uint256 public stakeCounter;

    // How much stake reward is already being expected;
    uint256 private _totalReward;

    //  user address => his amount of stakedBalance
    mapping(address => uint256) public stakedBalance;

    constructor(address _univTokenAddress) {
        univToken = IERC20(_univTokenAddress);
    }

    function stake(uint256 amount, uint256 dayAmount) external {
        require(amount > 0, "amount = 0");

        require(dayAmount >= 30, "Minimum time staked is one month");

        require(dayAmount <= 365, "Maximum time staked is one year");
        require(
            univToken.balanceOf(msg.sender) >=
                stakedBalance[msg.sender] + amount,
            "Don't have any unlocked tokens to stake"
        );

        // Calculate if contract has enough money to pay

        //     APYBase = 6 %
        //     APYExtraDay = 0.0328358 %                                days
        //     finalReward = amount * (APYBase+ days*(APYExtraDay))  * ------
        //                                                              365

        uint256 finalReward = ((amount * 6 * dayAmount) /
            100 +
            (amount * dayAmount**2 * 328358) /
            1000000000) / 365;

        //
        //  BC = SRG balance of contract
        //  TR = How much token is already saved to pay for current stakers
        //  FR = The final reward of staker after his locked duration ends
        //
        //  BC - TR >= FR

        univToken.transferFrom(msg.sender, address(this), amount);

        require(
            univToken.balanceOf(address(this)) - amount - _totalReward >=
                finalReward,
            "Contract doesn't have enough SRG Token to give rewards"
        );

        _totalReward += finalReward;
        stakedBalance[msg.sender] += amount;

        uint256 stakeId = stakeCounter++;
        Stake storage newStake = stakes[stakeId];

        newStake.deadline = block.timestamp + dayAmount * (1 days);
        newStake.amountStaked = amount;
        newStake.finalReward = finalReward;
        newStake.stakeId = stakeId;
        newStake.stakerAddress = msg.sender;

        emit NewStake(stakeId, msg.sender, amount, newStake.deadline);
    }

    function unStake(uint256 stakeId) external {
        require(
            stakes[stakeId].stakerAddress == msg.sender,
            "Only staker can withdraw"
        );

        require(
            stakes[stakeId].deadline <= block.timestamp,
            "Stake has not expired"
        );

        univToken.transfer(
            msg.sender,
            stakes[stakeId].amountStaked + stakes[stakeId].finalReward
        );

        // When a Stake payment gets made we need to burn a % of tokens
        // Questions:
        // What tokens exactly are we burning? A % of the total reward?? or something extra

        uint256 amountToBeBurned = 0; // TBD

        univToken.transfer(address(0), amountToBeBurned);

        _totalReward -= stakes[stakeId].finalReward;
        stakedBalance[msg.sender] -= stakes[stakeId].amountStaked;

        emit StakePaid(
            stakeId,
            msg.sender,
            stakes[stakeId].amountStaked,
            stakes[stakeId].deadline
        );

        delete stakes[stakeId];
    }

    function balanceOf(address account) external view returns (uint256) {
        return stakedBalance[account];
    }
}
