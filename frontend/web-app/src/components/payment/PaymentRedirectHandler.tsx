import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyPaymentStatus, handlePaymentRedirect } from '../utils/paymentVerification';
import { checkoutAPI } from '../services/api/checkoutAPI';
import styles from './PaymentRedirectHandler.module.css';

interface PaymentRedirectHandlerProps {
  onSuccess?: (result: any) => void;
  onFailure?: (error: any) => void;
}

export const PaymentRedirectHandler: React.FC<PaymentRedirectHandlerProps> = ({
  onSuccess,
  onFailure
}) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying payment status...');
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    verifyPayment();
  }, [location]);

  /**
   * Verify payment status from backend
   * Never trust frontend redirect success alone
   */
  const verifyPayment = async () => {
    try {
      // Get URL parameters
      const urlParams = new URLSearchParams(location.search);
      
      // Handle payment redirect
      const redirectResult = await handlePaymentRedirect(urlParams);
      
      if (redirectResult.verified) {
        if (redirectResult.status === 'succeeded') {
          setStatus('success');
          setMessage('Payment verified successfully!');
          setPaymentResult(redirectResult);
          
          if (onSuccess) {
            onSuccess(redirectResult);
          }
          
          // Redirect to order success page after delay
          setTimeout(() => {
            navigate(`/order-success/${redirectResult.metadata?.orderId || 'unknown'}`);
          }, 2000);
        } else if (redirectResult.status === 'failed' || redirectResult.status === 'cancelled') {
          setStatus('failed');
          setMessage('Payment failed or was cancelled');
          setError(redirectResult.error || 'Payment was not successful');
          
          if (onFailure) {
            onFailure({ error: redirectResult.error });
          }
        }
      } else {
        setStatus('error');
        setMessage('Payment verification failed');
        setError(redirectResult.error || 'Could not verify payment status');
        
        if (onFailure) {
          onFailure({ error: redirectResult.error });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment verification error';
      setStatus('error');
      setMessage('Payment verification failed');
      setError(errorMessage);
      
      if (onFailure) {
        onFailure({ error: errorMessage });
      }
    }
  };

  const handleRetry = () => {
    setStatus('verifying');
    setMessage('Verifying payment status...');
    setError(null);
    verifyPayment();
  };

  const handleGoBack = () => {
    navigate('/checkout');
  };

  if (status === 'verifying') {
    return (
      <div className={styles.paymentRedirectHandler}>
        <div className={styles.verifyingState}>
          <div className={styles.spinner}></div>
          <h2>{message}</h2>
          <p className={styles.subtext}>Please wait while we verify your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={styles.paymentRedirectHandler}>
        <div className={styles.successState}>
          <div className={styles.successIcon}>✅</div>
          <h2>Payment Verified Successfully!</h2>
          <p>Your payment has been confirmed and funds are held in escrow.</p>
          <p className={styles.subtext}>Redirecting to order confirmation...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className={styles.paymentRedirectHandler}>
        <div className={styles.failedState}>
          <div className={styles.failedIcon}>❌</div>
          <h2>Payment Failed</h2>
          <p>{message}</p>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.buttonGroup}>
            <button onClick={handleRetry} className={styles.retryButton}>
              Retry Payment
            </button>
            <button onClick={handleGoBack} className={styles.backButton}>
              Back to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.paymentRedirectHandler}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Payment Verification Error</h2>
          <p>{message}</p>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.buttonGroup}>
            <button onClick={handleRetry} className={styles.retryButton}>
              Retry Verification
            </button>
            <button onClick={handleGoBack} className={styles.backButton}>
              Back to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentRedirectHandler;