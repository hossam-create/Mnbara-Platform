import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  originCountry: string;
  deliveryCountry: string;
}

export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  // Mock checkout data for MVP
  const checkoutItems: CheckoutItem[] = [
    {
      id: '1',
      name: 'Colombian Coffee Beans',
      price: 29.99,
      quantity: 1,
      originCountry: 'Colombia',
      deliveryCountry: 'US'
    },
    {
      id: '2',
      name: 'Swiss Chocolate',
      price: 45.50,
      quantity: 2,
      originCountry: 'Switzerland',
      deliveryCountry: 'US'
    }
  ];

  const getSubtotal = () => {
    return checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getServiceFee = () => {
    return checkoutItems.length * 2.99; // $2.99 per order
  };

  const getTotal = () => {
    return getSubtotal() + getServiceFee();
  };

  const handleCheckout = async () => {
    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      // In a real app, this would redirect to order success page
      window.location.href = `/order-success/order-${Date.now()}`;
    }, 2000);
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to be signed in to complete your purchase</p>
            <Link to="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">From: {item.originCountry}</p>
                      <p className="text-sm text-gray-600">Deliver to: {item.deliveryCountry}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-brand-blue">${item.price} × {item.quantity}</span>
                        <span className="text-lg font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="card"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <label htmlFor="card" className="flex items-center cursor-pointer">
                    <span className="mr-2">💳</span>
                    Credit/Debit Card
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="paypal"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <label htmlFor="paypal" className="flex items-center cursor-pointer">
                    <span className="mr-2">🅿️</span>
                    PayPal
                  </label>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee ({checkoutItems.length} orders)</span>
                  <span>${getServiceFee().toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Traveler Service:</strong> A traveler will bring your items from {checkoutItems[0]?.originCountry} to {checkoutItems[0]?.deliveryCountry}
                </p>
              </div>
              
              <Button 
                className="w-full mb-2" 
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Complete Purchase'
                )}
              </Button>
              
              <Link to="/cart">
                <Button variant="outline" className="w-full">
                  Back to Cart
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}