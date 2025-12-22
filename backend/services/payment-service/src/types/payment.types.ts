/**
 * Payment Service Types
 */

// Payment Provider Types
export type PaymentProvider = 'stripe' | 'paypal' | 'paymob';

export type PaymentStatus = 
    | 'pending'
    | 'processing'
    | 'requires_action'
    | 'succeeded'
    | 'failed'
    | 'canceled'
    | 'refunded';

export type PaymentMethod = 
    | 'card'
    | 'paypal'
    | 'mobile_wallet'
    | 'bank_transfer';

// Common Payment Interfaces
export interface PaymentRequest {
    amount: number;
    currency: string;
    provider: PaymentProvider;
    orderId?: string;
    userId?: string;
    metadata?: Record<string, any>;
}

export interface PaymentResult {
    success: boolean;
    provider: PaymentProvider;
    transactionId: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
}

export interface RefundRequest {
    transactionId: string;
    provider: PaymentProvider;
    amount?: number; // Partial refund if specified
    reason?: string;
}

export interface RefundResult {
    success: boolean;
    refundId: string;
    status: string;
    amount: number;
    currency: string;
}

// Webhook Event Types
export interface WebhookEvent {
    provider: PaymentProvider;
    eventType: string;
    transactionId?: string;
    orderId?: string;
    status: PaymentStatus;
    amount?: number;
    currency?: string;
    rawData: any;
}

// Billing Data (used by Paymob)
export interface BillingData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

// Stripe-specific types
export interface StripePaymentIntentRequest {
    amount: number;
    currency?: string;
    captureMethod?: 'automatic' | 'manual';
    metadata?: Record<string, string>;
}

// PayPal-specific types
export interface PayPalOrderRequest {
    amount: number;
    currency?: string;
    description?: string;
    returnUrl?: string;
    cancelUrl?: string;
}

// Paymob-specific types
export interface PaymobPaymentRequest {
    amount: number;
    currency?: string;
    billingData: BillingData;
    merchantOrderId?: string;
}

export interface PaymobWalletRequest extends PaymobPaymentRequest {
    mobileNumber: string;
}
