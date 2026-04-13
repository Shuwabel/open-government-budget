import { ethers } from 'ethers';
import { BUDGET_TRANSPARENCY_ABI } from './blockchain-service';

/**
 * Server-side blockchain service for creating transactions
 * Uses private key for signing (server-side only)
 */
export class ServerBlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private budgetContract: ethers.Contract;
  private contractAddress: string;

  // Role hashes
  public readonly SUPER_ADMIN_ROLE: string;
  public readonly MINISTRY_ADMIN_ROLE: string;
  public readonly FINANCE_OFFICER_ROLE: string;
  public readonly AUDITOR_ROLE: string;

  constructor() {
    const rpcUrl = process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com';
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_BUDGET_CONTRACT_ADDRESS;

    if (!privateKey) {
      throw new Error('BLOCKCHAIN_PRIVATE_KEY is not set in environment variables');
    }

    if (!contractAddress) {
      throw new Error('NEXT_PUBLIC_BUDGET_CONTRACT_ADDRESS is not set in environment variables');
    }

    // ethers v6 syntax
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contractAddress = contractAddress;
    this.budgetContract = new ethers.Contract(
      contractAddress,
      BUDGET_TRANSPARENCY_ABI,
      this.wallet
    );

    // Initialize role hashes
    this.SUPER_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SUPER_ADMIN_ROLE"));
    this.MINISTRY_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINISTRY_ADMIN_ROLE"));
    this.FINANCE_OFFICER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FINANCE_OFFICER_ROLE"));
    this.AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE"));
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Check if wallet has a specific role
   */
  async hasRole(role: string, account: string): Promise<boolean> {
    try {
      return await this.budgetContract.hasRole(role, account);
    } catch (error: any) {
      console.error(`Error checking role for ${account}:`, error);
      return false;
    }
  }

  /**
   * Grant a role to an account
   */
  async grantRole(role: string, account: string): Promise<string> {
    try {
      const tx = await this.budgetContract.grantRole(role, account, {
        gasLimit: 200000,
      });
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      console.error(`Error granting role to ${account}:`, error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Grant MINISTRY_ADMIN_ROLE to the wallet address
   * Requires SUPER_ADMIN_ROLE or DEFAULT_ADMIN_ROLE
   */
  async grantMinistryAdminRole(): Promise<string> {
    try {
      const MINISTRY_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINISTRY_ADMIN_ROLE"));
      const tx = await this.budgetContract.grantRole(MINISTRY_ADMIN_ROLE, this.wallet.address, {
        gasLimit: 100000,
      });
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      console.error('Error granting role:', error);
      throw new Error(`Failed to grant role: ${error.message}`);
    }
  }

  /**
   * Check if wallet has MINISTRY_ADMIN_ROLE
   */
  async hasMinistryAdminRole(): Promise<boolean> {
    try {
      return await this.hasRole(this.MINISTRY_ADMIN_ROLE, this.wallet.address);
    } catch (error: any) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * Check if wallet has SUPER_ADMIN_ROLE (can grant other roles)
   */
  async hasSuperAdminRole(): Promise<boolean> {
    try {
      const SUPER_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SUPER_ADMIN_ROLE"));
      return await this.budgetContract.hasRole(SUPER_ADMIN_ROLE, this.wallet.address);
    } catch (error: any) {
      console.error('Error checking super admin role:', error);
      return false;
    }
  }

  /**
   * Create a budget allocation on blockchain
   */
  async createBudgetAllocation(
    fiscalYear: number,
    ministryId: number,
    categoryId: number,
    projectName: string,
    projectCode: string,
    allocatedAmount: number,
    priorityLevel: number = 1,
    startDate: number = Math.floor(Date.now() / 1000),
    endDate: number = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 // 1 year from now
  ): Promise<{ txHash: string; allocationId: number }> {
    try {
      const amountInWei = ethers.parseUnits(allocatedAmount.toString(), 18);
      
      // Check if wallet has required role
      const hasRole = await this.hasMinistryAdminRole();
      if (!hasRole) {
        console.warn('⚠️ Wallet does not have MINISTRY_ADMIN_ROLE.');
        // Check if we can grant it ourselves
        const hasSuperAdmin = await this.hasSuperAdminRole();
        if (hasSuperAdmin) {
          console.log('✅ Wallet has SUPER_ADMIN_ROLE. Granting MINISTRY_ADMIN_ROLE...');
          try {
            await this.grantMinistryAdminRole();
            console.log('✅ Role granted successfully');
          } catch (grantError: any) {
            throw new Error(`Failed to grant role: ${grantError.message}`);
          }
        } else {
          throw new Error('Wallet does not have MINISTRY_ADMIN_ROLE and cannot grant it. Please grant the role manually using a SUPER_ADMIN wallet.');
        }
      }

      // Log the call for debugging
      console.log('Calling createBudgetAllocation with:', {
        fiscalYear,
        ministryId,
        categoryId,
        projectName,
        projectCode,
        amountInWei: amountInWei.toString(),
        priorityLevel,
        startDate,
        endDate
      });

      // Estimate gas first
      let gasEstimate;
      try {
        gasEstimate = await this.budgetContract.createBudgetAllocation.estimateGas(
          fiscalYear,
          ministryId,
          categoryId,
          projectName,
          projectCode,
          amountInWei,
          priorityLevel,
          startDate,
          endDate
        );
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (estimateError: any) {
        console.error('Gas estimation failed:', estimateError);
        const errorMsg = estimateError.reason || estimateError.message || 'Unknown error';
        throw new Error(`Gas estimation failed: ${errorMsg}. Common causes: missing role, invalid ministry ID, or project code already exists.`);
      }
      
      const tx = await this.budgetContract.createBudgetAllocation(
        fiscalYear,
        ministryId,
        categoryId,
        projectName,
        projectCode,
        amountInWei,
        priorityLevel,
        startDate,
        endDate,
        {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
        }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      // Extract allocation ID from event (ethers v6)
      let allocationId = 0;
      if (receipt && receipt.logs) {
        const iface = this.budgetContract.interface;
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed && parsed.name === 'BudgetAllocated') {
              allocationId = Number(parsed.args.allocationId);
              break;
            }
          } catch (e) {
            // Not this event, continue
          }
        }
      }

      return {
        txHash: receipt.hash,
        allocationId
      };
    } catch (error: any) {
      console.error('Error creating budget allocation on blockchain:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Approve a budget allocation on blockchain
   */
  async approveBudgetAllocation(allocationId: number): Promise<string> {
    try {
      const tx = await this.budgetContract.approveBudgetAllocation(allocationId, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      console.error('Error approving budget allocation on blockchain:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Create a disbursement on blockchain
   */
  async createDisbursement(
    allocationId: number,
    contractorAddress: string,
    amount: number,
    purpose: string
  ): Promise<{ txHash: string; disbursementId: number }> {
    try {
      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      
      const tx = await this.budgetContract.createDisbursement(
        allocationId,
        contractorAddress,
        amountInWei,
        purpose,
        {
          gasLimit: 400000,
        }
      );

      const receipt = await tx.wait();
      
      // Extract disbursement ID from event (ethers v6)
      let disbursementId = 0;
      if (receipt && receipt.logs) {
        const iface = this.budgetContract.interface;
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed && parsed.name === 'DisbursementApproved') {
              disbursementId = Number(parsed.args.disbursementId);
              break;
            }
          } catch (e) {
            // Not this event, continue
          }
        }
      }

      return {
        txHash: receipt.hash,
        disbursementId
      };
    } catch (error: any) {
      console.error('Error creating disbursement on blockchain:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Approve a disbursement on blockchain
   */
  async approveDisbursement(disbursementId: number, transactionHash: string): Promise<string> {
    try {
      const tx = await this.budgetContract.approveDisbursement(disbursementId, transactionHash, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      console.error('Error approving disbursement on blockchain:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Register a ministry on blockchain
   */
  async registerMinistry(
    name: string,
    code: string,
    walletAddress: string
  ): Promise<{ txHash: string; ministryId: number }> {
    try {
      const tx = await this.budgetContract.registerMinistry(name, code, walletAddress, {
        gasLimit: 300000,
      });

      const receipt = await tx.wait();
      
      // Extract ministry ID from event (ethers v6)
      let ministryId = 0;
      if (receipt && receipt.logs) {
        const iface = this.budgetContract.interface;
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed && parsed.name === 'MinistryRegistered') {
              ministryId = Number(parsed.args.ministryId);
              break;
            }
          } catch (e) {
            // Not this event, continue
          }
        }
      }

      return {
        txHash: receipt.hash,
        ministryId
      };
    } catch (error: any) {
      console.error('Error registering ministry on blockchain:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Get ministry ID by wallet address
   */
  async getMinistryIdByAddress(walletAddress: string): Promise<number | null> {
    try {
      const ministryId = await this.budgetContract.ministryAddresses(walletAddress);
      return ministryId > 0 ? Number(ministryId) : null;
    } catch (error: any) {
      console.error('Error getting ministry ID by address:', error);
      return null;
    }
  }

  /**
   * Get ministry data from blockchain
   */
  async getMinistry(ministryId: number): Promise<any> {
    try {
      return await this.budgetContract.getMinistry(ministryId);
    } catch (error: any) {
      console.error('Error getting ministry from blockchain:', error);
      return null;
    }
  }

  /**
   * Get allocation from blockchain
   */
  async getAllocation(allocationId: number): Promise<any> {
    try {
      return await this.budgetContract.getAllocation(allocationId);
    } catch (error: any) {
      console.error('Error getting allocation from blockchain:', error);
      return null;
    }
  }

  /**
   * Get disbursement from blockchain
   */
  async getDisbursement(disbursementId: number): Promise<any> {
    try {
      return await this.budgetContract.getDisbursement(disbursementId);
    } catch (error: any) {
      console.error('Error getting disbursement from blockchain:', error);
      return null;
    }
  }

  /**
   * Check if wallet has sufficient balance for gas
   */
  async checkBalance(): Promise<{ balance: string; hasEnough: boolean }> {
    try {
      const balance = await this.wallet.getBalance();
      const balanceInMatic = ethers.formatEther(balance);
      // Check if balance is at least 0.01 MATIC (for gas)
      const hasEnough = balance >= ethers.parseEther('0.01');
      
      return {
        balance: balanceInMatic,
        hasEnough
      };
    } catch (error) {
      console.error('Error checking balance:', error);
      return { balance: '0', hasEnough: false };
    }
  }
}

// Singleton instance
let serverBlockchainService: ServerBlockchainService | null = null;

export function getServerBlockchainService(): ServerBlockchainService {
  if (!serverBlockchainService) {
    serverBlockchainService = new ServerBlockchainService();
  }
  return serverBlockchainService;
}


