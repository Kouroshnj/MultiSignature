const { ethers } = require("hardhat");
const { expect } = require("chai");
const erc20ABI = require("../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json").abi
const DaiAbi = require("../doc/Wallet/walletABI.json")


describe("Deploy wallet contract and swap assets", () => {

    const ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA"
    const AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
    const FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    let wallet;
    let walletAddress;
    let DAIcontract;
    let WethContract;
    let LinkContract;



    const deploy = async () => {
        const [signer, addr1] = await ethers.getSigners();
        const Wallet = await ethers.getContractFactory("SwapContract");
        wallet = await Wallet.deploy(ROUTER, FACTORY, 200);
        walletAddress = wallet.getAddress();
        DAIcontract = new ethers.Contract(DAI, DaiAbi, signer)
        WethContract = new ethers.Contract(WETH, DaiAbi, signer);
        LinkContract = new ethers.Contract(LINK, DaiAbi, signer);
        AaveContract = new ethers.Contract(AAVE, DaiAbi, signer)
    }

    before(deploy)

    const setVariables = async () => {
        const [signer, , addr2] = await ethers.getSigners();
        await wallet.connect(signer).setFeeForTokens(1, 100);
        await wallet.connect(signer).addStableCoinAddress(DAI);
    }

    before(setVariables);

    it.only("should call 'swapETHToTokenV3' function", async () => {
        const [signer, addr1, addr2, addr3] = await ethers.getSigners();
        // console.log("addr2 DAI balance before receiving fee: ", await DAIcontract.balanceOf(addr2.address));
        // console.log("wallet DAI balance before receiving fee: ", await DAIcontract.balanceOf(walletAddress));
        // first swap some WETH to USDT until we reach 10,000 USDT;
        await wallet.connect(addr1).swapETHToTokenV3(DAI, 0, 3000, 0, { value: ethers.parseEther("5") })
        // await wallet.connect(addr1).swapETHToTokenV3(LINK, 0, 3000, 0, { value: ethers.parseEther("2") })
        await wallet.connect(addr1).swapETHToTokenV3(AAVE, 0, 3000, 0, { value: ethers.parseEther("1") });
        // console.log("signer LINK balance after receiving fee: ", await LinkContract.balanceOf(signer.address));
        // console.log("addr1 LINK balance: ", await LinkContract.balanceOf(addr1.address));
        // console.log(await ethers.provider.getBalance(addr1.address));
        // console.log("wallet DAI balance: ", await DAIcontract.balanceOf(walletAddress));
        // console.log("wallet LINK balance: ", await LinkContract.balanceOf(walletAddress));
    })

    it.only("should add a new recipient", async () => {
        const [signer, , addr2] = await ethers.getSigners();
        await wallet.connect(signer).addRecipient(addr2.address, 200);
    })

    it.only("should revert because duplicate recipient", async () => {
        const [signer, , addr2] = await ethers.getSigners();
        const invalidRecipient = wallet.connect(signer).addRecipient(addr2.address, 200);
        await expect(invalidRecipient).to.be.rejectedWith('Duplicate recipient!');
    })

    it("should return all of the recipients", async () => {
        const data = await wallet.getAllRecipients();
        console.log(data);
    })


    it("should call funciton 'swapTokenToETHV3'", async () => {
        const [signer, addr1, addr2, addr3] = await ethers.getSigners();

        await DAIcontract.connect(addr1).approve(walletAddress, 100000000000000000000000000000000000000000000n)
        // await DAIcontract.connect(addr1).transferFrom(addr1.address, walletAddress, 11000000000000000000000n)

        // console.log(await wallet.checkAllowence(DAI, addr1.address, walletAddress));
        console.log("wallet balance before third swap: ", await DAIcontract.balanceOf(walletAddress));
        console.log("signer balance before third swap: ", await DAIcontract.balanceOf(signer.address));
        console.log("addr2 balance after third swap: ", await DAIcontract.balanceOf(addr2.address));
        await wallet.connect(addr1).swapTokenToETHV3(DAI, 10000000000000000000000n, 0, 3000, 0)
        console.log("wallet balance after swap:", await DAIcontract.balanceOf(walletAddress));
        console.log("signer balance after third swap: ", await DAIcontract.balanceOf(signer.address));
        console.log("addr2 balance after third swap: ", await DAIcontract.balanceOf(addr2.address));

        console.log(await ethers.provider.getBalance(addr1.address));
        console.log("this is WETH balance: ", await WethContract.balanceOf(addr1.address));

    })

    it("owner of contract should withdraw remaining tokens from contract", async () => {
        const [signer] = await ethers.getSigners();
        console.log("LINK balance of contract before withdraw: ", await LinkContract.balanceOf(walletAddress));
        console.log("LINK balance of signer before withdraw: ", await LinkContract.balanceOf(signer.address));
        await wallet.connect(signer).withdrawTokenFromContract(LINK);
        console.log("LINK balance of contract after withdraw: ", await LinkContract.balanceOf(walletAddress));
        console.log("LINK balance of signer after withdraw: ", await LinkContract.balanceOf(signer.address));
    })

    it("should call function 'swapTokenToTokenV3' when swaping DAI for WETH ", async () => {
        const [signer, addr1, addr2, addr3] = await ethers.getSigners();

        await DAIcontract.connect(addr1).approve(walletAddress, 1000000000000000000000n)
        console.log("this is DAI balance of signer before swap: ", await DAIcontract.balanceOf(signer.address));
        console.log("this is DAI balance of addr2 before swap: ", await DAIcontract.balanceOf(addr2.address));
        console.log("this is DAI balance of addr1 before swap: ", await DAIcontract.balanceOf(addr1.address));
        await wallet.connect(addr1).swapTokenToTokenV3(DAI, WETH, 1000000000000000000000n, 0, 3000, 0);
        console.log("addr1 WETH balance: ", await WethContract.balanceOf(addr1));
        console.log("this is DAI balance of signer after  swap: ", await DAIcontract.balanceOf(signer.address));
        console.log("this is DAI balance of addr2 after swap: ", await DAIcontract.balanceOf(addr2.address));
        console.log("this is DAI balance of addr1 after swap: ", await DAIcontract.balanceOf(addr1.address));
        console.log("this is DAI balance of contract after swap: ", await DAIcontract.balanceOf(walletAddress));

        console.log("this is DAI balance of contract: ", await DAIcontract.balanceOf(walletAddress));
    })

    it("should call function 'swapTokenToTokenV3' when swaping DAI for LINK ", async () => {
        const [signer, addr1, addr2, addr3] = await ethers.getSigners();

        await DAIcontract.connect(addr1).approve(walletAddress, 1000000000000000000000n)
        console.log("this is LINK balance of signer before swap: ", await LinkContract.balanceOf(signer.address));
        console.log("this is LINK balance of addr2 before swap: ", await LinkContract.balanceOf(addr2.address));
        console.log("this is LINK balance of addr1 before swap: ", await LinkContract.balanceOf(addr1.address));
        await wallet.connect(addr1).swapTokenToTokenV3(DAI, LINK, 1000000000000000000000n, 0, 3000, 0);
        console.log("this is LINK balance of signer after  swap: ", await LinkContract.balanceOf(signer.address));
        console.log("this is LINK balance of addr2 after swap: ", await LinkContract.balanceOf(addr2.address));
        console.log("this is LINK balance of addr1 after swap: ", await LinkContract.balanceOf(addr1.address));
        console.log("this is LINK balance of contract after swap: ", await LinkContract.balanceOf(walletAddress));

        console.log("this is DAI balance of contract: ", await DAIcontract.balanceOf(walletAddress));
    })

    it.only("should call function 'swapTokenToTokenV3' when swaping AAVE for LINK ", async () => {
        const [signer, addr1, addr2, addr3] = await ethers.getSigners();

        await AaveContract.connect(addr1).approve(walletAddress, 4000000000000000000n)
        console.log("this is AAVE balance of addr1 before swap: ", await AaveContract.balanceOf(addr1.address));
        console.log("contract AAVE balance: ", await AaveContract.balanceOf(walletAddress))
        console.log("LINK balance of addr1", await LinkContract.balanceOf(addr1.address));
        const amountOutMin = await wallet.callEstimateAmountOut(AAVE, LINK, 4000000000000000000n, 3000, 10);
        const tx = await wallet.connect(addr1).swapTokenToTokenV3(AAVE, LINK, 4000000000000000000n, 0, 3000, 0);
        console.log("this is AAVE balance of addr1 after swap: ", await AaveContract.balanceOf(addr1.address));
        console.log("this is AAVE balance of contract after swap: ", await AaveContract.balanceOf(walletAddress));
        console.log("LINK balance of addr1", await LinkContract.balanceOf(addr1.address));
    })

    it("should get value of amountOutMin from oracle and then set it to swapTokenToTokenV3 function", async () => {
        const [signer, addr1, addr2, addr3] = await ethers.getSigners();
        const amountOutMin = await wallet.callEstimateAmountOut(DAI, LINK, 10000000000000000000n, 3000, 10);
        await DAIcontract.connect(addr1).approve(walletAddress, 10000000000000000000n)
        await wallet.connect(addr1).swapTokenToTokenV3(DAI, LINK, amountOutMin, 0, 3000, 0);
        console.log(await UniSwapContract.balanceOf(addr1.address));
    })

})