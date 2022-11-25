// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract MockAggregator {
    int256 public s_answer;

    function setLatestAnswer(int256 answer) public {
        s_answer = answer;
    }

    function latestAnswer() public view returns (int256) {
        return s_answer;
    }

    function latestRoundData()
        external
        pure
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (uint80(1), 1 * 10**8, 1, 1, uint80(1));
    }
}
