// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BudgetCertificate
 * @dev NFT certificates for verified budget transactions
 * @author Government Budget Transparency System
 */
contract BudgetCertificate is ERC721, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    Counters.Counter private _tokenIdCounter;
    
    struct CertificateData {
        uint256 allocationId;
        uint256 disbursementId;
        uint256 reportId;
        string projectName;
        string ministryCode;
        uint256 amount;
        uint256 timestamp;
        string metadataHash; // IPFS hash of certificate metadata
    }
    
    mapping(uint256 => CertificateData) public certificates;
    mapping(uint256 => uint256) public allocationToCertificate; // allocationId => tokenId
    mapping(uint256 => uint256) public disbursementToCertificate; // disbursementId => tokenId
    
    event CertificateMinted(
        uint256 indexed tokenId,
        uint256 allocationId,
        uint256 disbursementId,
        string projectName,
        uint256 amount
    );
    
    constructor() ERC721("Budget Certificate", "BUDGET") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mint a certificate for verified budget transaction
     * @param to Recipient address
     * @param allocationId Budget allocation ID
     * @param disbursementId Disbursement ID
     * @param reportId Expenditure report ID
     * @param projectName Project name
     * @param ministryCode Ministry code
     * @param amount Transaction amount
     * @param metadataHash IPFS hash of certificate metadata
     */
    function mintCertificate(
        address to,
        uint256 allocationId,
        uint256 disbursementId,
        uint256 reportId,
        string memory projectName,
        string memory ministryCode,
        uint256 amount,
        string memory metadataHash
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        certificates[tokenId] = CertificateData({
            allocationId: allocationId,
            disbursementId: disbursementId,
            reportId: reportId,
            projectName: projectName,
            ministryCode: ministryCode,
            amount: amount,
            timestamp: block.timestamp,
            metadataHash: metadataHash
        });
        
        allocationToCertificate[allocationId] = tokenId;
        disbursementToCertificate[disbursementId] = tokenId;
        
        _safeMint(to, tokenId);
        
        emit CertificateMinted(tokenId, allocationId, disbursementId, projectName, amount);
        
        return tokenId;
    }
    
    /**
     * @dev Get certificate data
     * @param tokenId Token ID
     */
    function getCertificateData(uint256 tokenId) external view returns (CertificateData memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }
    
    /**
     * @dev Check if certificate exists for allocation
     * @param allocationId Allocation ID
     */
    function hasCertificateForAllocation(uint256 allocationId) external view returns (bool) {
        return allocationToCertificate[allocationId] != 0;
    }
    
    /**
     * @dev Get certificate token ID for allocation
     * @param allocationId Allocation ID
     */
    function getCertificateForAllocation(uint256 allocationId) external view returns (uint256) {
        return allocationToCertificate[allocationId];
    }
    
    /**
     * @dev Override tokenURI to return IPFS metadata
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return string(abi.encodePacked("ipfs://", certificates[tokenId].metadataHash));
    }
    
    /**
     * @dev Supports interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

