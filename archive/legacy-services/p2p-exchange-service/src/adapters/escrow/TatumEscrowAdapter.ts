import axios, { AxiosInstance } from 'axios';
import { Decimal } from 'decimal.js';
import crypto from 'crypto';
import {
  ExternalEscrowAdapter,
  EscrowMetadata,
  EscrowCreationResult,
  EscrowStatus,
  EscrowStatusResult,
  WebhookPayload,
  WebhookResult
} from './ExternalEscrowAdapter';

/**
 * Tatum.io Escrow Adapter
 * 
 * Integrates with Tatum.io blockchain escrow services.
 * Tatum provides smart contract-based escrow on multiple blockchains.
 * 
 * Features:
 * - Multi-blockchain support (Ethereum, BSC, Polygon, etc.)
 * - Smart contract escrow
 * - Webhook notifications
 * - Automatic release/refund
 */
export class TatumEscrowAdapter implements ExternalEscrowAdapter {
  private client: AxiosInstance;
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    webhookSecret: string,
    baseUrl: string = 'https://api.tatum.io/v3'
  ) {
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
    this.baseUrl = baseUrl;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Create a new escrow on Tatum blockchain
   */
  async createEscrow(
    amount: Decimal,
    currency: string,
    metadata: EscrowMetadata
  ): Promise<EscrowCreationResult> {
    try {
      const response = await this.client.post('/blockchain/escrow', {
        amount: amount.toString(),
        currency: this.mapCurrencyToBlockchain(currency),
        sender: metadata.senderAddress || this.generateAddress(),
        recipient: metadata.recipientAddress || this.generateAddress(),
        releaseConditions: {
          type: 'MANUAL',
          approver: metadata.platformAddress || process.env.TATUM_PLATFORM_ADDRESS
        },
        metadata: {
          matchId: metadata.matchId,
          senderUserId: metadata.senderUserId,
          recipientUserId: metadata.recipientUserId,
          platform: 'Mnbara',
          description: metadata.description || `P2P Exchange Match #${metadata.matchId}`
        },
        expirationTime: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });

      return {
        escrowId: response.data.escrowId,
        status: this.mapTatumStatus(response.data.status),
        createdAt: new Date(response.data.createdAt),
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined
      };
    } catch (error: any) {
      throw new Error(`Tatum escrow creation failed: ${error.message}`);
    }
  }

  /**
   * Release escrow funds to recipient
   */
  async releaseEscrow(escrowId: string): Promise<void> {
    try {
      await this.client.post(`/blockchain/escrow/${escrowId}/release`, {
        approverSignature: this.generateApproverSignature(escrowId, 'release')
      });
    } catch (error: any) {
      throw new Error(`Tatum escrow release failed: ${error.message}`);
    }
  }

  /**
   * Refund escrow funds to sender
   */
  async refundEscrow(escrowId: string): Promise<void> {
    try {
      await this.client.post(`/blockchain/escrow/${escrowId}/refund`, {
        approverSignature: this.generateApproverSignature(escrowId, 'refund')
      });
    } catch (error: any) {
      throw new Error(`Tatum escrow refund failed: ${error.message}`);
    }
  }

  /**
   * Get current escrow status
   */
  async getStatus(escrowId: string): Promise<EscrowStatusResult> {
    try {
      const response = await this.client.get(`/blockchain/escrow/${escrowId}`);

      return {
        escrowId: response.data.escrowId,
        status: this.mapTatumStatus(response.data.status),
        amount: new Decimal(response.data.amount),
        currency: response.data.currency,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined,
        transactionHash: response.data.transactionHash
      };
    } catch (error: any) {
      throw new Error(`Tatum escrow status check failed: ${error.message}`);
    }
  }

  /**
   * Handle webhook events from Tatum
   */
  async handleWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload)) {
      return {
        processed: false,
        error: 'Invalid webhook signature'
      };
    }

    try {
      const { event, data } = payload;

      switch (event) {
        case 'escrow.created':
          await this.handleEscrowCreated(data);
          break;
        case 'escrow.deposited':
          await this.handleEscrowDeposited(data);
          break;
        case 'escrow.released':
          await this.handleEscrowReleased(data);
          break;
        case 'escrow.refunded':
          await this.handleEscrowRefunded(data);
          break;
        case 'escrow.expired':
          await this.handleEscrowExpired(data);
          break;
        default:
          return {
            processed: false,
            error: `Unknown event type: ${event}`
          };
      }

      return {
        processed: true,
        escrowId: data.escrowId,
        status: this.mapTatumStatus(data.status)
      };
    } catch (error: any) {
      return {
        processed: false,
        error: error.message
      };
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload: WebhookPayload): boolean {
    if (!payload.signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload.data))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(payload.signature),
      Buffer.from(expectedSignature)
    );
  }

  // Private helper methods

  private async handleEscrowCreated(data: any): Promise<void> {
    // Emit event for internal processing
    console.log(`Escrow created: ${data.escrowId}`);
  }

  private async handleEscrowDeposited(data: any): Promise<void> {
    // Emit event for internal processing
    console.log(`Escrow deposited: ${data.escrowId}`);
  }

  private async handleEscrowReleased(data: any): Promise<void> {
    // Emit event for internal processing
    console.log(`Escrow released: ${data.escrowId}`);
  }

  private async handleEscrowRefunded(data: any): Promise<void> {
    // Emit event for internal processing
    console.log(`Escrow refunded: ${data.escrowId}`);
  }

  private async handleEscrowExpired(data: any): Promise<void> {
    // Emit event for internal processing
    console.log(`Escrow expired: ${data.escrowId}`);
  }

  private mapTatumStatus(tatumStatus: string): EscrowStatus {
    const statusMap: Record<string, EscrowStatus> = {
      'PENDING': EscrowStatus.PENDING,
      'DEPOSITED': EscrowStatus.DEPOSITED,
      'RELEASED': EscrowStatus.RELEASED,
      'REFUNDED': EscrowStatus.REFUNDED,
      'EXPIRED': EscrowStatus.EXPIRED,
      'FAILED': EscrowStatus.FAILED
    };

    return statusMap[tatumStatus] || EscrowStatus.PENDING;
  }

  private mapCurrencyToBlockchain(currency: string): string {
    // Map fiat currencies to stablecoins on blockchain
    const currencyMap: Record<string, string> = {
      'USD': 'USDT',
      'EUR': 'EURS',
      'SAR': 'USDT', // Use USDT for SAR
      'AED': 'USDT'
    };

    return currencyMap[currency] || currency;
  }

  private generateAddress(): string {
    // Generate a temporary address (in production, this would be user's wallet)
    return `0x${crypto.randomBytes(20).toString('hex')}`;
  }

  private generateApproverSignature(escrowId: string, action: string): string {
    // Generate platform signature for escrow action
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(`${escrowId}:${action}`)
      .digest('hex');
  }
}
