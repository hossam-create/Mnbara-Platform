import axios from 'axios';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008';

export interface SendPaymentLinkRequest {
  userId: string;
  requestId: string;
  paymentLink: string;
  amount: number;
  currency: string;
  deadline: Date;
  productTitle: string;
}

export interface SendFundsReceivedRequest {
  userId: string;
  requestId: string;
  amount: number;
  platformFee: number;
  currency: string;
  productTitle: string;
}

export interface SendPaymentFailedRequest {
  userId: string;
  requestId: string;
  productTitle: string;
  errorMessage?: string;
}

/**
 * Notification Service Integration
 * Handles sending notifications to users
 */
export class NotificationService {
  /**
   * Send payment link to buyer
   */
  async sendPaymentLink(request: SendPaymentLinkRequest): Promise<boolean> {
    try {
      console.log('[NotificationService] Sending payment link:', {
        userId: request.userId,
        requestId: request.requestId,
      });

      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/payment-link`,
        {
          userId: request.userId,
          requestId: request.requestId,
          type: 'PAYMENT_LINK',
          title: 'Complete Your Payment',
          message: `Please complete payment for "${request.productTitle}". Amount: ${request.currency} ${request.amount.toFixed(2)}`,
          data: {
            paymentLink: request.paymentLink,
            amount: request.amount,
            currency: request.currency,
            deadline: request.deadline,
            productTitle: request.productTitle,
          },
          priority: 'HIGH',
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[NotificationService] Payment link sent successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[NotificationService] Failed to send payment link:', error.message);
      // Don't throw - notification failure shouldn't block the main flow
      return false;
    }
  }

  /**
   * Send funds received notification to traveler
   */
  async sendFundsReceived(request: SendFundsReceivedRequest): Promise<boolean> {
    try {
      console.log('[NotificationService] Sending funds received notification:', {
        userId: request.userId,
        requestId: request.requestId,
        amount: request.amount,
      });

      const netAmount = request.amount - request.platformFee;

      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/funds-received`,
        {
          userId: request.userId,
          requestId: request.requestId,
          type: 'FUNDS_RECEIVED',
          title: 'Funds Received',
          message: `You've received ${request.currency} ${netAmount.toFixed(2)} for delivering "${request.productTitle}". Platform fee: ${request.currency} ${request.platformFee.toFixed(2)}`,
          data: {
            amount: request.amount,
            platformFee: request.platformFee,
            netAmount,
            currency: request.currency,
            productTitle: request.productTitle,
          },
          priority: 'MEDIUM',
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[NotificationService] Funds received notification sent successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[NotificationService] Failed to send funds received notification:', error.message);
      // Don't throw - notification failure shouldn't block the main flow
      return false;
    }
  }

  /**
   * Send payment failed notification to buyer
   */
  async sendPaymentFailed(request: SendPaymentFailedRequest): Promise<boolean> {
    try {
      console.log('[NotificationService] Sending payment failed notification:', {
        userId: request.userId,
        requestId: request.requestId,
      });

      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/payment-failed`,
        {
          userId: request.userId,
          requestId: request.requestId,
          type: 'PAYMENT_FAILED',
          title: 'Payment Failed',
          message: `Your payment for "${request.productTitle}" failed. ${request.errorMessage || 'Please try again.'}`,
          data: {
            productTitle: request.productTitle,
            errorMessage: request.errorMessage,
          },
          priority: 'HIGH',
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[NotificationService] Payment failed notification sent successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[NotificationService] Failed to send payment failed notification:', error.message);
      // Don't throw - notification failure shouldn't block the main flow
      return false;
    }
  }

  /**
   * Send request accepted notification to buyer
   */
  async sendRequestAccepted(userId: string, requestId: string, productTitle: string, travelerName: string): Promise<boolean> {
    try {
      console.log('[NotificationService] Sending request accepted notification:', {
        userId,
        requestId,
      });

      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/request-accepted`,
        {
          userId,
          requestId,
          type: 'REQUEST_ACCEPTED',
          title: 'Request Accepted',
          message: `${travelerName} has accepted your request for "${productTitle}". Please complete payment to proceed.`,
          data: {
            productTitle,
            travelerName,
          },
          priority: 'HIGH',
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[NotificationService] Request accepted notification sent successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[NotificationService] Failed to send request accepted notification:', error.message);
      return false;
    }
  }

  /**
   * Send delivery started notification to buyer
   */
  async sendDeliveryStarted(userId: string, requestId: string, productTitle: string): Promise<boolean> {
    try {
      console.log('[NotificationService] Sending delivery started notification:', {
        userId,
        requestId,
      });

      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/delivery-started`,
        {
          userId,
          requestId,
          type: 'DELIVERY_STARTED',
          title: 'Delivery Started',
          message: `Your delivery for "${productTitle}" has started. You can track the progress in your requests.`,
          data: {
            productTitle,
          },
          priority: 'MEDIUM',
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[NotificationService] Delivery started notification sent successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[NotificationService] Failed to send delivery started notification:', error.message);
      return false;
    }
  }

  /**
   * Send delivery completed notification to buyer
   */
  async sendDeliveryCompleted(userId: string, requestId: string, productTitle: string): Promise<boolean> {
    try {
      console.log('[NotificationService] Sending delivery completed notification:', {
        userId,
        requestId,
      });

      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/delivery-completed`,
        {
          userId,
          requestId,
          type: 'DELIVERY_COMPLETED',
          title: 'Delivery Completed',
          message: `Your delivery for "${productTitle}" has been completed. Please confirm receipt.`,
          data: {
            productTitle,
          },
          priority: 'HIGH',
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[NotificationService] Delivery completed notification sent successfully');
      return response.status === 200;
    } catch (error: any) {
      console.error('[NotificationService] Failed to send delivery completed notification:', error.message);
      return false;
    }
  }
}
