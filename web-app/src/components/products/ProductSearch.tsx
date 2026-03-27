import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '../core/Input';
import type { SearchSuggestion } from '../../types/product';
import './ProductSearch.css';

export interface ProductSearchProps {
  onSearch: (query: string) => void;
  onSuggestions?: (query: string) => Promise<SearchSuggestion[]>;
  placeholder?: string;
  debounceMs?: number;
  maxSuggestions?: number;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  onSearch,
  onSuggestions,
  placeholder = 'Search products...',
  debounceMs = 300,
  maxSuggestions = 5,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      }
    }, debounceMs);
  }, [query, debounceMs, onSearch]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!onSuggestions || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await onSuggestions(searchQuery);
      setSuggestions(results.slice(0, maxSuggestions));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [onSuggestions, maxSuggestions]);

  useEffect(() => {
    const fetch = async () => {
      await fetchSuggestions(query);
    };
    fetch();
  }, [query, fetchSuggestions]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product') {
      window.location.href = `/products/${suggestion.id}`;
    } else if (suggestion.type === 'category') {
      window.location.href = `/products?category=${suggestion.id}`;
    }
    setShowSuggestions(false);
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        );
      case 'category':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        );
    }
  };

  return (
    <div className="mnbara-product-search" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          size="lg"
          fullWidth
          leftIcon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          }
          rightIcon={
            loading ? (
              <span className="mnbara-product-search__spinner" />
            ) : query ? (
              <button
                type="button"
                className="mnbara-product-search__clear"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            ) : null
          }
        />
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="mnbara-product-search__suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className={`mnbara-product-search__suggestion mnbara-product-search__suggestion--${suggestion.type}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="mnbara-product-search__suggestion-icon">
                {getSuggestionIcon(suggestion.type)}
              </span>
              {suggestion.image && (
                <img
                  src={suggestion.image}
                  alt=""
                  className="mnbara-product-search__suggestion-image"
                />
              )}
              <div className="mnbara-product-search__suggestion-content">
                <span className="mnbara-product-search__suggestion-text">{suggestion.text}</span>
                {suggestion.categoryName && (
                  <span className="mnbara-product-search__suggestion-category">
                    {suggestion.categoryName}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
