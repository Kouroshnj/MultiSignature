//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./utils/UniswapV3Twap.sol";

contract LiquNativeStaking is ReentrancyGuard, UniswapV3Twap {
    uint256 stakeIds;
    uint32 rewardRate = 1300;
    address public owner;
    IERC20 WETHaddress;
    IERC20 USDTaddress;

    mapping(uint256 => Stake) private StakeInformation;
    mapping(uint256 => uint256) private StakeReward;

    event ChangeOwner(address oldOwner, address newOwner);
    event ChangeRewardRate(address signer, uint32 oldRewardRate);

    constructor(
        address WETHtoken,
        address USDTtoken,
        address factory,
        uint24 uniswapfee
    ) UniswapV3Twap(factory, WETHtoken, USDTtoken, uniswapfee) {
        owner = msg.sender;
        WETHaddress = IERC20(WETHtoken);
        USDTaddress = IERC20(USDTtoken);
    }

    modifier onlyContractOwner() {
        _onlyContractOwner();
        _;
    }

    modifier invalidStakeId(uint256 _stakeId) {
        _invalidStakeId(_stakeId);
        _;
    }

    modifier invalidLockOrInterval(uint16 _lockTime, uint16 _rewardInterval) {
        _invalidLockOrInterval(_lockTime, _rewardInterval);
        _;
    }

    modifier zeroOrMaxAmount(uint64 _amount) {
        _zeroOrMaxAmount(_amount);
        _;
    }

    modifier lessThanLockTime(uint256 _lockTime, uint16 _rewardInterval) {
        _lessThanLockTime(_lockTime, _rewardInterval);
        _;
    }

    modifier mustBeUngoing(uint256 _stakeId) {
        _mustBeUngoing(_stakeId);
        _;
    }

    modifier isAbleToUnStake(uint256 _stakeId) {
        _isAbleToUnStake(_stakeId);
        _;
    }

    modifier onlyStakeOwner(uint256 _stakeId) {
        _onlyStakeOwner(_stakeId);
        _;
    }

    modifier isAbleToClaim(uint256 _stakeId) {
        _isAbleToClaim(_stakeId);
        _;
    }

    struct Stake {
        address stakeHolder;
        uint64 amountToHold;
        uint256 lockTime;
        uint16 intervalOfClaim;
        uint256 latestClaim;
        uint256 upcomingClaim;
        uint16 holderTA;
        uint16 holderTL;
        uint16 holderTI;
        bool ongoing;
    }

    function deposit() public payable {
        require(msg.value > 0, "Deposit zero amount!");
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to desposit!");
    }

    function withdraw(uint256 _amount) public onlyContractOwner {
        require(address(this).balance >= _amount, "Insufficient balance");
        (bool sent, ) = owner.call{value: _amount}("");
        require(sent, "Failed to withdraw!");
    }

    function stake(
        uint64 _desireAmount,
        uint16 _lockTime,
        uint16 _rewardInterval
    )
        public
        payable
        zeroOrMaxAmount(_desireAmount)
        invalidLockOrInterval(_lockTime, _rewardInterval)
        lessThanLockTime(_lockTime, _rewardInterval)
        nonReentrant
        returns (uint256)
    {
        stakeIds += 1;
        uint256 ethAmount = getEthPriceInUsdt(_desireAmount);
        require(msg.value >= ethAmount, "Invalid value!");
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to stake!");
        uint16 userTA = calculateTA(_desireAmount);
        uint16 userTL = calculateTL(_lockTime);
        uint16 userTI = calculateRewardInterval(_rewardInterval);
        StakeInformation[stakeIds].holderTI = userTI;
        StakeInformation[stakeIds].holderTA = userTA;
        StakeInformation[stakeIds].holderTL = userTL;
        setInformation(stakeIds, _desireAmount, _lockTime, _rewardInterval);
        StakeReward[stakeIds] = calculateReward(stakeIds);
        return stakeIds;
    }

    function claimReward(
        uint256 _stakeId
    )
        public
        invalidStakeId(_stakeId)
        onlyStakeOwner(_stakeId)
        mustBeUngoing(_stakeId)
        isAbleToClaim(_stakeId)
        nonReentrant
        returns (uint256)
    {
        uint256 currentTime = block.timestamp;
        uint256 quantity;
        uint256 reward = getEthPriceInUsdt(uint128(StakeReward[_stakeId]));
        address stakeOwner = StakeInformation[_stakeId].stakeHolder;
        uint256 userLatestClaim = StakeInformation[_stakeId].latestClaim;
        uint16 userInterval = StakeInformation[_stakeId].intervalOfClaim;
        if (currentTime >= StakeInformation[_stakeId].lockTime) {
            quantity = StakeInformation[_stakeId].lockTime - userLatestClaim;
            StakeInformation[_stakeId].ongoing = false;
        } else {
            quantity = currentTime - userLatestClaim;
        }
        quantity /= userInterval * 1 minutes;
        reward *= quantity;
        (bool sent, ) = stakeOwner.call{value: reward}("");
        require(sent, "Failed to claim reward!");
        StakeInformation[_stakeId].latestClaim =
            (userInterval * 1 minutes * quantity) +
            userLatestClaim;
        StakeInformation[_stakeId].upcomingClaim =
            (userInterval * 1 minutes) +
            StakeInformation[_stakeId].latestClaim;
        return reward;
    }

    function unStake(
        uint256 _stakeId
    )
        public
        invalidStakeId(_stakeId)
        onlyStakeOwner(_stakeId)
        isAbleToUnStake(_stakeId)
    {
        uint256 amount = getEthPriceInUsdt(
            StakeInformation[_stakeId].amountToHold
        );
        address stakeOwner = StakeInformation[_stakeId].stakeHolder;
        (bool sent, ) = stakeOwner.call{value: amount}("");
        require(sent, "Failed to unstake!");
    }

    function changeRewardRate(uint32 _newRewardRate) public onlyContractOwner {
        rewardRate = _newRewardRate;
        emit ChangeRewardRate(msg.sender, _newRewardRate);
    }

    function getRewardRate() public view returns (uint256) {
        return rewardRate;
    }

    function changeOwner(address _newOwner) external onlyContractOwner {
        owner = _newOwner;
        emit ChangeOwner(msg.sender, _newOwner);
    }

    function getStakeInformation(
        uint256 _stakeId
    ) public view returns (Stake memory) {
        return StakeInformation[_stakeId];
    }

    function getEthPriceInUsdt(uint128 _amount) public view returns (uint256) {
        uint256 price = callEstimateAmountOut(USDTaddress, _amount, 10);
        return price;
    }

    function getStoredRewardsUptoNow(
        uint256 _stakeId
    ) public view returns (uint256) {
        uint256 currentTime = block.timestamp;
        uint reward = StakeReward[_stakeId];
        uint256 userInterval = StakeInformation[_stakeId].intervalOfClaim;
        uint256 userLatestClaim = StakeInformation[_stakeId].latestClaim;
        uint256 quantity = currentTime - userLatestClaim;
        uint256 allRewards = StakeInformation[_stakeId].lockTime -
            userLatestClaim;
        quantity /= userInterval * 1 minutes;
        allRewards /= userInterval * 1 minutes;
        if (currentTime > StakeInformation[_stakeId].lockTime) {
            return allRewards * reward;
        } else {
            return quantity * reward;
        }
    }

    function getStakeIdReward(uint256 _stakeId) public view returns (uint256) {
        return StakeReward[_stakeId];
    }

    function getStakeIds() public view returns (uint256) {
        return stakeIds;
    }

    receive() external payable {}

    function calculateRewardInterval(
        uint16 rewardInterval
    ) internal pure returns (uint16) {
        uint16 reward;
        if (rewardInterval >= 10 && rewardInterval < 14) {
            reward = 67;
        } else if (rewardInterval >= 14 && rewardInterval < 29) {
            reward = 130;
        } else if (rewardInterval >= 29 && rewardInterval < 45) {
            reward = 320;
        } else if (rewardInterval >= 45 && rewardInterval < 60) {
            reward = 340;
        } else if (rewardInterval >= 60 && rewardInterval < 90) {
            reward = 350;
        } else if (rewardInterval >= 90 && rewardInterval < 180) {
            reward = 370;
        } else if (rewardInterval >= 180 && rewardInterval < 270) {
            reward = 390;
        } else if (rewardInterval >= 270 && rewardInterval < 365) {
            reward = 400;
        }
        return reward;
    }

    function calculateTL(uint16 lockTime) internal pure returns (uint16) {
        uint16 userTL;
        if (lockTime >= 30 && lockTime < 50) {
            userTL = 67;
        } else if (lockTime >= 50 && lockTime < 60) {
            userTL = 130;
        } else if (lockTime >= 60 && lockTime < 80) {
            userTL = 320;
        } else if (lockTime >= 80 && lockTime < 90) {
            userTL = 340;
        } else if (lockTime >= 90 && lockTime < 110) {
            userTL = 350;
        } else if (lockTime >= 110 && lockTime < 120) {
            userTL = 370;
        } else if (lockTime >= 120 && lockTime < 150) {
            userTL = 390;
        } else if (lockTime >= 150 && lockTime < 270) {
            userTL = 400;
        } else if (lockTime >= 270 && lockTime < 365) {
            userTL = 500;
        }
        return userTL;
    }

    function calculateTA(uint64 desireAmount) internal pure returns (uint16) {
        uint16 reward;
        if (desireAmount < (300 * 10 ** 6)) {
            reward = 67;
        } else if (
            desireAmount >= (300 * 10 ** 6) && desireAmount < (1000 * 10 ** 6)
        ) {
            reward = 110;
        } else if (
            desireAmount >= (1000 * 10 ** 6) && desireAmount < (1500 * 10 ** 6)
        ) {
            reward = 200;
        } else if (
            desireAmount >= (1500 * 10 ** 6) && desireAmount < (5000 * 10 ** 6)
        ) {
            reward = 290;
        } else if (
            desireAmount >= (5000 * 10 ** 6) && desireAmount < (10000 * 10 ** 6)
        ) {
            reward = 320;
        } else if (
            desireAmount >= (10000 * 10 ** 6) &&
            desireAmount < (50000 * 10 ** 6)
        ) {
            reward = 390;
        } else if (
            desireAmount >= (50000 * 10 ** 6) &&
            desireAmount <= (100000 * 10 ** 6)
        ) {
            reward = 440;
        }
        return reward;
    }

    function setInformation(
        uint256 _stakeId,
        uint64 _amount,
        uint256 _lockTime,
        uint16 _interval
    ) internal {
        uint256 currentTime = block.timestamp;
        uint256 userUpcomingClaim = (_interval * 1 minutes) + currentTime;
        StakeInformation[_stakeId].stakeHolder = msg.sender;
        StakeInformation[_stakeId].amountToHold = _amount;
        StakeInformation[_stakeId].lockTime =
            (_lockTime * 1 minutes) +
            currentTime;
        StakeInformation[_stakeId].intervalOfClaim = _interval;
        StakeInformation[_stakeId].latestClaim = currentTime;
        StakeInformation[_stakeId].upcomingClaim = userUpcomingClaim;
        StakeInformation[_stakeId].ongoing = true;
    }

    function calculateReward(uint256 stakeId) internal view returns (uint256) {
        uint256 amount = StakeInformation[stakeId].amountToHold;
        uint16 userTA = StakeInformation[stakeId].holderTA;
        uint16 userTL = StakeInformation[stakeId].holderTL;
        uint16 userTI = StakeInformation[stakeId].holderTI;
        uint16 interval = StakeInformation[stakeId].intervalOfClaim;
        uint64 percentagePerMinute = (rewardRate + userTA + userTL + userTI);
        uint256 reward = percentagePerMinute * interval * amount;
        reward /= 10 ** 6;
        return reward;
    }

    function _invalidLockOrInterval(
        uint16 lockTime,
        uint16 rewardInterval
    ) private pure {
        require(
            (lockTime >= 30 && lockTime <= 365) &&
                (rewardInterval >= 10 && rewardInterval <= 365),
            "Invalid lock or interval time!"
        );
    }

    function _zeroOrMaxAmount(uint64 amount) private pure {
        require(
            amount >= (10 ** 6) && amount <= (100000 * 10 ** 6),
            "Invalid stake amount!"
        );
    }

    function _lessThanLockTime(
        uint256 lockTime,
        uint16 rewardInterval
    ) private pure {
        require(rewardInterval <= lockTime, "Reward interval is greater!");
    }

    function _mustBeUngoing(uint256 stakeId) private view {
        require(StakeInformation[stakeId].ongoing, "Claimed all rewards!");
    }

    function _onlyStakeOwner(uint256 stakeId) private view {
        require(
            StakeInformation[stakeId].stakeHolder == msg.sender,
            "Invalid owner!"
        );
    }

    function _isAbleToClaim(uint256 stakeId) private view {
        uint256 currentTime = block.timestamp;
        uint256 userUpcomingClaim = StakeInformation[stakeId].upcomingClaim;
        require(
            currentTime >= userUpcomingClaim,
            "Not reached to next interval!"
        );
    }

    function _isAbleToUnStake(uint256 stakeId) private view {
        require(!StakeInformation[stakeId].ongoing, "Stake is ongoing!");
    }

    function _onlyContractOwner() private view {
        require(msg.sender == owner, "Not contract owner!");
    }

    function _invalidStakeId(uint256 stakeId) private view {
        require(stakeId <= stakeIds, "Invalid stake id!");
    }
}
