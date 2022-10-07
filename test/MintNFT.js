const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const { BigNumber } = require("ethers");

describe("MintNFT contract", function () {

    async function deployTokenFixture() {
    // Get the ContractFactory and Signers here.
    const MintNFT = await ethers.getContractFactory("MintNFT");
    const [owner, addr1, addr2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // its deployed() method, which happens onces its transaction has been
    // mined.
    const contract = await MintNFT.deploy("nft mc", "mc", "testURI");

    await contract.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { MintNFT, contract, owner, addr1, addr2 };
  }

  it("batchMintNFT1", async function () {

    const { contract, owner } = await loadFixture(deployTokenFixture);
    
    const price = 5;
    const amount = 3;
    const totalPrice = price * amount;

    const tx = await contract.batchMintNFT(amount, { value: totalPrice });
    //console.log("tx: ", tx);

    const receipt = await tx.wait();
    //console.log("receipt: ", receipt);

    const balance = await contract.balanceOf(owner.address);
    console.log("balance: ", balance);

    expect(await contract.balanceOf(owner.address)).to.be.equal(amount);
    
  });

  it("batchMintNFT2", async function () {

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

  it("batchMintNFT3", async function () {

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

  it("batchMintNFT4", async function () {

    const { contract, owner } = await loadFixture(deployTokenFixture);

    const amount = 3;
    const price = 10;

    await expect(contract.batchMintNFT(amount, { value: price })).to.be.revertedWith("Not enough ether.");
    
  });

  it("batchMintNFT5", async function () {

    const { contract, owner } = await loadFixture(deployTokenFixture);
    
    const price = BigNumber.from(5);
    const amount = BigNumber.from(3);
    const totalPrice = price.mul(amount);
    
    console.log("totalPrice: ", totalPrice);

    const tx = await contract.batchMintNFT(amount, { value: totalPrice });
    //console.log("tx: ", tx);

    const receipt = await tx.wait();
    //console.log("receipt: ", receipt);

    const balance = await contract.balanceOf(owner.address);
    console.log("balance: ", balance);

    expect(await contract.balanceOf(owner.address)).to.be.equal(amount);
    
  });

});