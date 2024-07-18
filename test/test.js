const { expect, should } = require("chai")
const { ethers } = require("hardhat")


describe("deploy contract successfully", () => {

    let landContract;

    const deploy = async () => {
        const LandContract = await ethers.getContractFactory("Land");
        landContract = await LandContract.deploy();
    }
    beforeEach(deploy)

    const mintToken = async () => {
        const [signer, addr1, addr2] = await ethers.getSigners()
        await landContract.mintLandToken(1, 1, [22, 33], 400, addr1, "testURI.com");
        await landContract.mintLandToken(2, 5, [12, 36], 250, addr2, "addr2.com");
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
        await landContract.connect(addr1).setEnhancement([22, 33], 1);
        let tokenData = await landContract.getTokenInfo(1);
        // expect(tokenData[5]).to.eql(["soil", "axe"]);
        // expect(tokenData[5]).not.eql(["tractor", "soil"]);
    })

    it("should remove selected enhancements", async () => {
        const [signer, addr1, addr2] = await ethers.getSigners();
        await landContract.connect(addr1).setEnhancement([22, 33, 44, 55], 1);
        await landContract.connect(addr2).setEnhancement([91, 67, 59, 84], 2);
        await landContract.connect(signer).removeEnhancement(1, 44)
        await landContract.connect(signer).removeEnhancement(2, 67)
        await landContract.connect(signer).removeEnhancement(2, 84)
        let tokenData1 = await landContract.getTokenInfo(1);
        let tokenData2 = await landContract.getTokenInfo(2);
        console.log("Data1: ", tokenData1);
        console.log("Data2: ", tokenData2);
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

    it("should change the tokenURI of token", async () => {
        const [signer, addr1] = await ethers.getSigners();
        const tokenId = 1;
        const randomURI = "randomURI.com"
        const oldURI = await landContract.tokenURI(tokenId)
        await landContract.connect(signer).setTokenURI(tokenId, randomURI);
        const newURI = await landContract.tokenURI(tokenId)
        expect(newURI).not.eql(oldURI)
    })

    it("owner must change the ownership od contract", async () => {
        const [signer, addr1] = await ethers.getSigners();
        await landContract.connect(signer).changeOwner(addr1.address);
        const currentOwner = await landContract.owner();
        expect(currentOwner).to.eql(addr1.address)
        expect(currentOwner).not.eql(signer.address)
    })
})

describe("UniswapV3Twap get price", async () => {
    const FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    // MANA
    const TOKEN_0 = "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942"
    const DECIMALS_0 = 18n
    // USDT
    const TOKEN_1 = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    const DECIMALS_1 = 6n
    // 0.3%
    const FEE = 3000

    it("should get the price", async () => {
        const UniswapV3Twap = await ethers.getContractFactory("UniswapV3Twap")
        const twap = await UniswapV3Twap.deploy(FACTORY, TOKEN_0, TOKEN_1, FEE)

        const price = await twap.callEstimateAmountOut(TOKEN_1, 10n ** DECIMALS_1, 10)
        const price2 = await twap.callEstimateAmountOut(TOKEN_0, 10n ** DECIMALS_0, 10)
        const fee2 = await twap.callEstimateAmountOut(TOKEN_1, 400n ** DECIMALS_1, 10)


        console.log(`price one is : ${price}`)
        console.log(`price two is : ${price2}`)
        console.log("price fee is: ", fee2)
    })
})

describe("MarketPlace must deploy and work correctly", async () => {
    let MMLtoken;
    let USDTtoken;
    let landContract;
    let uniswapV3TwapContract
    let marketPlace;
    let marketPlaceAddress
    const FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    // MANA
    const TOKEN_0 = "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942"
    const DECIMALS_0 = 18n
    // USDT
    const TOKEN_1 = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    const DECIMALS_1 = 6n
    const FEE = 3000

    const deployTokens = async () => {

        const MMLToken = await ethers.getContractFactory("MMLtoken");
        MMLtoken = await MMLToken.deploy();

        const USDTToken = await ethers.getContractFactory("USDTtoken");
        USDTtoken = await USDTToken.deploy();

        const LandContract = await ethers.getContractFactory("Land");
        landContract = await LandContract.deploy();

        const UniswapContract = await ethers.getContractFactory("UniswapV3Twap");
        uniswapV3TwapContract = await UniswapContract.deploy(FACTORY, TOKEN_0, TOKEN_1, FEE);

        const MarketPlace = await ethers.getContractFactory("Marketplace");

        let MMLaddress = await MMLtoken.getAddress()
        let USDTaddress = await USDTtoken.getAddress()

        //! Using TOKEN_0 and TOKEN_1 for testing contract in order to get price feeds in real world
        // marketPlace = await MarketPlace.deploy(TOKEN_0, TOKEN_1, landContract, FACTORY, FEE)


        //! Using MMLaddress and USDTaddress for testing the contract with custom ERC20 contracts.
        marketPlace = await MarketPlace.deploy(MMLaddress, USDTaddress, landContract, FACTORY, FEE);
    }
    beforeEach(deployTokens)

    const mintAllTokens = async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await USDTtoken.mint(addr2.address);
        await MMLtoken.mint(addr2.address);
        await MMLtoken.mint(addr3.address);
        marketPlaceAddress = await marketPlace.getAddress()
        for (let i = 1; i < 3; i++) {
            await landContract.connect(owner).mintLandToken(1, i, [i, i], 100, addr1, "testURI.com")
            await landContract.connect(addr1).approveLandToken(marketPlaceAddress, i);
        }
        for (let j = 3; j < 5; j++) {
            await landContract.connect(owner).mintLandToken(1, j, [j, j], 100, addr2, "testURI.com")
            await landContract.connect(addr2).approveLandToken(marketPlaceAddress, j);
        }
        // await landContract.connect(owner).mintLandToken(1, 1, [22, 33], 400, addr1, "testURI.com");
        await USDTtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n)
    }
    beforeEach(mintAllTokens)

    const setNumeratorAndDenominator = async () => {
        await marketPlace.setFeeToContract(5, 100);
    }
    beforeEach(setNumeratorAndDenominator)


    it("owner of marketplace must be correct", async () => {
        const [owner, addr1] = await ethers.getSigners();

        const contractOwner = await marketPlace.owner();

        expect(contractOwner).to.eql(owner.address);
    })

    it("should list a marketItem", async () => {
        const [owner, addr1] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(1, 400);
        const marketItemInfo = await marketPlace.getMarketItemInfo(1);
        const ownerOfLandToken = await landContract.ownerOf(1);
        expect(marketItemInfo[1]).to.eql(addr1.address);
        expect(marketItemInfo[0]).to.eql(marketPlaceAddress);
        expect(ownerOfLandToken).to.eql(marketPlaceAddress);
    })

    it("should calculate the fee correctly", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(1, 400);
        const fee = await marketPlace.calculateMMLFeeAndNewPrice(1);
        const addr2Balance = await MMLtoken.balanceOf(addr2.address)
        console.log(fee);
        console.log(addr2Balance);
    })

    it("should buy the token with MML and tokens must transfer to the buyer", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(1, 400);
        const tokenId = 1
        const purachaseOption = 1 // purchase with MML
        await MMLtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n)
        await marketPlace.connect(addr2).buyToken(tokenId, purachaseOption)
        const marketItemInfo = await marketPlace.getMarketItemInfo(1);
        const sellerBalance = await MMLtoken.balanceOf(marketItemInfo[1]);
        console.log("owner balane: ", await MMLtoken.balanceOf(owner.address));
        console.log("addr1 balance: ", await MMLtoken.balanceOf(addr1.address));
        const newOwner = await landContract.ownerOf(tokenId);
        expect(newOwner).to.eql(addr2.address)
        expect(marketItemInfo[0]).to.eql(addr2.address);
        expect(sellerBalance).to.be.above(1000000000000000000n)
    })

    it.skip("calculated price from UniswapV3Twap and Marketplace must be equal", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1;
        const quantity = 60;
        const price = 1; //! In Dollars
        await marketPlace.connect(addr1).listToken(tokenId, price);
        const priceAndFee = await marketPlace.calculateMMLFeeAndNewPrice(1);
        const directlyFromUniswap = await uniswapV3TwapContract.callEstimateAmountOut(TOKEN_1, 10n ** DECIMALS_1, 10)
        console.log([priceAndFee, directlyFromUniswap]);
        expect(priceAndFee[0] + priceAndFee[1]).to.equal(directlyFromUniswap)
    })

    it("should but the token with USDT and tokens must transfer to the buyer", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1
        await marketPlace.connect(addr1).listToken(tokenId, 187);
        const purachaseOption = 2 // purchase with USDT
        await USDTtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n)
        await marketPlace.connect(addr2).buyToken(tokenId, purachaseOption)
        const marketItemInfo = await marketPlace.getMarketItemInfo(1);
        const sellerBalance = await USDTtoken.balanceOf(marketItemInfo[1]);
        console.log(sellerBalance);
        expect(marketItemInfo[0]).to.eql(addr2.address);
        // expect(sellerBalance).to.equal(190000000n)
    })

    it("not being able to buy sold item", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const tokenId = 1;
        const purchaseOption = 1;
        await marketPlace.connect(addr1).listToken(tokenId, 200);
        await MMLtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n);
        await MMLtoken.connect(addr3).approve(marketPlaceAddress, 10000000000000000000000000000000000n);
        await marketPlace.connect(addr2).buyToken(tokenId, purchaseOption);
        const buyingAfterSale = marketPlace.connect(addr3).buyToken(tokenId, purchaseOption)
        await expect(buyingAfterSale).to.be.revertedWith('Item has sold!')
    })

    it("seller of token should be able to cancel the listing: ", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1;
        const markeItemId = 1
        await marketPlace.connect(addr1).listToken(tokenId, 200);
        await marketPlace.connect(addr1).cancelMarketItem(markeItemId);
        const marketItemInfo = await marketPlace.getMarketItemInfo(markeItemId);
        expect(marketItemInfo[6]).to.equal(true);
        expect(marketItemInfo[0]).to.equal(addr1.address);
    })

    it("should return all market items", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(1, 100);
        await marketPlace.connect(addr2).listToken(3, 300);
        await marketPlace.connect(addr2).listToken(4, 400);
        await marketPlace.connect(addr1).listToken(2, 200);
        const allMarketItems = await marketPlace.allItems();
        console.log(allMarketItems);
    })

    it("should return an error for invalid purchase option", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1;
        const markeItemId = 1
        const purachaseOption = 0
        await marketPlace.connect(addr1).listToken(tokenId, 200);
        const buyWithInvalidOption = marketPlace.buyToken(markeItemId, purachaseOption)
        await expect(buyWithInvalidOption).to.be.revertedWith('Invalid purchase option')
    })

    it("should return all canceled and all items", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        for (let i = 1; i < 3; i++) {
            await marketPlace.connect(addr1).listToken(i, 100);
        }
        for (let i = 3; i < 5; i++) {
            await marketPlace.connect(addr2).listToken(i, 150);
        }
        await marketPlace.connect(addr1).cancelMarketItem(1);
        await marketPlace.connect(addr2).cancelMarketItem(3);
        const allCanceledItems = await marketPlace.canceldItems()
        const allItems = await marketPlace.allItems();
        console.log("these are canceled items: ", allCanceledItems);
        console.log("these are all items: ", allItems);
    })

    it("with given address, it should return its items", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(1, 100);
        await marketPlace.connect(addr2).listToken(3, 100);
        await marketPlace.connect(addr1).listToken(2, 100);
        const allItemsByAddress = await marketPlace.allMarketItemsListedByAddress(addr1.address);
        console.log(allItemsByAddress);
    })

    it("should return the sold Items", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        for (let i = 1; i < 3; i++) {
            await marketPlace.connect(addr1).listToken(i, 100);
        }
        for (let i = 3; i < 5; i++) {
            await marketPlace.connect(addr2).listToken(i, 150);
        }
        await MMLtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n);
        await marketPlace.connect(addr2).buyToken(1, 1);
        const allSoldItems = await marketPlace.soldItems();
        console.log(allSoldItems);
    })

    it("return items info by calling 'marketItemsListedByAddress' function ", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(1, 100);
        await marketPlace.connect(addr2).listToken(3, 300);
        await marketPlace.connect(addr2).listToken(4, 400);
        await marketPlace.connect(addr1).listToken(2, 200);
        const getInfo = await marketPlace.allMarketItemsListedByAddress(addr2.address)
        const getInfo2 = await marketPlace.marketItemsListedByAddress(addr1.address)
        console.log("info 1 is: ", getInfo);
        console.log("info 2 is: ", getInfo2);
    })
})

describe("deploy MirroraVilageItems contract and call its functions", async () => {
    let mirroraVillageItemsContract;
    const deploy = async () => {
        const MirroraVillageItemsContract = await ethers.getContractFactory("MirroraVillageItems");
        mirroraVillageItemsContract = await MirroraVillageItemsContract.deploy()
    }
    beforeEach(deploy);

    const mintItems = async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const quantity = 100;
        await mirroraVillageItemsContract.connect(owner).mintItem(addr1.address, quantity, "Hammer");
        await mirroraVillageItemsContract.connect(owner).mintItem(addr1.address, quantity, "Tractor");
        await mirroraVillageItemsContract.connect(owner).mintItem(addr1.address, quantity, "Axe");
        await mirroraVillageItemsContract.connect(owner).mintItem(addr1.address, quantity, "Combine");

    }
    beforeEach(mintItems)

    it("item has to be minted correctly", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const itemId = 1;
        const accountBalance = await mirroraVillageItemsContract.balanceOf(addr1.address, 1);
        expect(accountBalance).to.be.equal(100);
    })


    it("should find the item information by its name", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const itemName = "Combine"
        const itemInfo = await mirroraVillageItemsContract.getItemInformationByName(itemName);
        console.log(itemInfo);
    })

    it("should transfer some quantity to another address", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await mirroraVillageItemsContract.connect(addr1).transferItem(addr2.address, 4, 40);
        const addr2Balance = await mirroraVillageItemsContract.balanceOf(addr2.address, 4);
        expect(addr2Balance).to.equal(40)
    })

    it("should be able to change the uri of an itemId", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await mirroraVillageItemsContract.connect(owner).setURI(1, "https://morroraVillage/api/item/1.json");
        const itemURI = await mirroraVillageItemsContract.uri(1);
        console.log(itemURI);
    })

    it("should burn some quantity of itemId", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await mirroraVillageItemsContract.connect(owner).burnItem(addr1.address, 1, 90);
        const addr1Balance = await mirroraVillageItemsContract.balanceOf(addr1.address, 1);
        const itemInfo = await mirroraVillageItemsContract.getItemInformationByName("Hammer");
        expect(itemInfo[3]).to.be.equal(10);
        expect(addr1Balance).to.be.equal(10);
    })

    it("after burn all tokens, user should not be able to transfer", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await mirroraVillageItemsContract.connect(owner).burnItem(addr1.address, 1, 100);
        const transferResult = mirroraVillageItemsContract.connect(addr1).transferItem(addr2.address, 1, 10);
        await expect(transferResult).to.be.revertedWith('ERC1155: insufficient balance for transfer')
    })

    it("check the BurnItem event", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await expect(mirroraVillageItemsContract.connect(owner).burnItem(addr1.address, 1, 20)).to.emit(
            mirroraVillageItemsContract, 'BurnItem'
        )
    })
})

describe("Deploy itemsMarketplace ant call its functions", async () => {
    const FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    // MANA
    const TOKEN_0 = "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942"
    const DECIMALS_0 = 18n
    // USDT
    const TOKEN_1 = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    const DECIMALS_1 = 6n
    const FEE = 3000
    let uniswapContract
    let MMLtoken;
    let USDTtoken;
    let mirroraVillageItems;
    let itemsMarketplace
    let itemsMarketplaceAddress;
    const deployTokens = async () => {

        const MMLToken = await ethers.getContractFactory("MMLtoken");
        MMLtoken = await MMLToken.deploy();

        const USDTToken = await ethers.getContractFactory("USDTtoken");
        USDTtoken = await USDTToken.deploy();

        const MirroraVillageItems = await ethers.getContractFactory("MirroraVillageItems");
        mirroraVillageItems = await MirroraVillageItems.deploy();

        const UniswapContract = await ethers.getContractFactory("UniswapV3Twap");
        uniswapContract = await UniswapContract.deploy(FACTORY, TOKEN_0, TOKEN_1, FEE)

        const ItemsMarketplace = await ethers.getContractFactory("ItemsMarketplace");

        let MMLaddress = await MMLtoken.getAddress()
        let USDTaddress = await USDTtoken.getAddress()

        //! Using TOKEN_0 and TOKEN_1 for testing contract in order to get price feeds in real world
        // itemsMarketplace = await ItemsMarketplace.deploy(TOKEN_0, TOKEN_1, mirroraVillageItems, FACTORY, FEE);


        //! Using MMLaddress and USDTaddress for testing the contract with custom ERC20 contracts.
        itemsMarketplace = await ItemsMarketplace.deploy(MMLaddress, USDTaddress, mirroraVillageItems, FACTORY, FEE);


        itemsMarketplaceAddress = await itemsMarketplace.getAddress();
    }
    beforeEach(deployTokens)
    const mintAllTokens = async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await USDTtoken.mint(addr2.address);
        await USDTtoken.mint(addr3.address);
        await MMLtoken.mint(addr2.address);
        await MMLtoken.mint(addr3.address);
        await MMLtoken.mint(addr1.address);

        await mirroraVillageItems.connect(owner).mintItem(addr2.address, 100, "Hammer")
        await mirroraVillageItems.connect(owner).mintItem(addr3.address, 100, "Tractor")
        await mirroraVillageItems.connect(addr2).setApprovalForAll(itemsMarketplaceAddress, true)
        await mirroraVillageItems.connect(addr3).setApprovalForAll(itemsMarketplaceAddress, true)

        await USDTtoken.connect(addr2).approve(itemsMarketplaceAddress, 10000000000000000000000000000000000n)
        await MMLtoken.connect(addr2).approve(itemsMarketplaceAddress, 10000000000000000000000000000000000n)
        await MMLtoken.connect(addr3).approve(itemsMarketplaceAddress, 10000000000000000000000000000000000n)
        await MMLtoken.connect(addr1).approve(itemsMarketplaceAddress, 10000000000000000000000000000000000n)
        await USDTtoken.connect(addr3).approve(itemsMarketplaceAddress, 10000000000000000000000000000000000n)

    }
    beforeEach(mintAllTokens)

    const setNumeratorAndDenominator = async () => {
        await itemsMarketplace.setFeeToContract(5, 100);
    }
    beforeEach(setNumeratorAndDenominator)

    it("should list an itemId correctly", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1;
        const quantity = 60;
        const price = 100;
        await itemsMarketplace.connect(addr2).listToken(tokenId, quantity, price);
        const marketplaceBalanceTokenId = await mirroraVillageItems.balanceOf(itemsMarketplaceAddress, tokenId);
        const addr2BalanceOfTokenId = await mirroraVillageItems.balanceOf(addr2.address, tokenId)
        expect(marketplaceBalanceTokenId).to.equal(60);
        expect(addr2BalanceOfTokenId).to.equal(40);
    })

    it("should calculate the fee in MML", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1;
        const quantity = 60;
        const price = 100; //! In Dollars
        await itemsMarketplace.connect(addr2).listToken(tokenId, quantity, price);
        const priceAndFee = await itemsMarketplace.calculateMMLFeeAndNewPrice(1);
        console.log(priceAndFee);
    })

    it("should calculate fee in USDT", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1;
        const quantity = 60;
        const price = 100; //! In Dollars
        await itemsMarketplace.connect(addr2).listToken(tokenId, quantity, price);
        const priceAndFee = await itemsMarketplace.calculateUSDTFeeAndNewPrice(1);
        console.log(priceAndFee);
    })

    it.skip("calculated price from UniswapV3Twap and itemsMarketplace must be equal", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 1;
        const quantity = 60;
        const price = 1; //! In Dollars
        await itemsMarketplace.connect(addr2).listToken(tokenId, quantity, price);
        const priceAndFee = await itemsMarketplace.calculateMMLFeeAndNewPrice(1);
        const directlyFromUniswap = await uniswapContract.callEstimateAmountOut(TOKEN_1, 10n ** DECIMALS_1, 10)
        expect(priceAndFee[0] + priceAndFee[1]).to.equal(directlyFromUniswap)
    })

    it("should buy an item correctly with MML", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const tokenId = 1;
        const quantity = 60;
        const price = 200; //! In Dollars
        const marketItemId = 1;
        const purchaseOption = 1
        await itemsMarketplace.connect(addr2).listToken(tokenId, quantity, price);
        await itemsMarketplace.connect(addr3).buyToken(marketItemId, purchaseOption);
        const itemBalanceOfaddr3 = await mirroraVillageItems.balanceOf(addr3.address, tokenId);
        const MMLbalanceOfaddr2 = await MMLtoken.balanceOf(addr2.address);
        console.log("This is the MML balance of addr2: ", MMLbalanceOfaddr2);
        expect(itemBalanceOfaddr3).to.equal(quantity);
    })

    it("should buy an item correctly with USDT", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const tokenId = 1;
        const quantity = 60;
        const price = 200; //! In Dollars
        const marketItemId = 1;
        const purchaseOption = 2;
        await itemsMarketplace.connect(addr2).listToken(tokenId, quantity, price);
        await itemsMarketplace.connect(addr3).buyToken(marketItemId, purchaseOption);
        const itemBalanceOfaddr3 = await mirroraVillageItems.balanceOf(addr3.address, tokenId);
        const itemBalanceOfContract = await mirroraVillageItems.balanceOf(itemsMarketplaceAddress, tokenId);
        const USDTbalanceOfaddr2 = await USDTtoken.balanceOf(addr2.address);
        const USDTbalanceOfOwner = await USDTtoken.balanceOf(owner.address);
        console.log("This is the USDT balance of addr2: ", USDTbalanceOfaddr2);
        console.log("This is the USDT balance of contract owner: ", USDTbalanceOfOwner);
        expect(itemBalanceOfaddr3).to.equal(quantity);
        expect(itemBalanceOfContract).to.equal(0)
    })

    it("owner of marketItem should be able to cancel the item", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const tokenId = [1, 2];
        const quantity = [40, 50];
        const price = [200, 150]; //! In Dollars
        const marketItemId = [1, 2];
        await itemsMarketplace.connect(addr2).listToken(tokenId[0], quantity[0], price[0]);
        await itemsMarketplace.connect(addr3).listToken(tokenId[1], quantity[1], price[1]);
        await itemsMarketplace.connect(addr2).cancelMarketItem(marketItemId[0]);
        const itemInformation1 = await itemsMarketplace.getMarketItemInfo(marketItemId[0])
        const itemInformation2 = await itemsMarketplace.getMarketItemInfo(marketItemId[1])
        const contractItemBalance = await mirroraVillageItems.balanceOf(itemsMarketplaceAddress, 1);
        const addr2ItemBalance = await mirroraVillageItems.balanceOf(addr2.address, 1);
        expect(itemInformation1[7]).to.equal(true);
        expect(contractItemBalance).to.equal(0);
        expect(addr2ItemBalance).to.equal(100);
        expect(itemInformation2[7]).to.equal(false)
        const cancelWithWrongOwner = itemsMarketplace.connect(owner).cancelMarketItem(2);
        await expect(cancelWithWrongOwner).to.be.revertedWith('You are not the token seller!')
    })

    it("should get all canceled items information", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await mirroraVillageItems.connect(owner).mintItem(addr2.address, 300, "Axe")
        await mirroraVillageItems.connect(owner).mintItem(addr2.address, 120, "Combine")
        await mirroraVillageItems.connect(owner).mintItem(addr3.address, 110, "Panel")
        await itemsMarketplace.connect(addr2).listToken(3, 90, 200);
        await itemsMarketplace.connect(addr3).listToken(5, 10, 100);
        await itemsMarketplace.connect(addr2).listToken(4, 100, 300);
        await itemsMarketplace.connect(addr2).cancelMarketItem(3);
        await itemsMarketplace.connect(addr3).cancelMarketItem(2);
        const canceledItems = await itemsMarketplace.canceldItems();
        console.log(canceledItems);
    })

    it("should get all sold items", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await mirroraVillageItems.connect(owner).mintItem(addr2.address, 300, "Axe")
        await mirroraVillageItems.connect(owner).mintItem(addr2.address, 120, "Combine")
        await mirroraVillageItems.connect(owner).mintItem(addr3.address, 110, "Panel")
        await itemsMarketplace.connect(addr2).listToken(3, 90, 200);
        await itemsMarketplace.connect(addr3).listToken(5, 10, 100);
        await itemsMarketplace.connect(addr2).listToken(4, 100, 300);
        await itemsMarketplace.connect(addr1).buyToken(1, 1);
        await itemsMarketplace.connect(addr3).buyToken(3, 1);
        const addr1ItemBalanceToken3 = await mirroraVillageItems.balanceOf(addr1.address, 3);
        const addr3ItemBalanceToken4 = await mirroraVillageItems.balanceOf(addr3.address, 4);
        const getSoldItems = await itemsMarketplace.soldItems();
        console.log(getSoldItems);
        expect([addr1ItemBalanceToken3, addr3ItemBalanceToken4]).to.have.all.members([90n, 100n])
    })

    it("should return all marketItems listed by the given address", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await mirroraVillageItems.connect(owner).mintItem(addr2.address, 300, "Axe")
        await mirroraVillageItems.connect(owner).mintItem(addr2.address, 120, "Combine")
        await mirroraVillageItems.connect(owner).mintItem(addr3.address, 110, "Panel")
        await itemsMarketplace.connect(addr2).listToken(3, 90, 200);
        await itemsMarketplace.connect(addr3).listToken(5, 10, 100);
        await itemsMarketplace.connect(addr2).listToken(4, 100, 300);
        await itemsMarketplace.connect(addr3).listToken(2, 12, 20);
        const itemsListedByAddress = await itemsMarketplace.marketItemsListedByAddress(addr3.address);
        console.log(itemsListedByAddress);
    })
})

describe("Deploy Sneakers contract and test its functions", () => {
    let sneakersContract;

    const deploy = async () => {
        const SneakerContract = await ethers.getContractFactory("Sneakers");
        sneakersContract = await SneakerContract.deploy();
    }
    beforeEach(deploy);

    const mintToken = async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const type = 1;
        const quality = 3;
        const timeToWalk = 20;
        const speedRange = [1, 7];
        const maxDist = 100;
        const reward = 80;
        const efficiency = 100;
        const comfort = 20;
        const resilence = 5;
        const tokenURI = "test.com"
        await sneakersContract.mintItem(addr1.address, type, quality, timeToWalk, speedRange, maxDist, reward, efficiency, comfort, resilence, tokenURI);
        await sneakersContract.mintItem(addr2.address, 2, 2, 30, [2, 10], 200, 50, 120, 345, 180, "test2.com");
    }
    beforeEach(mintToken);

    it("should return the tokenInfo of the minted token", async () => {
        const data = await sneakersContract.getTokenInfo(1);
        console.log(data);
    })

    it("should be reveted because invalid quality type", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const invalidMintItem = sneakersContract.mintItem(addr2.address, 1, 0, 20, [2, 10], 200, 10, 480, 600, 320, "test2.com")
        await expect(invalidMintItem).to.be.revertedWith('Invalid quality!')
    })

    it("should change the item type", async () => {
        await sneakersContract.changeItemType(2, 4);
        const data = await sneakersContract.getTokenInfo(2);
        expect(data[1]).be.equal(4);
    })

    it("should change the item timeToWalk", async () => {
        await sneakersContract.changeItemTimeToWalk(1, 90);
        const data = await sneakersContract.getTokenInfo(1);
        expect(data[3]).be.equal(90);
    })

    it("should change the item owner", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await sneakersContract.changeItemOwner(1, addr2.address);
        const data = await sneakersContract.getTokenInfo(1);
        expect(data[0]).to.be.eql(addr2.address)
    })

    it("should change the item speed range", async () => {
        await sneakersContract.changeItemSpeedRange(2, [3, 9]);
        const data = await sneakersContract.getTokenInfo(2);
        console.log(data[4]);
    })

    it("should change the item quality", async () => {
        await sneakersContract.changeItemQuality(1, 3);
        const data = await sneakersContract.getTokenInfo(1);
        expect(data[2]).to.be.equal(3);
    })

    it("should change the item max distination", async () => {
        await sneakersContract.changeItemMaxDist(1, 2330);
        const data = await sneakersContract.getTokenInfo(1);
        expect(data[5]).to.be.equal(2330);
    })

    it("should change the item reward for hundred AWAT", async () => {
        await sneakersContract.changeItemReward(2, 18);
        const data = await sneakersContract.getTokenInfo(2);
        expect(data[6]).to.be.equal(18);
    })

    it("should change the item efficiency", async () => {
        await sneakersContract.changeItemEfficiency(2, 333);
        const data = await sneakersContract.getTokenInfo(2);
        expect(data[7]).to.be.equal(333);
    })

    it("should change the item comfort", async () => {
        await sneakersContract.changeItemComfort(1, 188);
        const data = await sneakersContract.getTokenInfo(1);
        console.log(data);
        expect(data[8]).to.be.equal(188);
    })

    it("should change the item resilence", async () => {
        await sneakersContract.changeItemResilence(1, 999);
        const data = await sneakersContract.getTokenInfo(1);
        expect(data[9]).to.be.equal(999);
    })

    it("should return the number of items owned by given address", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await sneakersContract.mintItem(addr1.address, 2, 2, 20, [5, 12], 500, 12, 360, 560, 780, "test3.com")
        const data = await sneakersContract.getNumberOfOwnedItemsByAddress(addr2.address);
        const items = await sneakersContract.getTokenInfoByOwnerAddress(addr2.address, data);
        console.log(items);
    })

    it("should return all items", async () => {
        for (let i = 1; i <= 2; i++) {
            console.log(await sneakersContract.getTokenInfo(i));
        }
    })

})
describe("Sneakers Marketplace must deploy and work correctly", async () => {
    let MMLtoken;
    let USDTtoken;
    let sneakersContract;
    let uniswapV3TwapContract
    let marketPlace;
    let marketPlaceAddress
    const FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    // MANA
    const TOKEN_0 = "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942"
    const DECIMALS_0 = 18n
    // USDT
    const TOKEN_1 = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    const DECIMALS_1 = 6n
    const FEE = 3000

    const deployTokens = async () => {

        const MMLToken = await ethers.getContractFactory("MMLtoken");
        MMLtoken = await MMLToken.deploy();

        const USDTToken = await ethers.getContractFactory("USDTtoken");
        USDTtoken = await USDTToken.deploy();

        const SneakersContract = await ethers.getContractFactory("Sneakers");
        sneakersContract = await SneakersContract.deploy();

        const UniswapContract = await ethers.getContractFactory("UniswapV3Twap");
        uniswapV3TwapContract = await UniswapContract.deploy(FACTORY, TOKEN_0, TOKEN_1, FEE);

        const MarketPlace = await ethers.getContractFactory("SneakersMarketplace");

        let MMLaddress = await MMLtoken.getAddress()
        let USDTaddress = await USDTtoken.getAddress()

        //! Using TOKEN_0 and TOKEN_1 for testing contract in order to get price feeds in real world
        // marketPlace = await MarketPlace.deploy(TOKEN_0, TOKEN_1, sneakersContract, FACTORY, FEE)


        //! Using MMLaddress and USDTaddress for testing the contract with custom ERC20 contracts.
        marketPlace = await MarketPlace.deploy(MMLaddress, USDTaddress, sneakersContract, FACTORY, FEE);
    }
    beforeEach(deployTokens)

    const mintAllTokens = async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await USDTtoken.mint(addr2.address);
        await MMLtoken.mint(addr2.address);
        await MMLtoken.mint(addr3.address);
        marketPlaceAddress = await marketPlace.getAddress()
        await sneakersContract.connect(owner).mintItem(addr2.address, 2, 2, 30, [2, 10], 200, 50, 120, 345, 180, "test2.com")
        await sneakersContract.connect(owner).mintItem(addr1.address, 3, 1, 20, [1, 7], 300, 60, 130, 750, 900, "test1.com")
        await sneakersContract.connect(owner).mintItem(addr2.address, 1, 1, 13, [3, 15], 100, 40, 110, 642, 111, "test22.com")
        await sneakersContract.connect(owner).mintItem(addr1.address, 2, 1, 23, [1, 11], 129, 678, 122, 194, 222, "test33.com")
        await sneakersContract.connect(addr2).approve(marketPlaceAddress, 1)
        await sneakersContract.connect(addr1).approve(marketPlaceAddress, 2)
        await sneakersContract.connect(addr2).approve(marketPlaceAddress, 3)
        await sneakersContract.connect(addr1).approve(marketPlaceAddress, 4)
        // await landContract.connect(owner).mintLandToken(1, 1, [22, 33], 400, addr1, "testURI.com");
        await USDTtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n)
    }
    beforeEach(mintAllTokens)

    const setNumeratorAndDenominator = async () => {
        await marketPlace.setFeeToContract(5, 100);
    }
    beforeEach(setNumeratorAndDenominator)


    it("owner of marketplace must be correct", async () => {
        const [owner, addr1] = await ethers.getSigners();

        const contractOwner = await marketPlace.owner();

        expect(contractOwner).to.eql(owner.address);
    })

    it("should list a marketItem", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr2).listToken(1, 400);
        const marketItemInfo = await marketPlace.getMarketItemInfo(1);
        const ownerOfSneakerToken = await sneakersContract.ownerOf(1);
        expect(marketItemInfo[1]).to.eql(addr2.address);
        expect(marketItemInfo[0]).to.eql(marketPlaceAddress);
        expect(ownerOfSneakerToken).to.eql(marketPlaceAddress);
    })

    it("should calculate the fee correctly", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr2).listToken(1, 400);
        const fee = await marketPlace.calculateMMLFeeAndNewPrice(1);
        const addr2Balance = await MMLtoken.balanceOf(addr2.address)
        console.log(fee);
        console.log(addr2Balance);
    })

    it("should buy the token with MML and tokens must transfer to the buyer", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await marketPlace.connect(addr2).listToken(1, 400);
        const tokenId = 1
        const purachaseOption = 1 // purchase with MML
        await MMLtoken.connect(addr3).approve(marketPlaceAddress, 10000000000000000000000000000000000n)
        await marketPlace.connect(addr3).buyToken(tokenId, purachaseOption)
        const marketItemInfo = await marketPlace.getMarketItemInfo(1);
        const sellerBalance = await MMLtoken.balanceOf(marketItemInfo[1]);
        console.log("owner balane: ", await MMLtoken.balanceOf(owner.address));
        console.log("addr2 balance: ", await MMLtoken.balanceOf(addr2.address));
        const newOwner = await sneakersContract.ownerOf(tokenId);
        expect(newOwner).to.eql(addr3.address)
        expect(marketItemInfo[0]).to.eql(addr3.address);
        expect(sellerBalance).to.be.above(1000000000000000000n)
    })

    it.skip("calculated price from UniswapV3Twap and Marketplace must be equal", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 2;
        const price = 1; //! In Dollars
        await marketPlace.connect(addr1).listToken(tokenId, price);
        const priceAndFee = await marketPlace.calculateMMLFeeAndNewPrice(1);
        const directlyFromUniswap = await uniswapV3TwapContract.callEstimateAmountOut(TOKEN_1, 10n ** DECIMALS_1, 10)
        console.log([priceAndFee, directlyFromUniswap]);
        expect(priceAndFee[0] + priceAndFee[1]).to.equal(directlyFromUniswap)
    })

    it("should but the token with USDT and tokens must transfer to the buyer", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 2
        const marketItemId = 1
        await marketPlace.connect(addr1).listToken(tokenId, 187);
        const purachaseOption = 2 // purchase with USDT
        await USDTtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n)
        await marketPlace.connect(addr2).buyToken(marketItemId, purachaseOption)
        const marketItemInfo = await marketPlace.getMarketItemInfo(1);
        const sellerBalance = await USDTtoken.balanceOf(marketItemInfo[1]);
        console.log("this is the USDT balance", sellerBalance);
        expect(marketItemInfo[0]).to.eql(addr2.address);
    })

    it("not being able to buy sold item", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const tokenId = 2;
        const marketItemId = 1
        const purchaseOption = 1;
        await marketPlace.connect(addr1).listToken(tokenId, 200);
        await MMLtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n);
        await MMLtoken.connect(addr3).approve(marketPlaceAddress, 10000000000000000000000000000000000n);
        await marketPlace.connect(addr2).buyToken(marketItemId, purchaseOption);
        const buyingAfterSale = marketPlace.connect(addr3).buyToken(marketItemId, purchaseOption)
        await expect(buyingAfterSale).to.be.revertedWith('Item has sold!')
    })

    it("seller of token should be able to cancel the listing: ", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 2;
        const markeItemId = 1
        await marketPlace.connect(addr1).listToken(tokenId, 200);
        await marketPlace.connect(addr1).cancelMarketItem(markeItemId);
        const marketItemInfo = await marketPlace.getMarketItemInfo(markeItemId);
        const buyingAfterCancelation = marketPlace.buyToken(markeItemId, 2)
        expect(marketItemInfo[6]).to.equal(true);
        expect(marketItemInfo[0]).to.equal(addr1.address);
        await expect(buyingAfterCancelation).to.be.revertedWith('Item has canceled!')
    })

    it("should return all market items", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(2, 100);
        await marketPlace.connect(addr2).listToken(1, 300);
        await marketPlace.connect(addr2).listToken(3, 400);
        await marketPlace.connect(addr1).listToken(4, 200);
        const allMarketItems = await marketPlace.allItems();
        console.log(allMarketItems);
    })

    it("should return an error for invalid purchase option", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const tokenId = 2;
        const markeItemId = 1
        const purachaseOption = 0
        await marketPlace.connect(addr1).listToken(tokenId, 200);
        const buyWithInvalidOption = marketPlace.buyToken(markeItemId, purachaseOption)
        await expect(buyWithInvalidOption).to.be.revertedWith('Invalid purchase option')
    })

    it("should return all canceled and all items", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(2, 120);
        await marketPlace.connect(addr2).listToken(1, 120);
        await marketPlace.connect(addr1).listToken(4, 120);
        await marketPlace.connect(addr2).listToken(3, 120);
        await marketPlace.connect(addr1).cancelMarketItem(1);
        await marketPlace.connect(addr2).cancelMarketItem(4);
        const allCanceledItems = await marketPlace.canceldItems()
        const allItems = await marketPlace.allItems();
        console.log("these are canceled items: ", allCanceledItems);
        console.log("these are all items: ", allItems);
    })

    it("with given address, it should return its items", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(2, 100);
        await marketPlace.connect(addr2).listToken(1, 100);
        await marketPlace.connect(addr1).listToken(4, 100);
        const allItemsByAddress = await marketPlace.allMarketItemsListedByAddress(addr1.address);
        console.log(allItemsByAddress);
    })

    it("should return the sold Items", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(2, 100);
        await marketPlace.connect(addr2).listToken(1, 300);
        await marketPlace.connect(addr1).listToken(4, 200);
        await marketPlace.connect(addr2).listToken(3, 400);
        await MMLtoken.connect(addr3).approve(marketPlaceAddress, 10000000000000000000000000000000000n);
        await marketPlace.connect(addr3).buyToken(1, 1);
        await marketPlace.connect(addr3).buyToken(4, 1);
        const allSoldItems = await marketPlace.soldItems();
        console.log(allSoldItems);
    })

    it("return items info by calling 'marketItemsListedByAddress' function ", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await marketPlace.connect(addr1).listToken(2, 100);
        await marketPlace.connect(addr2).listToken(1, 300);
        await marketPlace.connect(addr1).listToken(4, 200);
        await marketPlace.connect(addr2).listToken(3, 400);
        const getInfo = await marketPlace.allMarketItemsListedByAddress(addr2.address)
        const getInfo2 = await marketPlace.marketItemsListedByAddress(addr1.address)
        console.log("info 1 is: ", getInfo);
        console.log("info 2 is: ", getInfo2);
    })
})

describe("MultiSignature contract must deploy and work correctly", () => {
    let signatureContract;
    const deploy = async () => {
        const [owner] = await ethers.getSigners();
        const MultiSignatureContract = await ethers.getContractFactory("MultiSignature");
        signatureContract = await MultiSignatureContract.deploy(owner.address);
        await signatureContract.connect(owner).deposit({ value: ethers.parseEther("1.0") });
    }
    beforeEach(deploy)

    const setSecondOwner = async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await signatureContract.connect(owner).setOwnerStatus(addr1.address);
        await signatureContract.connect(owner).voteYesToAddOwner(1);
    }
    beforeEach(setSecondOwner);

    const setNewOwners = async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await signatureContract.connect(owner).setOwnerStatus(addr2.address);
        await signatureContract.connect(addr1).voteYesToAddOwner(2)
        await signatureContract.connect(owner).voteYesToAddOwner(2)
    }

    it("if a status is pending, you cannot set another one", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await signatureContract.connect(owner).setOwnerStatus(addr2.address);
        const invalidStatus = signatureContract.connect(owner).setTransactionStatus(2000000000000, addr3.address);
        await expect(invalidStatus).to.be.revertedWith('Another status is pending!')
    })

    it("should not add a new owner", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await signatureContract.connect(addr1).setOwnerStatus(addr2.address);
        await signatureContract.connect(addr1).voteYesToAddOwner(2)
        await signatureContract.connect(owner).voteNoToAddOwner(2)
        const data = await signatureContract.getOwnerStatusInfo(2)
        console.log(data);
    })

    it("should add a new owner", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await signatureContract.connect(owner).setOwnerStatus(addr2.address);
        await signatureContract.connect(addr1).voteYesToAddOwner(2)
        await signatureContract.connect(owner).voteYesToAddOwner(2)
        const data = await signatureContract.getOwnerStatusInfo(2)
        console.log(data);
        const ownersData = await signatureContract.getOwner(3)
        console.log(ownersData);
    })

    it("when 2 owners out of 3 voted yes, new owner must be added", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await signatureContract.connect(owner).setOwnerStatus(addr2.address);
        await signatureContract.connect(addr1).voteYesToAddOwner(2)
        await signatureContract.connect(owner).voteYesToAddOwner(2)
        await signatureContract.connect(addr2).setOwnerStatus(addr3.address);
        await signatureContract.connect(addr2).voteYesToAddOwner(3)
        await signatureContract.connect(addr1).voteYesToAddOwner(3)
        const data = await signatureContract.getOwnerStatusInfo(3)
        console.log(data);
        const ownersData = await signatureContract.getOwner(4)
        console.log(ownersData);
    })

    it("should not vote after status is failed or successful", async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await signatureContract.connect(owner).setOwnerStatus(addr2.address);
        await signatureContract.connect(addr1).voteYesToAddOwner(2)
        await signatureContract.connect(owner).voteYesToAddOwner(2)
        await signatureContract.connect(addr2).setOwnerStatus(addr3.address);
        await signatureContract.connect(addr2).voteYesToAddOwner(3)
        await signatureContract.connect(owner).voteNoToAddOwner(3)
        await signatureContract.connect(addr1).voteYesToAddOwner(3);
        const invalidVote = signatureContract.connect(addr3).voteYesToAddOwner(2)
        await expect(invalidVote).to.be.revertedWith('This status has ended!')
    })

    it("should set a transaction status", async () => {
        await setNewOwners();
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        const amountToTransfer = 2000000000000; // in WEI
        await signatureContract.connect(addr1).setTransactionStatus(amountToTransfer, addr4.address);
        await signatureContract.connect(addr1).voteYesToTxStatus(1);
        await signatureContract.connect(owner).voteYesToTxStatus(1);
        const data = await signatureContract.getTxStatusInfo(1);
        const contractBalanceBefore = await ethers.provider.getBalance(signatureContract)
        await signatureContract.connect(addr1).transferCoinsToReceiver(1);
        const contractBalanceAfter = await ethers.provider.getBalance(signatureContract)
        const addr4Balance = await ethers.provider.getBalance(addr4.address)
        expect(contractBalanceAfter).to.be.equal(999998000000000000n)
        expect(addr4Balance).to.be.greaterThan(10000000000000000000000n)
    })

    it("should not set address zero in transaction status or owner status", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const zeroAddress = signatureContract.connect(addr1).setOwnerStatus(ethers.ZeroAddress)
        await expect(zeroAddress).to.be.rejectedWith('Zero address!')
    })

    it("should revert because zero amount", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const zeroAmount = signatureContract.connect(addr1).setTransactionStatus(0, addr1.address);
        await expect(zeroAmount).to.be.revertedWith("Zero amount!");
    })

    it("if a transaction status has failed, should not be able to transfer coin", async () => {
        await setNewOwners();
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await signatureContract.connect(addr2).setTransactionStatus(500000000000000, addr3.address);
        await signatureContract.connect(addr1).voteNoToTxStatus(1);
        await signatureContract.connect(owner).voteNoToTxStatus(1)
        const invalidTransfer = signatureContract.connect(addr2).transferCoinsToReceiver(1)
        await expect(invalidTransfer).to.be.revertedWith('Status was not successful!');
    })

    it("should not adding the existing owner", async () => {
        await setNewOwners();
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const invalidOwnerStatus = signatureContract.connect(owner).setOwnerStatus(owner.address);
        await expect(invalidOwnerStatus).to.be.revertedWith('Existing address!');
    })

    it("if coins transfered to the receiver, should not transfer again!", async () => {
        await setNewOwners();
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        const amountToTransfer = 2000000000000; // in WEI
        await signatureContract.connect(addr1).setTransactionStatus(amountToTransfer, addr4.address);
        await signatureContract.connect(addr1).voteYesToTxStatus(1);
        await signatureContract.connect(owner).voteYesToTxStatus(1);
        await signatureContract.connect(addr1).transferCoinsToReceiver(1);
        const invalidTransfer = signatureContract.connect(addr1).transferCoinsToReceiver(1);
        const addr4Balance = await ethers.provider.getBalance(addr4.address);
        console.log(addr4Balance);
        await expect(invalidTransfer).to.be.revertedWith("Already transfered!");
    })

    it("should return all owners", async () => {
        await setNewOwners();
        const [owner, addr1] = await ethers.getSigners();
        const owners = await signatureContract.connect(owner).getAllOwners();
        console.log(owners);
    })
})

describe("MultiSignature contract with token instead of native coin", () => {
    let signatureContract;
    let MMLtoken;
    let signatureContractAddress;
    const deploy = async () => {
        const [owner, addr1] = await ethers.getSigners();
        const MultiSignatureContract = await ethers.getContractFactory("MultiSignatureWithToken");
        const MMLtokenContract = await ethers.getContractFactory("MMLtoken")
        MMLtoken = await MMLtokenContract.deploy();
        const MMLtokenAddress = await MMLtoken.getAddress();
        signatureContract = await MultiSignatureContract.deploy(owner.address, MMLtokenAddress);
        signatureContractAddress = await signatureContract.getAddress();
        await MMLtoken.connect(owner).approve(signatureContractAddress, 10000000000000000000000000000000000n);
        await signatureContract.connect(addr1).depositToken(6000000000000000000n)
    }
    beforeEach(deploy)

    const setSecondOwner = async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        await signatureContract.connect(owner).setOwnerStatus(addr1.address);
        await signatureContract.connect(owner).voteYesToAddOwner(1);
    }
    beforeEach(setSecondOwner);

    const setNewOwners = async () => {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await signatureContract.connect(owner).setOwnerStatus(addr2.address);
        await signatureContract.connect(addr1).voteYesToAddOwner(2)
        await signatureContract.connect(owner).voteYesToAddOwner(2)
    }

    it("should transfer the tokens after yes votes were valid", async () => {
        await setNewOwners();
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        const amountToTransfer = 4000000000000000000n;
        const contractBalanceBefore = await MMLtoken.balanceOf(signatureContractAddress)
        await signatureContract.connect(addr1).setTransactionStatus(amountToTransfer, addr4.address);
        await signatureContract.connect(addr1).voteYesToTxStatus(1);
        await signatureContract.connect(owner).voteYesToTxStatus(1);
        const Txdata = await signatureContract.getTxStatusInfo(1);
        const contractBalanceAfter = await MMLtoken.balanceOf(signatureContractAddress);
        const addr4Balance = await MMLtoken.balanceOf(addr4.address);
        console.log(`before is ${contractBalanceBefore}, After is ${contractBalanceAfter} \n`);
        console.log(`This is addr4 MMl balance: ${addr4Balance}`);
        console.log(Txdata);
    })

    it("should revert because zero amount", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const zeroAmount = signatureContract.connect(addr1).setTransactionStatus(0, addr1.address);
        await expect(zeroAmount).to.be.revertedWith("Zero amount!");
    })

    it("if a transaction status has failed, should not be able to transfer coin", async () => {
        await setNewOwners();
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        await signatureContract.connect(addr2).setTransactionStatus(500000000000000, addr3.address);
        await signatureContract.connect(addr1).voteNoToTxStatus(1);
        await signatureContract.connect(owner).voteNoToTxStatus(1)
        const invalidTransfer = signatureContract.connect(addr2).transferCoinsToReceiver(1)
        await expect(invalidTransfer).to.be.revertedWith('Status was not successful!');
    })

    it("should not adding the existing owner", async () => {
        await setNewOwners();
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const invalidOwnerStatus = signatureContract.connect(owner).setOwnerStatus(owner.address);
        await expect(invalidOwnerStatus).to.be.revertedWith('Existing address!');
    })

    it("if coins transfered to the receiver, should not transfer again!", async () => {
        await setNewOwners();
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        const amountToTransfer = 5000000000000000000n;
        await signatureContract.connect(addr1).setTransactionStatus(amountToTransfer, addr4.address);
        await signatureContract.connect(addr1).voteYesToTxStatus(1);
        await signatureContract.connect(owner).voteYesToTxStatus(1);
        await signatureContract.connect(addr1).transferCoinsToReceiver(1);
        const invalidTransfer = signatureContract.connect(addr1).transferCoinsToReceiver(1);
        const addr4Balance = await MMLtoken.balanceOf(addr4.address);
        console.log(addr4Balance);
        await expect(invalidTransfer).to.be.revertedWith("Already transfered!");
    })

    it("should return all owners", async () => {
        await setNewOwners();
        const [owner, addr1] = await ethers.getSigners();
        const owners = await signatureContract.connect(owner).getAllOwners();
        console.log(owners);
    })
})

describe.only("testing mirrora stake contract", () => {
    let stakeContract;

    const deployContract = async () => {
        const [owner] = await ethers.getSigners();
        const StakeContract = await ethers.getContractFactory("MirroraStake");
        stakeContract = await StakeContract.connect(owner).deploy();
        console.log(stakeContract);
    }

    beforeEach(deployContract);

    it("user should stake correctly", async () => {
        const [owner, addr1] = await ethers.getSigners();
        const amount = 20000000000000000000n
        const lockTime = 55;
        const rewardInterval = 10;
        const msgValue = { value: ethers.parseEther("20") };
        await stakeContract.connect(addr1).unStake(1);
    })
})