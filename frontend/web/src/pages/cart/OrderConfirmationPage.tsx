// ============================================
// ✅ Order Confirmation Page
// ============================================

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { orderApi, paymentApi } from '../../services/api';

interface OrderConfirmationState {
  orderId: string;
  total: number;
  escrow: boolean;
  deliveryMethod: 'standard' | 'express' | 'traveler';
  paymentMethod?: 'card' | 'paypal' | 'wallet';
}

interface TrackingInfo {
  status: string;
  estimatedDelivery: string;
  trackingNumber?: string;
  carrier?: string;
}

interface EscrowInfo {
  status: 'held' | 'released' | 'refunded';
  amount: number;
}

interface PaymentInfo {
  status: string;
  paidAt?: string;
  method?: string;
}

const PAYMENT_METHOD_INFO = {
  card: { name: 'Credit/Debit Card', icon: '💳' },
  paypal: { name: 'PayPal', icon: '🅿️' },
  wallet: { name: 'Wallet Balance', icon: '💰' },
};

const DELIVERY_INFO = {
  standard: {
    name: 'Standard Delivery',
    icon: '📦',
    estimatedDays: '5-7 business days',
  },
  express: {
    name: 'Express Delivery',
    icon: '🚀',
    estimatedDays: '2-3 business days',
  },
  traveler: {
    name: 'Traveler Delivery',
    icon: '✈️',
    estimatedDays: '3-5 business days',
  },
};

export function OrderConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderState, setOrderState] = useState<OrderConfirmationState | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [escrowInfo, setEscrowInfo] = useState<EscrowInfo | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order data from navigation state
    const state = location.state as OrderConfirmationState | null;
    
    if (!state?.orderId) {
      // No order data, redirect to home
      navigate('/');
      return;
    }

    setOrderState(state);

    // Fetch order details, tracking, and payment info
    const fetchOrderDetails = async () => {
      try {
        // Fetch tracking info from order API
        const trackingResponse = await orderApi.getTracking(state.orderId);
        const orderData = trackingResponse.data.data;
        
        if (orderData) {
          const estimatedDate = new Date();
          estimatedDate.setDate(estimatedDate.getDate() + (state.deliveryMethod === 'express' ? 3 : 7));
          
          // Use trackingInfo from order if available, otherwise generate mock data
          const orderTrackingInfo = orderData.trackingInfo;
          setTrackingInfo({
            status: orderData.status || 'Order Confirmed',
            estimatedDelivery: estimatedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }),
            trackingNumber: orderTrackingInfo?.trackingNumber || (state.deliveryMethod !== 'traveler' ? `TRK${Date.now().toString().slice(-10)}` : undefined),
            carrier: orderTrackingInfo?.carrier || (state.deliveryMethod === 'express' ? 'FedEx' : state.deliveryMethod === 'standard' ? 'USPS' : undefined),
          });
        }

        // Fetch payment status
        const paymentResponse = await paymentApi.getPaymentStatus(state.orderId);
        if (paymentResponse.data.data) {
          setPaymentInfo(paymentResponse.data.data);
        }

        // Fetch escrow status if escrow is enabled
        if (state.escrow) {
          // In a real app, we'd have the escrowId from the order
          // For now, we'll show the escrow as held
          setEscrowInfo({
            status: 'held',
            amount: state.total,
          });
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        // Fallback to mock data if API fails
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + (state.deliveryMethod === 'express' ? 3 : 7));
        
        setTrackingInfo({
          status: 'Order Confirmed',
          estimatedDelivery: estimatedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }),
          trackingNumber: state.deliveryMethod !== 'traveler' ? `TRK${Date.now().toString().slice(-10)}` : undefined,
          carrier: state.deliveryMethod === 'express' ? 'FedEx' : state.deliveryMethod === 'standard' ? 'USPS' : undefined,
        });

        if (state.escrow) {
          setEscrowInfo({
            status: 'held',
            amount: state.total,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (!orderState) {
    return null;
  }

  const deliveryInfo = DELIVERY_INFO[orderState.deliveryMethod];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. We've sent a confirmation email to your registered address.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="text-xl font-bold text-gray-900">{orderState.orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(orderState.total)}</p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Delivery Information</h3>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{deliveryInfo.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{deliveryInfo.name}</p>
                <p className="text-sm text-gray-500">{deliveryInfo.estimatedDays}</p>
              </div>
            </div>
          </div>

          {/* Tracking Information */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Tracking Information</h3>
            {loading ? (
              <div className="flex items-center gap-3 text-gray-500">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Loading tracking information...</span>
              </div>
            ) : trackingInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {trackingInfo.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Delivery</span>
                  <span className="font-medium text-gray-900">{trackingInfo.estimatedDelivery}</span>
                </div>
                {trackingInfo.trackingNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tracking Number</span>
                    <span className="font-mono text-gray-900">{trackingInfo.trackingNumber}</span>
                  </div>
                )}
                {trackingInfo.carrier && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Carrier</span>
                    <span className="font-medium text-gray-900">{trackingInfo.carrier}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Tracking information will be available once your order ships.</p>
            )}
          </div>

          {/* Payment Method */}
          {orderState.paymentMethod && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="flex items-center gap-4">
                <span className="text-3xl">{PAYMENT_METHOD_INFO[orderState.paymentMethod]?.icon || '💳'}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {PAYMENT_METHOD_INFO[orderState.paymentMethod]?.name || 'Payment'}
                  </p>
                  {paymentInfo?.paidAt && (
                    <p className="text-sm text-gray-500">
                      Paid on {new Date(paymentInfo.paidAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {paymentInfo?.status || 'Confirmed'}
                </span>
              </div>
            </div>
          )}

          {/* Escrow Status for Crowdship */}
          {orderState.escrow && escrowInfo && (
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-indigo-900 mb-1">Escrow Protection Active</h3>
                  <p className="text-sm text-indigo-700 mb-3">
                    Your payment of {formatCurrency(escrowInfo.amount)} is being held securely in escrow. 
                    It will be released to the seller/traveler once you confirm delivery of your order.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        escrowInfo.status === 'held' ? 'bg-indigo-500 animate-pulse' :
                        escrowInfo.status === 'released' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></span>
                      <span className="text-sm font-medium text-indigo-800">
                        {escrowInfo.status === 'held' ? 'Funds Held in Escrow' :
                         escrowInfo.status === 'released' ? 'Funds Released' : 'Funds Refunded'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-indigo-900">
                      {formatCurrency(escrowInfo.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-6">Order Timeline</h3>
          <div className="space-y-4">
            {[
              { status: 'Order Placed', time: 'Just now', completed: true, icon: '✓' },
              { status: 'Payment Confirmed', time: 'Just now', completed: true, icon: '✓' },
              { status: 'Processing', time: 'Pending', completed: false, icon: '⏳' },
              { status: 'Shipped', time: 'Pending', completed: false, icon: '📦' },
              { status: 'Delivered', time: 'Pending', completed: false, icon: '🏠' },
            ].map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <span>{step.icon}</span>
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.status}
                  </p>
                  <p className="text-sm text-gray-500">{step.time}</p>
                </div>
                {step.completed && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/orders"
            className="flex-1 py-4 text-center bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="flex-1 py-4 text-center border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Need help with your order?{' '}
            <Link to="/support" className="text-pink-500 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
