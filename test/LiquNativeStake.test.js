const { expect } = require("chai")
const { ethers } = require("hardhat")
const abi = require("../artifacts/contracts/LiquNativeStaking.sol/LiquNativeStaking.json").abi;
const uniswapABI = require("../artifacts/contracts/utils/UniswapV3Twap.sol/UniswapV3Twap.json").abi
const bytecode = require("../artifacts/contracts/LiquNativeStaking.sol/LiquNativeStaking.json").bytecode;


let WETHtokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
let USDTtokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
let factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const fee = 3000;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

describe("deploy LiquNativeStake contract and call its functions", () => {
    let stakeContract;
    let uniswapContract;
    // let stakeContractAddress = "0xE5b6F5e695BA6E4aeD92B68c4CC8Df1160D69A81"
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
        console.log("deployed");
    }

    before(deploy);

    it.skip("check price of two different contracts", async () => {
        const [signer, addr1, addr2] = await ethers.getSigners();
        const latestBlock = await ethers.provider.getBlockNumber();
        const price = await uniswapContract.connect(signer).estimateAmountOut(USDTtokenAddress, 1, 60, { blockTag: latestBlock })
        console.log(price);
    })


    it("should stake and transfer eth to the contract", async () => {
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

    it.skip("should return the stakeId information", async () => {
        const data = await stakeContract.getStakeInformation(1);
        console.log(data);
    })


    it.skip("should return the stakeId reward", async () => {
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

    it.skip("should return the eth price", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const price1 = await stakeContract.connect(addr1).getEthPriceInUsdt(1)
        const price2 = await stakeContract.connect(owner).getEthPriceInUsdt(1)
        console.log(price1, price2);
    })

})