// ============================================
// 🪙 MNB Token Payment Option Component
// ============================================

import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';

interface MNBPaymentOptionProps {
  amount: number;
  currency?: string;
  onPaymentComplete: (txHash: string) => void;
  onPaymentError: (error: string) => void;
  recipientAddress?: string;
  orderId: string;
  disabled?: boolean;
}

export function MNBPaymentOption({
  amount,
  currency = 'USD',
  onPaymentComplete,
  onPaymentError,
  recipientAddress = '0x0000000000000000000000000000000000000000', // Platform wallet
  orderId,
  disabled = false,
}: MNBPaymentOptionProps) {
  const {
    isConnected,
    address,
    mnbBalance,
    connectMetaMask,
    payWithMNB,
    getMNBPrice,
    formatAddress,
    isMetaMaskInstalled,
  } = useWallet();

  const [mnbPrice, setMnbPrice] = useState<number>(1.0);
  const [mnbAmount, setMnbAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch MNB price and calculate amount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getMNBPrice();
        setMnbPrice(price > 0 ? price : 1.0);
        setMnbAmount(amount / (price > 0 ? price : 1.0));
      } catch {
        setMnbPrice(1.0);
        setMnbAmount(amount);
      }
    };

    fetchPrice();
  }, [amount, getMNBPrice]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amt);
  };

  const handleConnect = async () => {
    try {
      await connectMetaMask();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handlePayment = async () => {
    if (!isConnected || isProcessing || disabled) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await payWithMNB(recipientAddress, amount, orderId);

      if (result.success && result.hash) {
        onPaymentComplete(result.hash);
      } else {
        const errorMsg = result.error || 'Payment failed';
        setError(errorMsg);
        onPaymentError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMsg);
      onPaymentError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const mnbBalanceNum = parseFloat(mnbBalance);
  const hasInsufficientBalance = mnbBalanceNum < mnbAmount;

  // Not connected state
  if (!isConnected) {
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
            {isMetaMaskInstalled ? 'Connect Wallet to Pay' : 'Install MetaMask'}
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

  // Connected state
  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
        {/* Wallet Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="font-mono text-sm text-gray-700">{formatAddress(address!)}</span>
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

        {/* Insufficient Balance Warning */}
        {hasInsufficientBalance && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="font-medium text-yellow-800">Insufficient Balance</p>
            <p className="text-sm text-yellow-700">
              You need {(mnbAmount - mnbBalanceNum).toLocaleString(undefined, { maximumFractionDigits: 4 })} more MNBT
            </p>
            <a 
              href="/wallet/deposit" 
              className="text-purple-600 font-medium hover:underline text-sm mt-1 inline-block"
            >
              Get more MNBT →
            </a>
          </div>
        )}

        {/* Pay Button */}
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
            <>
              🪙 Pay {mnbAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} MNBT
            </>
          )}
        </button>

        {/* Security Note */}
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

export default MNBPaymentOption;
