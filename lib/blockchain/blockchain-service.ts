import { ethers } from 'ethers';
import { web3Service } from './web3-service';

// Contract ABIs (simplified versions)
export const BUDGET_TRANSPARENCY_ABI = [
  // Events
  "event MinistryRegistered(uint256 indexed ministryId, string name, string code, address walletAddress)",
  "event BudgetAllocated(uint256 indexed allocationId, uint256 ministryId, string projectName, uint256 amount)",
  "event DisbursementApproved(uint256 indexed disbursementId, uint256 allocationId, address contractor, uint256 amount)",
  "event ExpenditureReported(uint256 indexed reportId, uint256 disbursementId, address contractor, uint256 amount)",
  "event ExpenditureVerified(uint256 indexed reportId, address verifier)",

  // Functions
  "function registerMinistry(string memory name, string memory code, address walletAddress) external",
  "function createBudgetAllocation(uint256 fiscalYear, uint256 ministryId, uint256 categoryId, string memory projectName, string memory projectCode, uint256 allocatedAmount, uint8 priorityLevel, uint256 startDate, uint256 endDate) external",
  "function approveBudgetAllocation(uint256 allocationId) external",
  "function createDisbursement(uint256 allocationId, address contractorAddress, uint256 amount, string memory purpose) external",
  "function approveDisbursement(uint256 disbursementId, string memory transactionHash) external",
  "function submitExpenditureReport(uint256 disbursementId, uint256 totalAmount, string memory reportHash) external",
  "function verifyExpenditureReport(uint256 reportId) external",
  
  // View functions
  "function getMinistry(uint256 ministryId) external view returns (tuple(string name, string code, address walletAddress, bool isActive, uint256 totalAllocated, uint256 totalDisbursed))",
  "function ministryAddresses(address) external view returns (uint256)",
  "function getAllocation(uint256 allocationId) external view returns (tuple(uint256 allocationId, uint256 fiscalYear, uint256 ministryId, uint256 categoryId, string projectName, string projectCode, uint256 allocatedAmount, uint256 disbursedAmount, uint8 priorityLevel, uint256 startDate, uint256 endDate, uint8 status, address createdBy, address approvedBy, uint256 createdAt, uint256 approvedAt))",
  "function getDisbursement(uint256 disbursementId) external view returns (tuple(uint256 disbursementId, uint256 allocationId, address contractorAddress, uint256 amount, string purpose, uint8 status, address approvedBy, uint256 createdAt, uint256 approvedAt, string transactionHash))",
  "function getExpenditureReport(uint256 reportId) external view returns (tuple(uint256 reportId, uint256 disbursementId, address contractorAddress, uint256 totalAmount, string reportHash, bool isVerified, address verifiedBy, uint256 createdAt, uint256 verifiedAt))",
  "function verifySignature(bytes32 messageHash, bytes memory signature, address signer) external pure returns (bool)",
  
  // AccessControl functions (from OpenZeppelin)
  "function grantRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)"
];

export const BUDGET_CERTIFICATE_ABI = [
  // Events
  "event CertificateMinted(uint256 indexed tokenId, uint256 allocationId, uint256 disbursementId, string projectName, uint256 amount)",
  
  // Functions
  "function mintCertificate(address to, uint256 allocationId, uint256 disbursementId, uint256 reportId, string memory projectName, string memory ministryCode, uint256 amount, string memory metadataHash) external returns (uint256)",
  
  // View functions
  "function getCertificateData(uint256 tokenId) external view returns (tuple(uint256 allocationId, uint256 disbursementId, uint256 reportId, string projectName, string ministryCode, uint256 amount, uint256 timestamp, string metadataHash))",
  "function hasCertificateForAllocation(uint256 allocationId) external view returns (bool)",
  "function getCertificateForAllocation(uint256 allocationId) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

export interface MinistryData {
  name: string;
  code: string;
  walletAddress: string;
  isActive: boolean;
  totalAllocated: ethers.BigNumber;
  totalDisbursed: ethers.BigNumber;
}

export interface AllocationData {
  allocationId: ethers.BigNumber;
  fiscalYear: ethers.BigNumber;
  ministryId: ethers.BigNumber;
  categoryId: ethers.BigNumber;
  projectName: string;
  projectCode: string;
  allocatedAmount: ethers.BigNumber;
  disbursedAmount: ethers.BigNumber;
  priorityLevel: number;
  startDate: ethers.BigNumber;
  endDate: ethers.BigNumber;
  status: number; // 0: PENDING, 1: APPROVED, 2: ACTIVE, 3: COMPLETED, 4: SUSPENDED
  createdBy: string;
  approvedBy: string;
  createdAt: ethers.BigNumber;
  approvedAt: ethers.BigNumber;
}

export interface DisbursementData {
  disbursementId: ethers.BigNumber;
  allocationId: ethers.BigNumber;
  contractorAddress: string;
  amount: ethers.BigNumber;
  purpose: string;
  status: number; // 0: PENDING, 1: APPROVED, 2: DISBURSED, 3: COMPLETED, 4: REJECTED
  approvedBy: string;
  createdAt: ethers.BigNumber;
  approvedAt: ethers.BigNumber;
  transactionHash: string;
}

export interface ExpenditureReportData {
  reportId: ethers.BigNumber;
  disbursementId: ethers.BigNumber;
  contractorAddress: string;
  totalAmount: ethers.BigNumber;
  reportHash: string;
  isVerified: boolean;
  verifiedBy: string;
  createdAt: ethers.BigNumber;
  verifiedAt: ethers.BigNumber;
}

export class BlockchainService {
  private budgetContract: ethers.Contract | null = null;
  private certificateContract: ethers.Contract | null = null;

  constructor() {
    this.initializeContracts();
  }

  private initializeContracts() {
    this.budgetContract = web3Service.getContract('BudgetTransparency', BUDGET_TRANSPARENCY_ABI);
    this.certificateContract = web3Service.getContract('BudgetCertificate', BUDGET_CERTIFICATE_ABI);
  }

  /**
   * Register a new ministry
   */
  async registerMinistry(
    name: string,
    code: string,
    walletAddress: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.registerMinistry(name, code, walletAddress);
  }

  /**
   * Create a budget allocation
   */
  async createBudgetAllocation(
    fiscalYear: number,
    ministryId: number,
    categoryId: number,
    projectName: string,
    projectCode: string,
    allocatedAmount: ethers.BigNumber,
    priorityLevel: number,
    startDate: number,
    endDate: number
  ): Promise<ethers.ContractTransaction> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.createBudgetAllocation(
      fiscalYear,
      ministryId,
      categoryId,
      projectName,
      projectCode,
      allocatedAmount,
      priorityLevel,
      startDate,
      endDate
    );
  }

  /**
   * Approve a budget allocation
   */
  async approveBudgetAllocation(allocationId: number): Promise<ethers.ContractTransaction> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.approveBudgetAllocation(allocationId);
  }

  /**
   * Create a disbursement
   */
  async createDisbursement(
    allocationId: number,
    contractorAddress: string,
    amount: ethers.BigNumber,
    purpose: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.createDisbursement(
      allocationId,
      contractorAddress,
      amount,
      purpose
    );
  }

  /**
   * Approve and execute disbursement
   */
  async approveDisbursement(
    disbursementId: number,
    transactionHash: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.approveDisbursement(disbursementId, transactionHash);
  }

  /**
   * Submit expenditure report
   */
  async submitExpenditureReport(
    disbursementId: number,
    totalAmount: ethers.BigNumber,
    reportHash: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.submitExpenditureReport(
      disbursementId,
      totalAmount,
      reportHash
    );
  }

  /**
   * Verify expenditure report
   */
  async verifyExpenditureReport(reportId: number): Promise<ethers.ContractTransaction> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.verifyExpenditureReport(reportId);
  }

  /**
   * Get ministry data
   */
  async getMinistry(ministryId: number): Promise<MinistryData> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.getMinistry(ministryId);
  }

  /**
   * Get allocation data
   */
  async getAllocation(allocationId: number): Promise<AllocationData> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.getAllocation(allocationId);
  }

  /**
   * Get disbursement data
   */
  async getDisbursement(disbursementId: number): Promise<DisbursementData> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.getDisbursement(disbursementId);
  }

  /**
   * Get expenditure report data
   */
  async getExpenditureReport(reportId: number): Promise<ExpenditureReportData> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.getExpenditureReport(reportId);
  }

  /**
   * Verify digital signature
   */
  async verifySignature(
    messageHash: string,
    signature: string,
    signer: string
  ): Promise<boolean> {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    return await this.budgetContract.verifySignature(messageHash, signature, signer);
  }

  /**
   * Mint certificate for verified transaction
   */
  async mintCertificate(
    to: string,
    allocationId: number,
    disbursementId: number,
    reportId: number,
    projectName: string,
    ministryCode: string,
    amount: ethers.BigNumber,
    metadataHash: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.certificateContract) {
      throw new Error('Certificate contract not initialized');
    }

    return await this.certificateContract.mintCertificate(
      to,
      allocationId,
      disbursementId,
      reportId,
      projectName,
      ministryCode,
      amount,
      metadataHash
    );
  }

  /**
   * Get certificate data
   */
  async getCertificateData(tokenId: number): Promise<any> {
    if (!this.certificateContract) {
      throw new Error('Certificate contract not initialized');
    }

    return await this.certificateContract.getCertificateData(tokenId);
  }

  /**
   * Check if certificate exists for allocation
   */
  async hasCertificateForAllocation(allocationId: number): Promise<boolean> {
    if (!this.certificateContract) {
      throw new Error('Certificate contract not initialized');
    }

    return await this.certificateContract.hasCertificateForAllocation(allocationId);
  }

  /**
   * Listen to contract events
   */
  onEvent(eventName: string, callback: Function): void {
    if (!this.budgetContract) {
      throw new Error('Contract not initialized');
    }

    this.budgetContract.on(eventName, callback);
  }

  /**
   * Remove event listener
   */
  offEvent(eventName: string, callback: Function): void {
    if (!this.budgetContract) {
      return;
    }

    this.budgetContract.off(eventName, callback);
  }

  /**
   * Format BigNumber to readable string
   */
  formatAmount(amount: ethers.BigNumber, decimals: number = 18): string {
    return ethers.utils.formatUnits(amount, decimals);
  }

  /**
   * Parse string to BigNumber
   */
  parseAmount(amount: string, decimals: number = 18): ethers.BigNumber {
    return ethers.utils.parseUnits(amount, decimals);
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

