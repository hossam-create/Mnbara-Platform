import { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Hook for Stripe payment integration
 */
export function usePayment() {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStripe(STRIPE_PUBLISHABLE_KEY)
      .then((stripeInstance) => {
        setStripe(stripeInstance);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load Stripe');
        setLoading(false);
      });
  }, []);

  return { stripe, loading, error };
}

/**
 * Hook for processing payment
 */
export function useProcessPayment() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const processPayment = async (
    stripe: Stripe | null,
    elements: StripeElements | null,
    clientSecret: string
  ) => {
    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return false;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message || 'Payment submission failed');
        setProcessing(false);
        return false;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/requests/payment-success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed');
        setProcessing(false);
        return false;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSuccess(true);
        setProcessing(false);
        return true;
      }

      setProcessing(false);
      return false;
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      setProcessing(false);
      return false;
    }
  };

  return { processPayment, processing, error, success };
}

/**
 * Hook for fetching payment info
 */
export function usePaymentInfo(requestId: string) {
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;

    fetch(`/api/requests/${requestId}/payment`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPaymentInfo(data.data);
        } else {
          setError(data.error || 'Failed to fetch payment info');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch payment info');
        setLoading(false);
      });
  }, [requestId]);

  return { paymentInfo, loading, error };
}
