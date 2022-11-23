// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MintNFT is ERC721Enumerable, Ownable {

    string public notRevealedURI;
    string public metadataURI;
    bool public isRevealed;

    uint public maxTotalSupply = 1000;
    uint public mintPrice = 5;
    uint public maxMintCount = 3;
    
    // merkleRoot
    bytes32 public merkleRoot;

    // presale phase 1
    mapping(address => uint) public preMintlistAddress1;
    bool public preMintEnabled1 = false;

    // presale phase 2
    mapping(address => uint) public preMintlistAddress2;
    bool public preMintEnabled2 = false;

    // public sale
    mapping(address => uint) public mintlistAddress;
    bool public mintEnabled = false;

    constructor(string memory _name, string memory _symbol, string memory _notRevealedURI) ERC721(_name, _symbol) {
        notRevealedURI = _notRevealedURI;
    }

    modifier costs(uint price) {
        require(msg.value >= price, "Not enough ether.");
        _;
    }

    modifier maxSupply(uint _amount) {
        require(totalSupply() + _amount <= maxTotalSupply, "You can no longer mint NFT.");
        _;
    }

    function tokenURI(uint _tokenId) override public view returns (string memory) {
        if (isRevealed == false) {
            return notRevealedURI;
        } 

        return string(abi.encodePacked(metadataURI, '/', Strings.toString(_tokenId), '.json'));
    }

    function mintNFTOwner() public onlyOwner {
        uint tokenId = totalSupply() + 1;
        _mint(msg.sender, tokenId);
    }

    function batchMintNFTOwner(uint _amount) public onlyOwner {
        for (uint i = 0; i < _amount; i++) {
            mintNFTOwner();
        }
    }

    // merkle tree phase 1
    function preSaleMerkleTree1(bytes32[] calldata proof, uint _amount) public payable costs(mintPrice * _amount) maxSupply(_amount) {
        require(preMintEnabled1, "The presale1 is not enabled.");
        require(_amount > 0, "The amount must be greater than 0.");
        require(preMintlistAddress1[msg.sender] + _amount <= maxMintCount, "The maximum number of minting has been exceeded.");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));

        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert("MerkleProof is invalid.");

        for (uint i = 0; i < _amount; i++) {
            uint tokenId = totalSupply() + 1;
            _mint(msg.sender, tokenId);
        }

        preMintlistAddress1[msg.sender] = preMintlistAddress1[msg.sender] + _amount;

        payable(owner()).transfer(msg.value);

    }

    // merkle tree phase 2
    function preSaleMerkleTree2(bytes32[] calldata proof, uint _amount) public payable costs(mintPrice * _amount) maxSupply(_amount) {
        require(preMintEnabled2, "The presale2 is not enabled.");
        require(_amount > 0, "The amount must be greater than 0.");
        require(preMintlistAddress2[msg.sender] + _amount <= maxMintCount, "The maximum number of minting has been exceeded.");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));

        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert("MerkleProof is invalid.");

        for (uint i = 0; i < _amount; i++) {
            uint tokenId = totalSupply() + 1;
            _mint(msg.sender, tokenId);
        }

        preMintlistAddress2[msg.sender] = preMintlistAddress2[msg.sender] + _amount;

        payable(owner()).transfer(msg.value);

    }

    // public sale
    function batchMintNFT(uint _amount) public payable costs(mintPrice * _amount) maxSupply(_amount) {
        require(mintEnabled, "The public sale is not enabled.");
        require(_amount > 0, "The amount must be greater than 0.");
        require(mintlistAddress[msg.sender] + _amount <= maxMintCount, "The maximum number of minting has been exceeded.");

        for (uint i = 0; i < _amount; i++) {
            uint tokenId = totalSupply() + 1;
            _mint(msg.sender, tokenId);
        }

        mintlistAddress[msg.sender] = mintlistAddress[msg.sender] + _amount;
        
        payable(owner()).transfer(msg.value);
    }

    // Airdrop NFTs
    function airdropNfts(address[] calldata wAddresses) public onlyOwner maxSupply(wAddresses.length) {
        for (uint i = 0; i < wAddresses.length; i++) {
            uint tokenId = totalSupply() + 1;
            _mint(wAddresses[i], tokenId);    
        }
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedURI = _notRevealedURI;
    }

    function setTokenURI(string memory _metadataURI) public onlyOwner {
        metadataURI = _metadataURI;
    }

    function setIsRevealed(bool b) public onlyOwner {
        isRevealed = b;
    }

    function setMaxTotalSupply(uint _maxTotalSupply) public onlyOwner {
        maxTotalSupply = _maxTotalSupply;
    }

    function setMintPrice(uint _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function setMaxMintCount(uint _maxMintCount) public onlyOwner {
        maxMintCount = _maxMintCount;
    }

    function setPreMintEnabled1(bool _preMintEnabled1) public onlyOwner {
        preMintEnabled1 = _preMintEnabled1;
    }

    function setPreMintEnabled2(bool _preMintEnabled2) public onlyOwner {
        preMintEnabled2 = _preMintEnabled2;
    }

    function setMintEnabled(bool _mintEnabled) public onlyOwner {
        mintEnabled = _mintEnabled;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }
}