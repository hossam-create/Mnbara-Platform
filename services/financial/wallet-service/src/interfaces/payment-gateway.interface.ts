export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentIntentRequest {
  amount: bigint;
  currency: string;
  referenceId: string; // Internal Order/Wallet Top-up ID
  description?: string;
  metadata?: Record<string, any>;
  customerEmail?: string;
  customerName?: string;
  paymentMethod?: string; // card, wallet, etc.
}

export interface PaymentIntentResponse {
  gatewayId: string; // The ID from the payment provider
  clientSecret?: string; // For client-side SDKs (Stripe)
  redirectUrl?: string; // For redirect flows (Paymob 3DS)
  status: PaymentStatus;
  rawResponse?: any; // For debugging
}

export interface WebhookEventRequest {
  headers: any;
  body: any;
  rawBody: Buffer; // Often required for signature verification (Stripe)
}

export interface WebhookResult {
  verified: boolean;
  gatewayReferenceId: string; // The ID from the gateway
  internalReferenceId?: string; // Our internal ID if strictly recoverable
  eventType: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'REFUND' | 'OTHER';
  amount?: bigint;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface PaymentGateway {
  /**
   * Initializes a payment intent/order on the gateway.
   */
  createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse>;

  /**
   * Verifies the webhook signature and parses the event.
   * MUST throw error if signature is invalid.
   */
  verifyWebhook(request: WebhookEventRequest): Promise<WebhookResult>;

  /**
   * Fetch current status of a payment from the gateway.
   * Used for reconciliation.
   */
  getPaymentDetails(gatewayReferenceId: string): Promise<PaymentIntentResponse>;

  /**
   * Maps gateway specific status strings to our internal enum.
   */
  mapStatus(gatewayStatus: string): PaymentStatus;
}
