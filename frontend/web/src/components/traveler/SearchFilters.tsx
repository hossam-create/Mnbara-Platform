// ============================================
// 🔍 Search Filters - Request Search Filters
// ============================================

import React from 'react';

interface SearchFiltersProps {
  filters: {
    originCountry: string;
    destinationCountry: string;
    minReward: number;
    maxDistance: number;
    status: string;
  };
  onChange: (filters: any) => void;
  loading?: boolean;
  className?: string;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  loading = false,
  className = '',
}) => {
  const handleFilterChange = (key: string, value: any) => {
    onChange({ [key]: value });
  };

  const countries = [
    { value: '', label: 'Any Country' },
    { value: 'USA', label: 'United States' },
    { value: 'UAE', label: 'United Arab Emirates' },
    { value: 'KSA', label: 'Saudi Arabia' },
    { value: 'EGY', label: 'Egypt' },
    { value: 'FRA', label: 'France' },
    { value: 'GBR', label: 'United Kingdom' },
    { value: 'DEU', label: 'Germany' },
    { value: 'TUR', label: 'Turkey' },
    { value: 'CHN', label: 'China' },
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">Filter Requests</h3>
      
      <div className="space-y-4">
        {/* Origin Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Origin Country
          </label>
          <select
            value={filters.originCountry}
            onChange={(e) => handleFilterChange('originCountry', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            disabled={loading}
          >
            {countries.map(country => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination Country
          </label>
          <select
            value={filters.destinationCountry}
            onChange={(e) => handleFilterChange('destinationCountry', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            disabled={loading}
          >
            {countries.map(country => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Reward */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Reward (${filters.minReward})
          </label>
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={filters.minReward}
            onChange={(e) => handleFilterChange('minReward', Number(e.target.value))}
            className="w-full"
            disabled={loading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$0</span>
            <span>$250</span>
            <span>$500</span>
          </div>
        </div>

        {/* Maximum Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Distance ({filters.maxDistance} km)
          </label>
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={filters.maxDistance}
            onChange={(e) => handleFilterChange('maxDistance', Number(e.target.value))}
            className="w-full"
            disabled={loading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50km</span>
            <span>2500km</span>
            <span>5000km</span>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="open">Open Requests</option>
            <option value="matched">Matched</option>
            <option value="in_progress">In Progress</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        {/* Additional Filters */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Additional Filters</h4>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">Verified Buyers Only</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">High Trust Score (80%+)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">Express Delivery</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={() => onChange({
              originCountry: '',
              destinationCountry: '',
              minReward: 0,
              maxDistance: 1000,
              status: 'open',
            })}
            className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Clear All
          </button>
          
          <button
            onClick={() => onChange(filters)}
            className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;