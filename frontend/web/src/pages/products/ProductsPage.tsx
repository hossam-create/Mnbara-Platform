// ============================================
// 🛒 Products Page - Browse & Filter Products
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../../components/products/ProductCard';
import { SearchBar } from '../../components/search/SearchBar';
import { useDebounce } from '../../hooks/useDebounce';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import type { Product, Category, ProductFilters, SortOption } from '../../types';
import { productApi, categoryApi } from '../../services/api';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    condition: searchParams.get('condition')?.split(',') as ProductFilters['condition'] || undefined,
    originCountry: searchParams.get('location') || undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
  });
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'relevance'
  );
  
  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounced search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Infinite scroll hook
  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: () => loadMoreProducts(),
    hasMore,
    isLoading: loadingMore,
    threshold: 300,
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    if (filters.condition?.length) params.set('condition', filters.condition.join(','));
    if (filters.originCountry) params.set('location', filters.originCountry);
    if (filters.rating) params.set('rating', String(filters.rating));
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, filters, sortBy, setSearchParams]);

  // Load products when filters or search changes
  useEffect(() => {
    setPage(1);
    setProducts([]);
    loadProducts(1, true);
  }, [debouncedSearchQuery, filters, sortBy]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadProducts = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      let response;
      
      if (debouncedSearchQuery) {
        // Use search endpoint with Elasticsearch
        response = await productApi.search(debouncedSearchQuery, {
          ...filters,
          sortBy,
        });
      } else {
        // Use list endpoint
        response = await productApi.list({ ...filters, sortBy }, pageNum);
      }

      if (response.data.success && response.data.data) {
        const { items, totalPages, total: totalCount } = response.data.data;
        
        if (reset) {
          setProducts(items || []);
        } else {
          setProducts(prev => [...prev, ...(items || [])]);
        }
        
        setTotalResults(totalCount || 0);
        setHasMore(pageNum < (totalPages || 1));
      } else {
        // Handle case where response structure is different
        if (reset) {
          setProducts([]);
        }
        setError('No products found');
      }
    } catch (err: any) {
      console.error('Failed to load products:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load products. Please try again.';
      setError(errorMessage);
      if (reset) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProducts = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadProducts(nextPage, false);
    }
  }, [page, loadingMore, hasMore]);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.list();
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSortBy('relevance');
  };

  const handlePriceRangeSelect = (min?: number, max?: number) => {
    setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }));
  };

  const handleConditionToggle = (condition: string) => {
    setFilters(prev => {
      const current = prev.condition || [];
      const updated = current.includes(condition as any)
        ? current.filter(c => c !== condition)
        : [...current, condition as any];
      return { ...prev, condition: updated.length ? updated : undefined };
    });
  };

  const priceRanges = [
    { label: 'Under $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $500', min: 100, max: 500 },
    { label: 'Over $500', min: 500, max: undefined },
  ];

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'open_box', label: 'Open Box' },
    { value: 'used', label: 'Used' },
    { value: 'refurbished', label: 'Refurbished' },
  ];

  const locations = [
    { value: 'US', label: '🇺🇸 United States' },
    { value: 'UK', label: '🇬🇧 United Kingdom' },
    { value: 'DE', label: '🇩🇪 Germany' },
    { value: 'FR', label: '🇫🇷 France' },
    { value: 'JP', label: '🇯🇵 Japan' },
    { value: 'CN', label: '🇨🇳 China' },
    { value: 'EG', label: '🇪🇬 Egypt' },
    { value: 'AE', label: '🇦🇪 UAE' },
    { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  ];

  const activeFiltersCount = [
    filters.category,
    filters.minPrice || filters.maxPrice,
    filters.condition?.length,
    filters.originCountry,
    filters.rating,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
            Discover Amazing Products
          </h1>
          <div className="flex justify-center">
            <SearchBar
              onSearch={handleSearch}
              categories={categories}
              popularSearches={['iPhone 15', 'MacBook', 'Nike', 'PlayStation 5', 'AirPods']}
            />
          </div>
          {searchQuery && (
            <p className="text-white/80 text-center mt-4">
              Searching for "<span className="font-semibold">{searchQuery}</span>"
            </p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className={`w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </h2>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-pink-500 hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Categories</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, category: undefined }))}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      !filters.category
                        ? 'bg-pink-50 text-pink-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">🏷️</span>
                    <span>All Categories</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        filters.category === cat.id
                          ? 'bg-pink-50 text-pink-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Price Range</h3>
                <div className="space-y-2">
                  {priceRanges.map((range, index) => (
                    <button
                      key={index}
                      onClick={() => handlePriceRangeSelect(range.min, range.max)}
                      className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                        filters.minPrice === range.min && filters.maxPrice === range.max
                          ? 'bg-pink-50 text-pink-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                {/* Custom price range */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      minPrice: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      maxPrice: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Condition */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Condition</h3>
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <label key={condition.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.condition?.includes(condition.value as any) || false}
                        onChange={() => handleConditionToggle(condition.value)}
                        className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">{condition.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Ships From</h3>
                <select
                  value={filters.originCountry || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    originCountry: e.target.value || undefined 
                  }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Minimum Rating</h3>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        rating: prev.rating === star ? undefined : star 
                      }))}
                      className={`p-2 rounded transition-colors ${
                        (filters.rating || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {filters.rating && (
                  <p className="text-sm text-gray-500 mt-1">{filters.rating}+ stars</p>
                )}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <span className="text-gray-600">
                  {loading ? (
                    'Loading...'
                  ) : (
                    <>
                      Showing <span className="font-semibold">{products.length}</span>
                      {totalResults > 0 && (
                        <> of <span className="font-semibold">{totalResults}</span></>
                      )} products
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="popularity">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>

                {/* View Mode */}
                <div className="flex bg-white border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-pink-50 text-pink-500' : 'text-gray-400'}`}
                    aria-label="Grid view"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-pink-50 text-pink-500' : 'text-gray-400'}`}
                    aria-label="List view"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>


            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="hover:text-pink-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                    Category: {categories.find(c => c.id === filters.category)?.name}
                    <button onClick={() => setFilters(prev => ({ ...prev, category: undefined }))} className="hover:text-pink-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                    Price: ${filters.minPrice || 0} - ${filters.maxPrice || '∞'}
                    <button onClick={() => setFilters(prev => ({ ...prev, minPrice: undefined, maxPrice: undefined }))} className="hover:text-pink-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.originCountry && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                    Location: {locations.find(l => l.value === filters.originCountry)?.label}
                    <button onClick={() => setFilters(prev => ({ ...prev, originCountry: undefined }))} className="hover:text-pink-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                  <button 
                    onClick={() => loadProducts(1, true)} 
                    className="ml-auto text-sm underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }
              `}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-8 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <>
                <div className={`
                  ${viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                  }
                `}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                      onAddToCart={(p) => console.log('Add to cart:', p)}
                      onAddToWishlist={(p) => console.log('Add to wishlist:', p)}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading more products...</span>
                    </div>
                  )}
                  {!hasMore && products.length > 0 && (
                    <p className="text-gray-500">You've reached the end of the results</p>
                  )}
                </div>
              </>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? `No results for "${searchQuery}". Try different keywords or filters.`
                    : 'Try adjusting your filters or search terms'
                  }
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}

export default ProductsPage;
