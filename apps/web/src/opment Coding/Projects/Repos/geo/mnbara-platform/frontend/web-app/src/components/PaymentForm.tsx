import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePayment, useProcessPayment } from '../hooks/usePayment';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  requestId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

/**
 * Payment Form Component (Inner)
 * Handles the actual payment form with Stripe Elements
 */
function PaymentFormInner({ amount, currency, requestId, onSuccess, onError }: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const { processPayment, processing, error, success } = useProcessPayment();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setMessage('Processing payment...');

    const clientSecret = elements.getElement(PaymentElement)?.options?.clientSecret as string;
    
    const result = await processPayment(stripe, elements, clientSecret);

    if (result) {
      setMessage('Payment successful!');
      onSuccess();
    } else if (error) {
      setMessage(error);
      onError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-header">
        <h2>Complete Payment</h2>
        <p className="payment-amount">
          {currency} {amount.toFixed(2)}
        </p>
      </div>

      <div className="payment-element-container">
        <PaymentElement />
      </div>

      {message && (
        <div className={`payment-message ${success ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="payment-submit-button"
      >
        {processing ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
      </button>

      <div className="payment-info">
        <p>Your payment is secured by Stripe</p>
        <p className="payment-note">
          Funds will be held in escrow until delivery is completed
        </p>
      </div>
    </form>
  );
}

/**
 * Payment Form Component (Outer)
 * Wraps the payment form with Stripe Elements provider
 */
export function PaymentForm({ clientSecret, amount, currency, requestId, onSuccess, onError }: PaymentFormProps) {
  const { stripe, loading, error } = usePayment();

  if (loading) {
    return (
      <div className="payment-loading">
        <p>Loading payment form...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-error">
        <p>Error loading payment form: {error}</p>
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="payment-error">
        <p>Stripe not available</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0066cc',
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripe} options={options}>
      <PaymentFormInner
        amount={amount}
        currency={currency}
        requestId={requestId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

/**
 * Payment Status Component
 * Shows payment status for a request
 */
interface PaymentStatusProps {
  paymentInfo: any;
}

export function PaymentStatus({ paymentInfo }: PaymentStatusProps) {
  if (!paymentInfo) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'green';
      case 'PENDING':
        return 'orange';
      case 'FAILED':
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getEscrowStatusColor = (status: string) => {
    switch (status) {
      case 'HELD':
        return 'blue';
      case 'RELEASED':
        return 'green';
      case 'REFUNDED':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <div className="payment-status">
      <h3>Payment Information</h3>
      
      <div className="payment-status-grid">
        <div className="payment-status-item">
          <label>Payment Status</label>
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(paymentInfo.paymentStatus) }}
          >
            {paymentInfo.paymentStatus || 'PENDING'}
          </span>
        </div>

        {paymentInfo.escrowStatus && (
          <div className="payment-status-item">
            <label>Escrow Status</label>
            <span
              className="status-badge"
              style={{ backgroundColor: getEscrowStatusColor(paymentInfo.escrowStatus) }}
            >
              {paymentInfo.escrowStatus}
            </span>
          </div>
        )}

        {paymentInfo.paymentAmount && (
          <div className="payment-status-item">
            <label>Amount</label>
            <span>{paymentInfo.paymentAmount.toFixed(2)}</span>
          </div>
        )}

        {paymentInfo.paymentPlatformFee && (
          <div className="payment-status-item">
            <label>Platform Fee (7%)</label>
            <span>{paymentInfo.paymentPlatformFee.toFixed(2)}</span>
          </div>
        )}

        {paymentInfo.paymentTotalAmount && (
          <div className="payment-status-item">
            <label>Total Amount</label>
            <span className="total-amount">
              {paymentInfo.paymentTotalAmount.toFixed(2)}
            </span>
          </div>
        )}

        {paymentInfo.escrowCreatedAt && (
          <div className="payment-status-item">
            <label>Escrow Created</label>
            <span>{new Date(paymentInfo.escrowCreatedAt).toLocaleString()}</span>
          </div>
        )}

        {paymentInfo.escrowReleasedAt && (
          <div className="payment-status-item">
            <label>Funds Released</label>
            <span>{new Date(paymentInfo.escrowReleasedAt).toLocaleString()}</span>
          </div>
        )}

        {paymentInfo.escrowRefundedAt && (
          <div className="payment-status-item">
            <label>Funds Refunded</label>
            <span>{new Date(paymentInfo.escrowRefundedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
