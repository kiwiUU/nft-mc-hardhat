const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("MintNFT contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const MintNFT = await ethers.getContractFactory("MintNFT");

    const hardhatMintNFT = await MintNFT.deploy("nft mc", "mc", "testURI");

    const ownerBalance = await hardhatMintNFT.balanceOf(owner.address);
    expect(await hardhatMintNFT.totalSupply()).to.equal(ownerBalance);
  });

  // it("test", async function () {

  //   const [owner, addr1, addr2] = await ethers.getSigners();
  //   const MintNFT = await ethers.getContractFactory("MintNFT");
  //   const contract = await MintNFT.deploy("nft mc", "mc", "testURI");

  //   const price = "5";

  //   const tx = await contract.mintNFT({ value: price });

  //   console.log("tx: ", tx);

  //   const receipt = await tx.wait();

  //   console.log("receipt: ", receipt.status);

  //   expect(1).to.equal(1);
    
  // });

  it("test2", async function () {

    const [owner, addr1, addr2] = await ethers.getSigners();
    const MintNFT = await ethers.getContractFactory("MintNFT");
    const contract = await MintNFT.deploy("nft mc", "mc", "testURI");

    const mintPrice = '10';
    const price = ethers.utils.parseEther(mintPrice);

    console.log("price: ", price);

    const tx = await contract.mintNFT({ value: price });

    console.log("tx: ", tx);

    const receipt = await tx.wait();

    console.log("receipt: ", receipt);

    expect(1).to.equal(1);
    
  });

});