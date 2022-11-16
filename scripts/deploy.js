async function main() {

    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const MintNFT = await ethers.getContractFactory("MintNFT");
    const mintNFT = await MintNFT.deploy(
        "MC name", 
        "MC", 
        "https://gateway.pinata.cloud/ipfs/QmPz6P5aPHiCTuu1guysuxtBCb1eY57vuF69Kv8zcKCxhf"
        );
  
    console.log("mintNFT address:", mintNFT.address);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });