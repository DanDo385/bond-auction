// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";

contract BondAuctionFactory is ERC721, ERC721URIStorage, VRFConsumerBase {
    uint256 public fee;
    bytes32 public keyHash;
    uint256 private tokenCounter;

    struct Bond {
        uint256 couponRate; // Coupon rate in basis points
        uint256 maturity; // Maturity in years
        uint256 price; // Price determined by Chainlink VRF, initially 0
        bool isMinted; // To check if the bond has been minted as an NFT
    }

    mapping(uint256 => Bond) public bonds;

    event BondCreated(uint256 indexed tokenId, uint256 couponRate, uint256 maturity);
    event BondMinted(uint256 indexed tokenId, uint256 price);
    event PriceSet(uint256 indexed tokenId, uint256 price);

    constructor(address _vrfCoordinator, address _linkToken, bytes32 _keyHash, uint256 _fee) 
        ERC721("Bond", "SEB")
        VRFConsumerBase(_vrfCoordinator, _linkToken) 
    {
        keyHash = _keyHash;
        fee = _fee;
        tokenCounter = 0;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _exists(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || ERC721URIStorage.supportsInterface(interfaceId);
    }

    function createBond(uint256 _couponRate, uint256 _maturity) external returns (uint256 tokenId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK to pay fee");
        tokenId = tokenCounter++;
        bonds[tokenId] = Bond(_couponRate, _maturity, 0, false);
        emit BondCreated(tokenId, _couponRate, _maturity);
    }

    function requestRandomPrice(uint256 tokenId) public {
        require(msg.sender == ownerOf(tokenId), "Caller is not the bond owner");
        require(!bonds[tokenId].isMinted, "Bond is already minted");
        requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        uint256 tokenId = uint256(requestId);
        uint256 price = ((randomness % 21) + 9990); // Gives a price between 99.90 and 100.10
        Bond storage bond = bonds[tokenId];
        bond.price = price;
        emit PriceSet(tokenId, price);
    }

    function mintBond(uint256 tokenId) public {
        require(msg.sender == ownerOf(tokenId), "Caller is not the bond owner");
        require(bonds[tokenId].price != 0, "Bond price not set");
        require(!bonds[tokenId].isMinted, "Bond is already minted");
        bonds[tokenId].isMinted = true;
        _safeMint(msg.sender, tokenId);
        emit BondMinted(tokenId, bonds[tokenId].price);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return ERC721URIStorage.tokenURI(tokenId);
    }
}
