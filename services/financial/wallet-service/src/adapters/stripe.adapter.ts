import { 
  PaymentGateway, 
  PaymentIntentRequest, 
  PaymentIntentResponse, 
  PaymentStatus, 
  WebhookEventRequest, 
  WebhookResult 
} from '../interfaces/payment-gateway.interface';
import * as crypto from 'crypto';
import axios from 'axios';

export class StripeAdapter implements PaymentGateway {
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(apiKey: string, webhookSecret: string) {
    if (!apiKey || apiKey === 'mock_key') throw new Error('Stripe API Key is required for Production');
    if (!webhookSecret || webhookSecret === 'mock_secret') throw new Error('Stripe Webhook Secret is required for Production');
    
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      // Form-URL-Encoded body for Stripe
      const data = new URLSearchParams();
      data.append('amount', request.amount.toString());
      data.append('currency', request.currency.toLowerCase());
      data.append('metadata[referenceId]', request.referenceId);
      if (request.description) data.append('description', request.description);
      if (request.metadata) {
        Object.entries(request.metadata).forEach(([key, value]) => {
          data.append(`metadata[${key}]`, String(value));
        });
      }

      const response = await axios.post(`${this.baseUrl}/payment_intents`, data, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const pi = response.data;
      return {
        gatewayId: pi.id,
        clientSecret: pi.client_secret,
        status: this.mapStatus(pi.status),
        rawResponse: pi,
      };
    } catch (error: any) {
      console.error('Stripe createPaymentIntent failed:', error.response?.data || error.message);
      throw new Error(`Stripe Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getPaymentDetails(referenceId: string): Promise<PaymentIntentResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/payment_intents/${referenceId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const pi = response.data;
      return {
        gatewayId: pi.id,
        status: this.mapStatus(pi.status),
        rawResponse: pi,
      };
    } catch (error: any) {
      throw new Error(`Stripe GetDetails Failed: ${error.message}`);
    }
  }

  async verifyWebhook(request: WebhookEventRequest): Promise<WebhookResult> {
    const signature = request.headers['stripe-signature'];
    if (!signature) {
      throw new Error('Missing Stripe-Signature header');
    }

    if (!request.rawBody) {
      throw new Error('Raw body required for Stripe signature verification');
    }

    // Parse signature header: t=TIMESTAMP,v1=SIGNATURE
    const parts = signature.split(',').reduce((acc: any, part: string) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {});

    if (!parts.t || !parts.v1) {
      throw new Error('Invalid signature format');
    }

    // Verify timestamp (prevents replay attacks) - 5 minute tolerance
    const timestamp = parseInt(parts.t, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > 300) {
      throw new Error('Webhook signature timestamp too old');
    }

    // Compute HMAC
    const signedPayload = `${parts.t}.${request.rawBody.toString('utf8')}`;
    const hmac = crypto.createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    // Constant-time comparison
    const trusted = Buffer.from(hmac);
    const untrusted = Buffer.from(parts.v1);
    
    // Ensure lengths match before comparing to avoid leaking length info
    if (trusted.length !== untrusted.length || !crypto.timingSafeEqual(trusted, untrusted)) {
      throw new Error('Invalid Webhook Signature');
    }

    const event = request.body; // Body is already parsed JSON per interface, strict parse checked by sig
    
    // Map Event
    let eventType: WebhookResult['eventType'] = 'OTHER';
    if (event.type === 'payment_intent.succeeded') {
      eventType = 'PAYMENT_SUCCESS';
    } else if (event.type === 'payment_intent.payment_failed') {
      eventType = 'PAYMENT_FAILED';
    } else if (event.type.startsWith('charge.refunded')) {
      eventType = 'REFUND';
    }

    const obj = event.data?.object || {};

    return {
      verified: true,
      gatewayReferenceId: obj.id, // payment_intent id
      internalReferenceId: obj.metadata?.referenceId,
      eventType,
      amount: obj.amount ? BigInt(obj.amount) : undefined,
      currency: obj.currency,
      metadata: obj.metadata,
    };
  }

  mapStatus(gatewayStatus: string): PaymentStatus {
    switch (gatewayStatus) {
      case 'succeeded': return PaymentStatus.COMPLETED;
      case 'processing': return PaymentStatus.PENDING;
      case 'requires_payment_method': 
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING; // Still pending user action
      case 'canceled': return PaymentStatus.CANCELLED;
      case 'failed': return PaymentStatus.FAILED;
      default: return PaymentStatus.PENDING;
    }
  }
}

