// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Land is ERC721URIStorage {
    address public owner;
    uint24 private tokenIds;
    uint16[] enhancementItems;

    event MintToken(uint24 toeknId, address signer, address owner);
    event TransferToken(address from, address to, uint24 tokenId);
    event SetEnhancements(address signer, uint16[] items);
    event ChangeLandLocation(
        address signer,
        uint[2] oldLocations,
        uint[2] newLocations
    );
    event ChangeLandPrice(address signer, uint oldPrice, uint newPrice);
    event ChangeOwner(address signer, address newOwner);

    constructor() ERC721("MirroraVillage", "MIRV") {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier zeroAddress(address _to) {
        _zeroAddress(_to);
        _;
    }

    modifier nftOwner(uint24 tokenId) {
        _nftOwner(tokenId);
        _;
    }

    modifier invalidTokenId(uint24 _tokenId) {
        _invalidTokenId(_tokenId);
        _;
    }

    struct LandStructure {
        address payable owner;
        uint8 regionId;
        uint24 landId;
        uint8 landSize;
        uint[2] landLocation;
        uint16[] enhancements;
        uint landPrice;
    }

    mapping(uint => LandStructure) private LandInformation;

    function mintLandToken(
        uint8 _regionId,
        uint8 _landSize,
        uint[2] memory _landLocation,
        uint24 _landPrice,
        address payable _to,
        string memory _tokenURI
    ) public onlyOwner zeroAddress(_to) returns (uint) {
        tokenIds += 1;
        LandInformation[tokenIds].owner = _to;
        LandInformation[tokenIds].regionId = _regionId;
        LandInformation[tokenIds].landId = tokenIds;
        LandInformation[tokenIds].landSize = _landSize;
        LandInformation[tokenIds].landLocation = _landLocation;
        LandInformation[tokenIds].landPrice = _landPrice;
        _mint(_to, tokenIds);
        _setTokenURI(tokenIds, _tokenURI);
        emit MintToken(tokenIds, msg.sender, _to);
        return tokenIds;
    }

    function setEnhancement(
        uint16[] memory _items,
        uint24 _tokenId
    ) external nftOwner(_tokenId) {
        LandInformation[_tokenId].enhancements = _items;
        emit SetEnhancements(msg.sender, _items);
    }

    function enhancementIndexFinder(
        uint24 _tokenId,
        uint16 _removeItem
    ) internal view returns (uint index) {
        uint16[] memory items = LandInformation[_tokenId].enhancements;
        uint itemsLength = items.length;
        for (uint i = 0; i < itemsLength; i++) {
            if (items[i] == _removeItem) {
                return i;
            }
        }
    }

    function removeEnhancement(
        uint24 _tokenId,
        uint16 _removeItem
    ) external onlyOwner {
        enhancementItems = [0];
        enhancementItems = LandInformation[_tokenId].enhancements;
        uint index = enhancementIndexFinder(_tokenId, _removeItem);
        for (uint i = index; i < enhancementItems.length - 1; i++) {
            enhancementItems[i] = enhancementItems[i + 1];
        }
        enhancementItems.pop();
        LandInformation[_tokenId].enhancements = enhancementItems;
    }

    function changeItemOwner(
        uint24 _tokenId,
        address payable _newOwner
    ) external onlyOwner invalidTokenId(_tokenId) {
        LandInformation[_tokenId].owner = _newOwner;
    }

    function transferLandToken(
        address payable _from,
        address payable _to,
        uint24 _tokenId
    ) external zeroAddress(_to) {
        safeTransferFrom(_from, _to, _tokenId);
        LandInformation[_tokenId].owner = _to;
        emit TransferToken(msg.sender, _to, _tokenId);
    }

    function changeLandLocation(
        uint24 _tokenId,
        uint[2] memory _newlocations
    ) external onlyOwner {
        uint[2] memory oldLocations = LandInformation[_tokenId].landLocation;
        LandInformation[_tokenId].landLocation = _newlocations;
        emit ChangeLandLocation(msg.sender, oldLocations, _newlocations);
    }

    function changeLandPrice(uint _tokenId, uint _newPrice) external onlyOwner {
        uint oldPrice = LandInformation[_tokenId].landPrice;
        LandInformation[_tokenId].landPrice = _newPrice;
        emit ChangeLandPrice(msg.sender, oldPrice, _newPrice);
    }

    function changeOwner(
        address _newOwner
    ) external onlyOwner zeroAddress(_newOwner) {
        owner = _newOwner;
        emit ChangeOwner(msg.sender, _newOwner);
    }

    function setTokenURI(
        uint24 _tokenId,
        string memory _newTokenURI
    ) external onlyOwner invalidTokenId(_tokenId) {
        _setTokenURI(_tokenId, _newTokenURI);
    }

    function approveLandToken(address _to, uint24 _tokenId) external {
        approve(_to, _tokenId);
        emit Approval(msg.sender, _to, _tokenId);
    }

    function getTokenURI(uint24 _tokenId) public view returns (string memory) {
        return tokenURI(_tokenId);
    }

    function getTokenInfo(
        uint24 _tokenId
    ) public view returns (LandStructure memory) {
        return LandInformation[_tokenId];
    }

    function allMintedTokens() public view returns (uint) {
        return tokenIds;
    }

    function _onlyOwner() private view {
        require(msg.sender == owner, "You are not owner of contract!");
    }

    function _zeroAddress(address _to) private pure {
        require(_to != address(0), "Invalid address!");
    }

    function _nftOwner(uint24 _tokenId) private view {
        require(
            msg.sender == LandInformation[_tokenId].owner,
            "You are not nft owner!"
        );
    }

    function _invalidTokenId(uint24 _tokenId) private view {
        require(_tokenId <= tokenIds, "Invalid tokenId");
    }
}
