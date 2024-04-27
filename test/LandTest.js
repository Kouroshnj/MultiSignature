const { expect } = require("chai")
const { ethers } = require("hardhat")
const { BigNumber } = require("ethers")


describe("deploy contract successfully", () => {

    let landContract;

    const deploy = async () => {
        const LandContract = await ethers.getContractFactory("Land");
        landContract = await LandContract.deploy();
    }
    beforeEach(deploy)

    const mintToken = async () => {
        const [signer, addr1] = await ethers.getSigners()
        await landContract.mintLandToken(1, 1, [22, 33], 400, addr1, "randomURL");
    }
    beforeEach(mintToken)

    it("owner of contract must be valid", async function () {
        const [signer, addr1] = await ethers.getSigners();
        let owner = await landContract.owner()
        expect(owner).to.equal(signer.address)
    })



    it("owner of first token must be valid", async () => {
        const [signer, addr1] = await ethers.getSigners();

        let firstTokenOwner = await landContract.ownerOf(1);
        expect(firstTokenOwner).to.equal(addr1);
        expect(firstTokenOwner).not.equal(signer)
    })

    it("owner of token must set the enhancements", async () => {
        const [signer, addr1] = await ethers.getSigners();
        await landContract.connect(addr1).setEnhancement(["soil", "axe"], 1);
        let tokenData = await landContract.getTokenInfo(1);
        expect(tokenData[5]).to.eql(["soil", "axe"]);
        expect(tokenData[5]).not.eql(["tractor", "soil"]);
    })

    it("owner of contract can change the nft location parameter", async () => {
        const [signer, addr1] = await ethers.getSigners();
        await landContract.connect(signer).changeLandLocation(1, [26, 11]);
        let tokenData = await landContract.getTokenInfo(1);
        const newLocations = [26, 11]
        const oldLocations = [22, 33]
        expect(tokenData[4]).to.deep.equal(newLocations);
        expect(tokenData[4]).not.deep.equal(oldLocations);
    })

    it("owner of contract must change the price of token", async () => {
        const [signer, addr1] = await ethers.getSigners();
        await landContract.connect(signer).changeLandPrice(1, 900);
        let tokenData = await landContract.getTokenInfo(1);
        const newPrice = 900
        const oldPrice = 400
        expect(tokenData[6]).to.equal(newPrice);
        expect(tokenData[6]).not.equal(oldPrice);
    })

    it("after approving the new address, it can change the owner of token", async () => {
        const [signer, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1
        await landContract.connect(addr1).approveLandToken(addr2.address, tokenId);
        await landContract.connect(addr2).transferLandToken(addr1.address, addr2.address, tokenId)
        let tokenData = await landContract.getTokenInfo(1);
        expect(tokenData[0]).to.eql(addr2.address)
        expect(tokenData[0]).not.eql(addr1.address)
    })
})