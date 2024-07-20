const { expect } = require("chai")
const { ethers } = require("hardhat")

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe("testing mirrora stake contract", () => {

    let stakeContract;

    const deploy = async () => {
        const StakeContract = await ethers.getContractFactory("HekasStake");
        stakeContract = await StakeContract.deploy();
    }

    beforeEach(deploy)

    const setStake = async () => {
        const [owner, addr1] = await ethers.getSigners();
        const signers = await ethers.getSigners();
        await stakeContract.connect(addr1).stake(55, 10, { value: ethers.parseEther("2") });
    }

    it("user should stake correctly", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const lockTime = 55;
        const rewardInterval = 10;
        await stakeContract.stake(lockTime, rewardInterval, { value: ethers.parseEther("20") })
        const data = await stakeContract.getStakeInformation(1);
        console.log(data);
    })

    it("after stake, contract balance must be raised", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const lockTime = 55;
        const rewardInterval = 10;
        await stakeContract.stake(lockTime, rewardInterval, { value: ethers.parseEther("20") })
        const contractBalance = await ethers.provider.getBalance(stakeContract.getAddress());
        expect(contractBalance).be.equal(ethers.parseEther("20"))
    })

    it("should revert because reward interval is greater than lock time", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const locktime = 30;
        const rewardInterval = 40;
        const invalidStake = stakeContract.connect(addr1).stake(locktime, rewardInterval, { value: ethers.parseEther("16") })
        await expect(invalidStake).be.revertedWith('Reward interval is greater!');
    })

    it("should revert because reward interval or lock time are invalid", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const locktime = 60;
        const rewardInterval = 9;
        const invalidStake = stakeContract.connect(addr1).stake(locktime, rewardInterval, { value: ethers.parseEther("8") })
        await expect(invalidStake).be.revertedWith('Invalid lock or interval time!');
    })


    it("should calculate the stake rewards correctly", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const locktime = 60;
        const rewardInterval = 10;
        await stakeContract.connect(addr1).stake(locktime, rewardInterval, { value: ethers.parseEther("12") });
        await stakeContract.connect(addr2).stake(30, 10, { value: ethers.parseEther("12") });
        const reward1 = await stakeContract.getStakeIdReward(1);
        const reward2 = await stakeContract.getStakeIdReward(2);
        console.log(reward1, reward2);
    })

    it("only stake owner must claim the reward", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const stakeId = 1;
        await setStake();
        const invalidClaim = stakeContract.connect(owner).claimReward(stakeId);
        await expect(invalidClaim).to.be.revertedWith('Invalid owner!')
    })

    it("stake holder must claim reward", async () => {
        const [owner, addr1] = await ethers.getSigners()
        await setStake()
        const beforeClaim = await ethers.provider.getBalance(addr1.address);
        console.log("waiting 10 seconds");
        await sleep(11000)
        await stakeContract.connect(addr1).claimReward(1);
        const afterClaim = await ethers.provider.getBalance(addr1.address);
        console.log(beforeClaim, afterClaim);
    })

    it("balance must be increased with exact reward amount", async () => {
        const [owner, addr1] = await ethers.getSigners()
        await setStake();
        console.log("waiting 11 seconds");
        await sleep(11000)
        const beforeClaim = await ethers.provider.getBalance(addr1.address)
        const data = await stakeContract.connect(addr1).claimReward(1);
        const afterClaim = await ethers.provider.getBalance(addr1.address)
        const receipt = await ethers.provider.getTransactionReceipt(data.hash)
        const gasCost = receipt.gasPrice + receipt.gasUsed;
        const stakeReward = await stakeContract.getStakeIdReward(1);
        console.log(`before claim: ${beforeClaim} \n this is after claim: ${afterClaim} \n gas cost: ${gasCost} \n this is reward: ${stakeReward}`);
    })

    it("should revert because not reaching to the next interval", async () => {
        const [owner, addr1] = await ethers.getSigners()
        await setStake();
        console.log("waiting 11 seconds");
        await sleep(11000)
        const incomingIntervalBefore = await stakeContract.getStakeInformation(1)
        await stakeContract.connect(addr1).claimReward(1);
        const afterClaim = await stakeContract.getStakeInformation(1)
        const invalidClaim = stakeContract.connect(addr1).claimReward(1);
        await expect(invalidClaim).to.be.revertedWith('Not reached to next interval!')
        expect(incomingIntervalBefore[5]).to.be.equal(afterClaim[4])
    })

    it("should not claim any reward after claiming all of them", async () => {
        const [owner, addr1] = await ethers.getSigners()
        await setStake();
        for (let i = 0; i < 5; i++) {
            console.log("waiting 11 seconds");
            await sleep(11000)
            await stakeContract.connect(addr1).claimReward(1);
        }
        const invalidClaim = stakeContract.connect(addr1).claimReward(1);
        await expect(invalidClaim).to.be.revertedWith('Claimed all rewards!')
    })

    it("should not be able to unstake", async () => {
        const [owner, addr1] = await ethers.getSigners()
        await setStake();
        for (let i = 0; i < 4; i++) {
            console.log("waiting 11 seconds");
            await sleep(11000)
            await stakeContract.connect(addr1).claimReward(1);
        }
        const invalidUnstake = stakeContract.connect(addr1).unStake(1);
        await expect(invalidUnstake).to.be.revertedWith('Stake is ongoing!')
    })

    it("should not revert becuase incoming interval is less than lock time and he can unstake", async () => {
        let alltakenRewards = 0n
        const [owner, addr1, addr2] = await ethers.getSigners();
        await stakeContract.connect(addr2).deposit({ value: 10000000000000000000n })
        const locktime = 30;
        const rewardInterval = 15;
        await stakeContract.connect(addr1).stake(locktime, rewardInterval, { value: ethers.parseEther("12") });
        const contractBalanceBefore = await ethers.provider.getBalance(stakeContract.getAddress());
        const reward = await stakeContract.getStakeIdReward(1);
        const holdAmount = await stakeContract.getStakeInformation(1)
        for (let i = 0; i < 2; i++) {
            console.log("waiting 15 seconds");
            await sleep(15000)
            await stakeContract.connect(addr1).claimReward(1);
            alltakenRewards += reward;
        }
        await stakeContract.connect(addr1).unStake(1);
        const contractBalanceAfter = await ethers.provider.getBalance(stakeContract.getAddress());
        expect(contractBalanceBefore - contractBalanceAfter).to.be.equal((holdAmount[1] + alltakenRewards))
    })

    it("should revert because invalid stakeId", async () => {
        const [owner, addr1] = await ethers.getSigners();
        await setStake();
        for (let i = 0; i < 2; i++) {
            console.log("waiting 15 seconds");
            await sleep(15000)
            await stakeContract.connect(addr1).claimReward(1);
        }
        const invalidStakeId = stakeContract.unStake(2);
        await expect(invalidStakeId).to.be.revertedWith('Invalid stake id!');
    })


})