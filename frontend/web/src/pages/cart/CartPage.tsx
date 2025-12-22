// ============================================
// 🛒 Cart Page - Shopping Cart
// ============================================

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

interface ShippingEstimate {
  method: string;
  price: number;
  estimatedDays: string;
}

const SHIPPING_ESTIMATES: ShippingEstimate[] = [
  { method: 'Standard', price: 15, estimatedDays: '5-7 business days' },
  { method: 'Express', price: 25, estimatedDays: '2-3 business days' },
  { method: 'Traveler', price: 40, estimatedDays: '3-5 business days' },
];

const FREE_SHIPPING_THRESHOLD = 500;

export function CartPage() {
  const navigate = useNavigate();
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingEstimate>(SHIPPING_ESTIMATES[0]);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = cart.totalPrice;
    const promoDiscount = appliedPromo ? (subtotal * appliedPromo.discount) / 100 : 0;
    const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : selectedShipping.price;
    const total = subtotal - promoDiscount + deliveryFee;
    
    return {
      subtotal,
      promoDiscount,
      deliveryFee,
      total,
      amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    };
  }, [cart.totalPrice, appliedPromo, selectedShipping]);

  const applyPromoCode = () => {
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();
    
    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }

    // Validate promo codes
    const validCodes: Record<string, number> = {
      'WELCOME10': 10,
      'SAVE15': 15,
      'VIP20': 20,
    };

    if (validCodes[code]) {
      setAppliedPromo({ code, discount: validCodes[code] });
      setPromoCode('');
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleProceedToCheckout = () => {
    // Store shipping selection for checkout
    sessionStorage.setItem('selectedShipping', JSON.stringify(selectedShipping));
    if (appliedPromo) {
      sessionStorage.setItem('appliedPromo', JSON.stringify(appliedPromo));
    }
    navigate('/checkout');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading && cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})
          </h1>
          {cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 font-medium text-sm"
            >
              Clear Cart
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {cart.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet</p>
            <Link
              to="/products"
              className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex gap-6">
                    {/* Image */}
                    <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">📦</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                            <Link to={`/products/${item.id}`} className="hover:text-pink-500">
                              {item.title}
                            </Link>
                          </h3>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={loading}
                          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={loading}
                            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center font-medium border border-gray-300 rounded-lg py-1"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={loading}
                            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-gray-500">
                              {formatCurrency(item.price)} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Shipping Estimate Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Shipping Estimate</h3>
                <div className="space-y-3">
                  {SHIPPING_ESTIMATES.map((option) => (
                    <label
                      key={option.method}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedShipping.method === option.method
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShipping.method === option.method}
                          onChange={() => setSelectedShipping(option)}
                          className="w-4 h-4 text-pink-500 focus:ring-pink-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{option.method}</span>
                          <span className="text-sm text-gray-500 ml-2">({option.estimatedDays})</span>
                        </div>
                      </div>
                      <span className="font-medium text-gray-900">
                        {calculations.subtotal >= FREE_SHIPPING_THRESHOLD && option.method === 'Standard'
                          ? 'FREE'
                          : formatCurrency(option.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between py-4">
                <Link to="/products" className="text-pink-500 font-medium hover:underline">
                  ← Continue Shopping
                </Link>
                <button className="text-pink-500 font-medium hover:underline">
                  ❤️ Save for Later
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                {/* Promo Code */}
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyPromoCode()}
                      placeholder="Promo code"
                      className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <button
                      onClick={applyPromoCode}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="mt-2 text-sm text-red-500">{promoError}</p>
                  )}
                  {appliedPromo && (
                    <div className="mt-2 flex items-center justify-between text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <span>✓ {appliedPromo.code} applied ({appliedPromo.discount}% off)</span>
                      <button 
                        onClick={() => setAppliedPromo(null)} 
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Remove promo code"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({cart.totalItems} items)</span>
                    <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                  </div>
                  {calculations.promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Promo Discount ({appliedPromo?.discount}%)</span>
                      <span>-{formatCurrency(calculations.promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping ({selectedShipping.method})</span>
                    <span className={calculations.deliveryFee === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                      {calculations.deliveryFee === 0 ? 'FREE' : formatCurrency(calculations.deliveryFee)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(calculations.total)}</span>
                  </div>
                  {calculations.promoDiscount > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      You're saving {formatCurrency(calculations.promoDiscount)}!
                    </p>
                  )}
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  disabled={loading || cart.items.length === 0}
                  className="block w-full py-4 text-center bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Proceed to Checkout'}
                </button>

                {/* Trust Badges */}
                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Secure
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Buyer Protection
                  </span>
                </div>

                {/* Free Shipping Banner */}
                {calculations.amountToFreeShipping > 0 && (
                  <div className="mt-4 p-3 bg-pink-50 rounded-xl text-center text-sm">
                    <span className="text-pink-600">
                      Add {formatCurrency(calculations.amountToFreeShipping)} more for <strong>FREE standard delivery</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
