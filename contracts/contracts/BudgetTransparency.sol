// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BudgetTransparency
 * @dev Smart contract for tracking government budget allocations and expenditures
 * @author Government Budget Transparency System
 */
contract BudgetTransparency is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    // Role definitions
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant MINISTRY_ADMIN_ROLE = keccak256("MINISTRY_ADMIN_ROLE");
    bytes32 public constant FINANCE_OFFICER_ROLE = keccak256("FINANCE_OFFICER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // Structs
    struct Ministry {
        string name;
        string code;
        address walletAddress;
        bool isActive;
        uint256 totalAllocated;
        uint256 totalDisbursed;
    }

    struct BudgetAllocation {
        uint256 allocationId;
        uint256 fiscalYear;
        uint256 ministryId;
        uint256 categoryId;
        string projectName;
        string projectCode;
        uint256 allocatedAmount;
        uint256 disbursedAmount;
        uint8 priorityLevel;
        uint256 startDate;
        uint256 endDate;
        AllocationStatus status;
        address createdBy;
        address approvedBy;
        uint256 createdAt;
        uint256 approvedAt;
    }

    struct Disbursement {
        uint256 disbursementId;
        uint256 allocationId;
        address contractorAddress;
        uint256 amount;
        string purpose;
        DisbursementStatus status;
        address approvedBy;
        uint256 createdAt;
        uint256 approvedAt;
        string transactionHash;
    }

    struct ExpenditureReport {
        uint256 reportId;
        uint256 disbursementId;
        address contractorAddress;
        uint256 totalAmount;
        string reportHash; // IPFS hash of the report
        bool isVerified;
        address verifiedBy;
        uint256 createdAt;
        uint256 verifiedAt;
    }

    // Enums
    enum AllocationStatus { PENDING, APPROVED, ACTIVE, COMPLETED, SUSPENDED }
    enum DisbursementStatus { PENDING, APPROVED, DISBURSED, COMPLETED, REJECTED }

    // State variables
    mapping(uint256 => Ministry) public ministries;
    mapping(uint256 => BudgetAllocation) public budgetAllocations;
    mapping(uint256 => Disbursement) public disbursements;
    mapping(uint256 => ExpenditureReport) public expenditureReports;
    
    mapping(address => uint256) public ministryAddresses; // address => ministryId
    mapping(string => uint256) public projectCodes; // projectCode => allocationId
    
    uint256 public nextMinistryId = 1;
    uint256 public nextAllocationId = 1;
    uint256 public nextDisbursementId = 1;
    uint256 public nextReportId = 1;

    // Events
    event MinistryRegistered(uint256 indexed ministryId, string name, string code, address walletAddress);
    event BudgetAllocated(uint256 indexed allocationId, uint256 ministryId, string projectName, uint256 amount);
    event DisbursementApproved(uint256 indexed disbursementId, uint256 allocationId, address contractor, uint256 amount);
    event ExpenditureReported(uint256 indexed reportId, uint256 disbursementId, address contractor, uint256 amount);
    event ExpenditureVerified(uint256 indexed reportId, address verifier);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new ministry
     * @param name Ministry name
     * @param code Ministry code (e.g., "EDU", "HEALTH")
     * @param walletAddress Ministry wallet address
     */
    function registerMinistry(
        string memory name,
        string memory code,
        address walletAddress
    ) external onlyRole(SUPER_ADMIN_ROLE) {
        require(walletAddress != address(0), "Invalid wallet address");
        require(ministryAddresses[walletAddress] == 0, "Address already registered");

        uint256 ministryId = nextMinistryId++;
        ministries[ministryId] = Ministry({
            name: name,
            code: code,
            walletAddress: walletAddress,
            isActive: true,
            totalAllocated: 0,
            totalDisbursed: 0
        });

        ministryAddresses[walletAddress] = ministryId;
        
        emit MinistryRegistered(ministryId, name, code, walletAddress);
    }

    /**
     * @dev Create a new budget allocation
     * @param fiscalYear Fiscal year
     * @param ministryId Ministry ID
     * @param categoryId Category ID
     * @param projectName Project name
     * @param projectCode Unique project code
     * @param allocatedAmount Amount allocated
     * @param priorityLevel Priority level (1-5)
     * @param startDate Project start date
     * @param endDate Project end date
     */
    function createBudgetAllocation(
        uint256 fiscalYear,
        uint256 ministryId,
        uint256 categoryId,
        string memory projectName,
        string memory projectCode,
        uint256 allocatedAmount,
        uint8 priorityLevel,
        uint256 startDate,
        uint256 endDate
    ) external onlyRole(MINISTRY_ADMIN_ROLE) {
        require(ministries[ministryId].isActive, "Ministry not active");
        require(allocatedAmount > 0, "Amount must be greater than 0");
        require(priorityLevel >= 1 && priorityLevel <= 5, "Invalid priority level");
        require(bytes(projectCode).length > 0, "Project code required");
        require(projectCodes[projectCode] == 0, "Project code already exists");

        uint256 allocationId = nextAllocationId++;
        budgetAllocations[allocationId] = BudgetAllocation({
            allocationId: allocationId,
            fiscalYear: fiscalYear,
            ministryId: ministryId,
            categoryId: categoryId,
            projectName: projectName,
            projectCode: projectCode,
            allocatedAmount: allocatedAmount,
            disbursedAmount: 0,
            priorityLevel: priorityLevel,
            startDate: startDate,
            endDate: endDate,
            status: AllocationStatus.PENDING,
            createdBy: msg.sender,
            approvedBy: address(0),
            createdAt: block.timestamp,
            approvedAt: 0
        });

        projectCodes[projectCode] = allocationId;
        ministries[ministryId].totalAllocated += allocatedAmount;

        emit BudgetAllocated(allocationId, ministryId, projectName, allocatedAmount);
    }

    /**
     * @dev Approve a budget allocation
     * @param allocationId Allocation ID to approve
     */
    function approveBudgetAllocation(uint256 allocationId) external onlyRole(SUPER_ADMIN_ROLE) {
        BudgetAllocation storage allocation = budgetAllocations[allocationId];
        require(allocation.allocationId != 0, "Allocation not found");
        require(allocation.status == AllocationStatus.PENDING, "Allocation not pending");

        allocation.status = AllocationStatus.APPROVED;
        allocation.approvedBy = msg.sender;
        allocation.approvedAt = block.timestamp;

        emit BudgetAllocated(allocationId, allocation.ministryId, allocation.projectName, allocation.allocatedAmount);
    }

    /**
     * @dev Create a disbursement request
     * @param allocationId Budget allocation ID
     * @param contractorAddress Contractor wallet address
     * @param amount Disbursement amount
     * @param purpose Purpose of disbursement
     */
    function createDisbursement(
        uint256 allocationId,
        address contractorAddress,
        uint256 amount,
        string memory purpose
    ) external onlyRole(FINANCE_OFFICER_ROLE) {
        BudgetAllocation storage allocation = budgetAllocations[allocationId];
        require(allocation.allocationId != 0, "Allocation not found");
        require(allocation.status == AllocationStatus.APPROVED, "Allocation not approved");
        require(contractorAddress != address(0), "Invalid contractor address");
        require(amount > 0, "Amount must be greater than 0");
        require(allocation.disbursedAmount + amount <= allocation.allocatedAmount, "Exceeds allocation");

        uint256 disbursementId = nextDisbursementId++;
        disbursements[disbursementId] = Disbursement({
            disbursementId: disbursementId,
            allocationId: allocationId,
            contractorAddress: contractorAddress,
            amount: amount,
            purpose: purpose,
            status: DisbursementStatus.PENDING,
            approvedBy: address(0),
            createdAt: block.timestamp,
            approvedAt: 0,
            transactionHash: ""
        });

        emit DisbursementApproved(disbursementId, allocationId, contractorAddress, amount);
    }

    /**
     * @dev Approve and execute disbursement
     * @param disbursementId Disbursement ID
     * @param transactionHash Blockchain transaction hash
     */
    function approveDisbursement(
        uint256 disbursementId,
        string memory transactionHash
    ) external onlyRole(MINISTRY_ADMIN_ROLE) nonReentrant {
        Disbursement storage disbursement = disbursements[disbursementId];
        require(disbursement.disbursementId != 0, "Disbursement not found");
        require(disbursement.status == DisbursementStatus.PENDING, "Disbursement not pending");

        disbursement.status = DisbursementStatus.DISBURSED;
        disbursement.approvedBy = msg.sender;
        disbursement.approvedAt = block.timestamp;
        disbursement.transactionHash = transactionHash;

        // Update allocation disbursed amount
        BudgetAllocation storage allocation = budgetAllocations[disbursement.allocationId];
        allocation.disbursedAmount += disbursement.amount;
        ministries[allocation.ministryId].totalDisbursed += disbursement.amount;

        emit DisbursementApproved(disbursementId, disbursement.allocationId, disbursement.contractorAddress, disbursement.amount);
    }

    /**
     * @dev Submit expenditure report
     * @param disbursementId Disbursement ID
     * @param totalAmount Total amount spent
     * @param reportHash IPFS hash of the expenditure report
     */
    function submitExpenditureReport(
        uint256 disbursementId,
        uint256 totalAmount,
        string memory reportHash
    ) external {
        Disbursement storage disbursement = disbursements[disbursementId];
        require(disbursement.disbursementId != 0, "Disbursement not found");
        require(disbursement.contractorAddress == msg.sender, "Only contractor can submit report");
        require(disbursement.status == DisbursementStatus.DISBURSED, "Disbursement not completed");
        require(totalAmount > 0, "Amount must be greater than 0");
        require(bytes(reportHash).length > 0, "Report hash required");

        uint256 reportId = nextReportId++;
        expenditureReports[reportId] = ExpenditureReport({
            reportId: reportId,
            disbursementId: disbursementId,
            contractorAddress: msg.sender,
            totalAmount: totalAmount,
            reportHash: reportHash,
            isVerified: false,
            verifiedBy: address(0),
            createdAt: block.timestamp,
            verifiedAt: 0
        });

        emit ExpenditureReported(reportId, disbursementId, msg.sender, totalAmount);
    }

    /**
     * @dev Verify expenditure report
     * @param reportId Report ID to verify
     */
    function verifyExpenditureReport(uint256 reportId) external onlyRole(AUDITOR_ROLE) {
        ExpenditureReport storage report = expenditureReports[reportId];
        require(report.reportId != 0, "Report not found");
        require(!report.isVerified, "Report already verified");

        report.isVerified = true;
        report.verifiedBy = msg.sender;
        report.verifiedAt = block.timestamp;

        // Update disbursement status
        Disbursement storage disbursement = disbursements[report.disbursementId];
        disbursement.status = DisbursementStatus.COMPLETED;

        emit ExpenditureVerified(reportId, msg.sender);
    }

    /**
     * @dev Get ministry information
     * @param ministryId Ministry ID
     */
    function getMinistry(uint256 ministryId) external view returns (Ministry memory) {
        return ministries[ministryId];
    }

    /**
     * @dev Get budget allocation information
     * @param allocationId Allocation ID
     */
    function getAllocation(uint256 allocationId) external view returns (BudgetAllocation memory) {
        return budgetAllocations[allocationId];
    }

    /**
     * @dev Get disbursement information
     * @param disbursementId Disbursement ID
     */
    function getDisbursement(uint256 disbursementId) external view returns (Disbursement memory) {
        return disbursements[disbursementId];
    }

    /**
     * @dev Get expenditure report information
     * @param reportId Report ID
     */
    function getExpenditureReport(uint256 reportId) external view returns (ExpenditureReport memory) {
        return expenditureReports[reportId];
    }

    /**
     * @dev Verify transaction signature
     * @param messageHash Hash of the message
     * @param signature Signature to verify
     * @param signer Expected signer address
     */
    function verifySignature(
        bytes32 messageHash,
        bytes memory signature,
        address signer
    ) external pure returns (bool) {
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        return recoveredSigner == signer;
    }
}

