import React from 'react'

interface SearchFiltersProps {
  filters: any
  onFiltersChange: (filters: any) => void
  resultCount: number
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  resultCount
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Filters
      </h3>
      
      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Price Range
        </h4>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1000"
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>$0</span>
            <span>$1000+</span>
          </div>
        </div>
      </div>

      {/* Condition */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Condition
        </h4>
        <div className="space-y-2">
          {['New', 'Used', 'Refurbished'].map((condition) => (
            <label key={condition} className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {condition}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Shipping */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Shipping
        </h4>
        <label className="flex items-center">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Free shipping
          </span>
        </label>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => onFiltersChange({})}
        className="w-full btn btn-outline text-sm"
      >
        Clear all filters
      </button>
    </div>
  )
}

export default SearchFilters