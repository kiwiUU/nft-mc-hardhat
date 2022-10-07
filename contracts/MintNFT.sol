// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MintNFT is ERC721Enumerable, Ownable {

    string public notRevealedURI;
    string public metadataURI;

    bool public isRevealed;

    uint public maxTotalSupply = 9800;
    uint public mintPrice = 5;
    uint public preMintPrice = 3;
    uint public maxMintCount = 5;

    // mintList mapping
    mapping (address => bool) public isMintListAddress;

    // Allowlist mapping
    mapping(address => bool) public isAllowlistAddress;

    // Signature tracker
    mapping(bytes => bool) public signatureUsed;

    constructor(string memory _name, string memory _symbol, string memory _notRevealedURI) ERC721(_name, _symbol) {
        notRevealedURI = _notRevealedURI;
    }

    function mintNFT() public payable {
        require(totalSupply() < maxTotalSupply, "You can no longer mint NFT.");
        require(msg.value >= mintPrice, "Not enough ether.");
        require(!isMintListAddress[msg.sender], "You have already minted.");

        uint tokenId = totalSupply() + 1;

        _mint(msg.sender, tokenId);
        isMintListAddress[msg.sender] = true;

        payable(owner()).transfer(msg.value);
    }

    function mintNFTOwner() public onlyOwner {
        uint tokenId = totalSupply() + 1;
        _mint(msg.sender, tokenId);
    }

    function batchMintNFT(uint _amount) public payable {
        require(totalSupply() + _amount <= maxTotalSupply, "You can no longer mint NFT.");
        require(msg.value >= mintPrice * _amount, "Not enough ether.");
        require(balanceOf(msg.sender) + _amount <= maxMintCount, "The maximum number of minting has been exceeded.");

        for (uint i = 0; i < _amount; i++) {
            uint tokenId = totalSupply() + 1;
            _mint(msg.sender, tokenId);
        }

        payable(owner()).transfer(msg.value);
    }

    function batchMintNFTOwner(uint _amount) public onlyOwner {
        for (uint i = 0; i < _amount; i++) {
            mintNFTOwner();
        }
    }

    function tokenURI(uint _tokenId) override public view returns (string memory) {
        if (isRevealed == false) {
            return notRevealedURI;
        } 

        return string(abi.encodePacked(metadataURI, '/', Strings.toString(_tokenId), '.json'));
    }

    // Allowlist addresses
    function allowlistAddresses(address[] calldata wAddresses) public onlyOwner {
        for (uint i = 0; i < wAddresses.length; i++) {
            isAllowlistAddress[wAddresses[i]] = true;
        }
    }

    // Presale mint
    function preSale() public payable {
        require(totalSupply() < maxTotalSupply, "You can no longer mint NFT.");
        require(msg.value >= preMintPrice, "Not enough ether.");
        require(isAllowlistAddress[msg.sender], "Address is not allowlisted");

        uint tokenId = totalSupply() + 1;
        _mint(msg.sender, tokenId);

        isAllowlistAddress[msg.sender] = false;    

        payable(owner()).transfer(msg.value);
    }

    function recoverSigner(bytes32 hash, bytes memory signature) public pure returns (address) {

        bytes32 messageDigest = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32", 
                hash
            )
        );

        return ECDSA.recover(messageDigest, signature);
    }

    // Presale mint - OffChain
    function preSaleOffChain(bytes32 hash, bytes memory signature) public payable {
        require(recoverSigner(hash, signature) == owner(), "Address is not allowlisted");
        require(!signatureUsed[signature], "Signature has already been used.");
        require(totalSupply() < maxTotalSupply, "You can no longer mint NFT.");
        require(msg.value >= preMintPrice, "Not enough ether.");
        
        uint tokenId = totalSupply() + 1;
        _mint(msg.sender, tokenId);

        signatureUsed[signature] = true;

        payable(owner()).transfer(msg.value);

    }

    // Airdrop NFTs
    function airdropNfts(address[] calldata wAddresses) public onlyOwner {
        require(totalSupply() + wAddresses.length <= maxTotalSupply, "You can no longer mint NFT.");

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

    function setPreMintPrice(uint _preMintPrice) public onlyOwner {
        preMintPrice = _preMintPrice;
    }

    function setMaxMintCount(uint _maxMintCount) public onlyOwner {
        maxMintCount = _maxMintCount;
    }
}