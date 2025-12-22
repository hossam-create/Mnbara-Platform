// ============================================
// 🔨 Auctions Page - Live Bidding Marketplace
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuctionCard } from '../../components/auctions/AuctionCard';
import type { Auction, Category } from '../../types';
import { auctionApi, categoryApi } from '../../services/api';

type AuctionTab = 'active' | 'ending_soon' | 'completed' | 'my_bids';

interface AuctionFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export function AuctionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AuctionTab>(() => {
    const tab = searchParams.get('tab');
    return (tab as AuctionTab) || 'active';
  });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuctionFilters>({
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Stats for display
  const [stats, setStats] = useState({
    liveCount: 0,
    totalBidsToday: 0,
    activeBidders: 0,
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.list();
        if (response.data.success && response.data.data) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load auctions when tab, page, or filters change
  const loadAuctions = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'active':
          response = await auctionApi.getLive();
          break;
        case 'ending_soon':
          response = await auctionApi.getEndingSoon();
          break;
        case 'my_bids':
          response = await auctionApi.getMyBids();
          break;
        case 'completed':
          response = await auctionApi.list('ended', page);
          break;
        default:
          response = await auctionApi.list('live', page);
      }

      if (response.data.success && response.data.data) {
        let auctionData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data.items;

        // Apply client-side filters
        if (filters.category) {
          auctionData = auctionData.filter(
            (a) => a.product.category.id === filters.category
          );
        }
        if (filters.minPrice !== undefined) {
          auctionData = auctionData.filter(
            (a) => a.currentPrice >= (filters.minPrice || 0)
          );
        }
        if (filters.maxPrice !== undefined) {
          auctionData = auctionData.filter(
            (a) => a.currentPrice <= (filters.maxPrice || Infinity)
          );
        }

        setAuctions(auctionData);

        // Update stats
        if (activeTab === 'active') {
          setStats((prev) => ({
            ...prev,
            liveCount: auctionData.length,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load auctions:', error);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, filters]);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'active') params.set('tab', activeTab);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    setSearchParams(params, { replace: true });
  }, [activeTab, filters, setSearchParams]);

  const handleBid = async (auctionId: string, amount: number) => {
    try {
      await auctionApi.placeBid(auctionId, amount);
      loadAuctions(); // Refresh
    } catch (error) {
      console.error('Failed to place bid:', error);
    }
  };

  const handleWatch = async (auctionId: string) => {
    try {
      await auctionApi.watch(auctionId);
    } catch (error) {
      console.error('Failed to watch auction:', error);
    }
  };

  const handleFilterChange = (key: keyof AuctionFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice;

  const tabs = [
    { id: 'active' as AuctionTab, label: 'Live Now', icon: '🔴', count: stats.liveCount },
    { id: 'ending_soon' as AuctionTab, label: 'Ending Soon', icon: '⚡' },
    { id: 'completed' as AuctionTab, label: 'Completed', icon: '✅' },
    { id: 'my_bids' as AuctionTab, label: 'My Bids', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-16 px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-72 h-72 bg-pink-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">🔨 Live Auctions</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Bid on exclusive products from around the world. Win amazing deals!
            </p>

            {/* Live Stats */}
            <div className="inline-flex items-center gap-6 bg-white/10 backdrop-blur-lg rounded-2xl px-8 py-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.liveCount}</div>
                <div className="text-sm text-gray-300">Live Now</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">${stats.totalBidsToday.toLocaleString()}</div>
                <div className="text-sm text-gray-300">In Bids Today</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.activeBidders.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Active Bidders</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                hasActiveFilters
                  ? 'bg-pink-100 text-pink-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price Filter */}
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice || ''}
                  onChange={(e) =>
                    handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Max Price Filter */}
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="$∞"
                  value={filters.maxPrice || ''}
                  onChange={(e) =>
                    handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors self-end"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Auction (for active tab) */}
        {activeTab === 'active' && auctions.length > 0 && !loading && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Featured Auction
            </h2>
            <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl p-8 border border-pink-200">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <img
                    src={auctions[0]?.product.images[0] || '/placeholder.jpg'}
                    alt={auctions[0]?.product.name}
                    className="w-full aspect-square object-cover rounded-2xl shadow-2xl"
                  />
                </div>
                <div>
                  <div className="inline-block px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full mb-4 animate-pulse">
                    🔴 LIVE NOW
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">{auctions[0]?.product.name}</h3>
                  <p className="text-gray-600 mb-6 line-clamp-3">{auctions[0]?.product.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <span className="block text-sm text-gray-500">Current Bid</span>
                      <span className="block text-3xl font-bold text-gray-900">
                        ${auctions[0]?.currentPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <span className="block text-sm text-gray-500">Total Bids</span>
                      <span className="block text-3xl font-bold text-indigo-600">
                        {auctions[0]?.totalBids}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/auctions/${auctions[0]?.id}`}
                    className="block w-full py-4 px-8 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all text-center"
                  >
                    🔨 Place Bid Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-8 bg-gray-200"></div>
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Auctions Grid */}
        {!loading && auctions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <Link key={auction.id} to={`/auctions/${auction.id}`}>
                <AuctionCard
                  auction={auction}
                  onBid={handleBid}
                  onWatch={() => handleWatch(auction.id)}
                />
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && auctions.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🔨</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No auctions found</h3>
            <p className="text-gray-600 mb-8">
              {activeTab === 'my_bids'
                ? "You haven't placed any bids yet"
                : hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Check back soon for new auctions'}
            </p>
            {activeTab === 'my_bids' ? (
              <button
                onClick={() => setActiveTab('active')}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Browse Live Auctions
              </button>
            ) : hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        )}

        {/* Pagination */}
        {!loading && auctions.length > 0 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={auctions.length < 20}
                className="px-4 py-2 rounded-lg font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionsPage;
