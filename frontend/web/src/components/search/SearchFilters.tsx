import React, { useState } from 'react';

const SearchFilters: React.FC = () => {
  const [filters, setFilters] = useState({
    condition: [] as string[],
    priceRange: { min: '', max: '' },
    shipping: '',
    location: '',
    sellerType: '',
  });

  const conditions = [
    { value: 'new', label: 'New', count: 234 },
    { value: 'like_new', label: 'Like New', count: 567 },
    { value: 'excellent', label: 'Excellent', count: 345 },
    { value: 'good', label: 'Good', count: 189 },
    { value: 'fair', label: 'Fair', count: 67 },
  ];

  const shippingOptions = [
    { value: 'free', label: 'Free Shipping', count: 876 },
    { value: 'local_pickup', label: 'Local Pickup', count: 123 },
    { value: 'expedited', label: 'Expedited Shipping', count: 234 },
  ];

  const sellerTypes = [
    { value: 'top_rated', label: 'Top Rated Plus', count: 456 },
    { value: 'business', label: 'Business Seller', count: 189 },
    { value: 'individual', label: 'Individual Seller', count: 602 },
  ];

  const handleConditionChange = (condition: string) => {
    setFilters(prev => ({
      ...prev,
      condition: prev.condition.includes(condition)
        ? prev.condition.filter(c => c !== condition)
        : [...prev.condition, condition]
    }));
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

      {/* Condition Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Condition</h4>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <label key={condition.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.condition.includes(condition.value)}
                onChange={() => handleConditionChange(condition.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {condition.label}
              </span>
              <span className="ml-auto text-xs text-gray-500">
                ({condition.count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Price</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceRange.min}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              priceRange: { ...prev.priceRange, min: e.target.value }
            }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceRange.max}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              priceRange: { ...prev.priceRange, max: e.target.value }
            }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Shipping Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Shipping</h4>
        <div className="space-y-2">
          {shippingOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="shipping"
                value={option.value}
                checked={filters.shipping === option.value}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  shipping: e.target.value
                }))}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {option.label}
              </span>
              <span className="ml-auto text-xs text-gray-500">
                ({option.count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Seller Type Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Seller Type</h4>
        <div className="space-y-2">
          {sellerTypes.map((seller) => (
            <label key={seller.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.sellerType === seller.value}
                onChange={() => setFilters(prev => ({
                  ...prev,
                  sellerType: prev.sellerType === seller.value ? '' : seller.value
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {seller.label}
              </span>
              <span className="ml-auto text-xs text-gray-500">
                ({seller.count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Item Location</h4>
        <select
          value={filters.location}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            location: e.target.value
          }))}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="">Any location</option>
          <option value="us_only">US Only</option>
          <option value="north_america">North America</option>
          <option value="europe">Europe</option>
          <option value="asia">Asia</option>
        </select>
      </div>

      {/* Apply Filters Button */}
      <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium">
        Apply Filters
      </button>

      {/* Clear Filters */}
      <button 
        onClick={() => setFilters({
          condition: [],
          priceRange: { min: '', max: '' },
          shipping: '',
          location: '',
          sellerType: '',
        })}
        className="w-full mt-2 text-blue-600 text-sm hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
};

export default SearchFilters;