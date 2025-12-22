// ============================================
// 💳 Payment Method Selector Component
// ============================================

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Types
export type PaymentMethodType = 'card' | 'paypal' | 'wallet' | 'mnb';

export interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  onPaymentReady: (ready: boolean) => void;
  onPaymentSubmit: (paymentData: PaymentData) => Promise<void>;
  amount: number;
  currency?: string;
  walletBalance?: number;
  disabled?: boolean;
  orderId?: string;
}

export interface PaymentData {
  method: PaymentMethodType;
  stripePaymentMethodId?: string;
  paypalOrderId?: string;
  walletConfirmed?: boolean;
  mnbTxHash?: string;
}

interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  icon: string;
  description: string;
  badge?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Pay with Visa, Mastercard, or Amex' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', description: 'Fast and secure checkout' },
  { id: 'wallet', name: 'Wallet Balance', icon: '💰', description: 'Use your MNBARA wallet' },
  { id: 'mnb', name: 'MNB Token', icon: '🪙', description: 'Pay with MNB cryptocurrency', badge: 'CRYPTO' },
];

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// Card Element Styles
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

// Stripe Card Form Component
interface StripeCardFormProps {
  onReady: (ready: boolean) => void;
  onSubmit: (paymentMethodId: string) => Promise<void>;
  amount: number;
  currency: string;
  disabled?: boolean;
}

function StripeCardForm({ onReady, onSubmit, amount, currency, disabled }: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  useEffect(() => {
    onReady(cardComplete && !processing && !!stripe && !!elements);
  }, [cardComplete, processing, stripe, elements, onReady]);

  const handleCardChange = (event: { complete: boolean; error?: { message: string } }) => {
    setCardComplete(event.complete);
    setError(event.error?.message || null);
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        return;
      }

      if (paymentMethod) {
        await onSubmit(paymentMethod.id);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amt);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border-2 border-gray-200 rounded-xl focus-within:border-pink-500 transition-colors">
        <CardElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange} />
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Your card details are encrypted and secure</span>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!cardComplete || processing || disabled}
        className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>🔒 Pay {formatCurrency(amount)}</>
        )}
      </button>
    </div>
  );
}

// PayPal Button Component
interface PayPalButtonProps {
  amount: number;
  currency: string;
  onApprove: (orderId: string) => Promise<void>;
  onError: (error: string) => void;
  onReady?: (ready: boolean) => void;
  disabled?: boolean;
}

// PayPal SDK types
interface PayPalActions {
  order: {
    capture: () => Promise<{ id: string; status: string }>;
  };
}

interface PayPalData {
  orderID: string;
}

interface PayPalButtonsComponent {
  render: (container: HTMLElement) => Promise<void>;
  close: () => Promise<void>;
}

interface PayPalNamespace {
  Buttons: (config: {
    style?: { layout?: string; color?: string; shape?: string; label?: string; height?: number };
    createOrder: () => Promise<string>;
    onApprove: (data: PayPalData, actions: PayPalActions) => Promise<void>;
    onError: (err: Error) => void;
    onCancel?: () => void;
  }) => PayPalButtonsComponent;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

function PayPalButton({ amount, currency, onApprove, onError, onReady, disabled }: PayPalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<PayPalButtonsComponent | null>(null);

  // Notify parent when PayPal is ready
  useEffect(() => {
    onReady?.(sdkReady && !loading);
  }, [sdkReady, loading, onReady]);

  useEffect(() => {
    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId || clientId === 'test') {
      // Use sandbox mode for testing
      setSdkReady(true);
      return;
    }

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
    script.async = true;
    script.onload = () => {
      setSdkReady(true);
      setSdkError(null);
    };
    script.onerror = () => {
      setSdkError('Failed to load PayPal. Please try another payment method.');
      onError('Failed to load PayPal SDK');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup PayPal buttons if they exist
      if (buttonsRef.current) {
        buttonsRef.current.close().catch(() => {});
      }
    };
  }, [currency, onError]);

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (!sdkReady || !paypalContainerRef.current || disabled) return;
    
    // Clear previous buttons
    if (paypalContainerRef.current) {
      paypalContainerRef.current.innerHTML = '';
    }

    // If PayPal SDK is available, render native buttons
    if (window.paypal) {
      const buttons = window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 50,
        },
        createOrder: async () => {
          setLoading(true);
          try {
            // Create PayPal order via backend API
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/payments/create-paypal-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              },
              body: JSON.stringify({
                amount,
                currency,
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to create PayPal order');
            }
            
            const data = await response.json();
            return data.data?.paypalOrderId || data.paypalOrderId;
          } catch (err) {
            setLoading(false);
            throw err;
          }
        },
        onApprove: async (data: PayPalData) => {
          try {
            await onApprove(data.orderID);
          } finally {
            setLoading(false);
          }
        },
        onError: (err: Error) => {
          setLoading(false);
          onError(err.message || 'PayPal payment failed. Please try again.');
        },
        onCancel: () => {
          setLoading(false);
        },
      });

      buttonsRef.current = buttons;
      buttons.render(paypalContainerRef.current).catch((err: Error) => {
        console.error('PayPal button render error:', err);
      });
    }
  }, [sdkReady, disabled, amount, currency, onApprove, onError]);

  // Fallback button for when SDK is not available or in test mode
  const handleFallbackClick = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    try {
      // Create PayPal order via backend and get approval URL
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/payments/create-paypal-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          amount,
          currency,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }
      
      const data = await response.json();
      const paypalOrderId = data.data?.paypalOrderId || data.paypalOrderId;
      const approvalUrl = data.data?.approvalUrl || data.approvalUrl;
      
      if (approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = approvalUrl;
      } else {
        // For testing/sandbox, simulate approval
        await onApprove(paypalOrderId);
      }
    } catch (err) {
      onError('PayPal payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amt);
  };

  return (
    <div className="space-y-4">
      {sdkError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {sdkError}
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-xl">
        <p className="text-sm text-gray-600 mb-4 text-center">
          Pay securely with PayPal
        </p>
        
        {/* PayPal SDK buttons container */}
        <div 
          ref={paypalContainerRef} 
          className={`min-h-[50px] ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        />
        
        {/* Fallback button when SDK is not loaded or in test mode */}
        {(!window.paypal || !import.meta.env.VITE_PAYPAL_CLIENT_ID) && (
          <button
            type="button"
            onClick={handleFallbackClick}
            disabled={disabled || loading}
            className="w-full py-4 bg-[#0070ba] hover:bg-[#003087] text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting to PayPal...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.629h6.724c2.332 0 4.058.625 5.13 1.86.972 1.12 1.322 2.63 1.04 4.494-.018.122-.04.252-.065.39a8.88 8.88 0 0 1-.107.57c-.76 3.466-3.17 5.235-7.17 5.235H9.39a.766.766 0 0 0-.757.63l-.925 5.903a.641.641 0 0 1-.632.54v-.376z"/>
                </svg>
                Pay with PayPal - {formatCurrency(amount)}
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>PayPal Buyer Protection included</span>
      </div>
    </div>
  );
}

// MNB Token Payment Component
interface MNBTokenPaymentProps {
  amount: number;
  currency: string;
  orderId: string;
  onPaymentComplete: (txHash: string) => void;
  onPaymentError: (error: string) => void;
  onReady?: (ready: boolean) => void;
  disabled?: boolean;
}

function MNBTokenPayment({
  amount,
  currency,
  orderId: _orderId,
  onPaymentComplete,
  onPaymentError,
  onReady,
  disabled,
}: MNBTokenPaymentProps) {
  // Import wallet context dynamically to avoid circular dependencies
  const [walletState, setWalletState] = useState<{
    isConnected: boolean;
    address: string | null;
    mnbBalance: string;
  }>({ isConnected: false, address: null, mnbBalance: '0' });
  const [mnbPrice] = useState<number>(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check wallet connection on mount
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0) {
            setWalletState({
              isConnected: true,
              address: accounts[0],
              mnbBalance: '1000', // Mock balance - in production, fetch from contract
            });
          }
        } catch {
          // Wallet not connected
        }
      }
    };
    checkWallet();
  }, []);

  const mnbAmount = amount / mnbPrice;
  const mnbBalanceNum = parseFloat(walletState.mnbBalance);
  const hasInsufficientBalance = mnbBalanceNum < mnbAmount;

  useEffect(() => {
    onReady?.(walletState.isConnected && !hasInsufficientBalance && !isProcessing);
  }, [walletState.isConnected, hasInsufficientBalance, isProcessing, onReady]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amt);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    if (!window.ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts && accounts.length > 0) {
        setWalletState({
          isConnected: true,
          address: accounts[0],
          mnbBalance: '1000', // Mock balance
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handlePayment = async () => {
    if (!walletState.isConnected || isProcessing || disabled) return;

    setIsProcessing(true);
    setError(null);

    try {
      // In production, this would call the actual smart contract
      // For now, simulate a successful transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock transaction hash
      const mockTxHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      
      onPaymentComplete(mockTxHash);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMsg);
      onPaymentError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!walletState.isConnected) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🪙</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Pay with MNB Tokens</p>
              <p className="text-sm text-gray-600">Connect your wallet to pay with crypto</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Order Total</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">≈ MNB Amount</span>
              <span className="font-medium text-purple-600">
                {mnbAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} MNBT
              </span>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={disabled}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            Connect Wallet to Pay
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
        {/* Wallet Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="font-mono text-sm text-gray-700">{formatAddress(walletState.address!)}</span>
          </div>
          <span className="text-sm text-purple-600 font-medium">
            {mnbBalanceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} MNBT
          </span>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Order Total</span>
            <span className="font-bold text-gray-900">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">MNB Price</span>
            <span className="text-gray-700">{formatCurrency(mnbPrice)} / MNBT</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-600">You Pay</span>
            <span className="font-bold text-purple-600 text-lg">
              {mnbAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} MNBT
            </span>
          </div>
        </div>

        {hasInsufficientBalance && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="font-medium text-yellow-800">Insufficient Balance</p>
            <p className="text-sm text-yellow-700">
              You need {(mnbAmount - mnbBalanceNum).toLocaleString(undefined, { maximumFractionDigits: 4 })} more MNBT
            </p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={disabled || isProcessing || hasInsufficientBalance}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing Transaction...
            </>
          ) : (
            <>🪙 Pay {mnbAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} MNBT</>
          )}
        </button>

        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secure blockchain transaction via MetaMask</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

// Wallet Payment Component
interface WalletPaymentProps {
  amount: number;
  currency: string;
  balance: number;
  onConfirm: () => Promise<void>;
  onReady?: (ready: boolean) => void;
  disabled?: boolean;
}

function WalletPayment({ amount, currency, balance, onConfirm, onReady, disabled }: WalletPaymentProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const insufficientFunds = balance < amount;

  // Notify parent when wallet payment is ready
  useEffect(() => {
    onReady?.(!insufficientFunds && !processing);
  }, [insufficientFunds, processing, onReady]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amt);
  };

  const handleConfirm = async () => {
    if (insufficientFunds || disabled || processing) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      await onConfirm();
    } catch (err) {
      setError('Wallet payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Available Balance</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(balance)}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Order Total</span>
          <span className="font-medium">{formatCurrency(amount)}</span>
        </div>
        
        {!insufficientFunds && (
          <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-green-200">
            <span className="text-gray-600">Remaining Balance</span>
            <span className="font-medium text-green-600">{formatCurrency(balance - amount)}</span>
          </div>
        )}
      </div>

      {insufficientFunds && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="font-medium text-yellow-800">Insufficient Balance</p>
          <p className="text-sm text-yellow-700">
            You need {formatCurrency(amount - balance)} more to complete this purchase.
          </p>
          <a href="/wallet/deposit" className="text-pink-500 font-medium hover:underline text-sm mt-2 inline-block">
            Add funds to wallet →
          </a>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={insufficientFunds || disabled || processing}
        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>💰 Pay with Wallet - {formatCurrency(amount)}</>
        )}
      </button>
    </div>
  );
}

// Main Payment Method Selector Component
export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  onPaymentReady,
  onPaymentSubmit,
  amount,
  currency = 'USD',
  walletBalance = 0,
  disabled = false,
  orderId = '',
}: PaymentMethodSelectorProps) {
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleStripeSubmit = async (paymentMethodId: string) => {
    await onPaymentSubmit({
      method: 'card',
      stripePaymentMethodId: paymentMethodId,
    });
  };

  const handlePayPalApprove = async (paypalOrderId: string) => {
    await onPaymentSubmit({
      method: 'paypal',
      paypalOrderId,
    });
  };

  const handleWalletConfirm = async () => {
    await onPaymentSubmit({
      method: 'wallet',
      walletConfirmed: true,
    });
  };

  const handleMNBPaymentComplete = async (txHash: string) => {
    await onPaymentSubmit({
      method: 'mnb',
      mnbTxHash: txHash,
    });
  };

  const handleMNBPaymentError = (error: string) => {
    setPaymentError(error);
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onMethodChange(method.id)}
            disabled={disabled}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === method.id
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-3xl">{method.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{method.name}</span>
                {method.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full">
                    {method.badge}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">{method.description}</span>
              {method.id === 'wallet' && (
                <span className="block text-sm text-green-600 mt-1">
                  Balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(walletBalance)}
                </span>
              )}
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === method.id ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
            }`}>
              {selectedMethod === method.id && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Payment Form based on selected method */}
      <div className="mt-6">
        {selectedMethod === 'card' && (
          <Elements stripe={stripePromise}>
            <StripeCardForm
              onReady={onPaymentReady}
              onSubmit={handleStripeSubmit}
              amount={amount}
              currency={currency}
              disabled={disabled}
            />
          </Elements>
        )}

        {selectedMethod === 'paypal' && (
          <PayPalButton
            amount={amount}
            currency={currency}
            onApprove={handlePayPalApprove}
            onError={setPaymentError}
            onReady={onPaymentReady}
            disabled={disabled}
          />
        )}

        {selectedMethod === 'wallet' && (
          <WalletPayment
            amount={amount}
            currency={currency}
            balance={walletBalance}
            onConfirm={handleWalletConfirm}
            onReady={onPaymentReady}
            disabled={disabled}
          />
        )}

        {selectedMethod === 'mnb' && (
          <MNBTokenPayment
            amount={amount}
            currency={currency}
            orderId={orderId}
            onPaymentComplete={handleMNBPaymentComplete}
            onPaymentError={handleMNBPaymentError}
            onReady={onPaymentReady}
            disabled={disabled}
          />
        )}
      </div>

      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {paymentError}
        </div>
      )}
    </div>
  );
}

export default PaymentMethodSelector;
