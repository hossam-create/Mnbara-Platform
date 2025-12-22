import React from 'react';
import { SearchFilters } from '../../services/search.service';

interface FiltersSidebarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  resultsCount: number;
}

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  filters,
  onFilterChange,
  resultsCount
}) => {
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handlePriceFilterChange = (min: number | undefined, max: number | undefined) => {
    onFilterChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const clearFilters = () => {
    onFilterChange({
      sortBy: filters.sortBy,
    });
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'sortBy' && filters[key as keyof SearchFilters] !== undefined
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Price Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Price</h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceFilterChange(
                e.target.value ? parseFloat(e.target.value) : undefined,
                filters.maxPrice
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceFilterChange(
                filters.minPrice,
                e.target.value ? parseFloat(e.target.value) : undefined
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Condition Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Condition</h3>
        <div className="space-y-2">
          {[
            { value: 'new', label: 'New' },
            { value: 'like_new', label: 'Like New' },
            { value: 'good', label: 'Good' },
            { value: 'fair', label: 'Fair' },
          ].map((condition) => (
            <label key={condition.value} className="flex items-center">
              <input
                type="radio"
                name="condition"
                value={condition.value}
                checked={filters.condition === condition.value}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{condition.label}</span>
            </label>
          ))}
          <label className="flex items-center">
            <input
              type="radio"
              name="condition"
              value=""
              checked={!filters.condition}
              onChange={() => handleFilterChange('condition', undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Any condition</span>
          </label>
        </div>
      </div>

      {/* Seller Verification */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Seller</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.verifiedSellerOnly || false}
            onChange={(e) => handleFilterChange('verifiedSellerOnly', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Verified sellers only</span>
        </label>
      </div>

      {/* Trust Score Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Trust Score</h3>
        <div className="space-y-2">
          {[
            { value: 90, label: 'Excellent (90%+)' },
            { value: 70, label: 'Good (70%+)' },
            { value: 50, label: 'Average (50%+)' },
            { value: 0, label: 'Any score' },
          ].map((score) => (
            <label key={score.value} className="flex items-center">
              <input
                type="radio"
                name="trustScore"
                checked={filters.minTrustScore === score.value}
                onChange={() => handleFilterChange('minTrustScore', score.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{score.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
        <input
          type="text"
          placeholder="City, state, or zip"
          value={filters.location || ''}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* Results Count */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">{resultsCount.toLocaleString()}</span> results match your filters
        </p>
      </div>
    </div>
  );
};

export default FiltersSidebar;