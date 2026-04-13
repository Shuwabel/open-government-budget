import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CredentialVerifier } from '@/components/credential-verifier';
import { WalletConnection } from '@/components/blockchain/wallet-connection';
import { FileUpload } from '@/components/storage/file-upload';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { SignatureVerifier } from '@/components/crypto/signature-verifier';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Web3 service
vi.mock('@/lib/blockchain/web3-service', () => ({
  web3Service: {
    connectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
    getWalletInfo: vi.fn(),
    signMessage: vi.fn(),
    formatAddress: vi.fn((addr) => addr?.slice(0, 6) + '...' + addr?.slice(-4)),
    getTransactionUrl: vi.fn(),
    getAddressUrl: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }
}));

// Mock file upload service
vi.mock('@/lib/storage/file-upload-service', () => ({
  fileUploadService: {
    uploadFile: vi.fn(),
    uploadMultipleFiles: vi.fn(),
    uploadWithIPFSBackup: vi.fn(),
    validateFile: vi.fn(),
  }
}));

// Mock notification service
vi.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    getNotificationStats: vi.fn(),
    subscribeToNotifications: vi.fn(() => ({ unsubscribe: vi.fn() })),
  }
}));

// Mock signature service
vi.mock('@/lib/crypto/signature-service', () => ({
  signatureService: {
    generateNonce: vi.fn(() => '0x' + 'a'.repeat(64)),
    createSignableMessage: vi.fn(),
    signMessage: vi.fn(),
    verifySignature: vi.fn(),
    getSignatureRequirements: vi.fn(() => ({
      requiredRole: 'MINISTRY_ADMIN',
      description: 'Test action',
      messageTemplate: 'Test message'
    })),
  }
}));

describe('UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CredentialVerifier', () => {
    it('should render verification form', () => {
      render(<CredentialVerifier />);
      
      expect(screen.getByText('Search Government Transactions')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter project code or transaction ID')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should handle search input', async () => {
      render(<CredentialVerifier />);
      
      const searchInput = screen.getByPlaceholderText('Enter project code or transaction ID');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(searchInput, { target: { value: 'TEST-001' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('TEST-001');
      });
    });

    it('should handle Enter key press', async () => {
      render(<CredentialVerifier />);
      
      const searchInput = screen.getByPlaceholderText('Enter project code or transaction ID');
      
      fireEvent.change(searchInput, { target: { value: 'TEST-001' } });
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('TEST-001');
      });
    });
  });

  describe('WalletConnection', () => {
    it('should render wallet connection button when not connected', () => {
      const { web3Service } = require('@/lib/blockchain/web3-service');
      web3Service.getWalletInfo.mockResolvedValue(null);
      
      render(<WalletConnection />);
      
      expect(screen.getByText(/connect wallet/i)).toBeInTheDocument();
    });

    it('should render wallet info when connected', async () => {
      const { web3Service } = require('@/lib/blockchain/web3-service');
      web3Service.getWalletInfo.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 137,
        isConnected: true,
        provider: {}
      });
      
      render(<WalletConnection />);
      
      await waitFor(() => {
        expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument();
      });
    });

    it('should handle wallet connection', async () => {
      const { web3Service } = require('@/lib/blockchain/web3-service');
      web3Service.connectWallet.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 137,
        isConnected: true
      });
      
      render(<WalletConnection />);
      
      const connectButton = screen.getByText(/connect wallet/i);
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(web3Service.connectWallet).toHaveBeenCalled();
      });
    });

    it('should handle wallet disconnection', async () => {
      const { web3Service } = require('@/lib/blockchain/web3-service');
      web3Service.getWalletInfo.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 137,
        isConnected: true
      });
      web3Service.disconnectWallet.mockResolvedValue(undefined);
      
      render(<WalletConnection />);
      
      await waitFor(() => {
        const disconnectButton = screen.getByText(/disconnect/i);
        fireEvent.click(disconnectButton);
      });
      
      expect(web3Service.disconnectWallet).toHaveBeenCalled();
    });
  });

  describe('FileUpload', () => {
    it('should render file upload area', () => {
      render(<FileUpload />);
      
      expect(screen.getByText(/drop files here or click to browse/i)).toBeInTheDocument();
      expect(screen.getByText(/choose files/i)).toBeInTheDocument();
    });

    it('should handle file selection', async () => {
      render(<FileUpload />);
      
      const fileInput = screen.getByRole('button', { name: /choose files/i });
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf'
      });
      
      fireEvent.click(fileInput);
      
      // Simulate file selection
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [mockFile],
          writable: false,
        });
        fireEvent.change(input);
      }
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('should handle drag and drop', async () => {
      render(<FileUpload />);
      
      const dropArea = screen.getByText(/drop files here or click to browse/i).closest('div');
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf'
      });
      
      fireEvent.dragEnter(dropArea!);
      fireEvent.dragOver(dropArea!);
      fireEvent.drop(dropArea!, {
        dataTransfer: {
          files: [mockFile]
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('should validate file types', async () => {
      const { fileUploadService } = require('@/lib/storage/file-upload-service');
      fileUploadService.validateFile.mockReturnValue({
        valid: false,
        error: 'File type not allowed'
      });
      
      render(<FileUpload />);
      
      const fileInput = screen.getByRole('button', { name: /choose files/i });
      const mockFile = new File(['test content'], 'test.exe', {
        type: 'application/x-executable'
      });
      
      fireEvent.click(fileInput);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [mockFile],
          writable: false,
        });
        fireEvent.change(input);
      }
      
      await waitFor(() => {
        expect(fileUploadService.validateFile).toHaveBeenCalledWith(mockFile);
      });
    });
  });

  describe('NotificationCenter', () => {
    it('should render notification center', () => {
      const { notificationService } = require('@/lib/services/notification-service');
      notificationService.getNotifications.mockResolvedValue([]);
      notificationService.getNotificationStats.mockResolvedValue({
        total: 0,
        unread: 0,
        byType: {}
      });
      
      render(<NotificationCenter userId="test-user-id" />);
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should display notifications', async () => {
      const { notificationService } = require('@/lib/services/notification-service');
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
      notificationService.getNotificationStats.mockResolvedValue({
        total: 1,
        unread: 1,
        byType: { info: 1 }
      });
      
      render(<NotificationCenter userId="test-user-id" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
        expect(screen.getByText('This is a test notification')).toBeInTheDocument();
      });
    });

    it('should handle notification filters', async () => {
      const { notificationService } = require('@/lib/services/notification-service');
      notificationService.getNotifications.mockResolvedValue([]);
      notificationService.getNotificationStats.mockResolvedValue({
        total: 0,
        unread: 0,
        byType: {}
      });
      
      render(<NotificationCenter userId="test-user-id" />);
      
      const unreadFilter = screen.getByText('Unread');
      fireEvent.click(unreadFilter);
      
      await waitFor(() => {
        expect(notificationService.getNotifications).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({ unreadOnly: true })
        );
      });
    });

    it('should handle mark as read', async () => {
      const { notificationService } = require('@/lib/services/notification-service');
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
      notificationService.getNotificationStats.mockResolvedValue({
        total: 1,
        unread: 1,
        byType: { info: 1 }
      });
      notificationService.markAsRead.mockResolvedValue(true);
      
      render(<NotificationCenter userId="test-user-id" />);
      
      await waitFor(() => {
        const markAsReadButton = screen.getByRole('button', { name: /mark as read/i });
        fireEvent.click(markAsReadButton);
      });
      
      expect(notificationService.markAsRead).toHaveBeenCalledWith('test-notification-id');
    });
  });

  describe('SignatureVerifier', () => {
    it('should render signature verifier', () => {
      render(
        <SignatureVerifier
          action="approve_allocation"
          data={{ allocationId: 'test-id' }}
        />
      );
      
      expect(screen.getByText('Signature Requirements')).toBeInTheDocument();
      expect(screen.getByText('Signable Message')).toBeInTheDocument();
    });

    it('should generate nonce on mount', () => {
      const { signatureService } = require('@/lib/crypto/signature-service');
      
      render(
        <SignatureVerifier
          action="approve_allocation"
          data={{ allocationId: 'test-id' }}
        />
      );
      
      expect(signatureService.generateNonce).toHaveBeenCalled();
    });

    it('should handle signature generation', async () => {
      const { web3Service } = require('@/lib/blockchain/web3-service');
      const { signatureService } = require('@/lib/crypto/signature-service');
      
      web3Service.getWalletInfo.mockResolvedValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      });
      web3Service.signMessage.mockResolvedValue('0x' + 'a'.repeat(130));
      signatureService.signMessage.mockResolvedValue('0x' + 'a'.repeat(130));
      
      render(
        <SignatureVerifier
          action="approve_allocation"
          data={{ allocationId: 'test-id' }}
        />
      );
      
      await waitFor(() => {
        const generateButton = screen.getByText(/generate digital signature/i);
        fireEvent.click(generateButton);
      });
      
      expect(signatureService.signMessage).toHaveBeenCalled();
    });

    it('should handle signature verification', async () => {
      const { signatureService } = require('@/lib/crypto/signature-service');
      signatureService.verifySignature.mockResolvedValue({
        isValid: true,
        signer: '0x1234567890123456789012345678901234567890',
        message: 'test message',
        timestamp: Date.now()
      });
      
      render(
        <SignatureVerifier
          action="approve_allocation"
          data={{ allocationId: 'test-id' }}
        />
      );
      
      // Simulate having a signature
      const verifyButton = screen.getByText(/verify signature/i);
      fireEvent.click(verifyButton);
      
      await waitFor(() => {
        expect(signatureService.verifySignature).toHaveBeenCalled();
      });
    });
  });

  describe('Component Integration', () => {
    it('should handle complete verification workflow', async () => {
      // Mock successful API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          status: 'verified',
          data: {
            projectName: 'Test Project',
            ministry: 'Test Ministry',
            allocatedAmount: '1000000',
            disbursedAmount: '500000',
            contractor: 'Test Contractor',
            disbursementDate: '2024-01-15',
            transactionHash: '0x' + 'a'.repeat(64),
            blockchainNetwork: 'Polygon'
          }
        })
      });
      
      render(<CredentialVerifier />);
      
      const searchInput = screen.getByPlaceholderText('Enter project code or transaction ID');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(searchInput, { target: { value: 'TEST-001' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Transaction Verified')).toBeInTheDocument();
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Test Ministry')).toBeInTheDocument();
      });
    });

    it('should handle error states', async () => {
      // Mock error API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          status: 'not_found',
          message: 'Transaction not found'
        })
      });
      
      render(<CredentialVerifier />);
      
      const searchInput = screen.getByPlaceholderText('Enter project code or transaction ID');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(searchInput, { target: { value: 'INVALID-001' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Transaction Not Found')).toBeInTheDocument();
      });
    });
  });
});

