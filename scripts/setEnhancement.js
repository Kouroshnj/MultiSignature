const { ethers } = require("hardhat")
const Land_abi = require("../artifacts/contracts/Land.sol/Land.json").abi
const mintToken = require("./mintToken")

async function setEnhancement() {
    const LandContract = await ethers.getContractFactory("Land");
    const landContract = await LandContract.deploy();
    const [deployer, addr1] = await ethers.getSigners();
    await mintToken();
    await landContract.connect(addr1).setEnhancement(["soil"], 1)

    const tokenData = await landContract.getTokenInfo();
    console.log(tokenData);

}

setEnhancement()