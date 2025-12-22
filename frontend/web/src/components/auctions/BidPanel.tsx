// ============================================
// 🔨 BidPanel Component - Auction Bidding UI
// ============================================

import { useState, useEffect } from 'react';
import { auctionApi } from '../../services/api';
import { wsService, auctionEvents } from '../../services/websocket';

interface BidPanelProps {
  auctionId: string;
  currentPrice: number;
  minIncrement: number;
  isUserHighestBidder?: boolean;
  onBidPlaced?: (amount: number) => void;
}

interface BidError {
  code: string;
  message: string;
}

// Error messages for bid rejections
const BID_ERROR_MESSAGES: Record<string, string> = {
  bid_too_low: 'Your bid must be higher than the current bid',
  auction_ended: 'This auction has ended',
  insufficient_funds: 'Insufficient wallet balance',
  user_blocked: 'You are not allowed to bid on this auction',
  invalid_amount: 'Please enter a valid bid amount',
  rate_limited: 'Too many bids. Please wait a moment.',
  not_authenticated: 'Please sign in to place a bid',
};

export function BidPanel({
  auctionId,
  currentPrice,
  minIncrement,
  isUserHighestBidder = false,
  onBidPlaced,
}: BidPanelProps) {
  const [bidAmount, setBidAmount] = useState(currentPrice + minIncrement);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);

  // Update bid amount when current price changes
  useEffect(() => {
    setBidAmount(prev => Math.max(prev, currentPrice + minIncrement));
  }, [currentPrice, minIncrement]);

  // Handle bid rejection from WebSocket
  useEffect(() => {
    const unsubscribe = wsService.subscribe('auction:bid_rejected', (data: unknown) => {
      const rejection = data as { auctionId: string; reason: string };
      if (rejection.auctionId === auctionId) {
        const errorMessage = BID_ERROR_MESSAGES[rejection.reason] || rejection.reason;
        setError(errorMessage);
        setIsSubmitting(false);
      }
    });

    return () => unsubscribe();
  }, [auctionId]);

  const handleBid = async (amount: number = bidAmount) => {
    if (amount <= currentPrice) {
      setError(BID_ERROR_MESSAGES.bid_too_low);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Try WebSocket first for real-time
      if (wsService.isConnected) {
        auctionEvents.placeBid(auctionId, amount);
        // Success will be confirmed via WebSocket event
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onBidPlaced?.(amount);
      } else {
        // Fallback to REST API
        const response = await auctionApi.placeBid(auctionId, amount);
        if (response.data.success) {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
          onBidPlaced?.(amount);
        }
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: BidError } };
      const errorCode = apiError.response?.data?.code || 'unknown';
      const errorMessage = BID_ERROR_MESSAGES[errorCode] || 'Failed to place bid. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick bid amounts
  const quickBidAmounts = [
    { label: `+$${minIncrement}`, amount: currentPrice + minIncrement },
    { label: `+$${minIncrement * 2}`, amount: currentPrice + minIncrement * 2 },
    { label: `+$${minIncrement * 5}`, amount: currentPrice + minIncrement * 5 },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {/* User is highest bidder notice */}
      {isUserHighestBidder && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          You're the highest bidder!
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Bid placed successfully!
        </div>
      )}

      {/* Quick Bid Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickBidAmounts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleBid(item.amount)}
            disabled={isSubmitting}
            className="py-3 px-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="block text-xs text-gray-500">{item.label}</span>
            <span className="block">{formatPrice(item.amount)}</span>
          </button>
        ))}
      </div>

      {/* Custom Bid Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => {
              setBidAmount(Number(e.target.value));
              setError(null);
            }}
            min={currentPrice + minIncrement}
            step={minIncrement}
            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg font-bold"
            placeholder="Enter bid amount"
          />
        </div>
        <button
          onClick={() => handleBid()}
          disabled={isSubmitting || bidAmount <= currentPrice}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Bidding...
            </>
          ) : (
            <>🔨 Place Bid</>
          )}
        </button>
      </div>

      {/* Min increment info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Min increment: {formatPrice(minIncrement)}</span>
        <button
          onClick={() => setShowProxyModal(true)}
          className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Set Proxy Bid
        </button>
      </div>

      {/* Proxy Bid Modal */}
      {showProxyModal && (
        <ProxyBidModal
          auctionId={auctionId}
          currentPrice={currentPrice}
          minIncrement={minIncrement}
          onClose={() => setShowProxyModal(false)}
          onSuccess={() => {
            setShowProxyModal(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// Proxy Bid Modal Component
// ============================================

interface ProxyBidModalProps {
  auctionId: string;
  currentPrice: number;
  minIncrement: number;
  onClose: () => void;
  onSuccess: () => void;
}

function ProxyBidModal({
  auctionId,
  currentPrice,
  minIncrement,
  onClose,
  onSuccess,
}: ProxyBidModalProps) {
  const [maxAmount, setMaxAmount] = useState(currentPrice + minIncrement * 10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetProxyBid = async () => {
    if (maxAmount <= currentPrice) {
      setError('Maximum bid must be higher than current price');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Send proxy bid via WebSocket
      if (wsService.isConnected) {
        wsService.send('auction:proxy_bid', { auctionId, maxAmount });
        onSuccess();
      } else {
        // Fallback - proxy bids typically require WebSocket
        setError('Real-time connection required for proxy bids');
      }
    } catch {
      setError('Failed to set proxy bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Set Proxy Bid</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Proxy Bidding Works</p>
              <p>We'll automatically bid on your behalf up to your maximum amount, using the minimum increment needed to stay ahead.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Current Price</span>
            <span className="text-xl font-bold">{formatPrice(currentPrice)}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Maximum Bid
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(Number(e.target.value));
                setError(null);
              }}
              min={currentPrice + minIncrement}
              step={minIncrement}
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none text-xl font-bold"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You won't pay more than this amount. Your actual winning bid may be lower.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSetProxyBid}
            disabled={isSubmitting || maxAmount <= currentPrice}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-indigo-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Setting...' : 'Set Proxy Bid'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BidPanel;
