import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SearchBar } from '../SearchBar';
import { productApi } from '../../../services/api';
import type { Category } from '../../../types';

// Mock the API
vi.mock('../../../services/api', () => ({
  productApi: {
    search: vi.fn(),
  },
}));

// Mock useDebounce to return value immediately for testing
vi.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Electronics', icon: '📱', color: '#FF5733', subcategories: [] },
  { id: 'cat-2', name: 'Clothing', icon: '👕', color: '#33FF57', subcategories: [] },
  { id: 'cat-3', name: 'Home & Garden', icon: '🏠', color: '#3357FF', subcategories: [] },
];

const mockSearchResults = {
  data: {
    success: true,
    data: {
      items: [
        {
          id: 'prod-1',
          name: 'iPhone 15 Pro',
          images: ['https://example.com/iphone.jpg'],
          price: 999.99,
          currency: 'USD',
          category: { id: 'cat-1', name: 'Electronics', icon: '📱', color: '#FF5733', subcategories: [] },
        },
        {
          id: 'prod-2',
          name: 'MacBook Pro',
          images: ['https://example.com/macbook.jpg'],
          price: 1999.99,
          currency: 'USD',
          category: { id: 'cat-1', name: 'Electronics', icon: '📱', color: '#FF5733', subcategories: [] },
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    },
  },
};

const renderSearchBar = (props = {}) => {
  const defaultProps = {
    onSearch: vi.fn(),
    categories: mockCategories,
    recentSearches: ['iPhone', 'MacBook'],
    popularSearches: ['PlayStation 5', 'AirPods'],
  };

  return render(
    <BrowserRouter>
      <SearchBar {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (productApi.search as ReturnType<typeof vi.fn>).mockResolvedValue(mockSearchResults);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      expect(input).toBeInTheDocument();
    });

    it('should render search button', () => {
      renderSearchBar();
      
      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toBeInTheDocument();
    });

    it('should render category dropdown when categories provided', () => {
      renderSearchBar({ categories: mockCategories });
      
      const select = screen.getByRole('combobox', { name: /select category/i });
      expect(select).toBeInTheDocument();
    });

    it('should render all category options', () => {
      renderSearchBar({ categories: mockCategories });
      
      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Clothing')).toBeInTheDocument();
      expect(screen.getByText('Home & Garden')).toBeInTheDocument();
    });

    it('should render with initial query', () => {
      renderSearchBar({ initialQuery: 'test query' });
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      expect(input).toHaveValue('test query');
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearch when form is submitted', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      renderSearchBar({ onSearch });
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, 'test search');
      
      // Use the submit button specifically (type="submit")
      const searchButton = screen.getByRole('button', { name: /^Search$/i });
      await user.click(searchButton);
      
      expect(onSearch).toHaveBeenCalledWith('test search');
    });

    it('should call onSearch when Enter is pressed', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      renderSearchBar({ onSearch });
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, 'keyboard search{enter}');
      
      expect(onSearch).toHaveBeenCalledWith('keyboard search');
    });

    it('should not call onSearch with empty query', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      renderSearchBar({ onSearch });
      
      // Use the submit button specifically
      const searchButton = screen.getByRole('button', { name: /^Search$/i });
      await user.click(searchButton);
      
      expect(onSearch).not.toHaveBeenCalled();
    });

    it('should trim whitespace from search query', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      renderSearchBar({ onSearch });
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, '  trimmed query  ');
      
      // Use the submit button specifically
      const searchButton = screen.getByRole('button', { name: /^Search$/i });
      await user.click(searchButton);
      
      expect(onSearch).toHaveBeenCalledWith('trimmed query');
    });
  });

  describe('Category Selection', () => {
    it('should call onCategorySelect when category is changed', async () => {
      const onCategorySelect = vi.fn();
      const user = userEvent.setup();
      renderSearchBar({ onCategorySelect });
      
      const select = screen.getByRole('combobox', { name: /select category/i });
      await user.selectOptions(select, 'cat-1');
      
      expect(onCategorySelect).toHaveBeenCalledWith('cat-1');
    });

    it('should update selected category state', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const select = screen.getByRole('combobox', { name: /select category/i });
      await user.selectOptions(select, 'cat-2');
      
      expect(select).toHaveValue('cat-2');
    });
  });

  describe('Dropdown Behavior', () => {
    it('should show dropdown when input is focused', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.click(input);
      
      // Should show recent or popular searches
      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      });
    });

    it('should show recent searches when focused with no query', async () => {
      const user = userEvent.setup();
      renderSearchBar({ recentSearches: ['iPhone', 'MacBook'] });
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone')).toBeInTheDocument();
        expect(screen.getByText('MacBook')).toBeInTheDocument();
      });
    });

    it('should show popular searches', async () => {
      const user = userEvent.setup();
      renderSearchBar({ popularSearches: ['PlayStation 5', 'AirPods'] });
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('Popular Searches')).toBeInTheDocument();
        expect(screen.getByText('PlayStation 5')).toBeInTheDocument();
        expect(screen.getByText('AirPods')).toBeInTheDocument();
      });
    });

    it('should close dropdown on Escape key', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.click(input);
      
      // Dropdown should be visible
      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      });
      
      // Press Escape
      await user.keyboard('{Escape}');
      
      // Dropdown should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auto-complete Suggestions', () => {
    it('should fetch suggestions when query length >= 2', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, 'ip');
      
      await waitFor(() => {
        expect(productApi.search).toHaveBeenCalledWith('ip', expect.any(Object));
      });
    });

    it('should not fetch suggestions when query length < 2', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, 'i');
      
      expect(productApi.search).not.toHaveBeenCalled();
    });

    it('should display product suggestions', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, 'iPhone');
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      });
    });

    it('should show "No products found" when no results', async () => {
      (productApi.search as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: { items: [] } },
      });
      
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText(/No products found/)).toBeInTheDocument();
      });
    });
  });

  describe('Clear Button', () => {
    it('should show clear button when query is not empty', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, 'test');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.type(input, 'test query');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      expect(input).toHaveValue('');
    });

    it('should not show clear button when query is empty', () => {
      renderSearchBar();
      
      const clearButton = screen.queryByRole('button', { name: /clear search/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Suggestion Click', () => {
    it('should call onSearch when recent search is clicked', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      renderSearchBar({ onSearch, recentSearches: ['iPhone'] });
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('iPhone'));
      
      expect(onSearch).toHaveBeenCalledWith('iPhone');
    });

    it('should call onSearch when popular search is clicked', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      renderSearchBar({ onSearch, popularSearches: ['AirPods'] });
      
      const input = screen.getByPlaceholderText(/Search for products/i);
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('AirPods')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('AirPods'));
      
      expect(onSearch).toHaveBeenCalledWith('AirPods');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      renderSearchBar();
      
      const input = screen.getByRole('textbox', { name: /search products/i });
      expect(input).toBeInTheDocument();
    });

    it('should have accessible category select', () => {
      renderSearchBar({ categories: mockCategories });
      
      const select = screen.getByRole('combobox', { name: /select category/i });
      expect(select).toBeInTheDocument();
    });
  });
});
