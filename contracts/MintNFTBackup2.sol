// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "operator-filter-registry/src/DefaultOperatorFilterer.sol";

contract MintNFTBackup2 is ERC721, Ownable, DefaultOperatorFilterer {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string public notRevealedURI;
    string public metadataURI;
    bool public isRevealed;

    uint public maxTotalSupply = 1000;
    uint public mintPrice = 0;
    uint public maxMintCount = 1;
    
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

    // event sale
    mapping(address => uint) public eventlistAddress;
    bool public eventMintEnabled = false;

    constructor(string memory _name, string memory _symbol, string memory _notRevealedURI) ERC721(_name, _symbol) {
        notRevealedURI = _notRevealedURI;
    }

    modifier costs(uint price) {
        require(msg.value >= price, "Not enough ether.");
        _;
    }

    modifier maxSupply(uint _amount) {
        require(_tokenIds.current() + _amount <= maxTotalSupply, "You can no longer mint NFT.");
        _;
    }

    function tokenURI(uint _tokenId) override public view returns (string memory) {
        if (isRevealed == false) {
            return notRevealedURI;
        } 

        return string(abi.encodePacked(metadataURI, '/', Strings.toString(_tokenId), '.json'));
    }

    function mintNFTOwner() public onlyOwner {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId);
    }

    function batchMintNFTOwner(uint _amount) public onlyOwner {
        for (uint i = 0; i < _amount; i++) {
            mintNFTOwner();
        }
    }

    // presale phase 1
    function preSaleMerkleTree1(bytes32[] calldata proof, uint _amount) public payable costs(mintPrice * _amount) maxSupply(_amount) {
        require(preMintEnabled1, "The presale1 is not enabled.");
        require(_amount > 0, "The amount must be greater than 0.");
        require(preMintlistAddress1[msg.sender] + _amount <= maxMintCount, "The maximum number of minting has been exceeded.");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));

        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert("MerkleProof is invalid.");

        for (uint i = 0; i < _amount; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();

            _mint(msg.sender, newItemId);
        }

        preMintlistAddress1[msg.sender] = preMintlistAddress1[msg.sender] + _amount;

        payable(owner()).transfer(msg.value);

    }

    // presale phase 2
    function preSaleMerkleTree2(bytes32[] calldata proof, uint _amount) public payable costs(mintPrice * _amount) maxSupply(_amount) {
        require(preMintEnabled2, "The presale2 is not enabled.");
        require(_amount > 0, "The amount must be greater than 0.");
        require(preMintlistAddress2[msg.sender] + _amount <= maxMintCount, "The maximum number of minting has been exceeded.");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));

        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert("MerkleProof is invalid.");

        for (uint i = 0; i < _amount; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();

            _mint(msg.sender, newItemId);
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
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();

            _mint(msg.sender, newItemId);
        }

        mintlistAddress[msg.sender] = mintlistAddress[msg.sender] + _amount;
        
        payable(owner()).transfer(msg.value);
    }

    // event mint
    function eventMint(bytes32[] calldata proof, uint _amount) public payable costs(mintPrice * _amount) maxSupply(_amount) {
        require(eventMintEnabled, "The eventSale is not enabled.");
        require(_amount > 0, "The amount must be greater than 0.");
        require(eventlistAddress[msg.sender] + _amount <= maxMintCount, "The maximum number of minting has been exceeded.");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));

        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert("MerkleProof is invalid.");

        for (uint i = 0; i < _amount; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();

            _mint(msg.sender, newItemId);
        }

        eventlistAddress[msg.sender] = eventlistAddress[msg.sender] + _amount;

        payable(owner()).transfer(msg.value);

    }

    // Airdrop NFTs
    function airdropNfts(address[] calldata wAddresses) public onlyOwner maxSupply(wAddresses.length) {
        for (uint i = 0; i < wAddresses.length; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            
            _mint(wAddresses[i], newItemId);    
        }
    }

    function totalSupply() public view returns(uint) {
        return _tokenIds.current();
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

    function setEventMintEnabled(bool _eventMintEnabled) public onlyOwner {
        eventMintEnabled = _eventMintEnabled;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setApprovalForAll(address operator, bool approved) public override onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId) public override onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, data);
    }
}