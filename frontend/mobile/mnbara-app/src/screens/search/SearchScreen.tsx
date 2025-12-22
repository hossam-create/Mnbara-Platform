import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { productsService } from '../../services/api';
import { Product, RootStackParamList, PaginatedResponse } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@mnbara_recent_searches';
const MAX_RECENT_SEARCHES = 10;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FilterState {
  category: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  sortBy: string;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'home', label: 'Home' },
  { value: 'sports', label: 'Sports' },
  { value: 'toys', label: 'Toys' },
  { value: 'books', label: 'Books' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'auto', label: 'Auto' },
];

const CONDITIONS = [
  { value: '', label: 'Any Condition' },
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Best Rated' },
];

export const SearchScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const searchInputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);


  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    sortBy: 'relevance',
  });

  const filterAnimation = useRef(new Animated.Value(0)).current;

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updated = [
        query,
        ...recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);
      
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  const fetchSuggestions = async (query: string) => {
    try {
      // In a real app, this would call an autocomplete API endpoint
      // For now, we'll simulate suggestions based on the query
      const mockSuggestions = [
        `${query} phone`,
        `${query} laptop`,
        `${query} accessories`,
        `${query} deals`,
      ].slice(0, 4);
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const searchProducts = useCallback(
    async (query: string, pageNum: number = 1, append: boolean = false) => {
      if (!query.trim()) return;

      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params: Record<string, any> = {
          search: query,
          page: pageNum,
          limit: 20,
        };

        if (filters.category) params.category = filters.category;
        if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
        if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);
        if (filters.condition) params.condition = filters.condition;
        if (filters.sortBy) params.sortBy = filters.sortBy;

        const response: PaginatedResponse<Product> = await productsService.getProducts(params);

        if (append) {
          setProducts((prev) => [...prev, ...(response.data || [])]);
        } else {
          setProducts(response.data || []);
        }

        setTotalPages(response.totalPages || 1);
        setPage(pageNum);
        setHasSearched(true);
        setSuggestions([]);

        if (pageNum === 1) {
          saveRecentSearch(query);
        }
      } catch (error: any) {
        console.error('Search failed:', error);
        // Set error state for user feedback
        if (pageNum === 1) {
          setProducts([]);
        }
        // Could show toast notification here
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filters]
  );

  const handleSearch = () => {
    Keyboard.dismiss();
    if (searchQuery.trim()) {
      searchProducts(searchQuery, 1);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    searchProducts(suggestion, 1);
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    searchProducts(query, 1);
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('Product', { productId });
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && page < totalPages) {
      searchProducts(searchQuery, page + 1, true);
    }
  };

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    setShowFilters(!showFilters);
    Animated.timing(filterAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const applyFilters = () => {
    toggleFilters();
    if (searchQuery.trim()) {
      searchProducts(searchQuery, 1);
    }
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: 'relevance',
    });
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.condition) count++;
    if (filters.sortBy !== 'relevance') count++;
    return count;
  };


  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.productPrice}>
          {formatPrice(item.price, item.currency)}
        </Text>
        <View style={styles.productMeta}>
          <Text style={styles.conditionBadge}>
            {item.condition.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestion = (suggestion: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(suggestion)}
    >
      <Text style={styles.suggestionIcon}>🔍</Text>
      <Text style={styles.suggestionText}>{suggestion}</Text>
    </TouchableOpacity>
  );

  const renderRecentSearch = (query: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.recentItem}
      onPress={() => handleRecentSearchPress(query)}
    >
      <Text style={styles.recentIcon}>🕐</Text>
      <Text style={styles.recentText}>{query}</Text>
    </TouchableOpacity>
  );

  const renderFilterChip = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void
  ) => (
    <View style={styles.filterChipContainer}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterChips}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              value === option.value && styles.filterChipActive,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                value === option.value && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const filterHeight = filterAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const renderHeader = () => (
    <>
      {/* Suggestions */}
      {suggestions.length > 0 && !hasSearched && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionLabel}>Suggestions</Text>
          {suggestions.map(renderSuggestion)}
        </View>
      )}

      {/* Recent Searches */}
      {!hasSearched && recentSearches.length > 0 && suggestions.length === 0 && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionLabel}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map(renderRecentSearch)}
        </View>
      )}

      {/* Results count */}
      {hasSearched && products.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {products.length} result{products.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </>
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    if (hasSearched && products.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your search or filters
          </Text>
        </View>
      );
    }

    if (!hasSearched && suggestions.length === 0 && recentSearches.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛍️</Text>
          <Text style={styles.emptyTitle}>Search for products</Text>
          <Text style={styles.emptyText}>
            Find electronics, fashion, home goods, and more
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setProducts([]);
                  setHasSearched(false);
                }}
                style={styles.clearInput}
              >
                <Text style={styles.clearInputText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              getActiveFiltersCount() > 0 && styles.filterButtonActive,
            ]}
            onPress={toggleFilters}
          >
            <Text style={styles.filterButtonText}>⚙️</Text>
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {getActiveFiltersCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters Panel */}
      <Animated.View style={[styles.filtersPanel, { height: filterHeight }]}>
        <View style={styles.filtersPanelContent}>
          {renderFilterChip('Category', filters.category, CATEGORIES, (v) =>
            setFilters((f) => ({ ...f, category: v }))
          )}

          {renderFilterChip('Condition', filters.condition, CONDITIONS, (v) =>
            setFilters((f) => ({ ...f, condition: v }))
          )}

          <View style={styles.priceFilterContainer}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={filters.minPrice}
                onChangeText={(v) =>
                  setFilters((f) => ({ ...f, minPrice: v }))
                }
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={filters.maxPrice}
                onChangeText={(v) =>
                  setFilters((f) => ({ ...f, maxPrice: v }))
                }
              />
            </View>
          </View>

          {renderFilterChip('Sort By', filters.sortBy, SORT_OPTIONS, (v) =>
            setFilters((f) => ({ ...f, sortBy: v }))
          )}

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productList}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#000',
  },
  clearInput: {
    padding: 4,
  },
  clearInputText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  filterButton: {
    marginLeft: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 18,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Filters Panel
  filtersPanel: {
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filtersPanelContent: {
    padding: 16,
  },
  filterChipContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#000',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  priceFilterContainer: {
    marginBottom: 16,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  filterActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Suggestions
  suggestionsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  suggestionIcon: {
    fontSize: 14,
    marginRight: 12,
    color: '#8E8E93',
  },
  suggestionText: {
    fontSize: 16,
    color: '#000',
  },
  // Recent Searches
  recentContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  recentIcon: {
    fontSize: 14,
    marginRight: 12,
  },
  recentText: {
    fontSize: 16,
    color: '#000',
  },
  // Results
  resultsHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  productList: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F2F2F7',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionBadge: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
