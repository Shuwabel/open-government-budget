import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
}

export interface ContractAddresses {
  BudgetTransparency: string;
  BudgetCertificate: string;
}

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contractAddresses: ContractAddresses | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.loadContractAddresses();
  }

  /**
   * Load contract addresses from deployment files
   */
  private async loadContractAddresses() {
    try {
      // In production, this would load from actual deployment files
      // For now, we'll use placeholder addresses
      this.contractAddresses = {
        BudgetTransparency: process.env.NEXT_PUBLIC_BUDGET_CONTRACT_ADDRESS || '',
        BudgetCertificate: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS || ''
      };
    } catch (error) {
      console.error('Failed to load contract addresses:', error);
    }
  }

  /**
   * Detect and connect to MetaMask
   */
  async connectWallet(): Promise<WalletInfo> {
    try {
      const ethereum = await detectEthereumProvider();
      
      if (!ethereum) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      // Create provider and signer
      this.provider = new ethers.providers.Web3Provider(ethereum);
      this.signer = this.provider.getSigner();
      
      // Get network info
      const network = await this.provider.getNetwork();
      const address = await this.signer.getAddress();

      const walletInfo: WalletInfo = {
        address,
        chainId: network.chainId,
        isConnected: true,
        provider: this.provider
      };

      // Set up event listeners
      this.setupEventListeners(ethereum);

      this.emit('walletConnected', walletInfo);
      return walletInfo;

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.emit('walletDisconnected', null);
  }

  /**
   * Switch to Polygon network
   */
  async switchToPolygon(): Promise<void> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: '0x89' } // Polygon mainnet
      ]);
    } catch (error: any) {
      // If the chain doesn't exist, add it
      if (error.code === 4902) {
        await this.addPolygonNetwork();
      } else {
        throw error;
      }
    }
  }

  /**
   * Switch to Mumbai testnet
   */
  async switchToMumbai(): Promise<void> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: '0x13881' } // Mumbai testnet
      ]);
    } catch (error: any) {
      // If the chain doesn't exist, add it
      if (error.code === 4902) {
        await this.addMumbaiNetwork();
      } else {
        throw error;
      }
    }
  }

  /**
   * Add Polygon network to wallet
   */
  private async addPolygonNetwork(): Promise<void> {
    await this.provider!.send('wallet_addEthereumChain', [
      {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com'],
      },
    ]);
  }

  /**
   * Add Mumbai testnet to wallet
   */
  private async addMumbaiNetwork(): Promise<void> {
    await this.provider!.send('wallet_addEthereumChain', [
      {
        chainId: '0x13881',
        chainName: 'Mumbai Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com'],
      },
    ]);
  }

  /**
   * Get current wallet info
   */
  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.provider || !this.signer) {
      return null;
    }

    try {
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();

      return {
        address,
        chainId: network.chainId,
        isConnected: true,
        provider: this.provider
      };
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      return null;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  /**
   * Get contract instance
   */
  getContract(contractName: keyof ContractAddresses, abi: any): ethers.Contract | null {
    if (!this.signer || !this.contractAddresses) {
      return null;
    }

    const address = this.contractAddresses[contractName];
    if (!address) {
      console.error(`Contract address not found for ${contractName}`);
      return null;
    }

    return new ethers.Contract(address, abi, this.signer);
  }

  /**
   * Setup event listeners for wallet events
   */
  private setupEventListeners(ethereum: any): void {
    // Account changed
    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnectWallet();
      } else {
        this.connectWallet();
      }
    });

    // Chain changed
    ethereum.on('chainChanged', (chainId: string) => {
      this.emit('chainChanged', parseInt(chainId, 16));
    });

    // Disconnect
    ethereum.on('disconnect', () => {
      this.disconnectWallet();
    });
  }

  /**
   * Event emitter methods
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get transaction URL for block explorer
   */
  getTransactionUrl(txHash: string, chainId?: number): string {
    const currentChainId = chainId || 137; // Default to Polygon
    
    switch (currentChainId) {
      case 137: // Polygon
        return `https://polygonscan.com/tx/${txHash}`;
      case 80001: // Mumbai
        return `https://mumbai.polygonscan.com/tx/${txHash}`;
      default:
        return `https://polygonscan.com/tx/${txHash}`;
    }
  }

  /**
   * Get address URL for block explorer
   */
  getAddressUrl(address: string, chainId?: number): string {
    const currentChainId = chainId || 137; // Default to Polygon
    
    switch (currentChainId) {
      case 137: // Polygon
        return `https://polygonscan.com/address/${address}`;
      case 80001: // Mumbai
        return `https://mumbai.polygonscan.com/address/${address}`;
      default:
        return `https://polygonscan.com/address/${address}`;
    }
  }
}

// Export singleton instance
export const web3Service = new Web3Service();

