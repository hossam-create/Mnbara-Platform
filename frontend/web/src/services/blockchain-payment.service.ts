// ============================================
// 🪙 Blockchain Payment Service
// Handles MNB token payments via smart contracts
// ============================================

import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';

// Contract ABIs for payment operations
const MNB_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

const MNB_EXCHANGE_ABI = [
  'function swap(uint256 pairId, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin) returns (uint256)',
  'function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)',
  'function getPrice(address token) view returns (uint256)',
  'event SwapExecuted(uint256 indexed pairId, address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)',
];

// Contract addresses
const CONTRACT_ADDRESSES = {
  mnbToken: import.meta.env.VITE_MNB_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  mnbExchange: import.meta.env.VITE_MNB_EXCHANGE_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  platformWallet: import.meta.env.VITE_PLATFORM_WALLET_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
};

// Types
export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  mnbAmount?: string;
  usdAmount?: number;
  error?: string;
}

export interface PaymentQuote {
  usdAmount: number;
  mnbAmount: string;
  mnbPrice: number;
  estimatedGas: string;
  isValid: boolean;
  error?: string;
}

export interface WalletInfo {
  address: string;
  mnbBalance: string;
  ethBalance: string;
  isConnected: boolean;
}

class BlockchainPaymentService {
  private provider: BrowserProvider | null = null;
  private mnbTokenContract: Contract | null = null;
  private mnbExchangeContract: Contract | null = null;

  // Initialize provider and contracts
  async initialize(): Promise<boolean> {
    if (!window.ethereum) {
      return false;
    }

    try {
      this.provider = new BrowserProvider(window.ethereum);
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

      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain payment service:', error);
      return false;
    }
  }

  // Get wallet info
  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.provider || !this.mnbTokenContract) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      const signer = await this.provider!.getSigner();
      const address = await signer.getAddress();
      
      const [mnbBalance, ethBalance] = await Promise.all([
        this.mnbTokenContract!.balanceOf(address),
        this.provider!.getBalance(address),
      ]);

      return {
        address,
        mnbBalance: formatEther(mnbBalance),
        ethBalance: formatEther(ethBalance),
        isConnected: true,
      };
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      return null;
    }
  }

  // Get MNB price in USD
  async getMNBPrice(): Promise<number> {
    if (!this.mnbExchangeContract) {
      await this.initialize();
    }

    try {
      const price = await this.mnbExchangeContract!.getPrice(CONTRACT_ADDRESSES.mnbToken);
      // Price is stored with 6 decimals
      return Number(price) / 1_000_000;
    } catch {
      // Return default price if contract call fails
      return 1.0;
    }
  }

  // Get payment quote
  async getPaymentQuote(usdAmount: number): Promise<PaymentQuote> {
    try {
      const mnbPrice = await this.getMNBPrice();
      
      if (mnbPrice <= 0) {
        return {
          usdAmount,
          mnbAmount: '0',
          mnbPrice: 0,
          estimatedGas: '0',
          isValid: false,
          error: 'Unable to fetch MNB price',
        };
      }

      const mnbAmount = usdAmount / mnbPrice;
      
      // Estimate gas for transfer
      let estimatedGas = '0.001'; // Default estimate
      if (this.mnbTokenContract && this.provider) {
        try {
          const signer = await this.provider.getSigner();
          const address = await signer.getAddress();
          const gasEstimate = await this.mnbTokenContract.transfer.estimateGas(
            CONTRACT_ADDRESSES.platformWallet,
            parseEther(mnbAmount.toFixed(18))
          );
          const gasPrice = await this.provider.getFeeData();
          const gasCost = gasEstimate * (gasPrice.gasPrice || BigInt(0));
          estimatedGas = formatEther(gasCost);
        } catch {
          // Use default estimate
        }
      }

      return {
        usdAmount,
        mnbAmount: mnbAmount.toFixed(6),
        mnbPrice,
        estimatedGas,
        isValid: true,
      };
    } catch (error) {
      return {
        usdAmount,
        mnbAmount: '0',
        mnbPrice: 0,
        estimatedGas: '0',
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to get quote',
      };
    }
  }

  // Process MNB payment
  async processPayment(
    usdAmount: number,
    orderId: string,
    recipientAddress?: string
  ): Promise<PaymentResult> {
    if (!this.provider || !this.mnbTokenContract) {
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          success: false,
          error: 'Wallet not connected. Please connect MetaMask.',
        };
      }
    }

    try {
      // Get payment quote
      const quote = await this.getPaymentQuote(usdAmount);
      if (!quote.isValid) {
        return {
          success: false,
          error: quote.error || 'Invalid payment quote',
        };
      }

      // Get signer address
      const signer = await this.provider!.getSigner();
      const signerAddress = await signer.getAddress();

      // Check balance
      const balance = await this.mnbTokenContract!.balanceOf(signerAddress);
      const requiredAmount = parseEther(quote.mnbAmount);

      if (balance < requiredAmount) {
        return {
          success: false,
          error: `Insufficient MNB balance. Required: ${quote.mnbAmount} MNBT, Available: ${formatEther(balance)} MNBT`,
        };
      }

      // Determine recipient
      const recipient = recipientAddress || CONTRACT_ADDRESSES.platformWallet;

      // Execute transfer
      const tx = await this.mnbTokenContract!.transfer(recipient, requiredAmount);
      
      // Wait for confirmation
      const receipt = await tx.wait();

      // Log payment for backend reconciliation
      await this.logPayment({
        orderId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        from: signerAddress,
        to: recipient,
        mnbAmount: quote.mnbAmount,
        usdAmount,
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        mnbAmount: quote.mnbAmount,
        usdAmount,
      };
    } catch (error) {
      console.error('Payment failed:', error);
      
      // Parse common errors
      let errorMessage = 'Payment failed';
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient ETH for gas fees';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Log payment to backend for reconciliation
  private async logPayment(paymentData: {
    orderId: string;
    transactionHash: string;
    blockNumber: number;
    from: string;
    to: string;
    mnbAmount: string;
    usdAmount: number;
  }): Promise<void> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await fetch(`${apiUrl}/payments/blockchain/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(paymentData),
      });
    } catch (error) {
      // Log error but don't fail the payment
      console.error('Failed to log payment to backend:', error);
    }
  }

  // Verify transaction on blockchain
  async verifyTransaction(transactionHash: string): Promise<{
    verified: boolean;
    blockNumber?: number;
    confirmations?: number;
    error?: string;
  }> {
    if (!this.provider) {
      await this.initialize();
    }

    try {
      const receipt = await this.provider!.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return {
          verified: false,
          error: 'Transaction not found',
        };
      }

      const currentBlock = await this.provider!.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        verified: receipt.status === 1,
        blockNumber: receipt.blockNumber,
        confirmations,
      };
    } catch (error) {
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  // Get contract addresses
  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }
}

// Extend Window interface
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
export const blockchainPaymentService = new BlockchainPaymentService();
export default blockchainPaymentService;
