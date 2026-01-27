// ============================================================
// P2P Exchange - Marketplace Filters Component
// Filter panel for marketplace browsing
// ============================================================

import React from 'react';
import type { MarketplaceFilters } from '../../types/p2p-exchange.types';

// ============================================================
// COMPONENT PROPS
// ============================================================

interface MarketplaceFiltersProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
  onReset?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const handleChange = (key: keyof MarketplaceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset All
        </button>
      </div>

      {/* Currency Filters */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Currency
          </label>
          <select
            value={filters.fromCurrency || ''}
            onChange={(e) => handleChange('fromCurrency', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Currencies</option>
            <option value="USD">USD</option>
            <option value="SAR">SAR</option>
            <option value="AED">AED</option>
            <option value="EGP">EGP</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Currency
          </label>
          <select
            value={filters.toCurrency || ''}
            onChange={(e) => handleChange('toCurrency', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Currencies</option>
            <option value="USD">USD</option>
            <option value="SAR">SAR</option>
            <option value="AED">AED</option>
            <option value="EGP">EGP</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* Amount Range */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={filters.minAmount || ''}
            onChange={(e) => handleChange('minAmount', parseFloat(e.target.value))}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={filters.maxAmount || ''}
            onChange={(e) => handleChange('maxAmount', parseFloat(e.target.value))}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Rate Range */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Rate
          </label>
          <input
            type="number"
            step="0.0001"
            value={filters.minRate || ''}
            onChange={(e) => handleChange('minRate', parseFloat(e.target.value))}
            placeholder="0.0000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Rate
          </label>
          <input
            type="number"
            step="0.0001"
            value={filters.maxRate || ''}
            onChange={(e) => handleChange('maxRate', parseFloat(e.target.value))}
            placeholder="0.0000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Trust Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Trust Level
        </label>
        <select
          value={filters.minTrustLevel || ''}
          onChange={(e) => handleChange('minTrustLevel', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Any Level</option>
          <option value="1">Level 1+</option>
          <option value="2">Level 2+</option>
          <option value="3">Level 3+</option>
          <option value="4">Level 4+</option>
          <option value="5">Level 5+</option>
        </select>
      </div>

      {/* Sort Options */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'time'}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="time">Time (Newest First)</option>
            <option value="rate">Exchange Rate</option>
            <option value="amount">Amount</option>
            <option value="reputation">Trust Level</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort Order
          </label>
          <select
            value={filters.sortOrder || 'desc'}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceFilters;
