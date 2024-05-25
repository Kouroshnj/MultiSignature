const { expect, should } = require("chai")
const { ethers } = require("hardhat")


// describe("deploy contract successfully", () => {

//     let landContract;

//     const deploy = async () => {
//         const LandContract = await ethers.getContractFactory("Land");
//         landContract = await LandContract.deploy();
//     }
//     beforeEach(deploy)

//     const mintToken = async () => {
//         const [signer, addr1] = await ethers.getSigners()
//         await landContract.mintLandToken(1, 1, [22, 33], 400, addr1, "testURI.com");
//     }
//     beforeEach(mintToken)

//     it("owner of contract must be valid", async function () {
//         const [signer, addr1] = await ethers.getSigners();
//         let owner = await landContract.owner()
//         expect(owner).to.equal(signer.address)
//     })



//     it("owner of first token must be valid", async () => {
//         const [signer, addr1] = await ethers.getSigners();

//         let firstTokenOwner = await landContract.ownerOf(1);
//         expect(firstTokenOwner).to.equal(addr1);
//         expect(firstTokenOwner).not.equal(signer)
//     })

//     it("owner of token must set the enhancements", async () => {
//         const [signer, addr1] = await ethers.getSigners();
//         await landContract.connect(addr1).setEnhancement(["soil", "axe"], 1);
//         let tokenData = await landContract.getTokenInfo(1);
//         expect(tokenData[5]).to.eql(["soil", "axe"]);
//         expect(tokenData[5]).not.eql(["tractor", "soil"]);
//     })

//     it("owner of contract can change the nft location parameter", async () => {
//         const [signer, addr1] = await ethers.getSigners();
//         await landContract.connect(signer).changeLandLocation(1, [26, 11]);
//         let tokenData = await landContract.getTokenInfo(1);
//         const newLocations = [26, 11]
//         const oldLocations = [22, 33]
//         expect(tokenData[4]).to.deep.equal(newLocations);
//         expect(tokenData[4]).not.deep.equal(oldLocations);
//     })

//     it("owner of contract must change the price of token", async () => {
//         const [signer, addr1] = await ethers.getSigners();
//         await landContract.connect(signer).changeLandPrice(1, 900);
//         let tokenData = await landContract.getTokenInfo(1);
//         const newPrice = 900
//         const oldPrice = 400
//         expect(tokenData[6]).to.equal(newPrice);
//         expect(tokenData[6]).not.equal(oldPrice);
//     })

//     it("after approving the new address, it can change the owner of token", async () => {
//         const [signer, addr1, addr2] = await ethers.getSigners();
//         const tokenId = 1
//         await landContract.connect(addr1).approveLandToken(addr2.address, tokenId);
//         await landContract.connect(addr2).transferLandToken(addr1.address, addr2.address, tokenId)
//         let tokenData = await landContract.getTokenInfo(1);
//         expect(tokenData[0]).to.eql(addr2.address)
//         expect(tokenData[0]).not.eql(addr1.address)
//     })

//     it("should change the tokenURI of token", async () => {
//         const [signer, addr1] = await ethers.getSigners();
//         const tokenId = 1;
//         const randomURI = "randomURI.com"
//         const oldURI = await landContract.tokenURI(tokenId)
//         await landContract.connect(signer).setTokenURI(tokenId, randomURI);
//         const newURI = await landContract.tokenURI(tokenId)
//         expect(newURI).not.eql(oldURI)
//     })

//     it("owner must change the ownership od contract", async () => {
//         const [signer, addr1] = await ethers.getSigners();
//         await landContract.connect(signer).changeOwner(addr1.address);
//         const currentOwner = await landContract.owner();
//         expect(currentOwner).to.eql(addr1.address)
//         expect(currentOwner).not.eql(signer.address)
//     })
// })

// describe("UniswapV3Twap get price", async () => {
//     const FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
//     // MANA
//     const TOKEN_0 = "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942"
//     const DECIMALS_0 = 18n
//     // USDT
//     const TOKEN_1 = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
//     const DECIMALS_1 = 6n
//     // 0.3%
//     const FEE = 3000

//     it("should get the price", async () => {
//         const UniswapV3Twap = await ethers.getContractFactory("UniswapV3Twap")
//         const twap = await UniswapV3Twap.deploy(FACTORY, TOKEN_0, TOKEN_1, FEE)

//         const price = await twap.callEstimateAmountOut(TOKEN_1, 10n ** DECIMALS_1, 10)
//         const price2 = await twap.callEstimateAmountOut(TOKEN_0, 10n ** DECIMALS_0, 10)
//         const fee2 = await twap.callEstimateAmountOut(TOKEN_1, 400n ** DECIMALS_1, 10)


//         console.log(`price one is : ${price}`)
//         console.log(`price two is : ${price2}`)
//         console.log("price fee is: ", fee2)
//     })
// })

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
        await marketPlace.connect(addr1).listToken(tokenId, 200);
        const purachaseOption = 2 // purchase with USDT
        await USDTtoken.connect(addr2).approve(marketPlaceAddress, 10000000000000000000000000000000000n)
        await marketPlace.connect(addr2).buyToken(tokenId, purachaseOption)
        const marketItemInfo = await marketPlace.getMarketItemInfo(1);
        const sellerBalance = await USDTtoken.balanceOf(marketItemInfo[1]);
        expect(marketItemInfo[0]).to.eql(addr2.address);
        expect(sellerBalance).to.equal(190000000n)
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

describe.only("Deploy itemsMarketplace ant call its functions", async () => {
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
        const itemsListedByAddress = await itemsMarketplace.allMarketItemsListedByAddress(addr3.address);
        console.log(itemsListedByAddress);
    })
})




