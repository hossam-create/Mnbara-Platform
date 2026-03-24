import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly notificationServiceUrl: string;

  constructor() {
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    email: string,
    orderNumber: string,
    orderDetails: {
      totalAmount: number;
      currency: string;
      items: Array<{ productName: string; quantity: number; price: number }>;
      deliveryAddress: string;
    },
  ): Promise<void> {
    try {
      const subject = `Order Confirmation - ${orderNumber}`;
      const body = this.generateOrderConfirmationEmail(orderNumber, orderDetails);

      await axios.post(`${this.notificationServiceUrl}/api/notifications/email`, {
        to: email,
        subject,
        body,
      });
    } catch (error: any) {
      // Log error but don't fail order creation
      console.error('Failed to send order confirmation email:', error.message);
      // In production, you might want to queue this for retry
    }
  }

  /**
   * Generate order confirmation email body
   */
  private generateOrderConfirmationEmail(
    orderNumber: string,
    orderDetails: {
      totalAmount: number;
      currency: string;
      items: Array<{ productName: string; quantity: number; price: number }>;
      deliveryAddress: string;
    },
  ): string {
    const itemsList = orderDetails.items
      .map((item) => `  - ${item.productName} x${item.quantity} - ${orderDetails.currency} ${item.price * item.quantity}`)
      .join('\n');

    return `
Thank you for your order!

Order Number: ${orderNumber}

Order Summary:
${itemsList}

Total: ${orderDetails.currency} ${orderDetails.totalAmount}

Delivery Address:
${orderDetails.deliveryAddress}

We'll send you tracking information once your order ships.

Thank you for shopping with MNBARA!
    `.trim();
  }
}





