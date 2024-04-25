const { ethers } = require("hardhat")
const Land_abi = require("../artifacts/contracts/Land.sol/Land.json").abi

async function mintToken() {
    const LandContract = await ethers.getContractFactory("Land");
    const landContract = await LandContract.deploy();
    const [deployer, addr1] = await ethers.getSigners();
    await landContract.mintLandNft(1, 1, [22, 2], 200, addr1, "https://api.example.com/nfts/123");

    await landContract.getTokenInfo(1);
}

module.exports = mintToken