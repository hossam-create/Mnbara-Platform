/**
 * ProductDetailScreen Tests
 * Tests for product detail rendering and user interactions
 * Requirements: 7.1, 7.2, 7.3
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ProductDetailScreen } from '../../../screens/products/ProductDetailScreen';
import { productsService } from '../../../services/api';

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { productId: 'product-123' },
  }),
}));

// Mock API service
jest.mock('../../../services/api', () => ({
  productsService: {
    getProduct: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ProductDetailScreen', () => {
  const mockProduct = {
    id: 'product-123',
    sellerId: 'seller-1',
    title: 'iPhone 15 Pro Max 256GB',
    description: 'Brand new iPhone 15 Pro Max with 256GB storage. Comes with original box and accessories.',
    categoryId: 'electronics',
    price: 1199,
    currency: 'USD',
    condition: 'new',
    images: [
      'https://example.com/iphone1.jpg',
      'https://example.com/iphone2.jpg',
      'https://example.com/iphone3.jpg',
    ],
    attributes: {
      brand: 'Apple',
      storage: '256GB',
      color: 'Natural Titanium',
    },
    status: 'active',
    viewsCount: 150,
    favoritesCount: 25,
    seller: {
      id: 'seller-1',
      fullName: 'John Electronics',
      avatarUrl: 'https://example.com/avatar.jpg',
      ratingAvg: 4.8,
      totalSales: 342,
      memberSince: '2022-03-15',
    },
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3,
    },
  };

  // Create mock props that match the expected screen props
  const createMockProps = () => ({
    route: { params: { productId: 'product-123' } } as any,
    navigation: {
      navigate: mockNavigate,
      goBack: mockGoBack,
    } as any,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);
  });

  it('renders loading state initially', () => {
    (productsService.getProduct as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    expect(getByText('Loading product...')).toBeTruthy();
  });

  it('fetches and displays product details', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(productsService.getProduct).toHaveBeenCalledWith('product-123');
      expect(getByText('iPhone 15 Pro Max 256GB')).toBeTruthy();
      expect(getByText('$1,199.00')).toBeTruthy();
    });
  });

  it('displays product description', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('Description')).toBeTruthy();
      expect(getByText(mockProduct.description)).toBeTruthy();
    });
  });

  it('displays product attributes', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('Details')).toBeTruthy();
      expect(getByText('Apple')).toBeTruthy();
      expect(getByText('256GB')).toBeTruthy();
      expect(getByText('Natural Titanium')).toBeTruthy();
    });
  });

  it('displays seller information', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('John Electronics')).toBeTruthy();
      expect(getByText('(4.8)')).toBeTruthy();
    });
  });

  it('displays condition badge', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('Brand New')).toBeTruthy();
    });
  });

  it('displays free shipping info', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('Free Shipping')).toBeTruthy();
      expect(getByText('Estimated delivery: 3 days')).toBeTruthy();
    });
  });

  it('handles add to cart action', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('Add to Cart')).toBeTruthy();
    });

    fireEvent.press(getByText('Add to Cart'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Added to Cart',
      expect.stringContaining('iPhone 15 Pro Max 256GB'),
      expect.any(Array)
    );
  });

  it('handles buy now action', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('Buy Now')).toBeTruthy();
    });

    fireEvent.press(getByText('Buy Now'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Proceed to Checkout',
      expect.stringContaining('iPhone 15 Pro Max 256GB'),
      expect.any(Array)
    );
  });

  it('handles quantity increment', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });

    // Increment quantity
    fireEvent.press(getByText('+'));

    expect(getByText('2')).toBeTruthy();
  });

  it('handles quantity decrement with minimum of 1', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
    });

    // Try to decrement below 1
    fireEvent.press(getByText('−'));

    // Should still be 1
    expect(getByText('1')).toBeTruthy();
  });

  it('toggles favorite state', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('🤍')).toBeTruthy();
    });

    // Toggle favorite
    fireEvent.press(getByText('🤍'));

    expect(getByText('❤️')).toBeTruthy();
  });

  it('displays error state when product fetch fails', async () => {
    (productsService.getProduct as jest.Mock).mockRejectedValue(
      new Error('Product not found')
    );

    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('Oops!')).toBeTruthy();
      expect(getByText('Product not found')).toBeTruthy();
    });
  });

  it('allows retry when product fetch fails', async () => {
    (productsService.getProduct as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockProduct);

    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('Try Again')).toBeTruthy();
    });

    fireEvent.press(getByText('Try Again'));

    await waitFor(() => {
      expect(productsService.getProduct).toHaveBeenCalledTimes(2);
      expect(getByText('iPhone 15 Pro Max 256GB')).toBeTruthy();
    });
  });

  it('displays image counter for multiple images', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('1/3')).toBeTruthy();
    });
  });

  it('displays views and favorites count', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('👁 150 views')).toBeTruthy();
      expect(getByText('❤️ 25 favorites')).toBeTruthy();
    });
  });

  it('handles contact seller action', async () => {
    const props = createMockProps();
    const { getByText } = render(<ProductDetailScreen {...props} />);

    await waitFor(() => {
      expect(getByText('💬')).toBeTruthy();
    });

    fireEvent.press(getByText('💬'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Contact Seller',
      'Messaging feature coming soon!'
    );
  });
});
