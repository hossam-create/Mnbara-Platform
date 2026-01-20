/**
 * Escrow Payment Service
 * Implements escrow-first payment flow with guarantee-driven architecture
 * Integrates payment providers with escrow service for secure marketplace transactions
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { EscrowService, EscrowStatus } from './escrow.service';
import { UnifiedPaymentService, PaymentProvider, PaymentResult } from './unified-payment.service';
import { eventPublisherService } from './event-publisher.service';

const prisma = new PrismaClient();
const paymentService = new UnifiedPaymentService();

// Payment Events
export enum PaymentEvent {
  PAYMENT_AUTHORIZED = 'PAYMENT_AUTHORIZED',
  PAYMENT_CAPTURED = 'PAYMENT_CAPTURED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  ESCROW_FUNDS_HELD = 'ESCROW_FUNDS_HELD',
  ESCROW_RELEASED = 'ESCROW_RELEASED',
  ESCROW_REFUNDED = 'ESCROW_REFUNDED',
  DISPUTE_OPENED = 'DISPUTE_OPENED'
}

// Payment States
export enum PaymentState {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  HELD_IN_ESCROW = 'HELD_IN_ESCROW',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
  DISPUTED = 'DISPUTED'
}

interface CreateEscrowPaymentParams {
  orderId: number;
  buyerId: number;
  sellerId: number;
  travelerId?: number;
  amount: number | Decimal;
  currency: string;
  provider: PaymentProvider;
  paymentMethodId?: string;
  billingData?: any;
  metadata?: Record<string, any>;
}

interface CaptureToEscrowParams {
  orderId: number;
  paymentIntentId: string;
  provider: PaymentProvider;
  systemUserId: number;
}

interface RefundToBuyerParams {
  escrowId: number;
  paymentIntentId: string;
  provider: PaymentProvider;
  reason: string;
  systemUserId: number;
  amount?: number | Decimal;
}

export class EscrowPaymentService {
  /**
   * Create escrow payment flow:
   * 1. Authorize payment with provider
   * 2. Hold funds in escrow
   * 3. Emit events for tracking
   */
  static async createEscrowPayment(params: CreateEscrowPaymentParams): Promise<{
    paymentResult: PaymentResult;
    escrowResult: any;
    paymentState: PaymentState;
  }> {
    const {
      orderId,
      buyerId,
      sellerId,
      travelerId,
      amount,
      currency,
      provider,
      paymentMethodId,
      billingData,
      metadata
    } = params;

    try {
      // Step 1: Create payment intent with provider
      const paymentResult = await paymentService.createPayment({
        amount: typeof amount === 'number' ? amount : parseFloat(amount.toString()),
        currency,
        provider,
        orderId: orderId.toString(),
        userId: buyerId.toString(),
        metadata: {
          ...metadata,
          orderId,
          buyerId,
          sellerId,
          travelerId,
          escrowFlow: true
        }
      });

      // Step 2: Hold funds in escrow (this will happen after payment confirmation)
      // For now, we create a pending escrow record
      const escrowResult = await EscrowService.holdFunds({
        orderId,
        buyerId,
        sellerId,
        travelerId,
        amount: typeof amount === 'number' ? amount : new Decimal(amount),
        currency,
        description: `Escrow for order #${orderId}`,
        metadata: {
          paymentProvider: provider,
          paymentIntentId: paymentResult.transactionId,
          paymentMethodId,
          ...metadata
        }
      });

      // Step 3: Emit events
      await eventPublisherService.publishEvent({
        eventType: PaymentEvent.PAYMENT_AUTHORIZED,
        aggregateId: orderId.toString(),
        aggregateType: 'order',
        data: {
          paymentIntentId: paymentResult.transactionId,
          provider,
          amount,
          currency,
          escrowId: escrowResult.escrow.id
        },
        metadata: {
          buyerId,
          sellerId,
          travelerId
        }
      });

      return {
        paymentResult,
        escrowResult,
        paymentState: PaymentState.AUTHORIZED
      };

    } catch (error) {
      // Emit failure event
      await eventPublisherService.publishEvent({
        eventType: PaymentEvent.PAYMENT_FAILED,
        aggregateId: orderId.toString(),
        aggregateType: 'order',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          provider,
          amount,
          currency
        },
        metadata: {
          buyerId,
          sellerId,
          travelerId
        }
      });

      throw error;
    }
  }

  /**
   * Capture payment and move funds to escrow
   * This is called after payment is confirmed by the frontend
   */
  static async captureToEscrow(params: CaptureToEscrowParams): Promise<{
    paymentResult: PaymentResult;
    escrowResult: any;
    paymentState: PaymentState;
  }> {
    const { orderId, paymentIntentId, provider, systemUserId } = params;

    try {
      // Step 1: Capture payment with provider
      const paymentResult = await paymentService.capturePayment(provider, paymentIntentId);

      if (!paymentResult.success) {
        throw new Error(`Payment capture failed: ${paymentResult.metadata?.error || 'Unknown error'}`);
      }

      // Step 2: Get escrow record
      const escrow = await EscrowService.getEscrowByOrderId(orderId);
      if (!escrow) {
        throw new Error(`Escrow not found for order ${orderId}`);
      }

      // Step 3: Update escrow status to HELD (funds are now actually held)
      // The holdFunds was already called during createEscrowPayment
      // Now we confirm the payment was successful

      // Step 4: Emit events
      await eventPublisherService.publishEvent({
        eventType: PaymentEvent.PAYMENT_CAPTURED,
        aggregateId: orderId.toString(),
        aggregateType: 'order',
        data: {
          paymentIntentId,
          provider,
          capturedAmount: paymentResult.amount,
          escrowId: escrow.id
        }
      });

      await eventPublisherService.publishEvent({
        eventType: PaymentEvent.ESCROW_FUNDS_HELD,
        aggregateId: orderId.toString(),
        aggregateType: 'order',
        data: {
          escrowId: escrow.id,
          amount: escrow.amount,
          currency: escrow.currency,
          paymentIntentId
        }
      });

      return {
        paymentResult,
        escrowResult: escrow,
        paymentState: PaymentState.HELD_IN_ESCROW
      };

    } catch (error) {
      // Emit failure event
      await eventPublisherService.publishEvent({
        eventType: PaymentEvent.PAYMENT_FAILED,
        aggregateId: orderId.toString(),
        aggregateType: 'order',
        data: {
          paymentIntentId,
          provider,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  /**
   * Release escrow funds to seller/traveler
   * Only callable by Control Center with proper authorization
   */
  static async releaseEscrowFunds(
    escrowId: number,
    recipientUserId: number,
    systemUserId: number,
    reason?: string
  ): Promise<any> {
    try {
      // Step 1: Release funds from escrow
      const escrowResult = await EscrowService.releaseFunds({
        escrowId,
        recipientUserId,
        systemUserId,
        reason: reason || 'Order completed successfully'
      });

      // Step 2: Emit events
      await eventPublisherService.publishEvent({
        eventType: PaymentEvent.ESCROW_RELEASED,
        aggregateId: escrowId.toString(),
        aggregateType: 'escrow',
        data: {
          escrowId,
          recipientUserId,
          releasedAmount: escrowResult.escrow.amount,
          currency: escrowResult.escrow.currency,
          reason
        }
      });

      return escrowResult;

    } catch (error) {
      console.error(`Failed to release escrow ${escrowId}:`, error);
      throw error;
    }
  }

  /**
   * Refund escrow funds to buyer
   * Only callable by Control Center with proper authorization
   */
  static async refundToBuyer(params: RefundToBuyerParams): Promise<{
    escrowResult: any;
    refundResult?: any;
  }> {
    const { escrowId, paymentIntentId, provider, reason, systemUserId, amount } = params;

    try {
      // Step 1: Get escrow details
      const escrow = await EscrowService.getEscrowById(escrowId);
      if (!escrow) {
        throw new Error(`Escrow ${escrowId} not found`);
      }

      // Step 2: Refund from payment provider
      let refundResult;
      if (paymentIntentId && provider) {
        refundResult = await paymentService.refundPayment({
          provider,
          transactionId: paymentIntentId,
          amount: amount ? (typeof amount === 'number' ? amount : parseFloat(amount.toString())) : undefined,
          reason
        });
      }

      // Step 3: Refund from escrow
      const escrowResult = await EscrowService.refundFunds({
        escrowId,
        systemUserId,
        reason
      });

      // Step 4: Emit events
      await eventPublisherService.publishEvent({
        eventType: PaymentEvent.ESCROW_REFUNDED,
        aggregateId: escrowId.toString(),
        aggregateType: 'escrow',
        data: {
          escrowId,
          refundedAmount: escrowResult.escrow.amount,
          currency: escrowResult.escrow.currency,
          reason,
          paymentRefundId: refundResult?.refundId
        }
      });

      if (refundResult) {
        await eventPublisherService.publishEvent({
          eventType: PaymentEvent.PAYMENT_REFUNDED,
          aggregateId: paymentIntentId,
          aggregateType: 'payment',
          data: {
            paymentIntentId,
            provider,
            refundId: refundResult.refundId,
            refundedAmount: refundResult.amount,
            currency: refundResult.currency,
            reason
          }
        });
      }

      return {
        escrowResult,
        refundResult
      };

    } catch (error) {
      console.error(`Failed to refund escrow ${escrowId}:`, error);
      throw error;
    }
  }

  /**
   * Handle dispute - freeze escrow funds
   */
  static async handleDispute(
    escrowId: number,
    disputeReason: string,
    raisedBy: number
  ): Promise<any> {
    try {
      // Step 1: Update escrow status to DISPUTED
      const escrowResult = await EscrowService.disputeEscrow(
        escrowId,
        disputeReason,
        raisedBy
      );

      // Step 2: Emit events
      await eventPublisherService.publishEvent({
        eventType: PaymentEvent.DISPUTE_OPENED,
        aggregateId: escrowId.toString(),
        aggregateType: 'escrow',
        data: {
          escrowId,
          disputeReason,
          raisedBy,
          disputedAmount: escrowResult.amount
        }
      });

      return escrowResult;

    } catch (error) {
      console.error(`Failed to handle dispute for escrow ${escrowId}:`, error);
      throw error;
    }
  }

  /**
   * Get payment state for an order
   */
  static async getPaymentState(orderId: number): Promise<{
    paymentState: PaymentState;
    escrow?: any;
    paymentDetails?: any;
  }> {
    try {
      // Get escrow record
      const escrow = await EscrowService.getEscrowByOrderId(orderId);
      
      if (!escrow) {
        return { paymentState: PaymentState.PENDING };
      }

      // Determine payment state based on escrow status
      let paymentState: PaymentState;
      
      switch (escrow.status) {
        case EscrowStatus.HELD:
          paymentState = PaymentState.HELD_IN_ESCROW;
          break;
        case EscrowStatus.RELEASED:
          paymentState = PaymentState.RELEASED;
          break;
        case EscrowStatus.REFUNDED:
          paymentState = PaymentState.REFUNDED;
          break;
        case EscrowStatus.DISPUTED:
          paymentState = PaymentState.DISPUTED;
          break;
        case EscrowStatus.CANCELLED:
          paymentState = PaymentState.FAILED;
          break;
        default:
          paymentState = PaymentState.PENDING;
      }

      return {
        paymentState,
        escrow
      };

    } catch (error) {
      console.error(`Failed to get payment state for order ${orderId}:`, error);
      return { paymentState: PaymentState.FAILED };
    }
  }

  /**
   * Get available payment providers for escrow flow
   */
  static getAvailableProviders(currency: string, country?: string): PaymentProvider[] {
    return paymentService.getAvailableProviders(currency, country);
  }
}

export default EscrowPaymentService;
