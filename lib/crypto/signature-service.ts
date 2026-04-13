import { ethers } from 'ethers';
import { web3Service } from '@/lib/blockchain/web3-service';

export interface SignatureData {
  message: string;
  signature: string;
  signer: string;
  timestamp: number;
  nonce: string;
}

export interface VerificationResult {
  isValid: boolean;
  signer: string;
  message: string;
  timestamp: number;
  error?: string;
}

export class SignatureService {
  private nonceCache: Map<string, number> = new Map();
  private readonly NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a unique nonce for signature verification
   */
  generateNonce(): string {
    return ethers.utils.hexlify(ethers.utils.randomBytes(32));
  }

  /**
   * Create a message to be signed by government officials
   */
  createSignableMessage(
    action: string,
    data: any,
    nonce: string,
    timestamp: number
  ): string {
    const messageData = {
      action,
      data: JSON.stringify(data),
      nonce,
      timestamp,
      domain: 'budget-transparency.gov'
    };

    return JSON.stringify(messageData);
  }

  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message: string): Promise<string> {
    try {
      const signature = await web3Service.signMessage(message);
      return signature;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`);
    }
  }

  /**
   * Verify a digital signature
   */
  async verifySignature(signatureData: SignatureData): Promise<VerificationResult> {
    try {
      // Check nonce validity
      if (!this.isNonceValid(signatureData.nonce)) {
        return {
          isValid: false,
          signer: '',
          message: signatureData.message,
          timestamp: signatureData.timestamp,
          error: 'Invalid or expired nonce'
        };
      }

      // Recover the signer address
      const messageHash = ethers.utils.hashMessage(signatureData.message);
      const recoveredAddress = ethers.utils.verifyMessage(
        signatureData.message,
        signatureData.signature
      );

      // Verify the recovered address matches the claimed signer
      if (recoveredAddress.toLowerCase() !== signatureData.signer.toLowerCase()) {
        return {
          isValid: false,
          signer: recoveredAddress,
          message: signatureData.message,
          timestamp: signatureData.timestamp,
          error: 'Signature does not match claimed signer'
        };
      }

      // Mark nonce as used
      this.markNonceAsUsed(signatureData.nonce);

      return {
        isValid: true,
        signer: recoveredAddress,
        message: signatureData.message,
        timestamp: signatureData.timestamp
      };
    } catch (error) {
      return {
        isValid: false,
        signer: '',
        message: signatureData.message,
        timestamp: signatureData.timestamp,
        error: `Verification failed: ${error}`
      };
    }
  }

  /**
   * Verify signature for budget allocation approval
   */
  async verifyAllocationApproval(
    allocationId: string,
    signatureData: SignatureData,
    expectedSigner: string
  ): Promise<VerificationResult> {
    const verification = await this.verifySignature(signatureData);
    
    if (!verification.isValid) {
      return verification;
    }

    // Verify the signer has authority to approve allocations
    if (verification.signer.toLowerCase() !== expectedSigner.toLowerCase()) {
      return {
        ...verification,
        isValid: false,
        error: 'Signer does not have authority to approve this allocation'
      };
    }

    // Parse the message to verify it's for the correct allocation
    try {
      const messageData = JSON.parse(verification.message);
      if (messageData.action !== 'approve_allocation' || messageData.data.allocationId !== allocationId) {
        return {
          ...verification,
          isValid: false,
          error: 'Signature is not for the correct allocation'
        };
      }
    } catch (error) {
      return {
        ...verification,
        isValid: false,
        error: 'Invalid message format'
      };
    }

    return verification;
  }

  /**
   * Verify signature for disbursement approval
   */
  async verifyDisbursementApproval(
    disbursementId: string,
    signatureData: SignatureData,
    expectedSigner: string
  ): Promise<VerificationResult> {
    const verification = await this.verifySignature(signatureData);
    
    if (!verification.isValid) {
      return verification;
    }

    // Verify the signer has authority to approve disbursements
    if (verification.signer.toLowerCase() !== expectedSigner.toLowerCase()) {
      return {
        ...verification,
        isValid: false,
        error: 'Signer does not have authority to approve this disbursement'
      };
    }

    // Parse the message to verify it's for the correct disbursement
    try {
      const messageData = JSON.parse(verification.message);
      if (messageData.action !== 'approve_disbursement' || messageData.data.disbursementId !== disbursementId) {
        return {
          ...verification,
          isValid: false,
          error: 'Signature is not for the correct disbursement'
        };
      }
    } catch (error) {
      return {
        ...verification,
        isValid: false,
        error: 'Invalid message format'
      };
    }

    return verification;
  }

  /**
   * Check if a nonce is valid (not used and not expired)
   */
  private isNonceValid(nonce: string): boolean {
    const timestamp = this.nonceCache.get(nonce);
    if (!timestamp) {
      return true; // Nonce not seen before
    }

    const now = Date.now();
    return (now - timestamp) < this.NONCE_EXPIRY;
  }

  /**
   * Mark a nonce as used
   */
  private markNonceAsUsed(nonce: string): void {
    this.nonceCache.set(nonce, Date.now());
  }

  /**
   * Clean up expired nonces
   */
  cleanupExpiredNonces(): void {
    const now = Date.now();
    for (const [nonce, timestamp] of this.nonceCache.entries()) {
      if ((now - timestamp) >= this.NONCE_EXPIRY) {
        this.nonceCache.delete(nonce);
      }
    }
  }

  /**
   * Get signature requirements for different actions
   */
  getSignatureRequirements(action: string): {
    requiredRole: string;
    description: string;
    messageTemplate: string;
  } {
    const requirements = {
      'approve_allocation': {
        requiredRole: 'MINISTRY_ADMIN',
        description: 'Approve budget allocation',
        messageTemplate: 'Approve budget allocation for project {projectName}'
      },
      'approve_disbursement': {
        requiredRole: 'MINISTRY_ADMIN',
        description: 'Approve fund disbursement',
        messageTemplate: 'Approve disbursement of {amount} to {contractor}'
      },
      'verify_expenditure': {
        requiredRole: 'FINANCE_OFFICER',
        description: 'Verify expenditure report',
        messageTemplate: 'Verify expenditure report for project {projectName}'
      },
      'audit_transaction': {
        requiredRole: 'AUDITOR',
        description: 'Audit transaction',
        messageTemplate: 'Audit transaction {transactionId}'
      }
    };

    return requirements[action as keyof typeof requirements] || {
      requiredRole: 'UNKNOWN',
      description: 'Unknown action',
      messageTemplate: 'Sign action: {action}'
    };
  }
}

export const signatureService = new SignatureService();

// Clean up expired nonces every 5 minutes
setInterval(() => {
  signatureService.cleanupExpiredNonces();
}, 5 * 60 * 1000);

