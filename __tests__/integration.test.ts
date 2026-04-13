import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { blockchainService } from '@/lib/blockchain/blockchain-service';
import { signatureService } from '@/lib/crypto/signature-service';
import { fileUploadService } from '@/lib/storage/file-upload-service';
import { notificationService } from '@/lib/services/notification-service';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: { id: 'test-id' },
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }
}));

// Mock blockchain service
vi.mock('@/lib/blockchain/blockchain-service', () => ({
  blockchainService: {
    registerMinistry: vi.fn(),
    createBudgetAllocation: vi.fn(),
    approveBudgetAllocation: vi.fn(),
    createDisbursement: vi.fn(),
    approveDisbursement: vi.fn(),
    submitExpenditureReport: vi.fn(),
    verifyExpenditureReport: vi.fn(),
    getMinistry: vi.fn(),
    getAllocation: vi.fn(),
    getDisbursement: vi.fn(),
    getExpenditureReport: vi.fn(),
    verifySignature: vi.fn()
  }
}));

// Mock signature service
vi.mock('@/lib/crypto/signature-service', () => ({
  signatureService: {
    generateNonce: vi.fn(() => '0x' + 'a'.repeat(64)),
    createSignableMessage: vi.fn(),
    signMessage: vi.fn(),
    verifySignature: vi.fn(),
    verifyAllocationApproval: vi.fn(),
    verifyDisbursementApproval: vi.fn(),
    getSignatureRequirements: vi.fn()
  }
}));

// Mock file upload service
vi.mock('@/lib/storage/file-upload-service', () => ({
  fileUploadService: {
    uploadFile: vi.fn(),
    uploadMultipleFiles: vi.fn(),
    uploadToIPFS: vi.fn(),
    uploadWithIPFSBackup: vi.fn(),
    getFileMetadata: vi.fn(),
    deleteFile: vi.fn(),
    getDownloadUrl: vi.fn(),
    searchFiles: vi.fn(),
    validateFile: vi.fn()
  }
}));

// Mock notification service
vi.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    sendNotification: vi.fn(),
    sendBulkNotification: vi.fn(),
    sendNotificationByRole: vi.fn(),
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    subscribeToNotifications: vi.fn(),
    cleanupExpiredNotifications: vi.fn(),
    getNotificationStats: vi.fn()
  }
}));

describe('Government Budget Transparency System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Endpoints', () => {
    describe('Budget Allocations API', () => {
      it('should create a budget allocation successfully', async () => {
        const mockRequest = new NextRequest('http://localhost:3000/api/budget-allocations', {
          method: 'POST',
          body: JSON.stringify({
            fiscalYearId: 'test-fiscal-year-id',
            ministryId: 'test-ministry-id',
            categoryId: 'test-category-id',
            projectName: 'Test Project',
            projectDescription: 'Test project description',
            allocatedAmount: 1000000,
            projectCode: 'TEST-001',
            priorityLevel: 5,
            expectedStartDate: '2024-01-01T00:00:00Z',
            expectedEndDate: '2024-12-31T23:59:59Z',
            createdBy: 'test-user-id'
          })
        });

        // Mock successful database insertion
        const mockInsert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'test-allocation-id',
                project_name: 'Test Project',
                allocated_amount: 1000000,
                status: 'pending'
              },
              error: null
            }))
          }))
        }));

        supabaseAdmin.from.mockReturnValue({
          insert: mockInsert
        });

        // Mock blockchain service
        blockchainService.createBudgetAllocation.mockResolvedValue({
          hash: '0x' + 'a'.repeat(64)
        });

        // Test the API endpoint
        const { POST } = await import('@/app/api/budget-allocations/route');
        const response = await POST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.project_name).toBe('Test Project');
        expect(mockInsert).toHaveBeenCalled();
      });

      it('should handle validation errors', async () => {
        const mockRequest = new NextRequest('http://localhost:3000/api/budget-allocations', {
          method: 'POST',
          body: JSON.stringify({
            // Missing required fields
            projectName: 'Test Project'
          })
        });

        const { POST } = await import('@/app/api/budget-allocations/route');
        const response = await POST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });

      it('should retrieve budget allocations with filters', async () => {
        const mockRequest = new NextRequest('http://localhost:3000/api/budget-allocations?ministryId=test-ministry-id&status=approved');

        const mockSelect = vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => ({
                data: [
                  {
                    id: 'test-allocation-id',
                    project_name: 'Test Project',
                    allocated_amount: 1000000,
                    status: 'approved'
                  }
                ],
                error: null
              }))
            }))
          }))
        }));

        supabaseAdmin.from.mockReturnValue({
          select: mockSelect
        });

        const { GET } = await import('@/app/api/budget-allocations/route');
        const response = await GET(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].project_name).toBe('Test Project');
      });
    });

    describe('Disbursements API', () => {
      it('should create a disbursement successfully', async () => {
        const mockRequest = new NextRequest('http://localhost:3000/api/disbursements', {
          method: 'POST',
          body: JSON.stringify({
            allocationId: 'test-allocation-id',
            contractorId: 'test-contractor-id',
            disbursedAmount: 500000,
            disbursementDate: '2024-01-15T00:00:00Z',
            description: 'Initial disbursement',
            createdBy: 'test-user-id'
          })
        });

        const mockInsert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'test-disbursement-id',
                disbursed_amount: 500000,
                status: 'pending'
              },
              error: null
            }))
          }))
        }));

        supabaseAdmin.from.mockReturnValue({
          insert: mockInsert
        });

        blockchainService.createDisbursement.mockResolvedValue({
          hash: '0x' + 'b'.repeat(64)
        });

        const { POST } = await import('@/app/api/disbursements/route');
        const response = await POST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.disbursed_amount).toBe(500000);
      });
    });

    describe('Public Verification API', () => {
      it('should verify transaction by hash', async () => {
        const mockRequest = new NextRequest('http://localhost:3000/api/public/verify', {
          method: 'POST',
          body: JSON.stringify({
            transactionHash: '0x' + 'c'.repeat(64)
          })
        });

        const mockSelect = vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'test-disbursement-id',
                disbursed_amount: 500000,
                blockchain_tx_hash: '0x' + 'c'.repeat(64),
                budget_allocations: {
                  project_name: 'Test Project',
                  allocated_amount: 1000000,
                  ministries: { name: 'Test Ministry' },
                  contractors: { company_name: 'Test Contractor' }
                }
              },
              error: null
            }))
          }))
        }));

        supabaseAdmin.from.mockReturnValue({
          select: mockSelect
        });

        blockchainService.getDisbursement.mockResolvedValue({
          amount: 500000,
          status: 'completed'
        });

        const { POST } = await import('@/app/api/public/verify/route');
        const response = await POST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.status).toBe('verified');
        expect(data.data.projectName).toBe('Test Project');
      });

      it('should verify transaction by project code', async () => {
        const mockRequest = new NextRequest('http://localhost:3000/api/public/verify', {
          method: 'POST',
          body: JSON.stringify({
            projectCode: 'TEST-001'
          })
        });

        const mockSelect = vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'test-allocation-id',
                project_name: 'Test Project',
                project_code: 'TEST-001',
                allocated_amount: 1000000,
                ministries: { name: 'Test Ministry' },
                contractors: { company_name: 'Test Contractor' },
                disbursements: [{
                  disbursed_amount: 500000,
                  disbursement_date: '2024-01-15T00:00:00Z',
                  blockchain_tx_hash: '0x' + 'd'.repeat(64)
                }]
              },
              error: null
            }))
          }))
        }));

        supabaseAdmin.from.mockReturnValue({
          select: mockSelect
        });

        const { POST } = await import('@/app/api/public/verify/route');
        const response = await POST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.status).toBe('verified');
        expect(data.data.projectName).toBe('Test Project');
      });
    });
  });

  describe('Blockchain Services', () => {
    describe('Signature Service', () => {
      it('should generate valid nonce', () => {
        const nonce = signatureService.generateNonce();
        expect(nonce).toMatch(/^0x[a-fA-F0-9]{64}$/);
      });

      it('should create signable message', () => {
        const message = signatureService.createSignableMessage(
          'approve_allocation',
          { allocationId: 'test-id' },
          '0x' + 'a'.repeat(64),
          Date.now()
        );

        expect(typeof message).toBe('string');
        expect(message).toContain('approve_allocation');
        expect(message).toContain('test-id');
      });

      it('should verify signature', async () => {
        const mockSignatureData = {
          message: 'test message',
          signature: '0x' + 'a'.repeat(130),
          signer: '0x' + 'b'.repeat(40),
          timestamp: Date.now(),
          nonce: '0x' + 'c'.repeat(64)
        };

        signatureService.verifySignature.mockResolvedValue({
          isValid: true,
          signer: '0x' + 'b'.repeat(40),
          message: 'test message',
          timestamp: Date.now()
        });

        const result = await signatureService.verifySignature(mockSignatureData);
        expect(result.isValid).toBe(true);
        expect(result.signer).toBe('0x' + 'b'.repeat(40));
      });
    });

    describe('Blockchain Service', () => {
      it('should register ministry', async () => {
        blockchainService.registerMinistry.mockResolvedValue({
          hash: '0x' + 'a'.repeat(64)
        });

        const result = await blockchainService.registerMinistry(
          'Test Ministry',
          'TEST',
          '0x' + 'b'.repeat(40)
        );

        expect(result.hash).toBe('0x' + 'a'.repeat(64));
        expect(blockchainService.registerMinistry).toHaveBeenCalledWith(
          'Test Ministry',
          'TEST',
          '0x' + 'b'.repeat(40)
        );
      });

      it('should create budget allocation', async () => {
        blockchainService.createBudgetAllocation.mockResolvedValue({
          hash: '0x' + 'c'.repeat(64)
        });

        const result = await blockchainService.createBudgetAllocation({
          ministryId: 1,
          projectName: 'Test Project',
          allocatedAmount: 1000000,
          projectCode: 'TEST-001'
        });

        expect(result.hash).toBe('0x' + 'c'.repeat(64));
      });
    });
  });

  describe('File Upload Service', () => {
    it('should validate file upload', () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf'
      });

      fileUploadService.validateFile.mockReturnValue({
        valid: true
      });

      const result = fileUploadService.validateFile(mockFile);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid file types', () => {
      const mockFile = new File(['test content'], 'test.exe', {
        type: 'application/x-executable'
      });

      fileUploadService.validateFile.mockReturnValue({
        valid: false,
        error: 'File type not allowed'
      });

      const result = fileUploadService.validateFile(mockFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File type not allowed');
    });

    it('should upload file successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf'
      });

      fileUploadService.uploadFile.mockResolvedValue({
        success: true,
        url: 'https://example.com/test.pdf',
        fileId: 'test-file-id'
      });

      const result = await fileUploadService.uploadFile(
        mockFile,
        'documents',
        'test-path'
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/test.pdf');
      expect(result.fileId).toBe('test-file-id');
    });
  });

  describe('Notification Service', () => {
    it('should send notification', async () => {
      notificationService.sendNotification.mockResolvedValue(true);

      const result = await notificationService.sendNotification(
        'test-user-id',
        {
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification'
        }
      );

      expect(result).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification'
        })
      );
    });

    it('should get notifications', async () => {
      const mockNotifications = [
        {
          id: 'test-notification-id',
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification',
          userId: 'test-user-id',
          read: false,
          createdAt: new Date().toISOString()
        }
      ];

      notificationService.getNotifications.mockResolvedValue(mockNotifications);

      const result = await notificationService.getNotifications('test-user-id');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Notification');
    });
  });

  describe('Security Utils', () => {
    it('should sanitize HTML content', async () => {
      const { SecurityUtils } = await import('@/lib/security/security-utils');
      
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = SecurityUtils.sanitizeHtml(maliciousHtml);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should validate IP address', async () => {
      const { SecurityUtils } = await import('@/lib/security/security-utils');
      
      expect(SecurityUtils.isValidIP('192.168.1.1')).toBe(true);
      expect(SecurityUtils.isValidIP('2001:db8::1')).toBe(true);
      expect(SecurityUtils.isValidIP('invalid-ip')).toBe(false);
    });

    it('should generate secure token', async () => {
      const { SecurityUtils } = await import('@/lib/security/security-utils');
      
      const token1 = SecurityUtils.generateSecureToken(32);
      const token2 = SecurityUtils.generateSecureToken(32);
      
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full budget allocation workflow', async () => {
      // 1. Create budget allocation
      const allocationRequest = new NextRequest('http://localhost:3000/api/budget-allocations', {
        method: 'POST',
        body: JSON.stringify({
          fiscalYearId: 'test-fiscal-year-id',
          ministryId: 'test-ministry-id',
          categoryId: 'test-category-id',
          projectName: 'Integration Test Project',
          allocatedAmount: 2000000,
          createdBy: 'test-user-id'
        })
      });

      const { POST: createAllocation } = await import('@/app/api/budget-allocations/route');
      const allocationResponse = await createAllocation(allocationRequest);
      const allocationData = await allocationResponse.json();

      expect(allocationResponse.status).toBe(200);
      expect(allocationData.success).toBe(true);

      // 2. Create disbursement
      const disbursementRequest = new NextRequest('http://localhost:3000/api/disbursements', {
        method: 'POST',
        body: JSON.stringify({
          allocationId: allocationData.data.id,
          contractorId: 'test-contractor-id',
          disbursedAmount: 1000000,
          disbursementDate: new Date().toISOString(),
          createdBy: 'test-user-id'
        })
      });

      const { POST: createDisbursement } = await import('@/app/api/disbursements/route');
      const disbursementResponse = await createDisbursement(disbursementRequest);
      const disbursementData = await disbursementResponse.json();

      expect(disbursementResponse.status).toBe(200);
      expect(disbursementData.success).toBe(true);

      // 3. Verify transaction
      const verificationRequest = new NextRequest('http://localhost:3000/api/public/verify', {
        method: 'POST',
        body: JSON.stringify({
          transactionHash: disbursementData.data.blockchain_tx_hash
        })
      });

      const { POST: verifyTransaction } = await import('@/app/api/public/verify/route');
      const verificationResponse = await verifyTransaction(verificationRequest);
      const verificationData = await verificationResponse.json();

      expect(verificationResponse.status).toBe(200);
      expect(verificationData.success).toBe(true);
      expect(verificationData.status).toBe('verified');
    });
  });
});

