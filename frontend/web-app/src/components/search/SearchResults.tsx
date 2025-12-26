import React from 'react'
import ProductCard from '@/components/product/ProductCard'

interface SearchResult {
  id: string
  title: string
  price: number
  image: string
  rating: number
  seller: string
  location: string
  relevanceScore: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface SearchResultsProps {
  results: SearchResult[]
  pagination: Pagination
  onPageChange: (page: number) => void
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  pagination,
  onPageChange
}) => {
  const generatePageNumbers = () => {
    const pages = []
    const { page, totalPages } = pagination
    
    // Always show first page
    if (totalPages > 1) pages.push(1)
    
    // Show pages around current page
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
      if (!pages.includes(i)) pages.push(i)
    }
    
    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages)
    
    return pages
  }

  return (
    <div>
      {/* Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {results.map((result) => (
          <ProductCard
            key={result.id}
            product={{
              id: result.id,
              title: result.title,
              price: result.price,
              image: result.image,
              rating: result.rating,
              seller: result.seller
            }}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>

          {/* Page numbers */}
          {generatePageNumbers().map((pageNum, index, array) => (
            <React.Fragment key={pageNum}>
              {/* Show ellipsis if there's a gap */}
              {index > 0 && pageNum > array[index - 1] + 1 && (
                <span className="px-3 py-2 text-sm text-gray-500">...</span>
              )}
              
              <button
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  pageNum === pagination.page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </button>
            </React.Fragment>
          ))}

          {/* Next button */}
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Results info */}
      <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
        {pagination.total.toLocaleString()} results
      </div>
    </div>
  )
}

export default SearchResults