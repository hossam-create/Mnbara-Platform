import { Decimal } from 'decimal.js';

/**
 * External Escrow Adapter Interface
 * 
 * Defines the contract that all external escrow providers must implement.
 * This allows the platform to integrate with multiple escrow providers
 * (Tatum.io, Stripe, PayPal, etc.) through a unified interface.
 */

export interface EscrowMetadata {
  matchId: number;
  senderUserId: number;
  recipientUserId: number;
  senderAddress?: string;
  recipientAddress?: string;
  platformAddress?: string;
  description?: string;
}

export interface EscrowCreationResult {
  escrowId: string;
  status: EscrowStatus;
  createdAt: Date;
  expiresAt?: Date;
}

export enum EscrowStatus {
  PENDING = 'PENDING',
  DEPOSITED = 'DEPOSITED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED'
}

export interface EscrowStatusResult {
  escrowId: string;
  status: EscrowStatus;
  amount: Decimal;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  transactionHash?: string;
}

export interface WebhookPayload {
  event: string;
  data: any;
  signature?: string;
  timestamp: Date;
}

export interface WebhookResult {
  processed: boolean;
  escrowId?: string;
  status?: EscrowStatus;
  error?: string;
}

/**
 * External Escrow Adapter Interface
 */
export interface ExternalEscrowAdapter {
  /**
   * Create a new escrow on the external provider
   */
  createEscrow(
    amount: Decimal,
    currency: string,
    metadata: EscrowMetadata
  ): Promise<EscrowCreationResult>;

  /**
   * Release escrow funds to the recipient
   */
  releaseEscrow(escrowId: string): Promise<void>;

  /**
   * Refund escrow funds to the sender
   */
  refundEscrow(escrowId: string): Promise<void>;

  /**
   * Get the current status of an escrow
   */
  getStatus(escrowId: string): Promise<EscrowStatusResult>;

  /**
   * Handle webhook events from the provider
   */
  handleWebhook(payload: WebhookPayload): Promise<WebhookResult>;

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload: WebhookPayload): boolean;
}
