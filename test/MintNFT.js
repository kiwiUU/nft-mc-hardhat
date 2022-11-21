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

    contract.setMintEnabled(true);
    await contract.setMintPrice(5);
    await contract.setMaxMintCount(5);

    await contract.setSigner("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");

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
  
      await contract.setMintEnabled(false);
  
      await expect(contract.batchMintNFT(amount, { value: totalPrice })).to.be.revertedWith("The public sale is not enabled.");
      
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

    it("The amount must be greater than 0", async function () {
      const { contract, owner } = await loadFixture(deployTokenFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(0);

      await expect(contract.batchMintNFT(amount, { value: price })).to.be.revertedWith("The amount must be greater than 0.");

    });
  });

  describe("preSaleOffChain1", function () {
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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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

      contract.setPreMintEnabled1(true);

      let txn;
      txn = await contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount,{ value: totalPrice });
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
      
      const price = BigNumber.from(3);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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

      contract.setPreMintEnabled1(true);
      await expect(contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount, { value: totalPrice })).to.be.revertedWith("Not enough ether.");

    });

    it("The maximum number of minting has been exceeded.", async function () {
      
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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(3);
      const totalPrice = price.mul(amount);

      const amount2 = BigNumber.from(3);
      const totalPrice2 = price.mul(amount2);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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

      contract.setPreMintEnabled1(true);

      let txn;
      txn = await contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount, { value: totalPrice });
      await txn.wait();
      //console.log("NFTs minted successfully!");

      await expect(contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount2, { value: totalPrice2 })).to.be.revertedWith("The maximum number of minting has been exceeded.");

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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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
      
      await expect(contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount, { value: totalPrice })).to.be.revertedWith("The presale1 is not enabled.");

    });

    it("You can no longer mint NFT.", async function () {

      const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployTokenFixture);

      contract.setPreMintEnabled1(true);
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
      const selectedAddress = addr3.address;

      // Define wallet that will be used to sign messages
      const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'; // owner.address
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");

      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);

      const amount2 = BigNumber.from(3);
      const totalPrice2 = price.mul(amount2);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
        //console.log("Message Hash: ", messageHash);

        // Sign the message hash
        let messageBytes = ethers.utils.arrayify(messageHash);
        signature = await signer.signMessage(messageBytes);
        //console.log("Signature: ", signature, "\n");
      }

      contract.setPreMintEnabled1(true);

      let txn;
      txn = await contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount, { value: totalPrice });
      await txn.wait();

      await expect(contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount2, { value: totalPrice2 })).to.be.revertedWith("You can no longer mint NFT.");

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
      const walletAddress = '0xfe1E7Dc29512C1F351753753D7c9F2181dbCb465';
      const privateKey = '26903ab37094c48eb3b620f0c424f94ee54953891b8b4c840997bea2c9b2df2e';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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

      contract.setPreMintEnabled1(true);

      await expect(contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount, { value: totalPrice })).to.be.revertedWith("Address is not allowlisted.");

    });

    it("The sender is not allowlisted.", async function () {

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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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

      contract.setPreMintEnabled1(true);

      await expect(contract.connect(addr1).preSaleOffChain1(messageHash, signature, amount, { value: totalPrice })).to.be.revertedWith("The sender is not allowlisted.");

    });

    it("The amount must be greater than 0.", async function () {

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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(0);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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

      contract.setPreMintEnabled1(true);

      await expect(contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount, { value: price })).to.be.revertedWith("The amount must be greater than 0.");


    });

    it("signer changed.", async function () {

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
      const walletAddress = '0xfe1E7Dc29512C1F351753753D7c9F2181dbCb465';
      const privateKey = '26903ab37094c48eb3b620f0c424f94ee54953891b8b4c840997bea2c9b2df2e';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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

      contract.setPreMintEnabled1(true);
      contract.setSigner(walletAddress);

      let txn;
      txn = await contract.connect(addr3).preSaleOffChain1(messageHash, signature, amount,{ value: totalPrice });
      await txn.wait();
      //console.log("NFTs minted successfully!");

      expect(await contract.balanceOf(addr3.address)).to.be.equal(amount);

    });
  });

  describe("preSaleOffChain2", function () {
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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);
  
      let messageHash, signature;
  
      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");
  
        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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
  
      contract.setPreMintEnabled2(true);
  
      let txn;
      txn = await contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount,{ value: totalPrice });
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
      
      const price = BigNumber.from(3);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);
  
      let messageHash, signature;
  
      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");
  
        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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
  
      contract.setPreMintEnabled2(true);
      await expect(contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount, { value: totalPrice })).to.be.revertedWith("Not enough ether.");
  
    });
  
    it("The maximum number of minting has been exceeded.", async function () {
      
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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(3);
      const totalPrice = price.mul(amount);
  
      const amount2 = BigNumber.from(3);
      const totalPrice2 = price.mul(amount2);
  
      let messageHash, signature;
  
      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");
  
        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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
  
      contract.setPreMintEnabled2(true);
  
      let txn;
      txn = await contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount, { value: totalPrice });
      await txn.wait();
      //console.log("NFTs minted successfully!");
  
      await expect(contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount2, { value: totalPrice2 })).to.be.revertedWith("The maximum number of minting has been exceeded.");
  
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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);
  
      let messageHash, signature;
  
      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");
  
        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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
      
      await expect(contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount, { value: totalPrice })).to.be.revertedWith("The presale2 is not enabled.");
  
    });
  
    it("You can no longer mint NFT.", async function () {
  
      const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployTokenFixture);
  
      contract.setPreMintEnabled2(true);
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
      const selectedAddress = addr3.address;
  
      // Define wallet that will be used to sign messages
      const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'; // owner.address
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
  
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);
  
      const amount2 = BigNumber.from(3);
      const totalPrice2 = price.mul(amount2);
  
      let messageHash, signature;
  
      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");
  
        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
        //console.log("Message Hash: ", messageHash);
  
        // Sign the message hash
        let messageBytes = ethers.utils.arrayify(messageHash);
        signature = await signer.signMessage(messageBytes);
        //console.log("Signature: ", signature, "\n");
      }
  
      contract.setPreMintEnabled2(true);
  
      let txn;
      txn = await contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount, { value: totalPrice });
      await txn.wait();
  
      await expect(contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount2, { value: totalPrice2 })).to.be.revertedWith("You can no longer mint NFT.");
  
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
      const walletAddress = '0xfe1E7Dc29512C1F351753753D7c9F2181dbCb465';
      const privateKey = '26903ab37094c48eb3b620f0c424f94ee54953891b8b4c840997bea2c9b2df2e';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);
  
      let messageHash, signature;
  
      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");
  
        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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
  
      contract.setPreMintEnabled2(true);
  
      await expect(contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount, { value: totalPrice })).to.be.revertedWith("Address is not allowlisted.");
  
    });
  
    it("The sender is not allowlisted.", async function () {
  
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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);
  
      let messageHash, signature;
  
      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");
  
        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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
  
      contract.setPreMintEnabled2(true);
  
      await expect(contract.connect(addr1).preSaleOffChain2(messageHash, signature, amount, { value: totalPrice })).to.be.revertedWith("The sender is not allowlisted.");
  
    });
  
    it("The amount must be greater than 0.", async function () {
  
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
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(0);
  
      let messageHash, signature;
  
      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");
  
        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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
  
      contract.setPreMintEnabled2(true);
  
      await expect(contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount, { value: price })).to.be.revertedWith("The amount must be greater than 0.");
  
  
    });

    it("signer changed.", async function () {

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
      const walletAddress = '0xfe1E7Dc29512C1F351753753D7c9F2181dbCb465';
      const privateKey = '26903ab37094c48eb3b620f0c424f94ee54953891b8b4c840997bea2c9b2df2e';
      const signer = new ethers.Wallet(privateKey);
      //console.log("Wallet used to sign messages: ", signer.address, "\n");
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(2);
      const totalPrice = price.mul(amount);

      let messageHash, signature;

      // Check if selected address is in allowlist
      // If yes, sign the wallet's address
      if (allowlistedAddresses.includes(selectedAddress)) {
        //console.log("Address is allowlisted! Minting should be possible.");

        // Compute message hash
        messageHash = ethers.utils.keccak256(selectedAddress);
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

      contract.setPreMintEnabled2(true);
      contract.setSigner(walletAddress);

      let txn;
      txn = await contract.connect(addr3).preSaleOffChain2(messageHash, signature, amount,{ value: totalPrice });
      await txn.wait();
      //console.log("NFTs minted successfully!");

      expect(await contract.balanceOf(addr3.address)).to.be.equal(amount);

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