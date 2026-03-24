import React, { useState } from 'react';
import { Button } from '../core/Button';
import { Input } from '../core/Input';
import type { ProductCategory, ProductCondition, ProductFilters as IProductFilters } from '../../types/product';
import './ProductFilters.css';

export interface ProductFiltersProps {
  categories: ProductCategory[];
  selectedFilters: IProductFilters;
  onFilterChange: (filters: IProductFilters) => void;
  onClearFilters: () => void;
  expanded?: boolean;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  expanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [priceRange, setPriceRange] = useState({
    min: selectedFilters.minPrice || '',
    max: selectedFilters.maxPrice || '',
  });

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  const handlePriceChange = (field: 'min' | 'max', value: string) => {
    const newPriceRange = { ...priceRange, [field]: value };
    setPriceRange(newPriceRange);
    
    const filters = {
      ...selectedFilters,
      minPrice: newPriceRange.min ? parseFloat(newPriceRange.min) : undefined,
      maxPrice: newPriceRange.max ? parseFloat(newPriceRange.max) : undefined,
    };
    onFilterChange(filters);
  };

  const handleConditionToggle = (condition: string) => {
    const currentConditions = selectedFilters.condition || [];
    const newConditions = currentConditions.includes(condition as ProductCondition)
      ? currentConditions.filter((c) => c !== condition)
      : [...currentConditions, condition as ProductCondition];
    
    onFilterChange({ ...selectedFilters, condition: newConditions });
  };

  const hasActiveFilters = 
    selectedFilters.categoryId ||
    selectedFilters.minPrice ||
    selectedFilters.maxPrice ||
    (selectedFilters.condition && selectedFilters.condition.length > 0) ||
    selectedFilters.location?.city;

  return (
    <div className="mnbara-product-filters">
      <div className="mnbara-product-filters__header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mnbara-product-filters__section">
        <button
          className="mnbara-product-filters__section-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Category</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="mnbara-product-filters__options">
            <label className="mnbara-product-filters__option">
              <input
                type="radio"
                name="category"
                checked={!selectedFilters.categoryId}
                onChange={() => onFilterChange({ ...selectedFilters, categoryId: undefined })}
              />
              <span>All Categories</span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="mnbara-product-filters__option">
                <input
                  type="radio"
                  name="category"
                  checked={selectedFilters.categoryId === category.id}
                  onChange={() => onFilterChange({ ...selectedFilters, categoryId: category.id })}
                />
                <span>{category.name}</span>
                {category.subcategories && category.subcategories.length > 0 && (
                  <span className="mnbara-product-filters__subcount">
                    ({category.subcategories.length})
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="mnbara-product-filters__section">
        <button
          className="mnbara-product-filters__section-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Price Range</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="mnbara-product-filters__price">
            <Input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              size="sm"
            />
            <span>to</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Condition Filter */}
      <div className="mnbara-product-filters__section">
        <button
          className="mnbara-product-filters__section-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Condition</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="mnbara-product-filters__options mnbara-product-filters__options--checkboxes">
            {conditions.map((condition) => (
              <label key={condition.value} className="mnbara-product-filters__checkbox">
                <input
                  type="checkbox"
                  checked={selectedFilters.condition?.includes(condition.value as ProductCondition) || false}
                  onChange={() => handleConditionToggle(condition.value)}
                />
                <span>{condition.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Location Filter */}
      <div className="mnbara-product-filters__section">
        <button
          className="mnbara-product-filters__section-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Location</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="mnbara-product-filters__location">
            <Input
              placeholder="City or Country"
              value={selectedFilters.location?.city || ''}
              onChange={(e) => onFilterChange({
                ...selectedFilters,
                location: { ...selectedFilters.location, city: e.target.value || undefined },
              })}
              size="sm"
              leftIcon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
