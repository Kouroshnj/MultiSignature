// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./utils/UniswapV3Twap.sol";

contract Marketplace is ReentrancyGuard, UniswapV3Twap {
    address public owner;
    IERC20 public MMLaddress;
    IERC20 public USDTaddress;
    IERC721 public Landaddress;

    //@dev numerator / denominator = feeToContract;
    uint8 numerator;
    uint24 denominator;

    //@dev Number of all market items that have been listed
    //@notice we can get the number by calling the function "getAllMarketItemIds"
    uint192 private marketItemIds;

    event ListingItem(address tokenOwner, uint192 tokenId, uint price);
    event BuyItem(
        address buyer,
        uint192 tokenId,
        PurchaseOptions purchaseOption
    );
    event CancelItem(address tokenOwner, uint192 tokenId);

    //@dev Map the id of market item to the structure
    mapping(uint => MarketItem) private MarketItemInfo;

    constructor(
        address MMLtoken,
        address USDTtoken,
        address LandToken,
        address _factory,
        uint24 _UniswapFee
    ) UniswapV3Twap(_factory, MMLtoken, USDTtoken, _UniswapFee) {
        owner = msg.sender;
        MMLaddress = IERC20(MMLtoken);
        USDTaddress = IERC20(USDTtoken);
        Landaddress = IERC721(LandToken);
    }

    modifier zeroAddress(uint192 marketItemId) {
        _zeroAddress(marketItemId);
        _;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier soldOut(uint192 marketItemId) {
        _soldOut(marketItemId);
        _;
    }

    modifier canceled(uint192 marketItemId) {
        _canceled(marketItemId);
        _;
    }

    modifier onlyMarketItemSeller(uint192 marketItemId) {
        _onlyMarketItemSeller(marketItemId);
        _;
    }

    modifier invalidPurchaseOption(PurchaseOptions purchaseOption) {
        _invalidPurchaseOption(purchaseOption);
        _;
    }

    enum PurchaseOptions {
        None,
        MML,
        USDT
    }

    struct MarketItem {
        address payable owner;
        address payable seller;
        uint price;
        uint192 marketItemId;
        uint192 tokenId;
        bool sold;
        bool canceled;
    }

    receive() external payable {}

    //@dev Listing the Land NFT in the marketplace.
    //@notice After listing the NFT, owner must be the address of contract.
    function listToken(
        uint192 _tokenId,
        uint256 _price
    ) public returns (uint256) {
        marketItemIds += 1;
        Landaddress.transferFrom(msg.sender, address(this), _tokenId);
        MarketItemInfo[marketItemIds].owner = payable(address(this));
        MarketItemInfo[marketItemIds].seller = payable(msg.sender);
        MarketItemInfo[marketItemIds].price = _price;
        MarketItemInfo[marketItemIds].marketItemId = marketItemIds;
        MarketItemInfo[marketItemIds].tokenId = _tokenId;
        MarketItemInfo[marketItemIds].sold = false;
        MarketItemInfo[marketItemIds].canceled = false;
        emit ListingItem(msg.sender, _tokenId, _price);
        return marketItemIds;
    }

    //@dev Users can buy the item.
    //@notice Users can choose in which way they want to purchase the item.
    //@param _purchaseOption is an enum to choose between purchase options, MML or USDT.
    function buyToken(
        uint192 _marketItemId,
        PurchaseOptions _purchaseOption
    )
        external
        soldOut(_marketItemId)
        canceled(_marketItemId)
        invalidPurchaseOption(_purchaseOption)
        nonReentrant
    {
        uint fee;
        uint marketItemPrice;
        address marketItemSeller = MarketItemInfo[_marketItemId].seller;
        uint192 tokenID = MarketItemInfo[_marketItemId].tokenId;
        if (_purchaseOption == PurchaseOptions.MML) {
            (marketItemPrice, fee) = calculateMMLFeeAndNewPrice(_marketItemId);
            require(marketItemPrice > 0, "marketItemPrice is invalid!");
            MMLaddress.transferFrom(msg.sender, owner, fee);
            MMLaddress.transferFrom(
                msg.sender,
                marketItemSeller,
                marketItemPrice
            );
        } else if (_purchaseOption == PurchaseOptions.USDT) {
            (marketItemPrice, fee) = calculateUSDTFeeAndNewPrice(_marketItemId);
            require(marketItemPrice > 0, "marketItemPrice is invalid!");
            USDTaddress.transferFrom(msg.sender, owner, fee);
            USDTaddress.transferFrom(
                msg.sender,
                marketItemSeller,
                marketItemPrice
            );
        }
        Landaddress.transferFrom(address(this), msg.sender, tokenID);
        MarketItemInfo[_marketItemId].owner = payable(msg.sender);
        MarketItemInfo[_marketItemId].sold = true;
        emit BuyItem(msg.sender, tokenID, _purchaseOption);
    }

    function cancelMarketItem(
        uint192 _marketItemId
    )
        external
        onlyMarketItemSeller(_marketItemId)
        soldOut(_marketItemId)
        canceled(_marketItemId)
    {
        uint192 tokenID = MarketItemInfo[_marketItemId].tokenId;
        Landaddress.transferFrom(address(this), msg.sender, tokenID);
        MarketItemInfo[_marketItemId].owner = payable(msg.sender);
        MarketItemInfo[_marketItemId].canceled = true;
        emit CancelItem(msg.sender, tokenID);
    }

    function setFeeToContract(
        uint8 _numerator,
        uint24 _denominator
    ) external onlyOwner {
        numerator = _numerator;
        denominator = _denominator;
    }

    function withdraw() external onlyOwner {
        uint amount = address(this).balance;
        require(amount > 0, "Balance is zero!");
        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Failed to withdraw!");
    }

    function calculateMMLFeeAndNewPrice(
        uint192 _marketItemId
    ) public view returns (uint, uint) {
        uint marketItemPrice = MarketItemInfo[_marketItemId].price;
        // uint totalMML = callEstimateAmountOut(
        //     USDTaddress,
        //     uint128(marketItemPrice),
        //     10
        // );
        uint totalMML = priceOfOneUSDTinMML(marketItemPrice);
        uint mul = totalMML * numerator;
        (, uint fee) = SafeMath.tryDiv(mul, denominator);
        totalMML -= fee;
        return (totalMML, fee);
    }

    function calculateUSDTFeeAndNewPrice(
        uint192 _marketItemId
    ) internal view returns (uint, uint) {
        uint marketItemPrice = MarketItemInfo[_marketItemId].price;
        marketItemPrice = SafeMath.mul(marketItemPrice, 10 ** 6);
        uint mul = marketItemPrice * numerator;
        (, uint fee) = SafeMath.tryDiv(mul, denominator);
        marketItemPrice -= fee;
        return (marketItemPrice, fee);
    }

    function getMarketItemInfo(
        uint192 _marketItemId
    ) public view returns (MarketItem memory) {
        return MarketItemInfo[_marketItemId];
    }

    function getAllMarketItemIds() public view returns (uint192) {
        return marketItemIds;
    }

    function _onlyOwner() private view {
        require(msg.sender == owner, "You are not owner of contract!");
    }

    function _soldOut(uint192 _marketItemId) private view {
        require(!MarketItemInfo[_marketItemId].sold, "Item has sold!");
    }

    function _canceled(uint192 _marketItemId) private view {
        require(!MarketItemInfo[_marketItemId].canceled, "Item has canceled!");
    }

    function _invalidPurchaseOption(
        PurchaseOptions _purchaseOption
    ) private pure {
        require(
            _purchaseOption != PurchaseOptions.None,
            "Invalid purchase option"
        );
    }

    function _onlyMarketItemSeller(uint192 _marketItemId) private view {
        require(
            MarketItemInfo[_marketItemId].seller == msg.sender,
            "You are not the token seller!"
        );
    }

    function _zeroAddress(uint192 _marketItemId) private view {
        require(
            MarketItemInfo[_marketItemId].seller != address(0),
            "Invalid seller address!"
        );
    }
}
