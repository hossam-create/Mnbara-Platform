import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import FilterSidebar from '../components/search/FilterSidebar';
import SearchResultItem, { SearchResultItemProps } from '../components/search/SearchResultItem';

// Icons
const GridIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Static mock data
const MOCK_RESULTS: SearchResultItemProps[] = [
  {
    id: '1',
    title: 'Apple iPhone 15 Pro Max 256GB Natural Titanium - Factory Unlocked - Excellent',
    price: 1049.99,
    originalPrice: 1199.00,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
    condition: 'Refurbished',
    shipping: 'Free shipping',
    shippingPrice: 0,
    freeReturns: true,
    sellerName: 'tech_deals_usa',
    sellerRating: 4.9,
    sellerReviews: 15234,
    sellerTopRated: true,
    itemsSold: 1234,
  },
  {
    id: '2',
    title: 'Sony PlayStation 5 Console Disc Edition Bundle with Extra Controller',
    price: 549.99,
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
    condition: 'New',
    shipping: 'Free shipping',
    shippingPrice: 0,
    freeReturns: true,
    sellerName: 'gaming_store',
    sellerRating: 4.8,
    sellerReviews: 8921,
    sellerTopRated: true,
    watchers: 45,
  },
  {
    id: '3',
    title: 'Apple MacBook Pro 14" M3 Pro Chip 512GB SSD Space Gray - AppleCare+',
    price: 1699.00,
    originalPrice: 1999.00,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    condition: 'Open Box',
    shipping: '+$14.99 shipping',
    shippingPrice: 14.99,
    freeReturns: true,
    sellerName: 'apple_reseller',
    sellerRating: 5.0,
    sellerReviews: 3456,
    itemsSold: 567,
    isBestOffer: true,
  },
  {
    id: '4',
    title: 'Nike Air Jordan 1 Retro High OG Chicago Lost and Found - Size 10',
    price: 289.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    condition: 'New',
    shipping: '+$12.99 shipping',
    shippingPrice: 12.99,
    sellerName: 'sneaker_authentic',
    sellerRating: 4.7,
    sellerReviews: 2341,
    watchers: 23,
  },
  {
    id: '5',
    title: 'Samsung 65" S95D OLED 4K Smart TV (2024) - Full Warranty',
    price: 1897.99,
    originalPrice: 2499.99,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    condition: 'New',
    shipping: 'Free shipping',
    shippingPrice: 0,
    freeReturns: true,
    sellerName: 'electronics_hub',
    sellerRating: 4.6,
    sellerReviews: 1892,
    sellerTopRated: true,
    itemsSold: 89,
  },
  {
    id: '6',
    title: 'Dyson V15 Detect Absolute Cordless Vacuum Cleaner - Gold',
    price: 549.99,
    originalPrice: 749.99,
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
    condition: 'Certified Refurbished',
    shipping: 'Free shipping',
    shippingPrice: 0,
    freeReturns: true,
    sellerName: 'dyson_official',
    sellerRating: 4.5,
    sellerReviews: 4521,
    sellerTopRated: true,
    itemsSold: 2345,
  },
  {
    id: '7',
    title: 'Canon EOS R6 Mark II Mirrorless Camera Body Only - 24.2MP',
    price: 2199.00,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    condition: 'New',
    shipping: 'Free shipping',
    shippingPrice: 0,
    freeReturns: true,
    sellerName: 'camera_world',
    sellerRating: 4.9,
    sellerReviews: 987,
    isBestOffer: true,
  },
  {
    id: '8',
    title: 'Vintage Rolex Submariner Date 16610 Automatic Steel Watch - 1995',
    price: 8500.00,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    condition: 'Used',
    shipping: 'Free shipping',
    shippingPrice: 0,
    freeReturns: false,
    sellerName: 'luxury_watches',
    sellerRating: 5.0,
    sellerReviews: 234,
    sellerTopRated: true,
    isAuction: true,
    bidCount: 12,
  },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || 'electronics';
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState('best-match');
  const [currentPage, setCurrentPage] = useState(1);
  const totalResults = 23456;
  const resultsPerPage = 50;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return (
    <MainLayout>
      {/* Breadcrumbs */}
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <nav className="text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-blue hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Search results for "{query}"</span>
        </nav>
      </div>

      {/* Results Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Results Count */}
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{totalResults.toLocaleString()}</span> results for <span className="font-semibold">"{query}"</span>
            </p>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-6">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-3">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">Sort:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent font-normal"
                >
                  <option value="best-match">Best Match</option>
                  <option value="ending-soonest">Time: ending soonest</option>
                  <option value="newly-listed">Time: newly listed</option>
                  <option value="price-low">Price + Shipping: lowest first</option>
                  <option value="price-high">Price + Shipping: highest first</option>
                  <option value="distance">Distance: nearest first</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  aria-label="List view"
                >
                  <ListIcon />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  aria-label="Grid view"
                >
                  <GridIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 py-12">
        <div className="flex gap-12">
          {/* Left Sidebar - Filters */}
          <FilterSidebar />

          {/* Results Area */}
          <div className="flex-1">
            {/* Active Filters / Pills (optional) */}
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-200">
              <span className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Active filters:</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-xs font-medium">
                Free Shipping
                <button className="hover:text-[#e53238] font-bold">×</button>
              </span>
              <button className="text-xs text-brand-blue hover:underline font-medium">Clear all</button>
            </div>

            {/* Results List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-8' : ''}>
              {MOCK_RESULTS.map((item) => (
                <SearchResultItem key={item.id} {...item} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-16 py-8 border-t border-gray-200">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon />
              </button>
              
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-md text-sm font-semibold ${
                    currentPage === page 
                      ? 'bg-brand-blue text-white' 
                      : 'border border-gray-300 hover:bg-gray-50 transition-colors'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <span className="px-2 text-gray-400">...</span>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="w-10 h-10 rounded-md text-sm font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {totalPages}
              </button>

              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon />
              </button>
            </div>

            {/* Results info */}
            <p className="text-center text-xs text-gray-600 mt-6 font-normal">
              Page {currentPage} of {totalPages} · Showing {((currentPage - 1) * resultsPerPage) + 1}-{Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults.toLocaleString()} results
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
