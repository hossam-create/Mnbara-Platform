import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AutoComplete, Input, Card, Typography, Tag, Spin, Divider } from 'antd';
import { SearchOutlined, LoadingOutlined, HistoryOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import debounce from 'lodash/debounce';

const { Text } = Typography;

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  level: number;
  path?: string;
  productCount: number;
  stats?: {
    productCount: number;
    activeListings: number;
    avgPrice: number;
  };
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

interface CategorySearchAutocompleteProps {
  onCategorySelect?: (category: Category) => void;
  onSearch?: (query: string, results: Category[]) => void;
  placeholder?: string;
  showHistory?: boolean;
  maxHistoryItems?: number;
  minSearchLength?: number;
  debounceMs?: number;
  className?: string;
}

const CategorySearchAutocomplete: React.FC<CategorySearchAutocompleteProps> = ({
  onCategorySelect,
  onSearch,
  placeholder = 'Search categories...',
  showHistory = true,
  maxHistoryItems = 5,
  minSearchLength = 2,
  debounceMs = 300,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Category[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<any>(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Load search history from localStorage
  useEffect(() => {
    try {
      const history = localStorage.getItem('categorySearchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Load popular categories
  useEffect(() => {
    const fetchPopularCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE}/categories/popular`, {
          params: { limit: 10 }
        });
        
        if (response.data.success) {
          setPopularCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching popular categories:', error);
      }
    };

    fetchPopularCategories();
  }, [API_BASE]);

  // Save search history to localStorage
  const saveSearchHistory = useCallback((query: string, resultCount: number) => {
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount
    };

    setSearchHistory(prev => {
      const updated = [newItem, ...prev.filter(item => item.query !== query)];
      const limited = updated.slice(0, maxHistoryItems);
      
      try {
        localStorage.setItem('categorySearchHistory', JSON.stringify(limited));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
      
      return limited;
    });
  }, [maxHistoryItems]);

  // Search categories with debouncing
  const searchCategories = useCallback(
    debounce(async (query: string) => {
      if (query.length < minSearchLength) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        abortControllerRef.current = new AbortController();
        
        const response = await axios.get(`${API_BASE}/categories/search`, {
          params: { 
            q: query, 
            limit: 20,
            signal: abortControllerRef.current.signal
          }
        });
        
        if (response.data.success) {
          setSearchResults(response.data.data);
          saveSearchHistory(query, response.data.data.length);
          
          if (onSearch) {
            onSearch(query, response.data.data);
          }
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Error searching categories:', error);
          setSearchResults([]);
        }
      } finally {
        setSearchLoading(false);
      }
    }, debounceMs),
    [API_BASE, minSearchLength, debounceMs, saveSearchHistory, onSearch]
  );

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowRecentSearches(false);
    
    if (value.trim()) {
      searchCategories(value.trim());
    } else {
      setSearchResults([]);
    }
  }, [searchCategories]);

  // Handle category selection
  const handleCategorySelect = useCallback((value: string, option: any) => {
    const category = searchResults.find(cat => cat.slug === value);
    if (category && onCategorySelect) {
      onCategorySelect(category);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchResults, onCategorySelect]);

  // Handle history item click
  const handleHistoryClick = useCallback((query: string) => {
    setSearchQuery(query);
    searchCategories(query);
    setShowRecentSearches(false);
    inputRef.current?.focus();
  }, [searchCategories]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('categorySearchHistory');
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, []);

  // Build autocomplete options
  const autoCompleteOptions = useMemo(() => {
    const options: any[] = [];

    if (searchQuery.length >= minSearchLength) {
      // Search results
      searchResults.forEach(category => {
        options.push({
          value: category.slug,
          label: (
            <div className="search-result-item">
              <div className="search-result-content">
                <div className="search-result-title">
                  <Text strong>{category.name}</Text>
                  {category.nameAr && <Text className="search-result-title-ar"> / {category.nameAr}</Text>}
                </div>
                <div className="search-result-meta">
                  <Tag size="small" color="blue">{category.productCount} products</Tag>
                  {category.stats && (
                    <>
                      <Tag size="small" color="green">{category.stats.activeListings} active</Tag>
                      <Tag size="small" color="orange">${category.stats.avgPrice.toFixed(0)}</Tag>
                    </>
                  )}
                  {category.path && (
                    <Text type="secondary" className="search-result-path">
                      {category.path}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          )
        });
      });

      if (options.length === 0 && !searchLoading) {
        options.push({
          value: 'no-results',
          label: (
            <div className="no-results">
              <Text type="secondary">No categories found for "{searchQuery}"</Text>
            </div>
          ),
          disabled: true
        });
      }
    } else if (showRecentSearches && searchHistory.length > 0) {
      // Recent searches
      options.push({
        value: 'recent-searches-header',
        label: (
          <div className="search-header">
            <Text strong>
              <HistoryOutlined /> Recent Searches
            </Text>
            <Button type="link" size="small" onClick={clearHistory}>
              Clear
            </Button>
          </div>
        ),
        disabled: true
      });

      searchHistory.forEach(item => {
        options.push({
          value: item.query,
          label: (
            <div className="history-item">
              <Text>{item.query}</Text>
              <Text type="secondary" className="history-meta">
                {item.resultCount} results
              </Text>
            </div>
          )
        });
      });

      if (popularCategories.length > 0) {
        options.push({
          value: 'popular-header',
          label: (
            <div className="search-header">
              <Text strong>Popular Categories</Text>
            </div>
          ),
          disabled: true
        });

        popularCategories.forEach(category => {
          options.push({
            value: category.slug,
            label: (
              <div className="popular-item">
                <Text strong>{category.name}</Text>
                {category.nameAr && <Text className="popular-item-ar"> / {category.nameAr}</Text>}
                <Tag size="small" color="blue">{category.productCount}</Tag>
              </div>
            )
          });
        });
      }
    }

    return options;
  }, [searchQuery, searchResults, searchLoading, searchHistory, showRecentSearches, popularCategories, clearHistory, minSearchLength]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (!searchQuery && showHistory) {
      setShowRecentSearches(true);
    }
  }, [searchQuery, showHistory]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    // Delay hiding recent searches to allow clicking on history items
    setTimeout(() => {
      setShowRecentSearches(false);
    }, 200);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className={`category-search-autocomplete ${className}`}>
      <AutoComplete
        ref={inputRef}
        className="category-search-input"
        options={autoCompleteOptions}
        onSelect={handleCategorySelect}
        onSearch={handleSearchChange}
        value={searchQuery}
        placeholder={placeholder}
        notFoundContent={searchLoading ? (
          <div className="search-loading">
            <Spin size="small" />
            <Text>Searching...</Text>
          </div>
        ) : null}
        open={searchQuery.length >= minSearchLength || showRecentSearches}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        filterOption={false}
        defaultActiveFirstOption={false}
      >
        <Input.Search
          prefix={<SearchOutlined />}
          loading={searchLoading}
          enterButton="Search"
          size="large"
        />
      </AutoComplete>

      {/* Search suggestions dropdown for recent searches */}
      <AnimatePresence>
        {showRecentSearches && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="search-suggestions"
          >
            <Card size="small" className="suggestions-card">
              {searchHistory.length > 0 && (
                <>
                  <div className="suggestions-header">
                    <Text strong>
                      <HistoryOutlined /> Recent Searches
                    </Text>
                    <Button type="link" size="small" onClick={clearHistory}>
                      Clear
                    </Button>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleHistoryClick(item.query)}
                    >
                      <Text>{item.query}</Text>
                      <Text type="secondary" className="suggestion-meta">
                        {item.resultCount} results
                      </Text>
                    </div>
                  ))}
                </>
              )}

              {popularCategories.length > 0 && (
                <>
                  <div className="suggestions-header">
                    <Text strong>Popular Categories</Text>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  {popularCategories.map(category => (
                    <div
                      key={category.id}
                      className="suggestion-item"
                      onClick={() => {
                        if (onCategorySelect) {
                          onCategorySelect(category);
                          setSearchQuery('');
                          setShowRecentSearches(false);
                        }
                      }}
                    >
                      <Text strong>{category.name}</Text>
                      {category.nameAr && <Text className="suggestion-item-ar"> / {category.nameAr}</Text>}
                      <Tag size="small" color="blue">{category.productCount}</Tag>
                    </div>
                  ))}
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySearchAutocomplete;
