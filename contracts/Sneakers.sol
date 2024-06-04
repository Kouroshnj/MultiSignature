// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Sneakers is ERC721URIStorage {
    address public owner;
    uint24 private tokenIds = 0;

    event MintItem(address to, uint8 sneakerType, uint24 itemId);

    mapping(uint => SneakerInfo) private SneakerInformation;

    constructor() ERC721("AkilaStep", "AKS") {
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

    modifier invalidTokenId(uint24 _tokenId) {
        _invalidTokenId(_tokenId);
        _;
    }

    modifier invalidQuality(Quality quality) {
        _invalidQuality(quality);
        _;
    }

    enum Quality {
        None,
        Standard,
        Rare,
        Iconic
    }

    struct SneakerInfo {
        address owner;
        uint8 sneakerType;
        Quality quality;
        uint64 timeToWalk;
        uint24[] speedRange;
        uint64 maxDist;
        uint64 rewardPerHundredMeter;
        uint64 efficiency;
        uint64 comfort;
        uint64 resilence;
        uint24 itemId;
    }

    function mintItem(
        address _to,
        uint8 _type,
        Quality _quality,
        uint64 _timeToWalk,
        uint24[2] memory _speedRange,
        uint64 _maxDist,
        uint64 _reward,
        uint64 _efficiency,
        uint64 _comfort,
        uint64 _resilence,
        string memory tokenURI
    ) external onlyOwner invalidQuality(_quality) returns (uint24) {
        tokenIds += 1;
        SneakerInformation[tokenIds].owner = _to;
        SneakerInformation[tokenIds].sneakerType = _type;
        SneakerInformation[tokenIds].timeToWalk = _timeToWalk;
        SneakerInformation[tokenIds].speedRange = _speedRange;
        SneakerInformation[tokenIds].maxDist = _maxDist;
        SneakerInformation[tokenIds].rewardPerHundredMeter = _reward;
        SneakerInformation[tokenIds].quality = _quality;
        SneakerInformation[tokenIds].efficiency = _efficiency;
        SneakerInformation[tokenIds].comfort = _comfort;
        SneakerInformation[tokenIds].resilence = _resilence;
        SneakerInformation[tokenIds].itemId = tokenIds;
        _mint(_to, tokenIds);
        _setTokenURI(tokenIds, tokenURI);
        emit MintItem(_to, _type, tokenIds);
        return tokenIds;
    }

    function changeItemType(
        uint24 _tokenId,
        uint8 _newType
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].sneakerType = _newType;
    }

    function changeItemTimeToWalk(
        uint24 _tokenId,
        uint64 _newTimeToWalk
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].timeToWalk = _newTimeToWalk;
    }

    function changeItemOwner(
        uint24 _tokenId,
        address _newOwner
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].owner = _newOwner;
    }

    function changeItemSpeedRange(
        uint24 _tokenId,
        uint24[2] memory _newSpeedRange
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].speedRange = _newSpeedRange;
    }

    function changeItemQuality(
        uint24 _tokenId,
        Quality _newQuality
    ) external onlyOwner invalidQuality(_newQuality) invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].quality = _newQuality;
    }

    function changeItemMaxDist(
        uint24 _tokenId,
        uint64 _newMaxDist
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].maxDist = _newMaxDist;
    }

    function changeItemReward(
        uint24 _tokenId,
        uint64 _newReward
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].rewardPerHundredMeter = _newReward;
    }

    function changeItemEfficiency(
        uint24 _tokenId,
        uint64 _newEfficiency
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].efficiency = _newEfficiency;
    }

    function changeItemComfort(
        uint24 _tokenId,
        uint64 _newComfort
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].comfort = _newComfort;
    }

    function changeItemResilence(
        uint24 _tokenId,
        uint64 _newResilence
    ) external onlyOwner invalidTokenId(_tokenId) {
        SneakerInformation[_tokenId].resilence = _newResilence;
    }

    function changeOwner(
        address _newOwner
    ) external onlyOwner zeroAddress(_newOwner) {
        owner = _newOwner;
    }

    function changeItemURI(
        uint24 _tokenId,
        string memory _newURI
    ) external onlyOwner {
        _setTokenURI(_tokenId, _newURI);
    }

    function getTokenInfo(
        uint24 _tokenId
    ) public view returns (SneakerInfo memory) {
        return SneakerInformation[_tokenId];
    }

    function getNumberOfOwnedItemsByAddress(
        address _itemOwner
    ) external view returns (uint) {
        uint k = 0;
        for (uint i = 1; i <= tokenIds; i++) {
            if (SneakerInformation[i].owner == _itemOwner) {
                k += 1;
            }
        }
        return k;
    }

    function getTokenInfoByOwnerAddress(
        address _itemOwner,
        uint _numberOfOwnedItems
    ) public view returns (SneakerInfo[] memory) {
        uint k = 0;
        SneakerInfo[] memory items = new SneakerInfo[](_numberOfOwnedItems);
        for (uint i = 1; i <= tokenIds; i++) {
            if (SneakerInformation[i].owner == _itemOwner) {
                items[k] = SneakerInformation[i];
                k++;
            }
        }
        return items;
    }

    function _onlyOwner() private view {
        require(msg.sender == owner, "You are not owner of contract!");
    }

    function _zeroAddress(address _to) private pure {
        require(_to != address(0), "Invalid address!");
    }

    function _invalidTokenId(uint24 _tokenId) private view {
        require(_tokenId <= tokenIds, "invalid tokenId");
    }

    function _invalidQuality(Quality quality) private pure {
        require(quality != Quality.None, "Invalid quality!");
    }
}
