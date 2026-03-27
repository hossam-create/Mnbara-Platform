import { RequestService } from './RequestService';
import { RequestStatus } from '../models/enums/RequestStatus';
import { PaymentIntegrationService } from './PaymentIntegrationService';
import { NotificationService } from './NotificationService';

export class StateTransitionService {
  private paymentService: PaymentIntegrationService;
  private notificationService: NotificationService;

  constructor(private requestService: RequestService) {
    this.paymentService = new PaymentIntegrationService();
    this.notificationService = new NotificationService();
  }

  async transitionStatus(
    requestId: string,
    toStatus: RequestStatus,
    userId: string,
    reason?: string
  ): Promise<any> {
    return await this.requestService.transitionStatus(requestId, toStatus, userId, reason);
  }

  /**
   * Accept request and create payment intent
   * Transition: VISIBLE_TO_TRAVELERS → ACCEPTED → AWAITING_PAYMENT
   */
  async acceptRequest(requestId: string, travelerId: string, requestData: any): Promise<any> {
    console.log(`[StateTransitionService] Accepting request ${requestId} by traveler ${travelerId}`);

    // Check if traveler has active requests
    const hasActiveRequest = await this.requestService.hasActiveRequest(travelerId);
    if (hasActiveRequest) {
      console.error(`[StateTransitionService] Traveler ${travelerId} already has an active request`);
      throw new Error('Traveler already has an active request');
    }

    // Transition to ACCEPTED
    console.log(`[StateTransitionService] Transitioning request ${requestId} to ACCEPTED`);
    const acceptedRequest = await this.transitionStatus(
      requestId,
      RequestStatus.ACCEPTED,
      travelerId,
      'Request accepted by traveler'
    );

    // Transition to AWAITING_PAYMENT
    console.log(`[StateTransitionService] Transitioning request ${requestId} to AWAITING_PAYMENT`);
    const awaitingPaymentRequest = await this.transitionStatus(
      requestId,
      RequestStatus.AWAITING_PAYMENT,
      travelerId,
      'Awaiting payment from buyer'
    );

    // Create PaymentIntent
    try {
      console.log(`[StateTransitionService] Creating payment intent for request ${requestId}`);
      const paymentIntent = await this.paymentService.createPaymentIntent({
        requestId,
        buyerId: requestData.requesterId,
        sellerId: travelerId,
        amount: requestData.product.price,
        currency: requestData.product.currency || 'USD',
        description: `Payment for Request ${requestId} - ${requestData.product.title}`,
      });

      // Store payment intent ID in request
      await this.requestService.updateRequestPaymentInfo(requestId, {
        paymentIntentId: paymentIntent.paymentIntentId,
        paymentClientSecret: paymentIntent.clientSecret,
        paymentAmount: paymentIntent.amount,
        paymentPlatformFee: paymentIntent.platformFee,
        paymentTotalAmount: paymentIntent.totalAmount,
      });

      console.log(`[StateTransitionService] Payment intent created: ${paymentIntent.paymentIntentId}`);

      // Send payment link to buyer via notification service
      const paymentLink = `${process.env.FRONTEND_URL || 'https://app.mnbara.com'}/pay/${paymentIntent.clientSecret}`;
      
      await this.notificationService.sendPaymentLink({
        userId: requestData.requesterId,
        requestId,
        paymentLink,
        amount: paymentIntent.totalAmount,
        currency: requestData.product.currency || 'USD',
        deadline: requestData.delivery.deadline,
        productTitle: requestData.product.title,
      });

      // Send request accepted notification to buyer
      await this.notificationService.sendRequestAccepted(
        requestData.requesterId,
        requestId,
        requestData.product.title,
        'Traveler' // TODO: Get traveler name from user service
      );

      return {
        ...awaitingPaymentRequest,
        paymentIntent: {
          id: paymentIntent.paymentIntentId,
          clientSecret: paymentIntent.clientSecret,
          amount: paymentIntent.totalAmount,
        },
      };
    } catch (error: any) {
      console.error(`[StateTransitionService] Failed to create payment intent:`, error.message);
      // Rollback to ACCEPTED state
      await this.transitionStatus(requestId, RequestStatus.ACCEPTED, travelerId, 'Payment intent creation failed');
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Handle successful payment webhook
   * Transition: AWAITING_PAYMENT → IN_PROGRESS
   * Called by payment webhook after payment_intent.succeeded
   */
  async handlePaymentSuccess(requestId: string, paymentIntentId: string, requestData: any): Promise<any> {
    console.log(`[StateTransitionService] Handling payment success for request ${requestId}`);

    // Lock funds in wallet
    try {
      console.log(`[StateTransitionService] Locking funds for request ${requestId}`);
      const fundsLocked = await this.paymentService.lockFunds({
        userId: requestData.requesterId,
        amount: requestData.product.price,
        requestId,
        currency: requestData.product.currency || 'USD',
      });

      if (!fundsLocked) {
        console.error(`[StateTransitionService] Failed to lock funds for request ${requestId}`);
        throw new Error('Failed to lock funds in escrow');
      }

      console.log(`[StateTransitionService] Funds locked successfully for request ${requestId}`);

      // Update escrow status
      await this.requestService.updateRequestPaymentInfo(requestId, {
        escrowStatus: 'HELD',
        escrowCreatedAt: new Date(),
      });

      // Transition to IN_PROGRESS
      console.log(`[StateTransitionService] Transitioning request ${requestId} to IN_PROGRESS`);
      const inProgressRequest = await this.transitionStatus(
        requestId,
        RequestStatus.IN_PROGRESS,
        requestData.travelerId,
        'Payment confirmed, delivery can start'
      );

      console.log(`[StateTransitionService] Request ${requestId} transitioned to IN_PROGRESS successfully`);

      // Send delivery started notification to buyer
      await this.notificationService.sendDeliveryStarted(
        requestData.requesterId,
        requestId,
        requestData.product.title
      );

      return inProgressRequest;
    } catch (error: any) {
      console.error(`[StateTransitionService] Failed to handle payment success:`, error.message);
      throw error;
    }
  }

  /**
   * Start delivery (manual transition if needed)
   * Transition: IN_PROGRESS (already done by payment webhook)
   */
  async startDelivery(requestId: string, travelerId: string): Promise<any> {
    console.log(`[StateTransitionService] Starting delivery for request ${requestId}`);
    return await this.transitionStatus(requestId, RequestStatus.IN_PROGRESS, travelerId, 'Delivery started');
  }

  /**
   * Complete delivery
   * Transition: IN_PROGRESS → DELIVERED
   * Release funds to traveler and deduct platform fee
   */
  async completeDelivery(requestId: string, travelerId: string, requestData: any): Promise<any> {
    console.log(`[StateTransitionService] Completing delivery for request ${requestId}`);

    try {
      // Release funds to traveler
      console.log(`[StateTransitionService] Releasing funds to traveler ${travelerId}`);
      const fundsReleased = await this.paymentService.releaseFunds({
        requestId,
        toUserId: travelerId,
      });

      if (!fundsReleased) {
        console.error(`[StateTransitionService] Failed to release funds for request ${requestId}`);
        throw new Error('Failed to release funds to traveler');
      }

      console.log(`[StateTransitionService] Funds released successfully to traveler ${travelerId}`);

      // Deduct platform fee
      const platformFee = requestData.paymentPlatformFee || (requestData.product.price * 0.07);
      console.log(`[StateTransitionService] Deducting platform fee: ${platformFee}`);
      const feeDeducted = await this.paymentService.deductPlatformFee(
        travelerId,
        platformFee,
        requestId
      );

      if (!feeDeducted) {
        console.warn(`[StateTransitionService] Failed to deduct platform fee for request ${requestId}`);
        // Don't throw - fee deduction failure shouldn't block delivery completion
      }

      // Update escrow status
      await this.requestService.updateRequestPaymentInfo(requestId, {
        escrowStatus: 'RELEASED',
        escrowReleasedAt: new Date(),
      });

      // Transition to DELIVERED
      console.log(`[StateTransitionService] Transitioning request ${requestId} to DELIVERED`);
      const deliveredRequest = await this.transitionStatus(
        requestId,
        RequestStatus.DELIVERED,
        travelerId,
        'Delivery completed successfully'
      );

      console.log(`[StateTransitionService] Delivery completed successfully for request ${requestId}`);

      // Send funds received notification to traveler
      await this.notificationService.sendFundsReceived({
        userId: travelerId,
        requestId,
        amount: requestData.product.price,
        platformFee: platformFee,
        currency: requestData.product.currency || 'USD',
        productTitle: requestData.product.title,
      });

      // Send delivery completed notification to buyer
      await this.notificationService.sendDeliveryCompleted(
        requestData.requesterId,
        requestId,
        requestData.product.title
      );

      return deliveredRequest;
    } catch (error: any) {
      console.error(`[StateTransitionService] Failed to complete delivery:`, error.message);
      throw error;
    }
  }

  /**
   * Cancel request
   * Handle cancellation at different stages:
   * - AWAITING_PAYMENT: Cancel PaymentIntent
   * - After payment: Refund funds
   */
  async cancelRequest(requestId: string, userId: string, reason: string, requestData: any): Promise<any> {
    console.log(`[StateTransitionService] Cancelling request ${requestId} by user ${userId}`);
    console.log(`[StateTransitionService] Current status: ${requestData.status}`);

    try {
      // Handle cancellation based on current status
      if (requestData.status === RequestStatus.AWAITING_PAYMENT) {
        // Cancel PaymentIntent
        if (requestData.paymentIntentId) {
          console.log(`[StateTransitionService] Cancelling payment intent ${requestData.paymentIntentId}`);
          await this.paymentService.cancelPaymentIntent(requestData.paymentIntentId);
        }

        // Update payment info
        await this.requestService.updateRequestPaymentInfo(requestId, {
          paymentStatus: 'CANCELLED',
        });

        console.log(`[StateTransitionService] Payment intent cancelled for request ${requestId}`);
      } else if (
        requestData.status === RequestStatus.IN_PROGRESS ||
        requestData.status === RequestStatus.DELIVERED
      ) {
        // Refund funds to buyer
        console.log(`[StateTransitionService] Refunding funds for request ${requestId}`);
        const fundsRefunded = await this.paymentService.refundFunds({
          requestId,
        });

        if (!fundsRefunded) {
          console.error(`[StateTransitionService] Failed to refund funds for request ${requestId}`);
          throw new Error('Failed to refund funds to buyer');
        }

        console.log(`[StateTransitionService] Funds refunded successfully for request ${requestId}`);

        // Create Stripe refund
        if (requestData.paymentIntentId) {
          console.log(`[StateTransitionService] Creating Stripe refund for ${requestData.paymentIntentId}`);
          await this.paymentService.createStripeRefund(requestData.paymentIntentId);
        }

        // Update escrow status
        await this.requestService.updateRequestPaymentInfo(requestId, {
          escrowStatus: 'REFUNDED',
          escrowRefundedAt: new Date(),
        });

        console.log(`[StateTransitionService] Refund completed for request ${requestId}`);
      }

      // Transition to CANCELLED
      console.log(`[StateTransitionService] Transitioning request ${requestId} to CANCELLED`);
      const cancelledRequest = await this.transitionStatus(
        requestId,
        RequestStatus.CANCELLED,
        userId,
        reason || 'Request cancelled'
      );

      console.log(`[StateTransitionService] Request ${requestId} cancelled successfully`);

      return cancelledRequest;
    } catch (error: any) {
      console.error(`[StateTransitionService] Failed to cancel request:`, error.message);
      throw error;
    }
  }

  async expireRequest(requestId: string, userId: string): Promise<any> {
    console.log(`[StateTransitionService] Expiring request ${requestId}`);
    return await this.transitionStatus(requestId, RequestStatus.EXPIRED, userId, 'Request expired - deadline passed');
  }
}
