/**
 * Resolution Service
 * 
 * Handles dispute resolution including refunds, escrow releases, and partial refunds.
 * Integrates with Stripe, Wallet Service, and Escrow Service.
 */

import { Pool } from 'pg';
import Stripe from 'stripe';
import {
  Dispute,
  DisputeResolution,
  DisputeStatus,
  ResolutionResult
} from '../types/dispute.types';
import {
  RefundFailedError,
  InvalidDisputeStatusError,
  InvalidResolutionPercentageError,
  WalletOperationError,
  EscrowOperationError
} from '../errors/DisputeErrors';
import { logger } from '../utils/logger';

export class ResolutionService {
  private db: Pool;
  private stripe: Stripe;

  constructor(db: Pool) {
    this.db = db;
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16'
    });
  }

  /**
   * Refund buyer (full refund)
   */
  async refundBuyer(
    disputeId: string,
    adminId: number,
    notes?: string
  ): Promise<ResolutionResult> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      logger.info('Processing refund to buyer', { disputeId, adminId });

      // Get dispute and request details
      const { dispute, request } = await this.getDisputeWithRequest(disputeId, client);

      // Validate dispute status
      this.validateDisputeStatus(dispute.status);

      // Process Stripe refund
      const refund = await this.processStripeRefund(
        request.paymentIntentId,
        request.amount,
        'Dispute resolved - refund to buyer'
      );

      // Credit buyer's wallet
      await this.creditWallet(
        request.buyerId,
        request.amount,
        disputeId,
        'DISPUTE_REFUND'
      );

      // Update request status
      await this.updateRequestStatus(request.id, 'REFUNDED', client);

      // Update dispute
      await this.updateDisputeResolution(
        disputeId,
        DisputeResolution.REFUND_BUYER,
        adminId,
        refund.id,
        notes,
        client
      );

      await client.query('COMMIT');

      logger.info('Buyer refund completed', { disputeId, refundId: refund.id });

      return {
        dispute: await this.getDispute(disputeId),
        refund: {
          amount: request.amount,
          stripeRefundId: refund.id
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Buyer refund failed', { disputeId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release to seller (seller wins)
   */
  async releaseToSeller(
    disputeId: string,
    adminId: number,
    notes?: string
  ): Promise<ResolutionResult> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      logger.info('Processing release to seller', { disputeId, adminId });

      // Get dispute and request details
      const { dispute, request } = await this.getDisputeWithRequest(disputeId, client);

      // Validate dispute status
      this.validateDisputeStatus(dispute.status);

      // Release escrow to seller
      const escrowRelease = await this.releaseEscrow(
        request.id,
        request.sellerId,
        request.amount,
        'DISPUTE_RESOLVED'
      );

      // Update request status
      await this.updateRequestStatus(request.id, 'COMPLETED', client);

      // Update dispute
      await this.updateDisputeResolution(
        disputeId,
        DisputeResolution.RELEASE_TO_SELLER,
        adminId,
        null,
        notes,
        client
      );

      await client.query('COMMIT');

      logger.info('Seller release completed', { disputeId });

      return {
        dispute: await this.getDispute(disputeId),
        escrowRelease: {
          amount: request.amount,
          transactionId: escrowRelease.transactionId
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Seller release failed', { disputeId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Partial refund (split between buyer and seller)
   */
  async partialRefund(
    disputeId: string,
    percentage: number,
    adminId: number,
    notes?: string
  ): Promise<ResolutionResult> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      logger.info('Processing partial refund', { disputeId, percentage, adminId });

      // Validate percentage
      if (percentage < 0 || percentage > 100) {
        throw new InvalidResolutionPercentageError(percentage);
      }

      // Get dispute and request details
      const { dispute, request } = await this.getDisputeWithRequest(disputeId, client);

      // Validate dispute status
      this.validateDisputeStatus(dispute.status);

      // Calculate amounts
      const refundAmount = Math.round((request.amount * percentage) / 100);
      const sellerAmount = request.amount - refundAmount;

      logger.info('Partial refund amounts', { 
        total: request.amount,
        refundAmount, 
        sellerAmount,
        percentage 
      });

      // Process Stripe refund (partial)
      const refund = await this.processStripeRefund(
        request.paymentIntentId,
        refundAmount,
        `Dispute resolved - partial refund (${percentage}%)`
      );

      // Credit buyer's wallet
      await this.creditWallet(
        request.buyerId,
        refundAmount,
        disputeId,
        'DISPUTE_PARTIAL_REFUND'
      );

      // Release remaining to seller
      await this.releaseEscrow(
        request.id,
        request.sellerId,
        sellerAmount,
        'DISPUTE_PARTIAL_RELEASE'
      );

      // Update request status
      await this.updateRequestStatus(request.id, 'PARTIALLY_REFUNDED', client);

      // Update dispute
      await this.updateDisputeResolution(
        disputeId,
        DisputeResolution.PARTIAL_REFUND,
        adminId,
        refund.id,
        notes,
        client,
        percentage
      );

      await client.query('COMMIT');

      logger.info('Partial refund completed', { disputeId, refundId: refund.id });

      return {
        dispute: await this.getDispute(disputeId),
        refund: {
          amount: refundAmount,
          stripeRefundId: refund.id
        },
        escrowRelease: {
          amount: sellerAmount,
          transactionId: 'partial-release'
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Partial refund failed', { disputeId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  // Private helper methods

  /**
   * Process Stripe refund
   */
  private async processStripeRefund(
    paymentIntentId: string,
    amount: number,
    reason: string
  ): Promise<Stripe.Refund> {
    try {
      logger.info('Processing Stripe refund', { paymentIntentId, amount });

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          dispute_reason: reason
        }
      });

      logger.info('Stripe refund successful', { refundId: refund.id });

      return refund;
    } catch (error) {
      logger.error('Stripe refund failed', { paymentIntentId, error });
      throw new RefundFailedError(error.message);
    }
  }

  /**
   * Credit wallet (placeholder - integrate with actual wallet service)
   */
  private async creditWallet(
    userId: number,
    amount: number,
    referenceId: string,
    referenceType: string
  ): Promise<void> {
    try {
      logger.info('Crediting wallet', { userId, amount, referenceType });

      // TODO: Integrate with actual WalletService
      // await walletService.credit(userId, amount, referenceType, referenceId, 'DISPUTE');

      // Placeholder implementation
      const query = `
        INSERT INTO wallet_transactions (
          user_id,
          amount,
          type,
          reference_id,
          reference_type,
          description
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await this.db.query(query, [
        userId,
        amount,
        'CREDIT',
        referenceId,
        referenceType,
        `Dispute resolution: ${referenceType}`
      ]);

      logger.info('Wallet credited successfully', { userId, amount });
    } catch (error) {
      logger.error('Wallet credit failed', { userId, error });
      throw new WalletOperationError('credit', error.message);
    }
  }

  /**
   * Release escrow (placeholder - integrate with actual escrow service)
   */
  private async releaseEscrow(
    requestId: number,
    sellerId: number,
    amount: number,
    reason: string
  ): Promise<{ transactionId: string }> {
    try {
      logger.info('Releasing escrow', { requestId, sellerId, amount });

      // TODO: Integrate with actual EscrowService
      // await escrowService.release(requestId, sellerId, amount, reason);

      // Placeholder implementation
      const query = `
        INSERT INTO escrow_releases (
          request_id,
          seller_id,
          amount,
          reason,
          released_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `;

      const result = await this.db.query(query, [
        requestId,
        sellerId,
        amount,
        reason
      ]);

      const transactionId = `escrow-${result.rows[0].id}`;

      logger.info('Escrow released successfully', { requestId, transactionId });

      return { transactionId };
    } catch (error) {
      logger.error('Escrow release failed', { requestId, error });
      throw new EscrowOperationError('release', error.message);
    }
  }

  /**
   * Update request status
   */
  private async updateRequestStatus(
    requestId: number,
    status: string,
    client: any
  ): Promise<void> {
    const query = `
      UPDATE requests
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await client.query(query, [status, requestId]);
  }

  /**
   * Update dispute resolution
   */
  private async updateDisputeResolution(
    disputeId: string,
    resolution: DisputeResolution,
    adminId: number,
    stripeRefundId: string | null,
    notes: string | undefined,
    client: any,
    percentage?: number
  ): Promise<void> {
    const query = `
      UPDATE disputes
      SET 
        status = $1,
        resolution = $2,
        resolution_percentage = $3,
        resolved_by_admin_id = $4,
        stripe_refund_id = $5,
        admin_notes = $6,
        resolved_at = NOW(),
        updated_at = NOW()
      WHERE id = $7
    `;

    await client.query(query, [
      DisputeStatus.RESOLVED,
      resolution,
      percentage || null,
      adminId,
      stripeRefundId,
      notes || null,
      disputeId
    ]);
  }

  /**
   * Get dispute with request details
   */
  private async getDisputeWithRequest(
    disputeId: string,
    client: any
  ): Promise<{ dispute: any; request: any }> {
    const query = `
      SELECT 
        d.*,
        r.id as request_id,
        r.amount as request_amount,
        r.buyer_id as request_buyer_id,
        r.seller_id as request_seller_id,
        r.payment_intent_id as request_payment_intent_id
      FROM disputes d
      INNER JOIN requests r ON d.request_id = r.id
      WHERE d.id = $1
    `;

    const result = await client.query(query, [disputeId]);

    if (result.rows.length === 0) {
      throw new Error(`Dispute not found: ${disputeId}`);
    }

    const row = result.rows[0];

    return {
      dispute: {
        id: row.id,
        status: row.status
      },
      request: {
        id: row.request_id,
        amount: row.request_amount,
        buyerId: row.request_buyer_id,
        sellerId: row.request_seller_id,
        paymentIntentId: row.request_payment_intent_id
      }
    };
  }

  /**
   * Get dispute
   */
  private async getDispute(disputeId: string): Promise<Dispute> {
    const query = `
      SELECT 
        id,
        request_id as "requestId",
        opened_by as "openedBy",
        reason,
        description,
        evidence_urls as "evidenceUrls",
        status,
        resolution,
        resolution_percentage as "resolutionPercentage",
        admin_notes as "adminNotes",
        opened_at as "openedAt",
        reviewed_at as "reviewedAt",
        resolved_at as "resolvedAt",
        closed_at as "closedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM disputes
      WHERE id = $1
    `;

    const result = await this.db.query(query, [disputeId]);
    return result.rows[0];
  }

  /**
   * Validate dispute status
   */
  private validateDisputeStatus(status: DisputeStatus): void {
    if (status !== DisputeStatus.UNDER_REVIEW) {
      throw new InvalidDisputeStatusError(status, 'resolve');
    }
  }
}
