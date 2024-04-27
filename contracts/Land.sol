// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Land is ERC721URIStorage {
    address public owner;
    address public marketplaceAddress;
    uint private tokenIds;

    event MintToken(uint toeknId, address signer, address owner);
    event TransferToken(address from, address to, uint tokenId);
    event SetEnhancements(address signer, string[] items);
    event ChangeLandLocation(
        address signer,
        uint[2] oldLocations,
        uint[2] newLocations
    );
    event ChangeLandPrice(address signer, uint oldPrice, uint newPrice);

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

    modifier nftOwner(uint tokenId) {
        _nftOwner(tokenId);
        _;
    }

    struct LandStructure {
        address payable owner;
        uint regionId;
        uint landId;
        uint8 landSize;
        uint[2] landLocation;
        string[] enhancements;
        uint landPrice;
    }

    mapping(uint => LandStructure) private LandInformation;

    function mintLandNft(
        uint _regionId,
        uint8 _landSize,
        uint[2] memory _landLocation,
        uint _landPrice,
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

    function transferLandToken(
        address payable _to,
        uint _tokenId
    ) external nftOwner(_tokenId) zeroAddress(_to) {
        safeTransferFrom(msg.sender, _to, _tokenId);
        LandInformation[_tokenId].owner = _to;
        emit TransferToken(msg.sender, _to, _tokenId);
    }

    function setEnhancement(
        string[] memory _items,
        uint _tokenId
    ) external nftOwner(_tokenId) {
        LandInformation[_tokenId].enhancements = _items;
        emit SetEnhancements(msg.sender, _items);
    }

    function changeLandLocation(
        uint _tokenId,
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

    function approveLandToken(address _to, uint _tokenId) external {
        approve(_to, _tokenId);
        emit Approval(msg.sender, _to, _tokenId);
    }

    function getTokenURI(uint _tokenId) public view returns (string memory) {
        return tokenURI(_tokenId);
    }

    function getTokenInfo(
        uint _tokenId
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

    function _nftOwner(uint _tokenId) public view {
        require(
            msg.sender == LandInformation[_tokenId].owner,
            "You are not nft owner!"
        );
    }
}
