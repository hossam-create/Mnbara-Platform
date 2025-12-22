// ============================================
// 🔨 AuctionCard Component - Live Bidding UI
// ============================================

import { useState, useEffect } from 'react';
import type { Auction } from '../../types';

interface AuctionCardProps {
  auction: Auction;
  onBid?: (auctionId: string, amount: number) => void;
  onWatch?: (auctionId: string) => void;
  variant?: 'default' | 'featured' | 'compact';
}

export function AuctionCard({ auction, onBid, onWatch, variant = 'default' }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [bidAmount, setBidAmount] = useState<number>(auction.currentPrice + getMinIncrement());
  const [isWatching, setIsWatching] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);

  function getMinIncrement() {
    const price = auction.currentPrice;
    if (price < 10) return 0.5;
    if (price < 50) return 1;
    if (price < 100) return 2;
    if (price < 500) return 5;
    if (price < 1000) return 10;
    return 25;
  }

  useEffect(() => {
    const updateTimer = () => {
      const end = new Date(auction.endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Ended');
        setIsUrgent(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
        setIsUrgent(false);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
        setIsUrgent(hours < 2);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
        setIsUrgent(true);
      } else {
        setTimeLeft(`${seconds}s`);
        setIsUrgent(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleBid = () => {
    if (bidAmount > auction.currentPrice) {
      onBid?.(auction.id, bidAmount);
      setShowBidModal(false);
    }
  };

  const getStatusStyles = () => {
    switch (auction.status) {
      case 'live':
        return isUrgent
          ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
          : 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'ending_soon':
        return 'bg-gradient-to-r from-orange-500 to-red-500 animate-pulse';
      case 'scheduled':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <>
      <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
        {/* Status Banner */}
        <div className={`absolute top-0 left-0 right-0 py-2 px-4 text-white text-center text-sm font-bold z-10 ${getStatusStyles()}`}>
          {auction.status === 'live' && (
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              LIVE - {timeLeft} left
            </div>
          )}
          {auction.status === 'scheduled' && `Starts ${new Date(auction.startTime).toLocaleDateString()}`}
          {auction.status === 'ended' && 'Auction Ended'}
        </div>

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 pt-10">
          <img
            src={auction.product.images[0] || '/placeholder.jpg'}
            alt={auction.product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Watchers Badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {auction.watchers} watching
          </div>

          {/* Watch Button */}
          <button
            onClick={() => {
              setIsWatching(!isWatching);
              onWatch?.(auction.id);
            }}
            className={`absolute top-14 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isWatching ? 'bg-pink-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-pink-500 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill={isWatching ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-500 transition-colors">
            {auction.product.name}
          </h3>

          {/* Bid Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <span className="block text-xs text-gray-500 uppercase tracking-wide">Current Bid</span>
              <span className="block text-xl font-bold text-gray-900">{formatPrice(auction.currentPrice)}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <span className="block text-xs text-gray-500 uppercase tracking-wide">Total Bids</span>
              <span className="block text-xl font-bold text-gray-900">{auction.totalBids}</span>
            </div>
          </div>

          {/* Buy Now Option */}
          {auction.buyNowPrice && (
            <div className="flex items-center justify-between bg-green-50 rounded-xl p-3 mb-4">
              <span className="text-sm text-green-700 font-medium">Buy Now Available</span>
              <span className="text-lg font-bold text-green-700">{formatPrice(auction.buyNowPrice)}</span>
            </div>
          )}

          {/* Action Buttons */}
          {auction.status === 'live' && (
            <div className="space-y-2">
              <button
                onClick={() => setShowBidModal(true)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all ${
                  isUrgent
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
                    : 'bg-gradient-to-r from-pink-500 to-indigo-500'
                }`}
              >
                {isUrgent ? '⚡ Quick Bid Now!' : '🔨 Place Bid'}
              </button>
              
              {auction.buyNowPrice && (
                <button className="w-full py-3 px-4 rounded-xl font-bold text-green-700 bg-green-100 hover:bg-green-200 transition-colors">
                  Buy Now - {formatPrice(auction.buyNowPrice)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Place Your Bid</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Current Bid</span>
                <span className="text-xl font-bold">{formatPrice(auction.currentPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Min Increment</span>
                <span className="font-semibold">{formatPrice(getMinIncrement())}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Bid Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  min={auction.currentPrice + getMinIncrement()}
                  step={getMinIncrement()}
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none text-xl font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBidModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBid}
                disabled={bidAmount <= auction.currentPrice}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-indigo-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Confirm Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AuctionCard;
