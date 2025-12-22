/**
 * Blockchain Service for MNBARA Mobile App
 * Handles MNB token wallet connection and payments
 */

import { apiClient } from './api';

// Types
export interface WalletInfo {
  address: string;
  mnbBalance: string;
  ethBalance: string;
  kycTier: number;
  dailyLimit: string;
  isConnected: boolean;
}

export interface MNBTransaction {
  id: string;
  type: 'send' | 'receive' | 'payment' | 'reward';
  amount: string;
  from: string;
  to: string;
  transactionHash: string;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  description?: string;
}

export interface PaymentQuote {
  usdAmount: number;
  mnbAmount: string;
  mnbPrice: number;
  estimatedGas: string;
  isValid: boolean;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  mnbAmount?: string;
  error?: string;
}

// Contract addresses
const CONTRACT_ADDRESSES = {
  mnbToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  mnbExchange: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  platformWallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
};

// Blockchain Service
export const blockchainService = {
  // Get MNB price from backend
  getMNBPrice: async (): Promise<number> => {
    try {
      const response = await apiClient.get('/payments/mnb/price');
      return response.data?.price || 1.0;
    } catch {
      return 1.0; // Default price
    }
  },

  // Get wallet info from backend (linked wallet)
  getWalletInfo: async (): Promise<WalletInfo | null> => {
    try {
      const response = await apiClient.get('/wallet/blockchain');
      return response.data;
    } catch {
      return null;
    }
  },

  // Link wallet address to account
  linkWallet: async (address: string, signature: string): Promise<boolean> => {
    try {
      await apiClient.post('/wallet/blockchain/link', { address, signature });
      return true;
    } catch {
      return false;
    }
  },

  // Unlink wallet from account
  unlinkWallet: async (): Promise<boolean> => {
    try {
      await apiClient.delete('/wallet/blockchain/link');
      return true;
    } catch {
      return false;
    }
  },

  // Get MNB transaction history
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ transactions: MNBTransaction[]; total: number }> => {
    try {
      const response = await apiClient.get('/wallet/blockchain/transactions', { params });
      return response.data;
    } catch {
      return { transactions: [], total: 0 };
    }
  },

  // Get payment quote
  getPaymentQuote: async (usdAmount: number): Promise<PaymentQuote> => {
    try {
      const response = await apiClient.post('/payments/mnb/quote', { amount: usdAmount });
      return response.data;
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
  },

  // Process MNB payment (backend-initiated)
  processPayment: async (
    orderId: string,
    usdAmount: number
  ): Promise<PaymentResult> => {
    try {
      const response = await apiClient.post('/payments/mnb/process', {
        orderId,
        amount: usdAmount,
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  },

  // Verify transaction
  verifyTransaction: async (transactionHash: string): Promise<{
    verified: boolean;
    confirmations: number;
    status: string;
  }> => {
    try {
      const response = await apiClient.get(`/payments/blockchain/verify/${transactionHash}`);
      return response.data;
    } catch {
      return { verified: false, confirmations: 0, status: 'unknown' };
    }
  },

  // Get contract addresses
  getContractAddresses: () => CONTRACT_ADDRESSES,
};

export default blockchainService;
