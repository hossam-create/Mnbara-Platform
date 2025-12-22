// ============================================
// 🔨 Auction Detail Page - Real-time Bidding
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auctionApi } from '../../services/api';
import { wsService, auctionEvents } from '../../services/websocket';
import { useAuth } from '../../context/AuthContext';
import { AuctionNotifications } from '../../components/auctions/AuctionNotifications';
import { AuctionTimer as AuctionTimerComponent } from '../../components/auctions/AuctionTimer';
import { BidPanel as BidPanelComponent } from '../../components/auctions/BidPanel';
import type { Auction, Bid } from '../../types';

interface AuctionState {
  currentPrice: number;
  totalBids: number;
  highestBidder?: { id: string; fullName: string };
  endTime: string;
  status: string;
}

interface BidUpdate {
  auctionId: string;
  bid: Bid;
  newHighest: number;
  totalBids: number;
}

export function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Real-time state from WebSocket
  const [liveState, setLiveState] = useState<AuctionState | null>(null);
  
  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void)[]>([]);

  // Load auction data
  const loadAuction = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [auctionRes, bidsRes] = await Promise.all([
        auctionApi.get(id),
        auctionApi.getBids(id),
      ]);

      if (auctionRes.data.success && auctionRes.data.data) {
        setAuction(auctionRes.data.data);
        setLiveState({
          currentPrice: auctionRes.data.data.currentPrice,
          totalBids: auctionRes.data.data.totalBids,
          highestBidder: auctionRes.data.data.highestBidder 
            ? { id: auctionRes.data.data.highestBidder.id, fullName: auctionRes.data.data.highestBidder.fullName }
            : undefined,
          endTime: auctionRes.data.data.endTime,
          status: auctionRes.data.data.status,
        });
      }
      
      if (bidsRes.data.success && bidsRes.data.data) {
        setBids(bidsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load auction:', err);
      setError('Failed to load auction details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!id || !isAuthenticated) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const setupWebSocket = async () => {
      try {
        if (!wsService.isConnected) {
          await wsService.connect(token);
        }
        setWsConnected(true);

        // Subscribe to auction updates
        wsService.send('auction:subscribe', { auctionId: id });

        // Handle new bids
        const unsubBid = auctionEvents.onNewBid((data: unknown) => {
          const bidData = data as BidUpdate;
          if (bidData.auctionId === id) {
            // Update live state
            setLiveState(prev => prev ? {
              ...prev,
              currentPrice: bidData.newHighest,
              totalBids: bidData.totalBids,
              highestBidder: bidData.bid.bidder 
                ? { id: bidData.bid.bidder.id, fullName: bidData.bid.bidder.fullName }
                : prev.highestBidder,
            } : null);

            // Add new bid to list
            setBids(prev => [bidData.bid, ...prev]);
          }
        });
        unsubscribeRef.current.push(unsubBid);

        // Handle auction end
        const unsubEnd = auctionEvents.onAuctionEnd((data: unknown) => {
          const endData = data as { auctionId: string; winner: { id: string; fullName: string }; finalPrice: number };
          if (endData.auctionId === id) {
            setLiveState(prev => prev ? {
              ...prev,
              status: 'ended',
              currentPrice: endData.finalPrice,
              highestBidder: endData.winner,
            } : null);
          }
        });
        unsubscribeRef.current.push(unsubEnd);

      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setWsConnected(false);
      }
    };

    setupWebSocket();

    return () => {
      // Unsubscribe from auction
      if (wsService.isConnected) {
        wsService.send('auction:unsubscribe', { auctionId: id });
      }
      // Cleanup handlers
      unsubscribeRef.current.forEach(unsub => unsub());
      unsubscribeRef.current = [];
    };
  }, [id, isAuthenticated]);

  // Load auction on mount
  useEffect(() => {
    loadAuction();
  }, [loadAuction]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: auction?.product.currency || 'USD',
    }).format(price);
  };

  // Get current price (live or static)
  const currentPrice = liveState?.currentPrice ?? auction?.currentPrice ?? 0;
  const totalBids = liveState?.totalBids ?? auction?.totalBids ?? 0;
  const highestBidder = liveState?.highestBidder ?? auction?.highestBidder;
  const auctionStatus = liveState?.status ?? auction?.status ?? 'live';
  const isEnded = auctionStatus === 'ended' || auctionStatus === 'sold';
  const isUserHighestBidder = !!(user && highestBidder?.id === user.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Auction Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This auction may have been removed.'}</p>
          <Link
            to="/auctions"
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-semibold"
          >
            Browse Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Real-time Notifications */}
      <AuctionNotifications 
        auctionId={auction.id} 
        userId={user?.id}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/auctions" className="text-gray-500 hover:text-gray-700">Auctions</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{auction.product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            <ImageGallery images={auction.product.images} name={auction.product.name} />
          </div>

          {/* Right Column - Auction Info & Bidding */}
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <StatusBadge status={auctionStatus} />
              {wsConnected && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live Updates
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-3xl font-bold text-gray-900">{auction.product.name}</h1>

            {/* Seller Info */}
            <div className="flex items-center gap-3">
              <img
                src={auction.product.seller.avatarUrl || '/default-avatar.png'}
                alt={auction.product.seller.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{auction.product.seller.fullName}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span className="text-yellow-500">★</span>
                  <span>{auction.product.seller.rating.toFixed(1)}</span>
                  <span>({auction.product.seller.totalReviews} reviews)</span>
                </div>
              </div>
            </div>

            {/* Current Bid Panel */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="block text-sm text-gray-500 mb-1">Current Bid</span>
                  <span className="block text-3xl font-bold text-gray-900">{formatPrice(currentPrice)}</span>
                  {highestBidder && (
                    <span className="text-sm text-gray-500">
                      by {isUserHighestBidder ? 'You' : highestBidder.fullName}
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-sm text-gray-500 mb-1">Total Bids</span>
                  <span className="block text-3xl font-bold text-indigo-600">{totalBids}</span>
                </div>
              </div>

              {/* Auction Timer */}
              <AuctionTimerComponent 
                endTime={liveState?.endTime || auction.endTime} 
                status={auctionStatus}
                auctionId={auction.id}
                showWarning={true}
              />

              {/* Winner Banner (if ended) */}
              {isEnded && highestBidder && (
                <div className={`mt-4 p-4 rounded-xl ${isUserHighestBidder ? 'bg-green-100 border border-green-300' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{isUserHighestBidder ? '🎉' : '🏆'}</span>
                    <div>
                      <p className="font-bold text-gray-900">
                        {isUserHighestBidder ? 'Congratulations! You won!' : `Won by ${highestBidder.fullName}`}
                      </p>
                      <p className="text-sm text-gray-600">Final price: {formatPrice(currentPrice)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bid Actions (if live) */}
              {!isEnded && (
                <div className="mt-4">
                  {isAuthenticated ? (
                    <BidPanelComponent
                      auctionId={auction.id}
                      currentPrice={currentPrice}
                      minIncrement={getMinIncrement(currentPrice)}
                      isUserHighestBidder={isUserHighestBidder}
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-3">Sign in to place a bid</p>
                      <Link
                        to={`/login?redirect=/auctions/${auction.id}`}
                        className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-semibold"
                      >
                        Sign In to Bid
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buy Now Option */}
            {auction.buyNowPrice && !isEnded && (
              <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm text-green-700 font-medium">Buy Now Price</span>
                    <span className="block text-2xl font-bold text-green-800">{formatPrice(auction.buyNowPrice)}</span>
                  </div>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors">
                    Buy Now
                  </button>
                </div>
              </div>
            )}

            {/* Product Description */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">{auction.product.description}</p>
              
              {/* Product Details */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Condition</span>
                  <span className="block font-medium text-gray-900 capitalize">{auction.product.condition.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Category</span>
                  <span className="block font-medium text-gray-900">{auction.product.category.name}</span>
                </div>
                {auction.product.brand && (
                  <div>
                    <span className="text-gray-500">Brand</span>
                    <span className="block font-medium text-gray-900">{auction.product.brand}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Origin</span>
                  <span className="block font-medium text-gray-900">{auction.product.originCountry}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bid History Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bid History</h2>
          <BidHistory bids={bids} currentUserId={user?.id} />
        </div>
      </div>
    </div>
  );
}

// Helper function for min increment
function getMinIncrement(price: number): number {
  if (price < 10) return 0.5;
  if (price < 50) return 1;
  if (price < 100) return 2;
  if (price < 500) return 5;
  if (price < 1000) return 10;
  return 25;
}

// ============================================
// Sub-components
// ============================================

// Image Gallery Component
function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayImages = images.length > 0 ? images : ['/placeholder.jpg'];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
        <img
          src={displayImages[selectedIndex]}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedIndex ? 'border-pink-500' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={img} alt={`${name} ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: 'bg-green-100 text-green-800 border-green-300',
    ending_soon: 'bg-orange-100 text-orange-800 border-orange-300',
    ended: 'bg-gray-100 text-gray-800 border-gray-300',
    sold: 'bg-blue-100 text-blue-800 border-blue-300',
    scheduled: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  const labels: Record<string, string> = {
    live: '🔴 Live Now',
    ending_soon: '⚡ Ending Soon',
    ended: '✅ Ended',
    sold: '🎉 Sold',
    scheduled: '📅 Scheduled',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${styles[status] || styles.live}`}>
      {labels[status] || status}
    </span>
  );
}

// Bid History Component
function BidHistory({ bids, currentUserId }: { bids: Bid[]; currentUserId?: string }) {
  if (bids.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
        <div className="text-4xl mb-3">🔨</div>
        <p className="text-gray-600">No bids yet. Be the first to bid!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Bidder</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bids.map((bid, idx) => {
              const isCurrentUser = bid.bidder.id === currentUserId;
              const isWinning = idx === 0;
              
              return (
                <tr key={bid.id} className={isWinning ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={bid.bidder.avatarUrl || '/default-avatar.png'}
                        alt={bid.bidder.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className={`font-medium ${isCurrentUser ? 'text-pink-600' : 'text-gray-900'}`}>
                        {isCurrentUser ? 'You' : bid.bidder.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">${bid.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(bid.placedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {isWinning ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        🏆 Highest
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        Outbid
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuctionDetailPage;
