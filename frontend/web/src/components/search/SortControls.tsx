import React from 'react';
import { SearchFilters } from '../../services/search.service';

interface SortControlsProps {
  sortBy: SearchFilters['sortBy'];
  onSortChange: (sortBy: SearchFilters['sortBy']) => void;
}

const SortControls: React.FC<SortControlsProps> = ({ sortBy, onSortChange }) => {
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest' },
    { value: 'ending_soon', label: 'Ending Soon' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Sort by:</span>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SearchFilters['sortBy'])}
        className="border border-gray-300 rounded px-3 py-1 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortControls;