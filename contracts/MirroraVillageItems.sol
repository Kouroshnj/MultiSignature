// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

contract MirroraVillageItems is ERC1155URIStorage {
    address public owner;
    uint16 private itemIds;

    constructor() ERC1155("https://mirroraVillage/api/item/{id}.json") {
        owner = msg.sender;
    }

    event MintItem(string itemName, uint16 itemId, uint quantity);
    event BurnItem(string itemName, uint16 itemId, uint quantity);
    event ChangeOwner(address previousOwner, address newOwner);

    mapping(uint => ItemInformation) private ItemInfo;

    struct ItemInformation {
        string itemName;
        bytes32 itemNameInBytes;
        uint16 itemId;
        uint mintedQuantity;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier invalidItemId(uint16 _itemId) {
        _invalidItemId(_itemId);
        _;
    }

    function mintItem(
        address _to,
        uint _quantity,
        string memory _itemName
    ) public onlyOwner returns (uint) {
        itemIds += 1;
        _mint(_to, itemIds, _quantity, "");
        bytes32 _itemNameInBytes = keccak256(abi.encodePacked(_itemName));
        ItemInfo[itemIds].itemName = _itemName;
        ItemInfo[itemIds].itemNameInBytes = _itemNameInBytes;
        ItemInfo[itemIds].itemId = itemIds;
        ItemInfo[itemIds].mintedQuantity = _quantity;
        emit MintItem(_itemName, itemIds, _quantity);
        return itemIds;
    }

    function burnItem(
        address _from,
        uint16 _itemId,
        uint _quantity
    ) public onlyOwner invalidItemId(_itemId) {
        _burn(_from, _itemId, _quantity);
        ItemInfo[_itemId].mintedQuantity -= _quantity;
        emit BurnItem(ItemInfo[_itemId].itemName, _itemId, _quantity);
    }

    function addQuantityToItemId(
        address _to,
        uint16 _itemId,
        uint _quantity
    ) public onlyOwner invalidItemId(_itemId) {
        _mint(_to, _itemId, _quantity, "");
        ItemInfo[_itemId].mintedQuantity += _quantity;
    }

    function changeItemName(
        uint16 _itemId,
        string memory _newName
    ) public onlyOwner invalidItemId(_itemId) {
        bytes32 _newItemNameInBytes = keccak256(abi.encodePacked(_newName));
        ItemInfo[_itemId].itemNameInBytes = _newItemNameInBytes;
        ItemInfo[itemIds].itemName = _newName;
    }

    function changeOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
        emit ChangeOwner(msg.sender, _newOwner);
    }

    function transferItem(
        address _to,
        uint16 _itemId,
        uint _quantity
    ) external {
        safeTransferFrom(msg.sender, _to, _itemId, _quantity, "0x");
    }

    function getItemInformationByName(
        string memory _itemName
    ) public view returns (ItemInformation memory _item) {
        for (uint16 i = 1; i <= itemIds; i++) {
            if (
                ItemInfo[i].itemNameInBytes ==
                keccak256(abi.encodePacked(_itemName))
            ) {
                return ItemInfo[i];
            }
        }
    }

    function getItemInformationById(
        uint16 _itemId
    ) public view invalidItemId(_itemId) returns (ItemInformation memory) {
        return ItemInfo[_itemId];
    }

    function setURI(
        uint16 _itemId,
        string memory _uri
    ) external onlyOwner invalidItemId(_itemId) {
        _setURI(_itemId, _uri);
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        _setBaseURI(_baseURI);
    }

    function _onlyOwner() private view {
        require(msg.sender == owner, "You are not owner of contract!");
    }

    function _invalidItemId(uint16 itemId) private view {
        require(itemId != 0 && itemId <= itemIds, "Invalid itemId!");
    }
}
