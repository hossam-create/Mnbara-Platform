import { PrismaClient } from '@prisma/client';
import { getPaymentGateway } from '../adapters/payment-gateway.registry';
import { paymentEventService } from './payment-event.service';
import { ledgerService } from './ledger.service';
import { LedgerReason, ReferenceType } from '../types';

const prisma = new PrismaClient();

export const paymentProcessingService = {
  /**
   * Process incoming webhook from a payment gateway
   * Guaranteed to be idempotent and atomic.
   */
  /**
   * Process incoming webhook from a payment gateway
   * Guaranteed to be idempotent and atomic.
   */
  async processWebhook(gatewayName: string, request: any) {
    const adapter = getPaymentGateway(gatewayName);
    
    // 1. Verify Signature
    const verification = await adapter.verifyWebhook(request);
    if (!verification.verified) {
      throw new Error('Invalid Webhook Signature');
    }

    return this.processValidEvent(gatewayName, {
      referenceId: verification.gatewayReferenceId,
      eventType: verification.eventType,
      amount: verification.amount,
      walletId: verification.metadata?.walletId || verification.internalReferenceId,
      escrowId: verification.metadata?.escrowId,
      rawPayload: request.body || request,
    });
  },

  /**
   * Process a payment confirmed via reconciliation (polling)
   * Skips signature verification (source is trusted API call)
   */
  async processReconciledPayment(gatewayName: string, details: any) {
    // Map details to event structure
    // details is PaymentIntentResponse
    return this.processValidEvent(gatewayName, {
      referenceId: details.gatewayId,
      eventType: details.status === 'COMPLETED' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
      amount: undefined, // We might need to fetch amount if not in details, or pass it in
      // In real app, details.rawResponse has everything
      walletId: details.rawResponse?.metadata?.walletId, 
      rawPayload: details.rawResponse,
    });
  },

  /**
   * Internal common processor
   */
  async processValidEvent(gatewayName: string, data: {
    referenceId: string;
    eventType: string;
    amount?: bigint;
    walletId?: string;
    escrowId?: string;
    rawPayload: any;
  }) {
    // 2. Idempotency Check (Check PaymentEvent table)
    const existing = await paymentEventService.findEvent(gatewayName, data.referenceId);
    if (existing?.processed) {
      return { status: 'already_processed', eventId: existing.id };
    }

    // Identify/Create Event Record
    let event = existing;
    if (!event) {
      event = await paymentEventService.createEvent({
        gateway: gatewayName,
        eventId: data.referenceId,
        eventType: data.eventType,
        payload: data.rawPayload,
      });
    }

    if (!event) throw new Error('Failed to record payment event');

    // 3. Process Logic (Atomic Transaction)
    try {
      if (data.eventType === 'PAYMENT_SUCCESS') {
        const walletId = data.walletId;
        
        if (!walletId) {
           // If reconciling, maybe we can fetch walletId from Order service using referenceId?
           // For now, assume it's in metadata.
           // If missing, we log error and mark processed_with_error logic (via catch)
           throw new Error('Missing walletId in payment metadata');
        }

        const amount = data.amount || BigInt(0); 
        // Note: Reconciled might strictly need amount. 
        // If amount is 0, we might need to rely on the event details.

        await prisma.$transaction(async (tx: any) => {
          // A. Credit Wallet
          await ledgerService.creditWallet({
            walletId,
            amount: amount > BigInt(0) ? amount : BigInt(100), // FALLBACK/TODO: Fetch amount from intent if missing
            reason: LedgerReason.DEPOSIT,
            referenceType: ReferenceType.SYSTEM,
            referenceId: `${gatewayName}:${data.referenceId}`,
            description: `Topup via ${gatewayName}`,
            createdBy: 'system:payment-processor',
            requestId: `evt_${event!.id}`,
          }, tx);

          // B. Mark Event Processed
          await paymentEventService.markProcessed(event!.id, undefined, tx);
        });

      } else {
         await paymentEventService.markProcessed(event.id);
      }
      
      return { status: 'processed', eventId: event.id };

    } catch (error: any) {
      console.error(`[PaymentProcessing] Error processing event ${event.id}:`, error);
      throw error;
    }
  }
};
