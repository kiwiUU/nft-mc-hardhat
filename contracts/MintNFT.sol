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
    bool public paused = true;
    bool public whitelistMintEnabled = false;

    uint public maxTotalSupply = 9800;
    uint public mintPrice = 5;
    uint public preMintPrice = 3;
    uint public maxMintCount = 5;

    // Allowlist mapping
    mapping(address => bool) public isAllowlistAddress;

    // mintList mapping
    mapping(address => uint) public mintlistAddress;

    // Signature tracker
    mapping(bytes => bool) public signatureUsed;

    constructor(string memory _name, string memory _symbol, string memory _notRevealedURI) ERC721(_name, _symbol) {
        notRevealedURI = _notRevealedURI;
    }

    modifier costs(uint price) {
        require(msg.value >= price, "Not enough ether.");
        _;
    }

    modifier pause() {
        require(!paused, "The contract is paused.");
        _;
    }

    modifier maxSupply(uint _amount) {
        require(totalSupply() + _amount <= maxTotalSupply, "You can no longer mint NFT.");
        _;
    }

    function mintNFTOwner() public onlyOwner {
        uint tokenId = totalSupply() + 1;
        _mint(msg.sender, tokenId);
    }

    function batchMintNFT(uint _amount) public payable pause costs(mintPrice * _amount) maxSupply(_amount) {
        require(mintlistAddress[msg.sender] + _amount <= maxMintCount, "The maximum number of minting has been exceeded.");

        for (uint i = 0; i < _amount; i++) {
            uint tokenId = totalSupply() + 1;
            _mint(msg.sender, tokenId);
        }

        mintlistAddress[msg.sender] = mintlistAddress[msg.sender] + _amount;
        
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
    function preSale() public payable costs(preMintPrice) maxSupply(1) {
        require(isAllowlistAddress[msg.sender], "Address is not allowlisted");
        require(whitelistMintEnabled, "The presale is not enabled.");

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
    function preSaleOffChain(bytes32 hash, bytes memory signature) public payable costs(preMintPrice) maxSupply(1) {
        require(recoverSigner(hash, signature) == owner(), "Address is not allowlisted.");
        require(!signatureUsed[signature], "Signature has already been used.");
        require(whitelistMintEnabled, "The presale is not enabled.");
        require(keccak256(abi.encodePacked(msg.sender)) == hash, "The sender is not allowlisted.");
        
        uint tokenId = totalSupply() + 1;
        _mint(msg.sender, tokenId);

        signatureUsed[signature] = true;

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

    function setPreMintPrice(uint _preMintPrice) public onlyOwner {
        preMintPrice = _preMintPrice;
    }

    function setMaxMintCount(uint _maxMintCount) public onlyOwner {
        maxMintCount = _maxMintCount;
    }

    function setPaused(bool _paused) public onlyOwner {
        paused = _paused;
    }

    function setWhitelistMintEnabled(bool _whitelistMintEnabled) public onlyOwner {
        whitelistMintEnabled = _whitelistMintEnabled;
    }
}