import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkoutAPI } from '../services/api/checkoutAPI';
import { cartAPI } from '../services/api/cartAPI';

export const CheckoutPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
  });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create payment intent
      const { clientSecret } = await checkoutAPI.createPaymentIntent(100); // $100 example

      // In production, use Stripe.js to confirm payment
      // For now, simulate successful payment
      const paymentResult = {
        paymentIntentId: clientSecret.split('_secret_')[0],
      };

      // Create order
      const order = await checkoutAPI.createOrder({
        paymentIntentId: paymentResult.paymentIntentId,
        customerEmail: formData.email,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
        },
      });

      // Clear cart
      await cartAPI.clearCart();

      // Redirect to success page
      navigate(`/order-success/${order.id}`);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Payment Information */}
        <div className="border p-6 rounded">
          <h2 className="text-xl font-bold mb-4">Payment Information</h2>
          <div className="space-y-4">
            <input
              type="text"
              name="cardNumber"
              placeholder="Card Number"
              value={formData.cardNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="cardExpiry"
                placeholder="MM/YY"
                value={formData.cardExpiry}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border rounded"
              />
              <input
                type="text"
                name="cardCVC"
                placeholder="CVC"
                value={formData.cardCVC}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-100 p-6 rounded">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>$100.00</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>$0.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span>$100.00</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded font-bold disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Complete Purchase'}
        </button>
      </form>
    </div>
  );
};
