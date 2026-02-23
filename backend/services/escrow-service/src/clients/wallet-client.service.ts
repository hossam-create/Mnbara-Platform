import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

interface HoldFundsRequest {
  userId: string; amount: number; escrowId: string; reason: string; currency?: string;
}
interface ReleaseFundsRequest {
  escrowId: string; toUserId: string; amount: number; currency?: string;
}
interface RefundFundsRequest {
  escrowId: string; toUserId: string; amount: number; currency?: string;
}
interface WalletResponse {
  success: boolean; data?: any; error?: string;
}

@Injectable()
export class WalletClientService {
  private readonly logger = new Logger(WalletClientService.name);
  private client: AxiosInstance;
  private retries = 3;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('WALLET_SERVICE_URL') || 'http://localhost:3005';
    this.client = axios.create({ baseURL, timeout: 10000, headers: { 'Content-Type': 'application/json' } });
  }

  async holdFunds(request: HoldFundsRequest): Promise<WalletResponse> {
    try {
      this.logger.log(`Holding funds for escrow ${request.escrowId}: ${request.amount} from user ${request.userId}`);
      const response = await this.retryRequest(() =>
        this.client.post('/api/v2/escrow/hold', {
          userId: request.userId, amount: request.amount, escrowId: request.escrowId,
          reason: request.reason, currency: request.currency || 'EGP',
        }),
      );
      if (response.data.success) return { success: true, data: response.data.data };
      return { success: false, error: response.data.error || 'Failed to hold funds' };
    } catch (error) {
      return this.handleError(error, 'holdFunds');
    }
  }

  async releaseFunds(request: ReleaseFundsRequest): Promise<WalletResponse> {
    try {
      this.logger.log(`Releasing funds for escrow ${request.escrowId}: ${request.amount} to user ${request.toUserId}`);
      const response = await this.retryRequest(() =>
        this.client.post('/api/v2/escrow/release', {
          escrowId: request.escrowId, toUserId: request.toUserId,
          amount: request.amount, currency: request.currency || 'EGP',
        }),
      );
      if (response.data.success) return { success: true, data: response.data.data };
      return { success: false, error: response.data.error || 'Failed to release funds' };
    } catch (error) {
      return this.handleError(error, 'releaseFunds');
    }
  }

  async refundFunds(request: RefundFundsRequest): Promise<WalletResponse> {
    try {
      this.logger.log(`Refunding funds for escrow ${request.escrowId}: ${request.amount} to user ${request.toUserId}`);
      const response = await this.retryRequest(() =>
        this.client.post('/api/v2/escrow/refund', {
          escrowId: request.escrowId, toUserId: request.toUserId,
          amount: request.amount, currency: request.currency || 'EGP',
        }),
      );
      if (response.data.success) return { success: true, data: response.data.data };
      return { success: false, error: response.data.error || 'Failed to refund funds' };
    } catch (error) {
      return this.handleError(error, 'refundFunds');
    }
  }

  async checkBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get(`/api/v2/wallets/owner/USER/${userId}`),
      );
      if (response.data.success && response.data.data) {
        return parseFloat(response.data.data.availableBalance || '0') >= amount;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async retryRequest<T>(requestFn: () => Promise<T>, attempt: number = 1): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.retries) throw error;
      const delay = Math.pow(2, attempt - 1) * 1000;
      this.logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  private handleError(error: any, operation: string): WalletResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        this.logger.error(`Wallet API ${operation} failed: ${axiosError.response.status}`);
        return { success: false, error: (axiosError.response.data as any)?.error || axiosError.message };
      }
      if (axiosError.request) {
        return { success: false, error: 'Wallet service is not responding' };
      }
    }
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}
