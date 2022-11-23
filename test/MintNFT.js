const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
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

      // Fixtures can return anything you consider useful for your tests
      return { MintNFT, contract, owner, addr1, addr2, addr3, addr4, addr5 };
  }

  async function deployMerkleTreeFixture() {
    // Get the ContractFactory and Signers here.
    const MintNFT = await ethers.getContractFactory("MintNFT");
    const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // its deployed() method, which happens onces its transaction has been
    // mined.
    const contract = await MintNFT.deploy("nft mc", "mc", "testURI");

    await contract.deployed();

    contract.setPreMintEnabled1(true);
    contract.setPreMintEnabled2(true);
    contract.setEventMintEnabled(true);
    await contract.setMintPrice(5);
    await contract.setMaxMintCount(5);

    const values = [
      [addr1.address],
      [addr2.address]
    ];

    const tree = StandardMerkleTree.of(values, ["address"]);

    await contract.setMerkleRoot(tree.root);

    // Fixtures can return anything you consider useful for your tests
    return { MintNFT, contract, owner, tree, addr1, addr2, addr3, addr4, addr5 };
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

    it("payable", async function () {

      const { contract, owner, addr1 } = await loadFixture(deployTokenFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;

      const prevOwnerBalance = await owner.getBalance();
  
      const tx = await contract.connect(addr1).batchMintNFT(amount, { value: totalPrice });
      const receipt = await tx.wait();

      expect(await owner.getBalance()).to.eq(prevOwnerBalance.add(totalPrice));
      
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

  describe("preSaleMerkleTree1", function () {
    it("mint", async function () {

      const { contract, addr1, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      const tx = await contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      expect(await contract.balanceOf(addr1.address)).to.be.equal(amount);
      
    });
  
    it("added minting", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = 5;
      const amount = 3;
      const amount2 = 2;
      const totalPrice = price * amount;
      const totalPrice2 = price * amount2;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
  
      const tx = await contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      await contract.connect(addr1).preSaleMerkleTree1(proof, amount2, { value: totalPrice2 });
  
      expect(await contract.balanceOf(addr1.address)).to.be.equal(amount + amount2);
      
    });
  
    it("Exceeded Minting Count", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = 5;
      const amount = 3;
      const amount2 = 3;
      const totalPrice = price * amount;
      const totalPrice2 = price * amount2;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
  
      const tx = await contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      await expect(contract.connect(addr1).preSaleMerkleTree1(proof, amount2, { value: totalPrice2 })).to.be.revertedWith("The maximum number of minting has been exceeded.");
      
    });
  
    it("Not enough ether", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);

      const price = 3;
      const amount = 3;
      const totalPrice = price * amount;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await expect(contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice })).to.be.revertedWith("Not enough ether.");
      
    });
  
    it("pause", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(3);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await contract.setPreMintEnabled1(false);
  
      await expect(contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice })).to.be.revertedWith("The presale1 is not enabled.");
      
    });

    it("maxSupply", async function () {
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);

      contract.setMaxTotalSupply(5);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(4);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }

      await contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice });

      const addedAmount = BigNumber.from(2);
      const totalPrice2 = price.mul(addedAmount);

      await expect(contract.connect(addr1).preSaleMerkleTree1(proof, addedAmount, { value: totalPrice2 })).to.be.revertedWith("You can no longer mint NFT.");

    });

    it("The amount must be greater than 0", async function () {
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(0);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }

      await expect(contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice })).to.be.revertedWith("The amount must be greater than 0.");

    });

    it("allowlist", async function () {
      const { contract, addr1, addr2, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr2.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await expect(contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice })).to.be.revertedWith("MerkleProof is invalid.");

    });

    it("payable", async function () {
      const { contract, addr1, addr2, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      const prevOwnerBalance = await owner.getBalance();
      await contract.connect(addr1).preSaleMerkleTree1(proof, amount, { value: totalPrice });


      expect(await owner.getBalance()).to.eq(prevOwnerBalance.add(totalPrice));

    });
  });

  describe("preSaleMerkleTree2", function () {
    it("mint", async function () {

      const { contract, addr1, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      const tx = await contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      expect(await contract.balanceOf(addr1.address)).to.be.equal(amount);
      
    });
  
    it("added minting", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = 5;
      const amount = 3;
      const amount2 = 2;
      const totalPrice = price * amount;
      const totalPrice2 = price * amount2;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
  
      const tx = await contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      await contract.connect(addr1).preSaleMerkleTree2(proof, amount2, { value: totalPrice2 });
  
      expect(await contract.balanceOf(addr1.address)).to.be.equal(amount + amount2);
      
    });
  
    it("Exceeded Minting Count", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = 5;
      const amount = 3;
      const amount2 = 3;
      const totalPrice = price * amount;
      const totalPrice2 = price * amount2;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
  
      const tx = await contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      await expect(contract.connect(addr1).preSaleMerkleTree2(proof, amount2, { value: totalPrice2 })).to.be.revertedWith("The maximum number of minting has been exceeded.");
      
    });
  
    it("Not enough ether", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);

      const price = 3;
      const amount = 3;
      const totalPrice = price * amount;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await expect(contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice })).to.be.revertedWith("Not enough ether.");
      
    });
  
    it("pause", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(3);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await contract.setPreMintEnabled2(false);
  
      await expect(contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice })).to.be.revertedWith("The presale2 is not enabled.");
      
    });

    it("maxSupply", async function () {
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);

      contract.setMaxTotalSupply(5);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(4);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }

      await contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice });

      const addedAmount = BigNumber.from(2);
      const totalPrice2 = price.mul(addedAmount);

      await expect(contract.connect(addr1).preSaleMerkleTree2(proof, addedAmount, { value: totalPrice2 })).to.be.revertedWith("You can no longer mint NFT.");

    });

    it("The amount must be greater than 0", async function () {
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(0);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }

      await expect(contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice })).to.be.revertedWith("The amount must be greater than 0.");

    });

    it("allowlist", async function () {
      const { contract, addr1, addr2, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr2.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await expect(contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice })).to.be.revertedWith("MerkleProof is invalid.");

    });

    it("payable", async function () {
      const { contract, addr1, addr2, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      const prevOwnerBalance = await owner.getBalance();
      await contract.connect(addr1).preSaleMerkleTree2(proof, amount, { value: totalPrice });


      expect(await owner.getBalance()).to.eq(prevOwnerBalance.add(totalPrice));

    });
  });

  describe("event Mint", function () {
    it("mint", async function () {

      const { contract, addr1, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      const tx = await contract.connect(addr1).eventMint(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      expect(await contract.balanceOf(addr1.address)).to.be.equal(amount);
      
    });
  
    it("added minting", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = 5;
      const amount = 3;
      const amount2 = 2;
      const totalPrice = price * amount;
      const totalPrice2 = price * amount2;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
  
      const tx = await contract.connect(addr1).eventMint(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      await contract.connect(addr1).eventMint(proof, amount2, { value: totalPrice2 });
  
      expect(await contract.balanceOf(addr1.address)).to.be.equal(amount + amount2);
      
    });
  
    it("Exceeded Minting Count", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = 5;
      const amount = 3;
      const amount2 = 3;
      const totalPrice = price * amount;
      const totalPrice2 = price * amount2;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
  
      const tx = await contract.connect(addr1).eventMint(proof, amount, { value: totalPrice });
  
      await tx.wait();
  
      await expect(contract.connect(addr1).eventMint(proof, amount2, { value: totalPrice2 })).to.be.revertedWith("The maximum number of minting has been exceeded.");
      
    });
  
    it("Not enough ether", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);

      const price = 3;
      const amount = 3;
      const totalPrice = price * amount;

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await expect(contract.connect(addr1).eventMint(proof, amount, { value: totalPrice })).to.be.revertedWith("Not enough ether.");
      
    });
  
    it("pause", async function () {
  
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(3);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await contract.setEventMintEnabled(false);
  
      await expect(contract.connect(addr1).eventMint(proof, amount, { value: totalPrice })).to.be.revertedWith("The eventSale is not enabled.");
      
    });

    it("maxSupply", async function () {
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);

      contract.setMaxTotalSupply(5);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(4);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }

      await contract.connect(addr1).eventMint(proof, amount, { value: totalPrice });

      const addedAmount = BigNumber.from(2);
      const totalPrice2 = price.mul(addedAmount);

      await expect(contract.connect(addr1).eventMint(proof, addedAmount, { value: totalPrice2 })).to.be.revertedWith("You can no longer mint NFT.");

    });

    it("The amount must be greater than 0", async function () {
      const { contract, owner, addr1, tree } = await loadFixture(deployMerkleTreeFixture);
      
      const price = BigNumber.from(5);
      const amount = BigNumber.from(0);
      const totalPrice = price.mul(amount);

      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }

      await expect(contract.connect(addr1).eventMint(proof, amount, { value: totalPrice })).to.be.revertedWith("The amount must be greater than 0.");

    });

    it("allowlist", async function () {
      const { contract, addr1, addr2, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr2.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      await expect(contract.connect(addr1).eventMint(proof, amount, { value: totalPrice })).to.be.revertedWith("MerkleProof is invalid.");

    });

    it("payable", async function () {
      const { contract, addr1, addr2, owner, tree } = await loadFixture(deployMerkleTreeFixture);
  
      const price = 5;
      const amount = 3;
      const totalPrice = price * amount;
      
      let proof;

      for (const [i, v] of tree.entries()) {
        if (v[0] === addr1.address) {

          proof = tree.getProof(i);

          // console.log('Value:', v);
          // console.log('Proof:', proof);
          // console.log('Root: ', tree.root);
        }
      }
  
      const prevOwnerBalance = await owner.getBalance();
      await contract.connect(addr1).eventMint(proof, amount, { value: totalPrice });


      expect(await owner.getBalance()).to.eq(prevOwnerBalance.add(totalPrice));

    });
  });

});