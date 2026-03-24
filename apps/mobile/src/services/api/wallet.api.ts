import { apiClient } from './client';
import { Wallet, Transaction, WalletStats, BankAccount } from '../../domain/entities/wallet.entity';

export interface CreateWalletParams {
  currency: string;
  type: 'personal' | 'business' | 'escrow';
}

export interface TopUpParams {
  walletId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
}

export interface WithdrawParams {
  walletId: string;
  amount: number;
  currency: string;
  bankAccountId: string;
}

export interface TransferParams {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface TransactionFilters {
  walletId?: string;
  type?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

class WalletApiService {
  private static instance: WalletApiService;

  public static getInstance(): WalletApiService {
    if (!WalletApiService.instance) {
      WalletApiService.instance = new WalletApiService();
    }
    return WalletApiService.instance;
  }

  async getWallets(): Promise<Wallet[]> {
    const response = await apiClient.get<Wallet[]>('/api/wallet');
    return response;
  }

  async getWalletById(walletId: string): Promise<Wallet> {
    const response = await apiClient.get<Wallet>(`/api/wallet/${walletId}`);
    return response;
  }

  async getBalance(walletId: string): Promise<{ available: number; pending: number; total: number }> {
    const response = await apiClient.get<{ available: number; pending: number; total: number }>(
      `/api/wallet/${walletId}/balance`
    );
    return response;
  }

  async createWallet(params: CreateWalletParams): Promise<Wallet> {
    const response = await apiClient.post<Wallet>('/api/wallet', params);
    return response;
  }

  async topUp(params: TopUpParams): Promise<Transaction> {
    const response = await apiClient.post<Transaction>('/api/wallet/top-up', params);
    return response;
  }

  async withdraw(params: WithdrawParams): Promise<Transaction> {
    const response = await apiClient.post<Transaction>('/api/wallet/withdraw', params);
    return response;
  }

  async transfer(params: TransferParams): Promise<Transaction> {
    const response = await apiClient.post<Transaction>('/api/wallet/transfer', params);
    return response;
  }

  async getTransactions(filters: TransactionFilters): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    
    const response = await apiClient.get<Transaction[]>(
      `/api/wallet/transactions?${queryParams.toString()}`
    );
    return response;
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/api/wallet/transactions/${transactionId}`);
    return response;
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string, amount: number): Promise<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    fromAmount: number;
    toAmount: number;
  }> {
    const response = await apiClient.get<{
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      fromAmount: number;
      toAmount: number;
    }>(
      `/api/wallet/exchange-rate?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
    );
    return response;
  }

  async linkBankAccount(walletId: string, bankAccountData: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
  }): Promise<{ bankAccountId: string }> {
    const response = await apiClient.post<{ bankAccountId: string }>(
      `/api/wallet/${walletId}/bank-accounts`,
      bankAccountData
    );
    return response;
  }

  async getBankAccounts(walletId: string): Promise<BankAccount[]> {
    const response = await apiClient.get<BankAccount[]>(
      `/api/wallet/${walletId}/bank-accounts`
    );
    return response;
  }
}

export const walletApi = WalletApiService.getInstance();
