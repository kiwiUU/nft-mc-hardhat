const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const { BigNumber } = require("ethers");

describe("MintNFT contract", function () {

    async function deployTokenFixture() {
    // Get the ContractFactory and Signers here.
    const MintNFT = await ethers.getContractFactory("MintNFT");
    const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // its deployed() method, which happens onces its transaction has been
    // mined.
    const contract = await MintNFT.deploy("nft mc", "mc", "testURI");

    await contract.deployed();

    contract.setPaused(false);
    await contract.setMintPrice(5);
    await contract.setPreMintPrice(3);
    await contract.setMaxMintCount(5);

    // Fixtures can return anything you consider useful for your tests
    return { MintNFT, contract, owner, addr1, addr2, addr3, addr4, addr5 };
  }

  describe("batchMintNFT", function () {
    it("batch mint", async function () {

      const { contract, owner } = await loadFixture(deployTokenFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
  
      const tx = await contract.batchMintNFT(amount, { value: totalPrice });
      //console.log("tx: ", tx);
  
      const receipt = await tx.wait();
      //console.log("receipt: ", receipt);
  
      const balance = await contract.balanceOf(owner.address);
  
      expect(await contract.balanceOf(owner.address)).to.be.equal(amount);
      
    });
  
    it("added minting", async function () {
  
      const { contract, owner } = await loadFixture(deployTokenFixture);
      
      const price = 5;
      const amount = 3;
      const amount2 = 2;
      const totalPrice = price * amount;
      const totalPrice2 = price * amount2;
  
  
      const tx = await contract.batchMintNFT(amount, { value: totalPrice });
  
      await tx.wait();
  
      await contract.batchMintNFT(amount2, { value: totalPrice2 });
  
      expect(await contract.balanceOf(owner.address)).to.be.equal(amount + amount2);
      
    });
  
    it("Exceeded Minting Count", async function () {
  
      const { contract, owner } = await loadFixture(deployTokenFixture);
      
      const price = 5;
      const amount = 3;
      const amount2 = 3;
      const totalPrice = price * amount;
      const totalPrice2 = price * amount2;
  
      const tx = await contract.batchMintNFT(amount, { value: totalPrice });
  
      await tx.wait();
  
      await expect(contract.batchMintNFT(amount2, { value: totalPrice2 })).to.be.revertedWith("The maximum number of minting has been exceeded.");
      
    });
  
    it("Not enough ether", async function () {
  
      const { contract, owner } = await loadFixture(deployTokenFixture);
  
      const amount = 3;
      const price = 10;
  
      await expect(contract.batchMintNFT(amount, { value: price })).to.be.revertedWith("Not enough ether.");
      
    });
  
    it("BigNumber", async function () {
  
      const { contract, owner } = await loadFixture(deployTokenFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(3);
      const totalPrice = price.mul(amount);
  
      const tx = await contract.batchMintNFT(amount, { value: totalPrice });
      //console.log("tx: ", tx);
  
      const receipt = await tx.wait();
      //console.log("receipt: ", receipt);
  
      expect(await contract.balanceOf(owner.address)).to.be.equal(amount);
      
    });
  
    it("pause", async function () {
  
      const { contract, owner } = await loadFixture(deployTokenFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(3);
      const totalPrice = price.mul(amount);
  
      await contract.setPaused(true);
  
      await expect(contract.batchMintNFT(amount, { value: totalPrice })).to.be.revertedWith("The contract is paused.");
      
    });

    it("maxSupply", async function () {
      const { contract, owner } = await loadFixture(deployTokenFixture);

      contract.setMaxTotalSupply(5);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(4);
      const totalPrice = price.mul(amount);

      await contract.batchMintNFT(amount, { value: totalPrice });

      const addedAmount = BigNumber.from(2);
      const totalPrice2 = price.mul(addedAmount);

      await expect(contract.batchMintNFT(addedAmount, { value: totalPrice2 })).to.be.revertedWith("You can no longer mint NFT.");

    });
  });

  describe("preSaleOffChain", function () {
    it("preSale", async function () {

      const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployTokenFixture);
      
      // Define a list of allowlisted wallets
      const allowlistedAddresses = [
        addr1.address,
        addr2.address,
        addr3.address,
        addr4.address,
        addr5.address
      ];

      // Select an allowlisted address to mint NFT
      const selectedAddress = addr3.address;

      // Define wallet that will be used to sign messages
      const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(3);
      const amount = BigNumber.from(1);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.id(selectedAddress);
        //console.log("Message Hash: ", messageHash);

        // Sign the message hash
        let messageBytes = ethers.utils.arrayify(messageHash);
        signature = await signer.signMessage(messageBytes);
        //console.log("Signature: ", signature, "\n");
      }

      

      //console.log("Contract deployed to: ", contract.address);
      //console.log("Contract deployed by (Owner/Signing Wallet): ", owner.address, "\n");

      recover = await contract.recoverSigner(messageHash, signature);
      //console.log("Message was signed by: ", recover.toString());

      contract.setWhitelistMintEnabled(true);

      let txn;
      txn = await contract.connect(addr3).preSaleOffChain(messageHash, signature, { value: price });
      await txn.wait();
      //console.log("NFTs minted successfully!");

      expect(await contract.balanceOf(addr3.address)).to.be.equal(amount);

    });

    it("Not enough ether.", async function () {
      
      const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployTokenFixture);
      
      // Define a list of allowlisted wallets
      const allowlistedAddresses = [
        addr1.address,
        addr2.address,
        addr3.address,
        addr4.address,
        addr5.address
      ];

      // Select an allowlisted address to mint NFT
      const selectedAddress = addr3.address;

      // Define wallet that will be used to sign messages
      const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(2);
      const amount = BigNumber.from(1);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.id(selectedAddress);
        //console.log("Message Hash: ", messageHash);

        // Sign the message hash
        let messageBytes = ethers.utils.arrayify(messageHash);
        signature = await signer.signMessage(messageBytes);
        //console.log("Signature: ", signature, "\n");
      }

      //console.log("Contract deployed to: ", contract.address);
      //console.log("Contract deployed by (Owner/Signing Wallet): ", owner.address, "\n");

      recover = await contract.recoverSigner(messageHash, signature);
      //console.log("Message was signed by: ", recover.toString());

      contract.setWhitelistMintEnabled(true);
      await expect(contract.connect(addr3).preSaleOffChain(messageHash, signature, { value: price })).to.be.revertedWith("Not enough ether.");

    });

    it("Signature has already been used.", async function () {
      
      const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployTokenFixture);
      
      // Define a list of allowlisted wallets
      const allowlistedAddresses = [
        addr1.address,
        addr2.address,
        addr3.address,
        addr4.address,
        addr5.address
      ];

      // Select an allowlisted address to mint NFT
      const selectedAddress = addr3.address;

      // Define wallet that will be used to sign messages
      const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(3);
      const amount = BigNumber.from(1);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.id(selectedAddress);
        //console.log("Message Hash: ", messageHash);

        // Sign the message hash
        let messageBytes = ethers.utils.arrayify(messageHash);
        signature = await signer.signMessage(messageBytes);
        //console.log("Signature: ", signature, "\n");
      }

      //console.log("Contract deployed to: ", contract.address);
      //console.log("Contract deployed by (Owner/Signing Wallet): ", owner.address, "\n");

      recover = await contract.recoverSigner(messageHash, signature);
      //console.log("Message was signed by: ", recover.toString());

      contract.setWhitelistMintEnabled(true);

      let txn;
      txn = await contract.connect(addr3).preSaleOffChain(messageHash, signature, { value: price });
      await txn.wait();
      //console.log("NFTs minted successfully!");

      await expect(contract.connect(addr3).preSaleOffChain(messageHash, signature, { value: price })).to.be.revertedWith("Signature has already been used.");

    });

    it("The presale is not enabled.", async function () {
      
      const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployTokenFixture);
      
      // Define a list of allowlisted wallets
      const allowlistedAddresses = [
        addr1.address,
        addr2.address,
        addr3.address,
        addr4.address,
        addr5.address
      ];

      // Select an allowlisted address to mint NFT
      const selectedAddress = addr3.address;

      // Define wallet that will be used to sign messages
      const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(3);
      const amount = BigNumber.from(1);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.id(selectedAddress);
        //console.log("Message Hash: ", messageHash);

        // Sign the message hash
        let messageBytes = ethers.utils.arrayify(messageHash);
        signature = await signer.signMessage(messageBytes);
        //console.log("Signature: ", signature, "\n");
      }

      //console.log("Contract deployed to: ", contract.address);
      //console.log("Contract deployed by (Owner/Signing Wallet): ", owner.address, "\n");

      recover = await contract.recoverSigner(messageHash, signature);
      //console.log("Message was signed by: ", recover.toString());
      
      await expect(contract.connect(addr3).preSaleOffChain(messageHash, signature, { value: price })).to.be.revertedWith("The presale is not enabled.");

    });

    it("You can no longer mint NFT.", async function () {

      const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployTokenFixture);

      contract.setWhitelistMintEnabled(true);
      contract.setMaxTotalSupply(3);
      
      // Define a list of allowlisted wallets
      const allowlistedAddresses = [
        addr1.address,
        addr2.address,
        addr3.address,
        addr4.address,
        addr5.address
      ];

      // Select an allowlisted address to mint NFT
      const selectedAddresses = [
        addr1,
        addr2,
        addr3,
        addr4
      ];

      // Define wallet that will be used to sign messages
      const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'; // owner.address
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");

      const price = BigNumber.from(3);
      const amount = BigNumber.from(1);

      for (let index = 0; index < selectedAddresses.length; index++) {
        let messageHash, signature;

        // Check if selected address is in allowlist
        // If yes, sign the wallet's address
        if (allowlistedAddresses.includes(selectedAddresses[index].address)) {
          //console.log("Address is allowlisted! Minting should be possible.");

          // Compute message hash
          messageHash = ethers.utils.id(selectedAddresses[index].address);
          //console.log("Message Hash: ", messageHash);

          // Sign the message hash
          let messageBytes = ethers.utils.arrayify(messageHash);
          signature = await signer.signMessage(messageBytes);
          //console.log("Signature: ", signature, "\n");
        }

        if (index == 3) {
          await expect(contract.connect(selectedAddresses[index]).preSaleOffChain(messageHash, signature, { value: price })).to.be.revertedWith("You can no longer mint NFT.");

        } else {
          let txn;
          txn = await contract.connect(selectedAddresses[index]).preSaleOffChain(messageHash, signature, { value: price });
          await txn.wait();
          //console.log("NFTs minted successfully!");

          expect(await contract.connect(selectedAddresses[index]).balanceOf(selectedAddresses[index].address)).to.be.equal(amount);
        }
      }

    });

    it("Address is not allowlisted.", async function () {

      const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployTokenFixture);
      
      // Define a list of allowlisted wallets
      const allowlistedAddresses = [
        addr1.address,
        addr2.address,
        addr3.address,
        addr4.address,
        addr5.address
      ];

      // Select an allowlisted address to mint NFT
      const selectedAddress = addr3.address;

      // Define wallet that will be used to sign messages
      const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      const privateKey = '26903ab37094c48eb3b620f0c424f94ee54953891b8b4c840997bea2c9b2df2e';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(3);
      const amount = BigNumber.from(1);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.id(selectedAddress);
        //console.log("Message Hash: ", messageHash);

        // Sign the message hash
        let messageBytes = ethers.utils.arrayify(messageHash);
        signature = await signer.signMessage(messageBytes);
        //console.log("Signature: ", signature, "\n");
      }

      

      //console.log("Contract deployed to: ", contract.address);
      //console.log("Contract deployed by (Owner/Signing Wallet): ", owner.address, "\n");

      recover = await contract.recoverSigner(messageHash, signature);
      //console.log("Message was signed by: ", recover.toString());

      contract.setWhitelistMintEnabled(true);

      await expect(contract.connect(addr3).preSaleOffChain(messageHash, signature, { value: price })).to.be.revertedWith("Address is not allowlisted.");

    });
  });

  describe("airdropNfts", function () {
    it("airdropNfts", async function () {
      const { contract, owner, addr1, addr2, addr3 } = await loadFixture(deployTokenFixture);

      // Define a list of allowlisted wallets
      const airDropAddresses = [
        addr1.address,
        addr2.address,
      ];

      contract.airdropNfts(airDropAddresses);

      expect(await contract.balanceOf(addr1.address)).to.be.equal(1);
      expect(await contract.balanceOf(addr2.address)).to.be.equal(1);
      expect(await contract.balanceOf(addr3.address)).to.be.equal(0);

    });
  });

});