// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MultiSignature is ReentrancyGuard {
    using SafeMath for uint256;

    uint16 private counter = 1;
    uint8 public lock = 0;
    uint24 private ownerStatusIds = 0;
    uint24 private transactionIds = 0;

    mapping(uint256 => address) private checkOwner;
    mapping(uint24 => OwnerStatus) private checkAddOwnerStatus;
    mapping(uint24 => TransactionStatus) private checkTransactionStatus;
    mapping(uint24 => mapping(address => bool)) public isVotedInOwnerStatus;
    mapping(uint24 => mapping(address => bool))
        public isVotedInTransactionStatus;

    constructor(address owner) {
        checkOwner[counter] = owner;
    }

    enum Status {
        None,
        Pending,
        Successful,
        Failed
    }

    struct OwnerStatus {
        address addressToAdd;
        uint8 noVotes;
        uint8 yesVotes;
        uint8 allVotesSoFar;
        uint256 neededVotes;
        Status status;
    }

    struct TransactionStatus {
        address coinsReceiver;
        uint256 coinsToTransfer;
        uint8 noVotes;
        uint8 yesVotes;
        uint8 allVotesSoFar;
        uint256 neededVotes;
        bool isTransfered;
        Status status;
    }

    receive() external payable {}

    modifier zeroAmount(uint256 _amount) {
        _zeroAmount(_amount);
        _;
    }

    modifier zeroAddress(address _receiver) {
        _zeroAddress(_receiver);
        _;
    }

    modifier isStatusLocked() {
        _isStatusLocked();
        _;
    }

    modifier existingAddress(address _newOwner) {
        _existingAddress(_newOwner);
        _;
    }

    modifier invalidOwnerStatusId(uint24 _ownerStatusId) {
        _invalidOwnerStatusId(_ownerStatusId);
        _;
    }

    modifier hasTxStatusEnded(uint24 _transactionId) {
        _hasTxStatusEnded(_transactionId);
        _;
    }

    modifier invalidTxStatusId(uint24 _transactionId) {
        _invalidTxStatusId(_transactionId);
        _;
    }

    modifier hasOwnerStatusEnded(uint24 _ownerStatusId) {
        _hasOwnerStatusEnded(_ownerStatusId);
        _;
    }

    modifier hasVotedOnOwnerStatus(uint24 _ownerStatusId) {
        _hasVotedOnOwnerStatus(_ownerStatusId);
        _;
    }

    modifier hasVotedOnTxStatus(uint24 _ownerStatusId) {
        _hasVotedOnTxStatus(_ownerStatusId);
        _;
    }

    modifier hasTransfered(uint24 _transactionId) {
        _hasTransfered(_transactionId);
        _;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function deposit() public payable {
        require(msg.value > 0, "Deposit zero amount!");
        address contractAddress = address(this);
        (bool sent, ) = contractAddress.call{value: msg.value}("");
        require(sent, "Native coin deposit failed!");
    }

    function transferCoinsToReceiver(
        uint24 _transactionId
    )
        external
        payable
        onlyOwner
        invalidTxStatusId(_transactionId)
        hasTransfered(_transactionId)
        nonReentrant
    {
        require(
            checkTransactionStatus[_transactionId].status == Status.Successful,
            "Status was not successful!"
        );
        address receiver = checkTransactionStatus[_transactionId].coinsReceiver;
        (bool sent, ) = receiver.call{
            value: checkTransactionStatus[_transactionId].coinsToTransfer
        }("");
        require(sent, "Native coin transfer failed!");
        checkTransactionStatus[_transactionId].isTransfered = true;
    }

    function helperTransactionStatus(uint24 _transactionId) internal {
        uint8 allVotes = checkTransactionStatus[_transactionId].allVotesSoFar;
        uint8 allYesVotes = checkTransactionStatus[_transactionId].yesVotes;
        uint8 allNoVotes = checkTransactionStatus[_transactionId].noVotes;
        uint256 needVotes = checkTransactionStatus[_transactionId].neededVotes;
        if (allYesVotes >= needVotes) {
            checkTransactionStatus[_transactionId].status = Status.Successful;
            lock = 0;
        } else if (allNoVotes >= needVotes || allVotes == counter) {
            checkTransactionStatus[_transactionId].status = Status.Failed;
            lock = 0;
        }
    }

    function helperAddingOwner(uint24 _ownerStatusId) internal {
        address newOwner = checkAddOwnerStatus[_ownerStatusId].addressToAdd;
        uint8 allYesVotes = checkAddOwnerStatus[_ownerStatusId].yesVotes;
        uint8 allNoVotes = checkAddOwnerStatus[_ownerStatusId].noVotes;
        uint8 allVotes = checkAddOwnerStatus[_ownerStatusId].allVotesSoFar;
        uint256 needVotes = checkAddOwnerStatus[_ownerStatusId].neededVotes;
        if (allYesVotes >= needVotes) {
            counter += 1;
            checkOwner[counter] = newOwner;
            checkAddOwnerStatus[_ownerStatusId].status = Status.Successful;
            lock = 0;
        } else if (allNoVotes >= needVotes || allVotes == counter) {
            checkAddOwnerStatus[_ownerStatusId].status = Status.Failed;
            lock = 0;
        }
    }

    function setTransactionStatus(
        uint256 _amount,
        address _receiver
    )
        external
        onlyOwner
        zeroAmount(_amount)
        zeroAddress(_receiver)
        isStatusLocked
    {
        transactionIds += 1;
        uint256 needVotes = moreThanHalf();
        checkTransactionStatus[transactionIds].coinsToTransfer = _amount;
        checkTransactionStatus[transactionIds].coinsReceiver = _receiver;
        checkTransactionStatus[transactionIds].neededVotes = needVotes;
        checkTransactionStatus[transactionIds].status = Status.Pending;
    }

    function setOwnerStatus(
        address _newOwner
    )
        external
        onlyOwner
        zeroAddress(_newOwner)
        isStatusLocked
        existingAddress(_newOwner)
    {
        ownerStatusIds += 1;
        uint256 needVotes = moreThanHalf();
        checkAddOwnerStatus[ownerStatusIds].addressToAdd = _newOwner;
        checkAddOwnerStatus[ownerStatusIds].neededVotes = needVotes;
        checkAddOwnerStatus[ownerStatusIds].status = Status.Pending;
        lock = 1;
    }

    function voteYesToTxStatus(
        uint24 _transactionId
    )
        external
        onlyOwner
        invalidTxStatusId(_transactionId)
        hasTxStatusEnded(_transactionId)
        hasVotedOnTxStatus(_transactionId)
    {
        checkTransactionStatus[_transactionId].yesVotes += 1;
        checkTransactionStatus[_transactionId].allVotesSoFar += 1;
        isVotedInTransactionStatus[_transactionId][msg.sender] = true;
        helperTransactionStatus(_transactionId);
    }

    function voteNoToTxStatus(
        uint24 _transactionId
    )
        external
        onlyOwner
        invalidTxStatusId(_transactionId)
        hasTxStatusEnded(_transactionId)
        hasVotedOnTxStatus(_transactionId)
    {
        checkTransactionStatus[_transactionId].noVotes += 1;
        checkTransactionStatus[_transactionId].allVotesSoFar += 1;
        isVotedInTransactionStatus[_transactionId][msg.sender] = true;
        helperTransactionStatus(_transactionId);
    }

    function voteYesToAddOwner(
        uint24 _ownerStatusId
    )
        external
        onlyOwner
        hasOwnerStatusEnded(_ownerStatusId)
        invalidOwnerStatusId(_ownerStatusId)
        hasVotedOnOwnerStatus(_ownerStatusId)
    {
        checkAddOwnerStatus[_ownerStatusId].yesVotes += 1;
        checkAddOwnerStatus[_ownerStatusId].allVotesSoFar += 1;
        isVotedInOwnerStatus[_ownerStatusId][msg.sender] = true;
        helperAddingOwner(_ownerStatusId);
    }

    function voteNoToAddOwner(
        uint24 _ownerStatusId
    )
        external
        onlyOwner
        hasOwnerStatusEnded(_ownerStatusId)
        invalidOwnerStatusId(_ownerStatusId)
        hasVotedOnOwnerStatus(_ownerStatusId)
    {
        checkAddOwnerStatus[_ownerStatusId].noVotes += 1;
        checkAddOwnerStatus[_ownerStatusId].allVotesSoFar += 1;
        isVotedInOwnerStatus[_ownerStatusId][msg.sender] = true;
        helperAddingOwner(_ownerStatusId);
    }

    function moreThanHalf() internal view returns (uint256) {
        return (counter / 2) + 1;
    }

    function getOwner(uint _index) public view returns (address) {
        return checkOwner[_index];
    }

    function getOwnerStatusInfo(
        uint24 _ownerStatusId
    ) public view returns (OwnerStatus memory) {
        return checkAddOwnerStatus[_ownerStatusId];
    }

    function getTxStatusInfo(
        uint24 _transactionId
    ) public view returns (TransactionStatus memory) {
        return checkTransactionStatus[_transactionId];
    }

    function _onlyOwner() private view returns (bool isValid) {
        isValid = false;
        for (uint i = 1; i < counter + 1; i++) {
            if (msg.sender == checkOwner[i]) {
                isValid = true;
            }
        }
        require(isValid == true, "Not owner!");
    }

    function _existingAddress(address newOwner) private view {
        for (uint i = 1; i < counter + 1; i++) {
            require(checkOwner[i] != newOwner, "Existing address!");
        }
    }

    function _hasVotedOnOwnerStatus(uint24 ownerStatusId) private view {
        require(
            isVotedInOwnerStatus[ownerStatusId][msg.sender] == false,
            "Already voted!"
        );
    }

    function _hasVotedOnTxStatus(uint24 _transactionId) private view {
        require(
            isVotedInTransactionStatus[_transactionId][msg.sender] == false,
            "Already voted!"
        );
    }

    function _invalidOwnerStatusId(uint24 ownerStatusId) private view {
        require(
            ownerStatusId != 0 && ownerStatusId <= ownerStatusIds,
            "Invalid status id!"
        );
    }

    function _invalidTxStatusId(uint24 transactionId) private view {
        require(
            transactionId != 0 && transactionId <= transactionIds,
            "Invalid transaction id!"
        );
    }

    function _hasOwnerStatusEnded(uint24 ownerStatusId) private view {
        require(
            checkAddOwnerStatus[ownerStatusId].status == Status.Pending,
            "This status has ended!"
        );
    }

    function _hasTxStatusEnded(uint24 _transactionId) private view {
        require(
            checkTransactionStatus[_transactionId].status == Status.Pending,
            "This status has ended!"
        );
    }

    function _isStatusLocked() private view {
        require(lock == 0, "Another status is pending!");
    }

    function _zeroAddress(address receiver) private pure {
        require(receiver != address(0), "Zero address!");
    }

    function _zeroAmount(uint256 amount) private pure {
        require(amount > 0, "Zero amount!");
    }

    function _hasTransfered(uint24 transactionId) private view {
        require(
            checkTransactionStatus[transactionId].isTransfered == false,
            "Already transfered!"
        );
    }
}
