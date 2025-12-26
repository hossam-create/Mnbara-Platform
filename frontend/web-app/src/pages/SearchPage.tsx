import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/store'
import { searchProducts, setFilters, setPage } from '@/store/slices/searchSlice'
import { Helmet } from 'react-helmet-async'
import SearchFilters from '@/components/search/SearchFilters'
import SearchResults from '@/components/search/SearchResults'
import SearchSorting from '@/components/search/SearchSorting'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

const SearchPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  
  const {
    query,
    results,
    filters,
    pagination,
    isLoading,
    error,
    searchTime,
    lastSearchQuery
  } = useSelector((state: RootState) => state.search)

  const searchQuery = searchParams.get('q') || ''
  const currentPage = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    if (searchQuery && searchQuery !== lastSearchQuery) {
      dispatch(searchProducts({
        query: searchQuery,
        page: currentPage,
        filters
      }))
    }
  }, [dispatch, searchQuery, currentPage, filters, lastSearchQuery])

  const handleFilterChange = (newFilters: any) => {
    dispatch(setFilters(newFilters))
    // Reset to page 1 when filters change
    setSearchParams(prev => {
      const params = new URLSearchParams(prev)
      params.set('page', '1')
      return params
    })
  }

  const handlePageChange = (page: number) => {
    dispatch(setPage(page))
    setSearchParams(prev => {
      const params = new URLSearchParams(prev)
      params.set('page', page.toString())
      return params
    })
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (sortBy: string) => {
    handleFilterChange({ ...filters, sortBy })
  }

  if (!searchQuery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Search Mnbara
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a search term to find products
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{`${searchQuery} - Search Results | Mnbara`}</title>
        <meta 
          name="description" 
          content={`Find ${searchQuery} on Mnbara. Browse millions of products from trusted sellers.`} 
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Search results for "{searchQuery}"
            </h1>
            
            {!isLoading && results.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-400">
                  {pagination.total.toLocaleString()} results found
                  {searchTime && (
                    <span className="ml-2">({searchTime}ms)</span>
                  )}
                </p>
                
                <div className="flex items-center space-x-4">
                  {/* Sort Options */}
                  <SearchSorting
                    currentSort={filters.sortBy || 'relevance'}
                    onSortChange={handleSortChange}
                  />
                  
                  {/* Filter Toggle (Mobile) */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden btn btn-outline"
                  >
                    <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
                    Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          )}

          {/* Search Results */}
          {!isLoading && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <SearchFilters
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  resultCount={pagination.total}
                />
              </div>

              {/* Results */}
              <div className="flex-1">
                {results.length > 0 ? (
                  <SearchResults
                    results={results}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                ) : !isLoading && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <p>• Check your spelling</p>
                      <p>• Try more general keywords</p>
                      <p>• Remove some filters</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default SearchPage