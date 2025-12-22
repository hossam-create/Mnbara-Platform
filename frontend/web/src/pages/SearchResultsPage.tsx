import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import SearchBar from '../components/search/SearchBar';
import ListingCard from '../components/listings/ListingCard';
import type { ListingCardProps } from '../components/listings/ListingCard';
import FiltersSidebar from '../components/search/FiltersSidebar';
import Pagination from '../components/search/Pagination';
import SortControls from '../components/search/SortControls';
import { searchService } from '../services/search.service';
import type { SearchFilters, SearchResult } from '../services/search.service';

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get initial values from URL params
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sort') as SearchFilters['sortBy'] || 'relevance';
  
  const [filters, setFilters] = useState<SearchFilters>({
    categoryId: searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    condition: searchParams.get('condition') || undefined,
    location: searchParams.get('location') || undefined,
    minTrustScore: searchParams.get('minTrustScore') ? parseInt(searchParams.get('minTrustScore')!) : undefined,
    verifiedSellerOnly: searchParams.get('verified') === 'true',
    sortBy,
  });

  const loadSearchResults = useCallback(async () => {
    if (!query) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchService.search(query, filters, page, 24);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search results');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, query]);

  useEffect(() => {
    void loadSearchResults();
  }, [loadSearchResults]);

  const handleSearch = (searchQuery: string) => {
    const newParams = new URLSearchParams();
    newParams.set('q', searchQuery);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    
    // Update URL with new filters
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: SearchFilters['sortBy']) => {
    handleFilterChange({ ...filters, sortBy: newSort });
  };

  if (loading && !results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-80 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search for anything..."
              initialValue={query}
            />
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {query ? `Results for "${query}"` : 'Search Results'}
          </h1>
          
          {results && (
            <span className="text-sm text-gray-600">
              {results.total.toLocaleString()} results
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <FiltersSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              resultsCount={results?.total || 0}
            />
          </aside>

          {/* Main Results */}
          <div className="lg:col-span-3">
            {/* Sort and Results Info */}
            {results && results.items.length > 0 && (
              <div className="flex items-center justify-between mb-8">
                <SortControls
                  sortBy={filters.sortBy}
                  onSortChange={handleSortChange}
                />
                
                <span className="text-sm text-gray-600">
                  Page {results.page} of {results.totalPages}
                </span>
              </div>
            )}

            {/* Results Grid */}
            {results && results.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {results.items.map((listing) => {
                    const cardProps: ListingCardProps = {
                      id: listing.id,
                      title: listing.name,
                      price: listing.price,
                      originalPrice: undefined,
                      image: listing.images?.[0] || '/placeholders/product.png',
                      condition: listing.condition.replace(/_/g, ' ').toUpperCase(),
                      seller: listing.seller.fullName,
                      rating: listing.rating ?? 0,
                      reviews: listing.totalReviews ?? 0,
                      shipping: `Ships from ${listing.originCountry}`,
                      timeLeft: 'Limited time',
                    };
                    return <ListingCard key={listing.id} {...cardProps} />;
                  })}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={results.page}
                  totalPages={results.totalPages}
                  totalItems={results.total}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-4xl mb-6">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {query ? 'No results found' : 'Start searching'}
                </h3>
                <p className="text-gray-600">
                  {query 
                    ? 'Try adjusting your filters or search terms.'
                    : 'Enter a search term to find products.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchResultsPage;