import React, { useState, useEffect } from 'react';
import { checkoutAPI } from '../../services/api/checkoutAPI';
import { PaymentProvider, PaymentMethod } from '../../types/payment.types';
import styles from './SecurePaymentProcessor.module.css';

interface SecurePaymentProcessorProps {
  amount: number;
  currency?: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  onPaymentSuccess: (paymentResult: any) => void;
  onPaymentFailure: (error: any) => void;
  onPaymentPending: () => void;
  className?: string;
}

export const SecurePaymentProcessor: React.FC<SecurePaymentProcessorProps> = ({
  amount,
  currency = 'USD',
  orderId,
  buyerId,
  sellerId,
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentPending,
  className
}) => {
  const [paymentState, setPaymentState] = useState<'idle' | 'creating' | 'processing' | 'polling' | 'success' | 'failed'>('idle');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  /**
   * Create payment intent via backend only
   * Never create payment intents on frontend
   */
  const createPaymentIntent = async (provider: PaymentProvider) => {
    try {
      setPaymentState('creating');
      setError(null);

      const response = await checkoutAPI.createPaymentIntent({
        amount,
        currency,
        orderId,
        buyerId,
        sellerId,
        provider,
        paymentMethod: 'card',
        metadata: {
          source: 'web',
          timestamp: new Date().toISOString()
        }
      });

      if (response.success && response.data.paymentIntent) {
        const { paymentIntent } = response.data;
        setClientSecret(paymentIntent.clientSecret);
        setPaymentIntentId(paymentIntent.id);
        setSelectedProvider(provider);
        setPaymentState('processing');
        
        // Start payment processing
        processPayment(paymentIntent.clientSecret);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment creation failed';
      setError(errorMessage);
      setPaymentState('failed');
      onPaymentFailure({ error: errorMessage });
    }
  };

  /**
   * Process payment with provider (Stripe/Paymob)
   * This handles the redirect/iframe flow
   */
  const processPayment = async (clientSecret: string) => {
    try {
      // In production, this would integrate with Stripe.js or Paymob SDK
      // For now, simulate the payment processing
      
      // Simulate payment provider interaction
      const paymentResult = await simulatePaymentProvider(clientSecret);
      
      if (paymentResult.requiresAction) {
        // Handle 3D Secure or other authentication
        setPaymentState('processing');
        // In real implementation, this would show authentication UI
        await handlePaymentAuthentication(paymentResult);
      } else {
        // Start polling for payment status
        startPaymentStatusPolling();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      setPaymentState('failed');
      onPaymentFailure({ error: errorMessage });
    }
  };

  /**
   * Simulate payment provider interaction
   * In production, this would be Stripe.js or Paymob SDK
   */
  const simulatePaymentProvider = async (clientSecret: string): Promise<any> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate random outcomes for testing
    const random = Math.random();
    
    if (random < 0.1) {
      // 10% chance of immediate failure
      throw new Error('Payment declined by bank');
    } else if (random < 0.3) {
      // 20% chance of requiring authentication
      return {
        requiresAction: true,
        paymentIntentId: clientSecret.split('_secret_')[0],
        redirectUrl: '/payment/authenticate'
      };
    } else {
      // 70% chance of proceeding to polling
      return {
        requiresAction: false,
        paymentIntentId: clientSecret.split('_secret_')[0]
      };
    }
  };

  /**
   * Handle payment authentication (3D Secure, etc.)
   */
  const handlePaymentAuthentication = async (paymentResult: any): Promise<void> => {
    // In production, this would handle the authentication flow
    // For simulation, just wait and then poll
    await new Promise(resolve => setTimeout(resolve, 2000));
    startPaymentStatusPolling();
  };

  /**
   * Poll payment status from backend
   * Never trust frontend redirect success alone
   */
  const startPaymentStatusPolling = async () => {
    try {
      setPaymentState('polling');
      onPaymentPending();

      // Poll payment status from backend
      const result = await checkoutAPI.pollPaymentStatus(orderId, 30, 2000);
      
      if (result.success && result.data.paymentState) {
        const { status } = result.data.paymentState;
        
        if (status === 'succeeded') {
          setPaymentState('success');
          onPaymentSuccess(result.data);
        } else if (status === 'failed' || status === 'cancelled') {
          setPaymentState('failed');
          onPaymentFailure({ 
            error: 'Payment failed', 
            details: result.data.paymentState.error 
          });
        } else {
          // Still pending or unknown status
          setError('Payment status unclear. Please contact support.');
          setPaymentState('failed');
          onPaymentFailure({ error: 'Payment status unclear' });
        }
      } else {
        throw new Error('Failed to get payment status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment status check failed';
      setError(errorMessage);
      setPaymentState('failed');
      onPaymentFailure({ error: errorMessage });
    }
  };

  /**
   * Handle payment provider selection
   */
  const handleProviderSelect = (provider: PaymentProvider) => {
    if (paymentState === 'idle') {
      createPaymentIntent(provider);
    }
  };

  /**
   * Reset payment state
   */
  const resetPayment = () => {
    setPaymentState('idle');
    setClientSecret(null);
    setPaymentIntentId(null);
    setSelectedProvider(null);
    setError(null);
    setPollingAttempts(0);
  };

  return (
    <div className={`${styles.securePaymentProcessor} ${className || ''}`}>
      <div className={styles.paymentHeader}>
        <h3>Secure Payment</h3>
        <div className={styles.amount}>
          {amount} {currency}
        </div>
      </div>

      {paymentState === 'idle' && (
        <div className={styles.providerSelection}>
          <h4>Choose Payment Method</h4>
          <div className={styles.providerButtons}>
            <button
              onClick={() => handleProviderSelect(PaymentProvider.STRIPE)}
              className={styles.providerButton}
              disabled={paymentState !== 'idle'}
            >
              Pay with Card (Stripe)
            </button>
            <button
              onClick={() => handleProviderSelect(PaymentProvider.PAYMOB)}
              className={styles.providerButton}
              disabled={paymentState !== 'idle'}
            >
              Pay with Card (Paymob)
            </button>
          </div>
        </div>
      )}

      {paymentState === 'creating' && (
        <div className={styles.processingState}>
          <div className={styles.spinner}></div>
          <p>Creating secure payment...</p>
        </div>
      )}

      {paymentState === 'processing' && (
        <div className={styles.processingState}>
          <div className={styles.spinner}></div>
          <p>Processing payment...</p>
          <p className={styles.subtext}>Do not refresh or close this page</p>
        </div>
      )}

      {paymentState === 'polling' && (
        <div className={styles.processingState}>
          <div className={styles.spinner}></div>
          <p>Confirming payment status...</p>
          <p className={styles.subtext}>Attempt {pollingAttempts} of 30</p>
        </div>
      )}

      {paymentState === 'failed' && (
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>❌</div>
          <h4>Payment Failed</h4>
          <p>{error || 'Payment could not be processed'}</p>
          <button onClick={resetPayment} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {paymentState === 'success' && (
        <div className={styles.successState}>
          <div className={styles.successIcon}>✅</div>
          <h4>Payment Successful!</h4>
          <p>Your payment has been processed and funds are held in escrow.</p>
        </div>
      )}
    </div>
  );
};

export default SecurePaymentProcessor;