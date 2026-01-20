import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkoutAPI } from '../services/api/checkoutAPI';
import { cartAPI } from '../services/api/cartAPI';
import SecurePaymentProcessor from '../components/payment/SecurePaymentProcessor';
import ProductGuaranteeBox from '../components/guarantees/ProductGuaranteeBox';
import { PaymentProvider } from '../types/payment.types';

export const CheckoutPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
  });
  const [paymentState, setPaymentState] = useState<'shipping' | 'payment' | 'processing' | 'success' | 'failed'>('shipping');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const navigate = useNavigate();

  // Mock user and seller IDs - in production, these would come from auth context
  const buyerId = 'user_123';
  const sellerId = 'seller_456';
  const amount = 100; // $100 example
  const currency = 'USD';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate shipping information
    if (!formData.email || !formData.firstName || !formData.lastName || 
        !formData.address || !formData.city || !formData.zipCode) {
      alert('Please fill in all shipping information');
      return;
    }

    // Generate order ID for payment processing
    const newOrderId = `order_${Date.now()}`;
    setOrderId(newOrderId);
    setPaymentState('payment');
  };

  const handlePaymentSuccess = async (result: any) => {
    setPaymentResult(result);
    setPaymentState('success');
    
    try {
      // Clear cart after successful payment
      await cartAPI.clearCart();
      
      // Navigate to success page
      setTimeout(() => {
        navigate(`/order-success/${orderId}`);
      }, 2000);
    } catch (error) {
      console.error('Post-payment cleanup failed:', error);
      // Still navigate to success page even if cart cleanup fails
      navigate(`/order-success/${orderId}`);
    }
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    setPaymentState('failed');
  };

  const handlePaymentPending = () => {
    setPaymentState('processing');
  };

  const resetPayment = () => {
    setPaymentState('shipping');
    setPaymentResult(null);
  };

  if (paymentState === 'success') {
    return (
      <div className="checkout-page p-6 max-w-2xl mx-auto text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-800 mb-4">Payment Successful!</h1>
          <p className="text-green-700 mb-4">
            Your payment has been processed and funds are held in escrow.
          </p>
          <p className="text-green-600">
            Redirecting to order confirmation...
          </p>
        </div>
      </div>
    );
  }

  if (paymentState === 'failed') {
    return (
      <div className="checkout-page p-6 max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-800 mb-4">Payment Failed</h1>
          <p className="text-red-700 mb-6">
            Your payment could not be processed. Please try again.
          </p>
          <button
            onClick={resetPayment}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (paymentState === 'payment') {
    return (
      <div className="checkout-page p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setPaymentState('shipping')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back to Shipping
          </button>
        </div>
        
        <div className="bg-gray-50 border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>$0.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span>${amount.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <ProductGuaranteeBox variant="checkout" />
        </div>

        <SecurePaymentProcessor
          amount={amount}
          currency={currency}
          orderId={orderId}
          buyerId={buyerId}
          sellerId={sellerId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onPaymentPending={handlePaymentPending}
        />
      </div>
    );
  }

  return (
    <div className="checkout-page p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleShippingSubmit} className="space-y-6">
        {/* Shipping Information */}
        <div className="border p-6 rounded">
          <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="col-span-2 px-4 py-2 border rounded"
            />
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="col-span-2 px-4 py-2 border rounded"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              required
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              name="zipCode"
              placeholder="Zip Code"
              value={formData.zipCode}
              onChange={handleInputChange}
              required
              className="px-4 py-2 border rounded"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-100 p-6 rounded">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          
          <div className="mb-4">
            <ProductGuaranteeBox variant="checkout" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>$0.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span>${amount.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 transition-colors"
        >
          Continue to Payment
        </button>
      </form>
    </div>
  );
};