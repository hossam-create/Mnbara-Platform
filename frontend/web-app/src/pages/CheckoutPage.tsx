import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import {
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { RootState, AppDispatch } from '@/store'
import { clearCart } from '@/store/slices/cartSlice'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ShippingAddress {
  fullName: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

interface PaymentMethod {
  id: string
  type: 'card' | 'apple_pay' | 'mada' | 'cod'
  label: string
  icon: string
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  
  const { items, total } = useSelector((state: RootState) => state.cart)
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Saudi Arabia'
  })
  
  const [selectedPayment, setSelectedPayment] = useState<string>('card')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })

  const paymentMethods: PaymentMethod[] = [
    { id: 'card', type: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { id: 'mada', type: 'mada', label: 'Mada', icon: '🏦' },
    { id: 'apple_pay', type: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
    { id: 'cod', type: 'cod', label: 'Cash on Delivery', icon: '💵' }
  ]

  const shippingCost = total > 200 ? 0 : 25
  const tax = total * 0.15
  const grandTotal = total + shippingCost + tax

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate('/cart')
    }
  }, [items, navigate, orderPlaced])

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newOrderId = `ORD-${Date.now()}`
      setOrderId(newOrderId)
      setOrderPlaced(true)
      dispatch(clearCart())
      setStep(3)
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  if (orderPlaced) {
    return (
      <>
        <Helmet>
          <title>Order Confirmed - Mnbara</title>
        </Helmet>
        
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto px-4 text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-12 h-12 text-green-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Order Confirmed!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Thank you for your purchase. Your order has been placed successfully.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{orderId}</p>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                A confirmation email has been sent to your email address.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                  View Orders
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Mnbara</title>
        <meta name="description" content="Complete your purchase securely on Mnbara." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[
              { num: 1, label: 'Shipping' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'Confirmation' }
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.num 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {step > s.num ? <CheckCircleIcon className="w-6 h-6" /> : s.num}
                  </div>
                  <span className={`ml-2 font-medium ${
                    step >= s.num ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <ChevronRightIcon className="w-5 h-5 mx-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <TruckIcon className="w-6 h-6" />
                    Shipping Address
                  </h2>
                  
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={shippingAddress.fullName}
                            onChange={e => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            required
                            value={shippingAddress.phone}
                            onChange={e => setShippingAddress({...shippingAddress, phone: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            placeholder="+966 5X XXX XXXX"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Street Address
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <textarea
                          required
                          rows={2}
                          value={shippingAddress.address}
                          onChange={e => setShippingAddress({...shippingAddress, address: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                          placeholder="Street name, building number, apartment"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.city}
                          onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                          placeholder="Riyadh"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.postalCode}
                          onChange={e => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                          placeholder="12345"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Country
                        </label>
                        <select
                          value={shippingAddress.country}
                          onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Saudi Arabia</option>
                          <option>UAE</option>
                          <option>Kuwait</option>
                          <option>Bahrain</option>
                          <option>Qatar</option>
                          <option>Oman</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mt-6"
                    >
                      Continue to Payment
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <CreditCardIcon className="w-6 h-6" />
                    Payment Method
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    {paymentMethods.map(method => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedPayment === method.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedPayment === method.id}
                          onChange={e => setSelectedPayment(e.target.value)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="text-2xl">{method.icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{method.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  {selectedPayment === 'card' && (
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardDetails.number}
                          onChange={e => setCardDetails({...cardDetails, number: formatCardNumber(e.target.value)})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardDetails.expiry}
                            onChange={e => setCardDetails({...cardDetails, expiry: formatExpiry(e.target.value)})}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            placeholder="MM/YY"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={cardDetails.cvv}
                            onChange={e => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            placeholder="123"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          required
                          value={cardDetails.name}
                          onChange={e => setCardDetails({...cardDetails, name: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                          placeholder="JOHN DOE"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <LockClosedIcon className="w-4 h-4" />
                        <span>Your payment information is encrypted and secure</span>
                      </div>
                      
                      <div className="flex gap-4 mt-6">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 border-2 border-gray-300 dark:border-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <LoadingSpinner size="small" />
                              Processing...
                            </>
                          ) : (
                            `Pay ${grandTotal.toFixed(2)} SAR`
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                  
                  {selectedPayment === 'cod' && (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                          Cash on Delivery: Pay when you receive your order. Additional fee of 15 SAR applies.
                        </p>
                      </div>
                      
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 border-2 border-gray-300 dark:border-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Back
                        </button>
                        <button
                          onClick={handlePaymentSubmit}
                          disabled={loading}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : 'Place Order'}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h3>
                
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(item.price * item.quantity).toFixed(2)} SAR
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{total.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? 'Free' : `${shippingCost.toFixed(2)} SAR`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>VAT (15%)</span>
                    <span>{tax.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>{grandTotal.toFixed(2)} SAR</span>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CheckoutPage
