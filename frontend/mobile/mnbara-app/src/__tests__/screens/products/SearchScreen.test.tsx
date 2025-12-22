/**
 * SearchScreen Tests
 * Tests for search functionality and product filtering
 * Requirements: 7.1, 7.2, 7.3
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SearchScreen } from '../../../screens/search/SearchScreen';
import { productsService } from '../../../services/api';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock API service
jest.mock('../../../services/api', () => ({
  productsService: {
    getProducts: jest.fn(),
  },
}));

// Mock Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('SearchScreen', () => {
  const mockProducts = [
    {
      id: 'product-1',
      title: 'iPhone 15 Pro',
      price: 999,
      currency: 'USD',
      condition: 'new',
      images: ['https://example.com/iphone.jpg'],
    },
    {
      id: 'product-2',
      title: 'Samsung Galaxy S24',
      price: 899,
      currency: 'USD',
      condition: 'like_new',
      images: ['https://example.com/samsung.jpg'],
    },
  ];

  const mockPaginatedResponse = {
    data: mockProducts,
    total: 2,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  };

  // Get AsyncStorage mock from jest.setup.js
  const AsyncStorage = require('@react-native-async-storage/async-storage');

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    (productsService.getProducts as jest.Mock).mockResolvedValue(mockPaginatedResponse);
  });

  it('renders search input and initial state', () => {
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);

    expect(getByPlaceholderText('Search products...')).toBeTruthy();
    expect(getByText('Search')).toBeTruthy();
  });

  it('displays empty state when no search performed', () => {
    const { getByText } = render(<SearchScreen />);

    expect(getByText('Search for products')).toBeTruthy();
    expect(getByText('Find electronics, fashion, home goods, and more')).toBeTruthy();
  });

  it('performs search when user submits query', async () => {
    const { getByPlaceholderText } = render(<SearchScreen />);

    const searchInput = getByPlaceholderText('Search products...');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'iPhone');
      fireEvent(searchInput, 'submitEditing');
    });

    await waitFor(() => {
      expect(productsService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'iPhone',
          page: 1,
          limit: 20,
        })
      );
    });
  });

  it('displays search results after successful search', async () => {
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);

    const searchInput = getByPlaceholderText('Search products...');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'phone');
      fireEvent(searchInput, 'submitEditing');
    });

    await waitFor(() => {
      expect(getByText('iPhone 15 Pro')).toBeTruthy();
      expect(getByText('Samsung Galaxy S24')).toBeTruthy();
    });
  });

  it('displays no results message when search returns empty', async () => {
    (productsService.getProducts as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });

    const { getByPlaceholderText, getByText } = render(<SearchScreen />);

    const searchInput = getByPlaceholderText('Search products...');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'nonexistent');
      fireEvent(searchInput, 'submitEditing');
    });

    await waitFor(() => {
      expect(getByText('No results found')).toBeTruthy();
    });
  });

  it('navigates to product detail when product is pressed', async () => {
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);

    const searchInput = getByPlaceholderText('Search products...');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'phone');
      fireEvent(searchInput, 'submitEditing');
    });

    await waitFor(() => {
      expect(getByText('iPhone 15 Pro')).toBeTruthy();
    });

    fireEvent.press(getByText('iPhone 15 Pro'));

    expect(mockNavigate).toHaveBeenCalledWith('Product', { productId: 'product-1' });
  });

  it('clears search input when clear button is pressed', async () => {
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);

    const searchInput = getByPlaceholderText('Search products...');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'test query');
    });

    // Find and press clear button
    const clearButton = getByText('✕');
    fireEvent.press(clearButton);

    expect(searchInput.props.value).toBe('');
  });

  it('saves recent searches', async () => {
    const { getByPlaceholderText } = render(<SearchScreen />);

    const searchInput = getByPlaceholderText('Search products...');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'laptop');
      fireEvent(searchInput, 'submitEditing');
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@mnbara_recent_searches',
        expect.any(String)
      );
    });
  });

  it('loads and displays recent searches', async () => {
    const recentSearches = ['phone', 'laptop', 'headphones'];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(recentSearches));

    const { getByText } = render(<SearchScreen />);

    await waitFor(() => {
      expect(getByText('Recent Searches')).toBeTruthy();
      expect(getByText('phone')).toBeTruthy();
      expect(getByText('laptop')).toBeTruthy();
    });
  });

  it('applies category filter to search', async () => {
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);

    // Open filters
    const filterButton = getByText('⚙️');
    fireEvent.press(filterButton);

    // Select electronics category
    await waitFor(() => {
      const electronicsChip = getByText('Electronics');
      fireEvent.press(electronicsChip);
    });

    // Apply filters
    const applyButton = getByText('Apply Filters');
    fireEvent.press(applyButton);

    // Perform search
    const searchInput = getByPlaceholderText('Search products...');
    await act(async () => {
      fireEvent.changeText(searchInput, 'phone');
      fireEvent(searchInput, 'submitEditing');
    });

    await waitFor(() => {
      expect(productsService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'electronics',
        })
      );
    });
  });
});
