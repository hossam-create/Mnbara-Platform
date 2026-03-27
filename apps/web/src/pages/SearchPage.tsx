import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import FilterSidebar from '../components/search/FilterSidebar';
import SearchResultItem, { SearchResultItemProps } from '../components/search/SearchResultItem';
import listingService from '../services/listingService';

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

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || 'electronics';
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState('best-match');
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<SearchResultItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 50;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  // Fetch search results from API using listingService
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await listingService.searchListings(query, {
          page: currentPage,
          limit: resultsPerPage,
          sort: sortBy
        });
        
        setResults(response.listings);
        setTotalResults(response.pagination?.total || 0);
      } catch (err) {
        setError('Failed to fetch search results. Please try again.');
        console.error('Search API error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage, sortBy]);

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
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
              </div>
            )}
            
            {error && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            
            {!loading && !error && results.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No results found for "{query}"</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your search terms or filters</p>
              </div>
            )}
            
            {!loading && !error && results.length > 0 && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-8' : ''}>
                {results.map((item) => (
                  <SearchResultItem key={item.id} {...item} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && results.length > 0 && totalPages > 1 && (
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
            )}

            {/* Results info */}
            {!loading && !error && results.length > 0 && (
              <p className="text-center text-xs text-gray-600 mt-6 font-normal">
                Page {currentPage} of {totalPages} · Showing {((currentPage - 1) * resultsPerPage) + 1}-{Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults.toLocaleString()} results
              </p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
