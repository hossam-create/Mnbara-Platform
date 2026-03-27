import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

interface PaymentFormProps {
  listingId: string;
  listingTitle: string;
  price: number;
  buyerId: string;
  shippingAddress: any;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  listingId,
  listingTitle,
  price,
  buyerId,
  shippingAddress,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  // Create payment intent on component mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId,
            quantity: 1,
            buyerId,
            shippingAddress,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment intent');
        }

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Payment setup failed');
      }
    };

    createPaymentIntent();
  }, [listingId, buyerId, shippingAddress, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          payment_method_data: {
            billing_details: {
              address: {
                city: shippingAddress.city,
                country: shippingAddress.country,
                line1: shippingAddress.line1,
                line2: shippingAddress.line2,
                postal_code: shippingAddress.postal_code,
                state: shippingAddress.state,
              },
              email: shippingAddress.email,
              name: shippingAddress.name,
              phone: shippingAddress.phone,
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        const confirmResponse = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            listingId,
            buyerId,
            buyerEmail: shippingAddress.email,
            listingTitle,
          }),
        });

        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok) {
          throw new Error(confirmData.error || 'Failed to confirm payment');
        }

        onSuccess(confirmData.orderId);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
              <CardElement options={cardElementOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{listingTitle}</span>
            <span>${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Marketplace Fee (5%)</span>
            <span>${(price * 0.05).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-yellow-600">${(price * 1.05).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2 text-blue-800">Shipping Address</h4>
        <div className="text-sm text-blue-700">
          <p>{shippingAddress.name}</p>
          <p>{shippingAddress.line1}</p>
          {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
          <p>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
          </p>
          <p>{shippingAddress.country}</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={processing || !stripe || !elements}
        className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold
                 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                 transition-colors duration-200"
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </span>
        ) : (
          `Pay $${(price * 1.05).toFixed(2)}`
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>By completing this purchase, you agree to our Terms of Service and Privacy Policy.</p>
        <p>Your payment information is secure and encrypted.</p>
      </div>
    </form>
  );
};

interface StripePaymentFormProps extends PaymentFormProps {}

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
