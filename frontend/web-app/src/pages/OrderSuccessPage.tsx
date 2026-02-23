import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface OrderDetails {
  id: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    originCountry: string;
    deliveryCountry: string;
  }>;
  total: number;
  serviceFee: number;
  estimatedDelivery: string;
  status: string;
}

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock order details for MVP
    const mockOrderDetails: OrderDetails = {
      id: id || 'order-123',
      items: [
        {
          name: 'Colombian Coffee Beans',
          price: 29.99,
          quantity: 1,
          originCountry: 'Colombia',
          deliveryCountry: 'US'
        },
        {
          name: 'Swiss Chocolate',
          price: 45.50,
          quantity: 2,
          originCountry: 'Switzerland',
          deliveryCountry: 'US'
        }
      ],
      total: 120.98,
      serviceFee: 5.98,
      estimatedDelivery: '2024-02-25',
      status: 'Looking for traveler'
    };

    setTimeout(() => {
      setOrderDetails(mockOrderDetails);
      setLoading(false);
    }, 1500);
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!orderDetails) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <Link to="/">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircleIcon className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Thank you for your order. We're now looking for a traveler to bring your items.</p>
        </div>

        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order #{orderDetails.id}</h2>
              <p className="text-sm text-gray-600">Status: <span className="font-medium text-blue-600">{orderDetails.status}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Estimated delivery</p>
              <p className="font-medium">{orderDetails.estimatedDelivery}</p>
            </div>
          </div>

          <div className="space-y-4">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-4 border-b border-gray-200 last:border-b-0">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">From: {item.originCountry}</p>
                  <p className="text-sm text-gray-600">Deliver to: {item.deliveryCountry}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.price.toFixed(2)} × {item.quantity}</p>
                  <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Subtotal</span>
              <span>${(orderDetails.total - orderDetails.serviceFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Service Fee ({orderDetails.items.length} orders)</span>
              <span>${orderDetails.serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-4 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>${orderDetails.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Traveler Assignment</h4>
                <p className="text-sm text-gray-600">We'll match you with a traveler heading from your item's origin country to your location.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Secure Payment</h4>
                <p className="text-sm text-gray-600">Your payment is held in escrow until your items are delivered safely.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Delivery & Release</h4>
                <p className="text-sm text-gray-600">Once your items arrive, we'll release payment to the seller and traveler.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/user/dashboard" className="flex-1">
            <Button className="w-full">
              View Order Status
            </Button>
          </Link>
          <Link to="/search" className="flex-1">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Support Information */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Need help?</h4>
          <p className="text-sm text-gray-600 mb-2">
            If you have any questions about your order, please contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 text-sm">
            <Link to="/help/contact" className="text-brand-blue hover:underline">
              Contact Support
            </Link>
            <span className="hidden sm:inline text-gray-400">•</span>
            <Link to="/help/faq" className="text-brand-blue hover:underline">
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}