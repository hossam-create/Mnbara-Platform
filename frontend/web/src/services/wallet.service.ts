// ============================================
// 🔗 Blockchain Wallet Service
// ============================================

import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';

// Contract ABIs (simplified for frontend use)
const MNB_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function getKYCTier(address account) view returns (uint256)',
  'function getRemainingDailyLimit(address account) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

const MNB_EXCHANGE_ABI = [
  'function swap(uint256 pairId, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin) returns (uint256)',
  'function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)',
  'function getPairInfo(uint256 pairId) view returns (address, address, uint256, uint256, uint256, bool, uint256)',
  'function getPrice(address token) view returns (uint256)',
  'event SwapExecuted(uint256 indexed pairId, address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)',
];

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  mnbToken: import.meta.env.VITE_MNB_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  mnbExchange: import.meta.env.VITE_MNB_EXCHANGE_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  mnbWallet: import.meta.env.VITE_MNB_WALLET_ADDRESS || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
};

// Supported networks
const SUPPORTED_NETWORKS: Record<number, { name: string; rpcUrl: string }> = {
  1: { name: 'Ethereum Mainnet', rpcUrl: 'https://mainnet.infura.io/v3/' },
  5: { name: 'Goerli Testnet', rpcUrl: 'https://goerli.infura.io/v3/' },
  11155111: { name: 'Sepolia Testnet', rpcUrl: 'https://sepolia.infura.io/v3/' },
  137: { name: 'Polygon Mainnet', rpcUrl: 'https://polygon-rpc.com' },
  80001: { name: 'Mumbai Testnet', rpcUrl: 'https://rpc-mumbai.maticvigil.com' },
  31337: { name: 'Localhost', rpcUrl: 'http://localhost:8545' },
};

// Types
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  mnbBalance: string;
  kycTier: number;
  dailyLimit: string;
  provider: BrowserProvider | null;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
}

// Wallet connection types
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase';

class WalletService {
  private provider: BrowserProvider | null = null;
  private mnbTokenContract: Contract | null = null;
  private mnbExchangeContract: Contract | null = null;

  // Check if MetaMask is installed
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  // Check if any wallet is available
  isWalletAvailable(): boolean {
    return this.isMetaMaskInstalled();
  }

  // Get current network
  async getCurrentNetwork(): Promise<{ chainId: number; name: string } | null> {
    if (!window.ethereum) return null;
    
    try {
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex as string, 16);
      const network = SUPPORTED_NETWORKS[chainId];
      
      return {
        chainId,
        name: network?.name || `Unknown Network (${chainId})`,
      };
    } catch {
      return null;
    }
  }

  // Connect to MetaMask
  async connectMetaMask(): Promise<WalletState> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create provider
      this.provider = new BrowserProvider(window.ethereum!);
      
      // Get chain ID
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      // Initialize contracts
      await this.initializeContracts();

      // Get balances
      const address = accounts[0];
      const balance = await this.getEthBalance(address);
      const mnbBalance = await this.getMNBBalance(address);
      const kycTier = await this.getKYCTier(address);
      const dailyLimit = await this.getDailyLimit(address);

      return {
        isConnected: true,
        address,
        chainId,
        balance,
        mnbBalance,
        kycTier,
        dailyLimit,
        provider: this.provider,
      };
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw error;
    }
  }

  // Connect via WalletConnect (placeholder - requires @walletconnect/web3-provider)
  async connectWalletConnect(): Promise<WalletState> {
    // WalletConnect integration would go here
    // For now, throw an error indicating it's not yet implemented
    throw new Error('WalletConnect integration coming soon. Please use MetaMask.');
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    this.provider = null;
    this.mnbTokenContract = null;
    this.mnbExchangeContract = null;
  }

  // Initialize smart contracts
  private async initializeContracts(): Promise<void> {
    if (!this.provider) return;

    const signer = await this.provider.getSigner();
    
    this.mnbTokenContract = new Contract(
      CONTRACT_ADDRESSES.mnbToken,
      MNB_TOKEN_ABI,
      signer
    );

    this.mnbExchangeContract = new Contract(
      CONTRACT_ADDRESSES.mnbExchange,
      MNB_EXCHANGE_ABI,
      signer
    );
  }

  // Get ETH balance
  async getEthBalance(address: string): Promise<string> {
    if (!this.provider) return '0';
    
    try {
      const balance = await this.provider.getBalance(address);
      return formatEther(balance);
    } catch {
      return '0';
    }
  }

  // Get MNB token balance
  async getMNBBalance(address: string): Promise<string> {
    if (!this.mnbTokenContract) return '0';
    
    try {
      const balance = await this.mnbTokenContract.balanceOf(address);
      return formatEther(balance);
    } catch {
      return '0';
    }
  }

  // Get KYC tier
  async getKYCTier(address: string): Promise<number> {
    if (!this.mnbTokenContract) return 0;
    
    try {
      const tier = await this.mnbTokenContract.getKYCTier(address);
      return Number(tier);
    } catch {
      return 0;
    }
  }

  // Get remaining daily limit
  async getDailyLimit(address: string): Promise<string> {
    if (!this.mnbTokenContract) return '0';
    
    try {
      const limit = await this.mnbTokenContract.getRemainingDailyLimit(address);
      return formatEther(limit);
    } catch {
      return '0';
    }
  }

  // Get MNB token info
  async getTokenInfo(address: string): Promise<TokenInfo | null> {
    if (!this.mnbTokenContract) return null;
    
    try {
      const [name, symbol, decimals, balance] = await Promise.all([
        this.mnbTokenContract.name(),
        this.mnbTokenContract.symbol(),
        this.mnbTokenContract.decimals(),
        this.mnbTokenContract.balanceOf(address),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        balance: balance.toString(),
        balanceFormatted: formatEther(balance),
      };
    } catch {
      return null;
    }
  }

  // Transfer MNB tokens
  async transferMNB(to: string, amount: string): Promise<TransactionResult> {
    if (!this.mnbTokenContract) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const amountWei = parseEther(amount);
      const tx = await this.mnbTokenContract.transfer(to, amountWei);
      const receipt = await tx.wait();
      
      return {
        success: true,
        hash: receipt.hash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  // Approve MNB spending
  async approveMNB(spender: string, amount: string): Promise<TransactionResult> {
    if (!this.mnbTokenContract) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const amountWei = parseEther(amount);
      const tx = await this.mnbTokenContract.approve(spender, amountWei);
      const receipt = await tx.wait();
      
      return {
        success: true,
        hash: receipt.hash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Approval failed',
      };
    }
  }

  // Check MNB allowance
  async checkAllowance(owner: string, spender: string): Promise<string> {
    if (!this.mnbTokenContract) return '0';
    
    try {
      const allowance = await this.mnbTokenContract.allowance(owner, spender);
      return formatEther(allowance);
    } catch {
      return '0';
    }
  }

  // Get MNB price in USD (from exchange contract)
  async getMNBPrice(): Promise<number> {
    if (!this.mnbExchangeContract) return 0;
    
    try {
      const price = await this.mnbExchangeContract.getPrice(CONTRACT_ADDRESSES.mnbToken);
      // Price is in 6 decimals (USD cents)
      return Number(price) / 1_000_000;
    } catch {
      // Return default price if contract call fails
      return 1.0;
    }
  }

  // Pay with MNB tokens (for checkout)
  async payWithMNB(
    recipientAddress: string,
    amountUSD: number,
    _orderId: string
  ): Promise<TransactionResult> {
    if (!this.mnbTokenContract || !this.provider) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // Get MNB price
      const mnbPrice = await this.getMNBPrice();
      if (mnbPrice <= 0) {
        return { success: false, error: 'Unable to get MNB price' };
      }

      // Calculate MNB amount needed
      const mnbAmount = amountUSD / mnbPrice;
      const mnbAmountWei = parseEther(mnbAmount.toFixed(18));

      // Get signer address
      const signer = await this.provider.getSigner();
      const signerAddress = await signer.getAddress();

      // Check balance
      const balance = await this.mnbTokenContract.balanceOf(signerAddress);
      if (balance < mnbAmountWei) {
        return { success: false, error: 'Insufficient MNB balance' };
      }

      // Transfer tokens
      const tx = await this.mnbTokenContract.transfer(recipientAddress, mnbAmountWei);
      const receipt = await tx.wait();

      return {
        success: true,
        hash: receipt.hash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  // Switch network
  async switchNetwork(chainId: number): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error: unknown) {
      // If network doesn't exist, try to add it
      if ((error as { code?: number })?.code === 4902) {
        return this.addNetwork(chainId);
      }
      return false;
    }
  }

  // Add network to wallet
  private async addNetwork(chainId: number): Promise<boolean> {
    const network = SUPPORTED_NETWORKS[chainId];
    if (!network || !window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
        }],
      });
      return true;
    } catch {
      return false;
    }
  }

  // Format address for display
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get contract addresses
  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;
