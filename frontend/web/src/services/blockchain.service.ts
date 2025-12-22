// ============================================
// ⛓️ Blockchain Service - Frontend Integration
// ============================================

import { apiClient } from './api.service';
import type { ApiResponse } from '../types';

export interface BlockchainBalance {
  address: string;
  balance: string;
  formattedBalance: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
}

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenValue?: string;
  tokenSymbol?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  contractAddress: string;
}

export interface WalletInfo {
  address: string;
  ethBalance: string;
  formattedEthBalance: string;
  tokens: BlockchainBalance[];
  transactions: BlockchainTransaction[];
}

export interface BlockchainEvent {
  type: 'new_transaction';
  data: BlockchainTransaction;
}

class BlockchainService {
  private baseUrl = '/blockchain';

  private ensureData<T>(response: ApiResponse<T>, context: string): T {
    if (!response.success || response.data === undefined || response.data === null) {
      throw new Error(response.message || `Failed to ${context}`);
    }
    return response.data;
  }

  // Get wallet information including ETH balance and token balances
  async getWalletInfo(address: string): Promise<WalletInfo> {
    const response = await apiClient.get<ApiResponse<WalletInfo>>(
      `${this.baseUrl}/wallet/${address}`
    );
    return this.ensureData(response.data, 'get wallet info');
  }

  // Get MNBToken balance for a specific address
  async getMNBTokenBalance(address: string): Promise<BlockchainBalance> {
    const response = await apiClient.get<ApiResponse<BlockchainBalance>>(
      `${this.baseUrl}/token/mnbt/balance/${address}`
    );
    return this.ensureData(response.data, 'get MNBToken balance');
  }

  // Get all token balances for a specific address
  async getTokenBalances(address: string): Promise<BlockchainBalance[]> {
    const response = await apiClient.get<ApiResponse<BlockchainBalance[]>>(
      `${this.baseUrl}/tokens/balances/${address}`
    );
    return this.ensureData(response.data, 'get token balances');
  }

  // Get transaction history for a specific address
  async getTransactionHistory(
    address: string,
    limit: number = 50,
    page: number = 1
  ): Promise<BlockchainTransaction[]> {
    const response = await apiClient.get<ApiResponse<BlockchainTransaction[]>>(
      `${this.baseUrl}/transactions/${address}`,
      { params: { limit, page } }
    );
    return this.ensureData(response.data, 'get transaction history');
  }

  // Get MNBToken information
  async getMNBTokenInfo(): Promise<TokenInfo> {
    const response = await apiClient.get<ApiResponse<TokenInfo>>(
      `${this.baseUrl}/token/mnbt/info`
    );
    return this.ensureData(response.data, 'get token info');
  }

  // Transfer MNBToken to another address
  async transferMNBToken(
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string
  ): Promise<{ transactionHash: string }> {
    const response = await apiClient.post<ApiResponse<{ transactionHash: string }>>(
      `${this.baseUrl}/token/mnbt/transfer`,
      { fromAddress, toAddress, amount, privateKey }
    );
    return this.ensureData(response.data, 'transfer MNBToken');
  }

  // Get gas price estimation
  async getGasPrice(): Promise<{ gasPrice: string }> {
    const response = await apiClient.get<ApiResponse<{ gasPrice: string }>>(
      `${this.baseUrl}/gas/price`
    );
    return this.ensureData(response.data, 'get gas price');
  }

  // Get transaction status
  async getTransactionStatus(txHash: string): Promise<BlockchainTransaction> {
    const response = await apiClient.get<ApiResponse<BlockchainTransaction>>(
      `${this.baseUrl}/transaction/${txHash}`
    );
    return this.ensureData(response.data, 'get transaction status');
  }

  // Get network information
  async getNetworkInfo(): Promise<{
    chainId: number;
    networkName: string;
    blockNumber: number;
    gasLimit: string;
  }> {
    const response = await apiClient.get<ApiResponse<{
      chainId: number;
      networkName: string;
      blockNumber: number;
      gasLimit: string;
    }>>(`${this.baseUrl}/network/info`);
    return this.ensureData(response.data, 'get network info');
  }

  // Subscribe to address events (WebSocket)
  subscribeToAddressEvents(
    address: string,
    callback: (event: BlockchainEvent) => void
  ): () => void {
    // This would typically use WebSocket connection
    // For now, we'll implement polling or use server-sent events
    const interval = setInterval(async () => {
      try {
        const transactions = await this.getTransactionHistory(address, 1, 1);
        if (transactions.length > 0) {
          callback({ type: 'new_transaction', data: transactions[0] });
        }
      } catch (error) {
        console.error('Error polling for transactions:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;