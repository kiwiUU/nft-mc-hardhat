const { expect } = require("chai");

describe("MintNFT contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const MintNFT = await ethers.getContractFactory("MintNFT");

    const hardhatMintNFT = await MintNFT.deploy("nft mc", "mc", "testURI");

    const ownerBalance = await hardhatMintNFT.balanceOf(owner.address);
    expect(await hardhatMintNFT.totalSupply()).to.equal(ownerBalance);
  });

});