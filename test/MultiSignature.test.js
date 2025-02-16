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
