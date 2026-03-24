/**
 * Payment Status Verification Utility
 * Ensures payment status is always confirmed via backend
 * No trust in frontend redirect success alone
 */

import { checkoutAPI } from '../services/api/checkoutAPI';

export interface PaymentVerificationResult {
  verified: boolean;
  status: 'succeeded' | 'failed' | 'pending' | 'cancelled' | 'unknown';
  paymentIntentId?: string;
  escrowId?: string;
  amount?: number;
  currency?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Verify payment status via backend only
 * Never trust frontend redirect success alone
 */
export async function verifyPaymentStatus(orderId: string): Promise<PaymentVerificationResult> {
  try {
    // Get payment status from backend
    const response = await checkoutAPI.getPaymentStatus(orderId);
    
    if (!response.success || !response.data.paymentState) {
      return {
        verified: false,
        status: 'unknown',
        error: 'Payment status not found in backend'
      };
    }

    const paymentState = response.data.paymentState;
    const escrow = response.data.escrow;

    // Verify payment status
    switch (paymentState.status) {
      case 'succeeded':
        return {
          verified: true,
          status: 'succeeded',
          paymentIntentId: paymentState.paymentIntentId,
          escrowId: escrow?.id,
          amount: paymentState.amount,
          currency: paymentState.currency,
          metadata: {
            provider: paymentState.provider,
            method: paymentState.method,
            escrowStatus: escrow?.status
          }
        };

      case 'failed':
      case 'cancelled':
        return {
          verified: true,
          status: paymentState.status === 'failed' ? 'failed' : 'cancelled',
          paymentIntentId: paymentState.paymentIntentId,
          error: paymentState.error || 'Payment was not successful',
          metadata: {
            provider: paymentState.provider,
            failureReason: paymentState.error
          }
        };

      case 'pending':
      case 'processing':
        return {
          verified: false,
          status: 'pending',
          paymentIntentId: paymentState.paymentIntentId,
          metadata: {
            provider: paymentState.provider,
            processingStatus: paymentState.status
          }
        };

      default:
        return {
          verified: false,
          status: 'unknown',
          error: `Unknown payment status: ${paymentState.status}`
        };
    }
  } catch (error) {
    return {
      verified: false,
      status: 'unknown',
      error: error instanceof Error ? error.message : 'Failed to verify payment status'
    };
  }
}

/**
 * Verify payment with retry logic
 * Useful for cases where payment might still be processing
 */
export async function verifyPaymentWithRetry(
  orderId: string, 
  maxRetries = 5, 
  retryDelayMs = 1000
): Promise<PaymentVerificationResult> {
  let lastResult: PaymentVerificationResult;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await verifyPaymentStatus(orderId);
    
    // If payment is verified (succeeded/failed/cancelled), return immediately
    if (lastResult.verified) {
      return lastResult;
    }
    
    // If payment is pending and we have retries left, wait and retry
    if (lastResult.status === 'pending' && attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      continue;
    }
    
    // If payment is unknown or other error, return immediately
    return lastResult;
  }
  
  // Return the last result after all retries
  return lastResult!;
}

/**
 * Validate payment redirect parameters
 * Ensures redirect URLs contain valid payment information
 */
export function validatePaymentRedirect(
  urlParams: URLSearchParams
): { valid: boolean; orderId?: string; error?: string } {
  const orderId = urlParams.get('order_id');
  const paymentIntentId = urlParams.get('payment_intent');
  const status = urlParams.get('status');

  if (!orderId) {
    return { valid: false, error: 'Missing order_id parameter' };
  }

  if (!paymentIntentId) {
    return { valid: false, error: 'Missing payment_intent parameter' };
  }

  // Note: We don't trust the status from URL alone
  // Always verify with backend
  return { valid: true, orderId };
}

/**
 * Handle payment redirect and verify status
 * Complete flow for handling payment redirects
 */
export async function handlePaymentRedirect(
  urlParams: URLSearchParams
): Promise<PaymentVerificationResult> {
  // First validate the redirect parameters
  const validation = validatePaymentRedirect(urlParams);
  
  if (!validation.valid) {
    return {
      verified: false,
      status: 'unknown',
      error: validation.error
    };
  }

  // Always verify with backend, regardless of redirect status
  return await verifyPaymentStatus(validation.orderId!);
}

/**
 * Payment verification with escrow validation
 * Ensures funds are properly held in escrow
 */
export async function verifyEscrowPayment(
  orderId: string
): Promise<PaymentVerificationResult & { escrowVerified: boolean }> {
  const paymentResult = await verifyPaymentStatus(orderId);
  
  if (!paymentResult.verified || paymentResult.status !== 'succeeded') {
    return {
      ...paymentResult,
      escrowVerified: false
    };
  }

  // Verify escrow status
  const escrowVerified = paymentResult.metadata?.escrowStatus === 'HELD';
  
  return {
    ...paymentResult,
    escrowVerified,
    error: escrowVerified ? undefined : 'Funds not properly held in escrow'
  };
}