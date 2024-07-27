const { expect } = require("chai")
const { ethers } = require("hardhat")
const abi = require("../artifacts/contracts/LiquNativeStaking.sol/LiquNativeStaking.json").abi;
const uniswapABI = require("../artifacts/contracts/utils/UniswapV3Twap.sol/UniswapV3Twap.json").abi
const bytecode = require("../artifacts/contracts/LiquNativeStaking.sol/LiquNativeStaking.json").bytecode;



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe("deploy LiquNativeStake contract and call its functions", () => {
    let stakeContract;
    let uniswapContract;
    // let stakeContractAddress = "0x0462Bc7390a33C8BB748d5c2ad76E93690A365c5"
    // let uniswapAddress = "0x33f4f8bf90d8AA3d19fF812B50e79c15Df0d0b03"

    let WETHtokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    let USDTtokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    let factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
    const fee = 3000;
    let usdtDecimals = 6n;
    let wethDecimals = 18n

    const deploy = async () => {
        const LiquNativeContract = await ethers.getContractFactory("LiquNativeStaking");
        const UniswapContract = await ethers.getContractFactory("UniswapV3Twap");
        stakeContract = await LiquNativeContract.deploy(WETHtokenAddress, USDTtokenAddress, factoryAddress, fee);
        uniswapContract = await UniswapContract.deploy(factoryAddress, WETHtokenAddress, USDTtokenAddress, fee)
    }

    before(deploy);

    it.only("should stake and transfer eth to the contract", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const contractBalanceBefore = await ethers.provider.getBalance(stakeContract.getAddress());
        const lockTime = 55;
        const rewardInterval = 10;
        const desireAmount = 400000000 // Means 400 dollars.
        const price = await stakeContract.connect(addr1).getEthPriceInUsdt(400000000)
        await stakeContract.connect(addr1).stake(desireAmount, lockTime, rewardInterval, { value: price });
        const contractBalanceAfter = await ethers.provider.getBalance(stakeContract.getAddress());
        console.log(contractBalanceBefore, contractBalanceAfter);
    })

    it("should claim reward", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const reward = await stakeContract.getStakeIdReward(1);
        const rewardInETH = await stakeContract.getEthPriceInUsdt(reward);
        const addr1Before = await ethers.provider.getBalance(addr1.address)
        await stakeContract.connect(addr1).claimReward(1);
        const addr1After = await ethers.provider.getBalance(addr1.address)
        console.log(addr1After, addr1Before);
        console.log(rewardInETH);
    })

    it.skip("should return the stored rewards up to now", async () => {
        for (let i = 0; i < 3; i++) {
            console.log("11 seconds");
            await sleep(11000)
            await stakeContract.getStoredRewardsUptoNow(1);
            const data = await stakeContract.userReward();
            console.log(data);
        }
    })

    it("should return the stakeId information", async () => {
        const data = await stakeContract.getStakeInformation(1);
        console.log(data);
    })

    it("should return the stakeId reward", async () => {
        const reward = await stakeContract.getStakeIdReward(1);
        console.log("this is reward: ", reward);
    })

    it("should transfer proper reward to the stake holder", async () => {
        const [signer, addr1] = await ethers.getSigners();
        const addr1BalanceBefore = await ethers.provider.getBalance(addr1.address);
        console.log("wait for 10 seconds");
        await sleep(10000)
        await stakeContract.connect(addr1).claimReward(1);
        const addr1BalanceAfter = await ethers.provider.getBalance(addr1.address);
        const result = addr1BalanceAfter - addr1BalanceBefore;
        console.log(result);
    })

    it("should return the eth price", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const price1 = await stakeContract.connect(addr1).getEthPriceInUsdt(1)
        console.log(price1);
    })

    it.only("should be able to unstake", async () => {
        const [owner, addr1] = await ethers.getSigners();
        await stakeContract.connect(owner).deposit({ value: ethers.parseEther("4") })
        console.log("sleep for 55 seconds");
        await sleep(55000);
        await stakeContract.connect(addr1).claimReward(1)
        await stakeContract.connect(addr1).unStake(1);
    })

})