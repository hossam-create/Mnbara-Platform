// ============================================
// 💳 Checkout Page - Complete Purchase
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethodSelector, type PaymentData, type PaymentMethodType } from '../../components/checkout';
import { paymentApi, orderApi } from '../../services/api';
import rewardsService from '../../services/rewards.service';
import type { Address, RewardsAccount } from '../../types';

type CheckoutStep = 'shipping' | 'payment' | 'review';
type DeliveryOption = 'standard' | 'express' | 'traveler';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

interface ShippingAddress extends Omit<Address, 'id' | 'isDefault'> {
  id?: string;
  isDefault?: boolean;
}

const DELIVERY_OPTIONS = [
  {
    id: 'standard' as DeliveryOption,
    name: 'Standard Delivery',
    price: 15,
    time: '5-7 business days',
    icon: '📦',
    description: 'Reliable shipping via courier',
  },
  {
    id: 'express' as DeliveryOption,
    name: 'Express Delivery',
    price: 25,
    time: '2-3 business days',
    icon: '🚀',
    description: 'Fast priority shipping',
  },
  {
    id: 'traveler' as DeliveryOption,
    name: 'Traveler Delivery (Crowdship)',
    price: 40,
    time: 'Hand-delivered by verified traveler',
    icon: '✈️',
    featured: true,
    description: 'Personal delivery with escrow protection',
    escrowRequired: true,
  },
];

const PAYMENT_METHODS = [
  { id: 'card' as PaymentMethodType, name: 'Credit/Debit Card', icon: '💳', description: 'Pay with Visa, Mastercard, or Amex' },
  { id: 'paypal' as PaymentMethodType, name: 'PayPal', icon: '🅿️', description: 'Fast and secure checkout' },
  { id: 'wallet' as PaymentMethodType, name: 'Wallet Balance', icon: '💰', description: 'Use your MNBARA wallet' },
];

const SAVED_ADDRESSES: ShippingAddress[] = [
  {
    id: 'addr1',
    label: 'Home',
    street: '123 Main Street, Apt 4B',
    city: 'Cairo',
    state: 'Cairo Governorate',
    country: 'Egypt',
    zipCode: '12345',
    phone: '+20 100 123 4567',
    isDefault: true,
  },
  {
    id: 'addr2',
    label: 'Office',
    street: '456 Business Park, Floor 5',
    city: 'Giza',
    state: 'Giza Governorate',
    country: 'Egypt',
    zipCode: '12556',
    phone: '+20 100 987 6543',
    isDefault: false,
  },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  // User context available for future personalization
  const { } = useAuth();
  
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('standard');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(SAVED_ADDRESSES[0]?.id || null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    label: '',
    street: '',
    city: '',
    state: '',
    country: 'Egypt',
    zipCode: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  const [useEscrow, setUseEscrow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentReady, setPaymentReady] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // Rewards state
  const [rewardsAccount, setRewardsAccount] = useState<RewardsAccount | null>(null);
  const [useRewardsDiscount, setUseRewardsDiscount] = useState(false);
  const [rewardsDiscountAmount, setRewardsDiscountAmount] = useState(0);
  const [rewardsPointsToUse, setRewardsPointsToUse] = useState(0);

  // Mock wallet balance - in production, fetch from user profile
  const walletBalance = 2840.50;
  
  // Points to dollar conversion rate (100 points = $1)
  const POINTS_TO_DOLLAR_RATE = 100;

  // Load saved shipping selection from cart page and fetch rewards
  useEffect(() => {
    const savedShipping = sessionStorage.getItem('selectedShipping');
    if (savedShipping) {
      try {
        const parsed = JSON.parse(savedShipping);
        const matchingOption = DELIVERY_OPTIONS.find(o => o.name.includes(parsed.method));
        if (matchingOption) {
          setDeliveryOption(matchingOption.id);
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Fetch rewards account
    const fetchRewards = async () => {
      try {
        const account = await rewardsService.getRewardsAccount();
        setRewardsAccount(account);
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
      }
    };
    fetchRewards();
  }, []);

  // Auto-enable escrow for traveler delivery
  useEffect(() => {
    if (deliveryOption === 'traveler') {
      setUseEscrow(true);
    }
  }, [deliveryOption]);

  const selectedDelivery = DELIVERY_OPTIONS.find(d => d.id === deliveryOption)!;
  const selectedAddress = selectedAddressId 
    ? SAVED_ADDRESSES.find(a => a.id === selectedAddressId) 
    : null;

  // Calculate order totals
  const orderSummary = useMemo(() => {
    const subtotal = cart.totalPrice;
    const delivery = selectedDelivery.price;
    
    // Load promo from session
    let discount = 0;
    const savedPromo = sessionStorage.getItem('appliedPromo');
    if (savedPromo) {
      try {
        const promo = JSON.parse(savedPromo);
        discount = (subtotal * promo.discount) / 100;
      } catch {
        // Ignore
      }
    }
    
    // Add rewards discount
    const rewardsDiscount = useRewardsDiscount ? rewardsDiscountAmount : 0;
    
    const escrowFee = useEscrow ? Math.round(subtotal * 0.02) : 0; // 2% escrow fee
    const total = subtotal + delivery - discount - rewardsDiscount + escrowFee;
    
    return { subtotal, delivery, discount, rewardsDiscount, escrowFee, total };
  }, [cart.totalPrice, selectedDelivery.price, useEscrow, useRewardsDiscount, rewardsDiscountAmount]);
  
  // Calculate max rewards discount (can't exceed subtotal)
  const maxRewardsDiscount = useMemo(() => {
    if (!rewardsAccount) return 0;
    const maxFromPoints = rewardsAccount.points / POINTS_TO_DOLLAR_RATE;
    return Math.min(maxFromPoints, cart.totalPrice * 0.5); // Max 50% of subtotal
  }, [rewardsAccount, cart.totalPrice]);
  
  // Handle rewards discount toggle
  const handleRewardsToggle = (enabled: boolean) => {
    setUseRewardsDiscount(enabled);
    if (enabled && rewardsAccount) {
      // Default to max available discount
      const discountAmount = Math.min(maxRewardsDiscount, 50); // Cap at $50 for demo
      setRewardsDiscountAmount(discountAmount);
      setRewardsPointsToUse(Math.round(discountAmount * POINTS_TO_DOLLAR_RATE));
    } else {
      setRewardsDiscountAmount(0);
      setRewardsPointsToUse(0);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const validateShippingStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedAddressId && !showNewAddressForm) {
      newErrors.address = 'Please select or add a shipping address';
    }
    
    if (showNewAddressForm) {
      if (!newAddress.street.trim()) newErrors.street = 'Street address is required';
      if (!newAddress.city.trim()) newErrors.city = 'City is required';
      if (!newAddress.country.trim()) newErrors.country = 'Country is required';
      if (!newAddress.phone.trim()) newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateShippingStep()) {
      setStep('payment');
    }
  };

  const handleContinueToReview = () => {
    setStep('review');
  };

  // Handle payment submission from PaymentMethodSelector
  const handlePaymentSubmit = useCallback(async (paymentData: PaymentData) => {
    setPaymentStatus('processing');
    setErrors({});

    try {
      // First, create the order if not already created
      let currentOrderId = orderId;
      if (!currentOrderId) {
        const orderResponse = await orderApi.create({
          items: cart.items.map(item => ({ productId: item.id, quantity: item.quantity })),
          addressId: selectedAddressId || 'new',
          deliveryMethod: deliveryOption,
        });
        currentOrderId = orderResponse.data.data?.id || `ORD-${Date.now()}`;
        setOrderId(currentOrderId);
      }

      // Process payment based on method
      if (paymentData.method === 'card' && paymentData.stripePaymentMethodId) {
        // Create payment intent and confirm with Stripe
        const intentResponse = await paymentApi.createPaymentIntent(
          currentOrderId,
          orderSummary.total,
          'USD'
        );
        
        await paymentApi.confirmStripePayment(
          intentResponse.data.data?.paymentIntentId || '',
          paymentData.stripePaymentMethodId
        );
      } else if (paymentData.method === 'paypal' && paymentData.paypalOrderId) {
        // Capture PayPal payment
        await paymentApi.capturePayPalPayment(paymentData.paypalOrderId);
      } else if (paymentData.method === 'wallet' && paymentData.walletConfirmed) {
        // Process wallet payment
        await paymentApi.processWalletPayment(currentOrderId, orderSummary.total);
      }

      // Create escrow if enabled
      if (useEscrow) {
        await paymentApi.createEscrow(currentOrderId, orderSummary.total);
      }

      setPaymentStatus('success');
      
      // Clear cart and session data
      clearCart();
      sessionStorage.removeItem('selectedShipping');
      sessionStorage.removeItem('appliedPromo');

      // Navigate to confirmation
      navigate('/order-confirmation', {
        state: {
          orderId: currentOrderId,
          total: orderSummary.total,
          escrow: useEscrow,
          deliveryMethod: deliveryOption,
          paymentMethod: paymentData.method,
        },
      });
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
      setErrors({ 
        payment: error instanceof Error 
          ? error.message 
          : 'Payment failed. Please try again or use a different payment method.' 
      });
    }
  }, [orderId, cart.items, selectedAddressId, deliveryOption, orderSummary.total, useEscrow, clearCart, navigate]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cart and session data
      clearCart();
      sessionStorage.removeItem('selectedShipping');
      sessionStorage.removeItem('appliedPromo');
      
      // Navigate to confirmation
      navigate('/order-confirmation', { 
        state: { 
          orderId: `ORD-${Date.now()}`,
          total: orderSummary.total,
          escrow: useEscrow,
          deliveryMethod: deliveryOption,
        } 
      });
    } catch (error) {
      console.error('Order placement failed:', error);
      setErrors({ submit: 'Failed to place order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if cart is empty
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some items before checking out</p>
          <Link
            to="/products"
            className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {(['shipping', 'payment', 'review'] as CheckoutStep[]).map((s, index) => {
            const stepIndex = ['shipping', 'payment', 'review'].indexOf(step);
            const isCompleted = index < stepIndex;
            const isCurrent = s === step;
            
            return (
              <div key={s} className="flex items-center gap-4">
                <button
                  onClick={() => isCompleted && setStep(s)}
                  disabled={!isCompleted}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg'
                      : isCompleted
                      ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <span>✓</span>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  <span className="hidden sm:inline capitalize">{s}</span>
                </button>
                {index < 2 && (
                  <div className={`w-16 h-1 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            {errors.submit}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shipping Step */}
            {step === 'shipping' && (
              <div className="space-y-6">
                {/* Saved Addresses */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Address</h2>
                  
                  {errors.address && (
                    <p className="text-red-500 text-sm mb-4">{errors.address}</p>
                  )}
                  
                  <div className="space-y-3">
                    {SAVED_ADDRESSES.map((address) => (
                      <label
                        key={address.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddressId === address.id && !showNewAddressForm
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === address.id && !showNewAddressForm}
                          onChange={() => {
                            setSelectedAddressId(address.id!);
                            setShowNewAddressForm(false);
                          }}
                          className="mt-1 w-4 h-4 text-pink-500 focus:ring-pink-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{address.label}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-gray-600">{address.street}</p>
                          <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                          <p className="text-gray-600">{address.country}</p>
                          <p className="text-gray-500 text-sm mt-1">{address.phone}</p>
                        </div>
                      </label>
                    ))}
                    
                    {/* Add New Address Button */}
                    <button
                      onClick={() => {
                        setShowNewAddressForm(true);
                        setSelectedAddressId(null);
                      }}
                      className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all ${
                        showNewAddressForm
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xl">+</span>
                      <span className="font-medium text-gray-700">Add New Address</span>
                    </button>
                  </div>

                  {/* New Address Form */}
                  {showNewAddressForm && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address Label</label>
                          <input
                            type="text"
                            value={newAddress.label}
                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                            placeholder="e.g., Home, Office"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                          <input
                            type="text"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 ${
                              errors.street ? 'border-red-500' : 'border-gray-200 focus:border-pink-500'
                            }`}
                          />
                          {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                          <input
                            type="text"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 ${
                              errors.city ? 'border-red-500' : 'border-gray-200 focus:border-pink-500'
                            }`}
                          />
                          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                          <input
                            type="text"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                          <select
                            value={newAddress.country}
                            onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 ${
                              errors.country ? 'border-red-500' : 'border-gray-200 focus:border-pink-500'
                            }`}
                          >
                            <option value="Egypt">Egypt</option>
                            <option value="Saudi Arabia">Saudi Arabia</option>
                            <option value="UAE">United Arab Emirates</option>
                            <option value="USA">United States</option>
                            <option value="UK">United Kingdom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                          <input
                            type="text"
                            value={newAddress.zipCode}
                            onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 ${
                              errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-pink-500'
                            }`}
                          />
                          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Options */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Method</h2>
                  <div className="space-y-4">
                    {DELIVERY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDeliveryOption(option.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          deliveryOption === option.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${option.featured ? 'ring-2 ring-indigo-200' : ''}`}
                      >
                        <span className="text-3xl">{option.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{option.name}</span>
                            {option.featured && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-xs font-bold rounded-full">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 block">{option.time}</span>
                          <span className="text-xs text-gray-400">{option.description}</span>
                        </div>
                        <span className="font-bold text-gray-900">{formatCurrency(option.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Escrow Option for Crowdship */}
                {deliveryOption === 'traveler' && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔒</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">Escrow Protection</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Your payment is held securely until you confirm delivery. This protects both buyers and travelers.
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useEscrow}
                            onChange={(e) => setUseEscrow(e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Enable escrow protection (+2% fee)
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          Escrow fee: {formatCurrency(orderSummary.escrowFee)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleContinueToPayment}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Continue to Payment
                </button>
              </div>
            )}


            {/* Payment Step */}
            {step === 'payment' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
                  
                  {/* Payment Status Messages */}
                  {paymentStatus === 'processing' && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing your payment...
                    </div>
                  )}
                  
                  {paymentStatus === 'error' && errors.payment && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                      <p className="font-medium">Payment Failed</p>
                      <p className="text-sm">{errors.payment}</p>
                    </div>
                  )}

                  {/* Integrated Payment Method Selector with Stripe & PayPal */}
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    onPaymentReady={setPaymentReady}
                    onPaymentSubmit={handlePaymentSubmit}
                    amount={orderSummary.total}
                    currency="USD"
                    walletBalance={walletBalance}
                    disabled={paymentStatus === 'processing'}
                  />
                </div>

                {/* Rewards Discount Option */}
                {rewardsAccount && rewardsAccount.points > 0 && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎁</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-pink-800">Use Rewards Points</span>
                          <span className="text-sm text-pink-600 font-bold">
                            {rewardsAccount.points.toLocaleString()} pts available
                          </span>
                        </div>
                        <p className="text-sm text-pink-700 mb-3">
                          Apply your rewards points for a discount (100 pts = $1)
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useRewardsDiscount}
                            onChange={(e) => handleRewardsToggle(e.target.checked)}
                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                          />
                          <span className="text-sm font-medium text-pink-800">
                            Apply {rewardsPointsToUse.toLocaleString()} points for {formatCurrency(rewardsDiscountAmount)} off
                          </span>
                        </label>
                        {useRewardsDiscount && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={Math.min(rewardsAccount.points, cart.totalPrice * 0.5 * POINTS_TO_DOLLAR_RATE)}
                              step={100}
                              value={rewardsPointsToUse}
                              onChange={(e) => {
                                const points = parseInt(e.target.value);
                                setRewardsPointsToUse(points);
                                setRewardsDiscountAmount(points / POINTS_TO_DOLLAR_RATE);
                              }}
                              className="flex-1 h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                            <span className="text-sm font-bold text-pink-600 min-w-[60px] text-right">
                              {formatCurrency(rewardsDiscountAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Escrow Notice for Crowdship */}
                {useEscrow && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔒</span>
                      <div>
                        <span className="font-medium text-green-800">Escrow Protection Active</span>
                        <p className="text-sm text-green-700">
                          Your payment will be held securely until delivery is confirmed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('shipping')}
                    disabled={paymentStatus === 'processing'}
                    className="flex-1 py-4 border-2 border-gray-300 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleContinueToReview}
                    disabled={!paymentReady || paymentStatus === 'processing' || (paymentMethod === 'wallet' && walletBalance < orderSummary.total)}
                    className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && (
              <div className="space-y-6">
                {/* Shipping Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Shipping Details</h2>
                    <button onClick={() => setStep('shipping')} className="text-pink-500 font-medium hover:underline">
                      Edit
                    </button>
                  </div>
                  {selectedAddress ? (
                    <div className="text-gray-600">
                      <p className="font-medium text-gray-900">{selectedAddress.label}</p>
                      <p>{selectedAddress.street}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
                      <p>{selectedAddress.country}</p>
                      <p className="text-gray-500 mt-1">{selectedAddress.phone}</p>
                    </div>
                  ) : showNewAddressForm ? (
                    <div className="text-gray-600">
                      <p className="font-medium text-gray-900">{newAddress.label || 'New Address'}</p>
                      <p>{newAddress.street}</p>
                      <p>{newAddress.city}, {newAddress.state} {newAddress.zipCode}</p>
                      <p>{newAddress.country}</p>
                      <p className="text-gray-500 mt-1">{newAddress.phone}</p>
                    </div>
                  ) : null}
                  <div className="mt-4 pt-4 border-t flex items-center gap-2">
                    <span className="text-2xl">{selectedDelivery.icon}</span>
                    <div>
                      <span className="font-medium">{selectedDelivery.name}</span>
                      <span className="text-gray-500 text-sm block">{selectedDelivery.time}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                    <button onClick={() => setStep('payment')} className="text-pink-500 font-medium hover:underline">
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.icon}</span>
                    <span className="font-medium">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.name}</span>
                  </div>
                </div>

                {/* Escrow Status */}
                {useEscrow && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <span className="font-bold text-green-800">Escrow Protection Enabled</span>
                        <p className="text-sm text-green-700">
                          Your payment will be held securely until delivery is confirmed
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items ({cart.totalItems})</h2>
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.title}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>🔒 Place Order - {formatCurrency(orderSummary.total)}</>
                  )}
                </button>
              </div>
            )}
          </div>


          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Items Preview */}
              <div className="space-y-3 text-sm max-h-48 overflow-y-auto mb-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(orderSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery ({selectedDelivery.name})</span>
                  <span className="font-medium">{formatCurrency(orderSummary.delivery)}</span>
                </div>
                {orderSummary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount</span>
                    <span>-{formatCurrency(orderSummary.discount)}</span>
                  </div>
                )}
                {orderSummary.rewardsDiscount > 0 && (
                  <div className="flex justify-between text-pink-600">
                    <span>Rewards Discount</span>
                    <span>-{formatCurrency(orderSummary.rewardsDiscount)}</span>
                  </div>
                )}
                {orderSummary.escrowFee > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span>Escrow Fee (2%)</span>
                    <span>{formatCurrency(orderSummary.escrowFee)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(orderSummary.total)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">🔒</span>
                    Secure SSL Encryption
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Buyer Protection Guarantee
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">↩️</span>
                    Easy Returns within 30 days
                  </div>
                  {useEscrow && (
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-500">🛡️</span>
                      Escrow Protection Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
