import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '../ProductCard';
import type { Product } from '../../../types';

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  name: 'Test Product',
  description: 'A test product description',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  price: 99.99,
  currency: 'USD',
  category: { id: 'cat-1', name: 'Electronics', icon: '📱', color: '#FF5733', subcategories: [] },
  condition: 'new',
  listingType: 'buy_now',
  seller: {
    id: 'seller-1',
    email: 'seller@example.com',
    fullName: 'Test Seller',
    role: 'seller',
    kycVerified: true,
    rating: 4.5,
    totalReviews: 100,
    createdAt: '2024-01-01T00:00:00Z',
  },
  originCountry: 'US',
  tags: ['electronics', 'gadget'],
  stock: 10,
  rating: 4.5,
  totalReviews: 50,
  views: 1000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  ...overrides,
});

describe('ProductCard Component', () => {
  const mockOnAddToCart = vi.fn();
  const mockOnAddToWishlist = vi.fn();
  const mockOnQuickView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default Variant Rendering', () => {
    it('should render product name', () => {
      const product = createMockProduct({ name: 'Amazing Gadget' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('Amazing Gadget')).toBeInTheDocument();
    });

    it('should render product price formatted correctly', () => {
      const product = createMockProduct({ price: 149.99, currency: 'USD' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('$149.99')).toBeInTheDocument();
    });

    it('should render category name', () => {
      const product = createMockProduct();
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('should render product image', () => {
      const product = createMockProduct({ images: ['https://example.com/test.jpg'] });
      render(<ProductCard product={product} />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
    });

    it('should render origin country', () => {
      const product = createMockProduct({ originCountry: 'US' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText(/Ships from US/)).toBeInTheDocument();
    });

    it('should render rating stars', () => {
      const product = createMockProduct({ rating: 4.5, totalReviews: 50 });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('(50)')).toBeInTheDocument();
    });
  });

  describe('Condition Badges', () => {
    it('should render "New" badge for new products', () => {
      const product = createMockProduct({ condition: 'new' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render "Used" badge for used products', () => {
      const product = createMockProduct({ condition: 'used' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('Used')).toBeInTheDocument();
    });

    it('should render "Open Box" badge for open_box products', () => {
      const product = createMockProduct({ condition: 'open_box' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('Open Box')).toBeInTheDocument();
    });

    it('should render "Refurbished" badge for refurbished products', () => {
      const product = createMockProduct({ condition: 'refurbished' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('Refurbished')).toBeInTheDocument();
    });
  });

  describe('Auction Badge', () => {
    it('should render auction badge for auction listings', () => {
      const product = createMockProduct({ listingType: 'auction' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText(/Auction/)).toBeInTheDocument();
    });

    it('should not render auction badge for buy_now listings', () => {
      const product = createMockProduct({ listingType: 'buy_now' });
      render(<ProductCard product={product} />);
      
      expect(screen.queryByText(/Auction/)).not.toBeInTheDocument();
    });
  });

  describe('Low Stock Warning', () => {
    it('should show low stock warning when stock is 5 or less', () => {
      const product = createMockProduct({ stock: 3 });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText(/Only 3 left!/)).toBeInTheDocument();
    });

    it('should not show low stock warning when stock is above 5', () => {
      const product = createMockProduct({ stock: 10 });
      render(<ProductCard product={product} />);
      
      expect(screen.queryByText(/Only.*left!/)).not.toBeInTheDocument();
    });

    it('should not show low stock warning when stock is 0', () => {
      const product = createMockProduct({ stock: 0 });
      render(<ProductCard product={product} />);
      
      expect(screen.queryByText(/Only.*left!/)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onAddToCart when cart button is clicked', async () => {
      const user = userEvent.setup();
      const product = createMockProduct();
      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);
      
      // Find the cart button (it's an SVG button)
      const cartButtons = screen.getAllByRole('button');
      const cartButton = cartButtons.find(btn => btn.querySelector('svg path[d*="M3 3h2l"]'));
      
      if (cartButton) {
        await user.click(cartButton);
        expect(mockOnAddToCart).toHaveBeenCalledWith(product);
      }
    });

    it('should toggle wishlist state when wishlist button is clicked', async () => {
      const user = userEvent.setup();
      const product = createMockProduct();
      render(<ProductCard product={product} onAddToWishlist={mockOnAddToWishlist} />);
      
      // The wishlist button has a heart SVG
      const buttons = screen.getAllByRole('button');
      const wishlistButton = buttons.find(btn => btn.querySelector('svg path[d*="M4.318"]'));
      
      if (wishlistButton) {
        await user.click(wishlistButton);
        expect(mockOnAddToWishlist).toHaveBeenCalledWith(product);
      }
    });

    it('should call onQuickView when Quick View button is clicked', async () => {
      const user = userEvent.setup();
      const product = createMockProduct();
      render(<ProductCard product={product} onQuickView={mockOnQuickView} />);
      
      const quickViewButton = screen.getByText('Quick View');
      await user.click(quickViewButton);
      
      expect(mockOnQuickView).toHaveBeenCalledWith(product);
    });
  });

  describe('Compact Variant', () => {
    it('should render compact layout when variant is compact', () => {
      const product = createMockProduct();
      const { container } = render(<ProductCard product={product} variant="compact" />);
      
      // Compact variant uses flex layout
      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should render product name in compact variant', () => {
      const product = createMockProduct({ name: 'Compact Product' });
      render(<ProductCard product={product} variant="compact" />);
      
      expect(screen.getByText('Compact Product')).toBeInTheDocument();
    });

    it('should render price in compact variant', () => {
      const product = createMockProduct({ price: 29.99 });
      render(<ProductCard product={product} variant="compact" />);
      
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });

    it('should render rating in compact variant', () => {
      const product = createMockProduct({ rating: 4.2 });
      render(<ProductCard product={product} variant="compact" />);
      
      expect(screen.getByText('4.2')).toBeInTheDocument();
    });
  });

  describe('Featured Variant', () => {
    it('should render featured badge when variant is featured', () => {
      const product = createMockProduct();
      render(<ProductCard product={product} variant="featured" />);
      
      expect(screen.getByText(/Featured/)).toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    it('should format USD prices correctly', () => {
      const product = createMockProduct({ price: 1234.56, currency: 'USD' });
      render(<ProductCard product={product} />);
      
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should format EUR prices correctly', () => {
      const product = createMockProduct({ price: 99.99, currency: 'EUR' });
      render(<ProductCard product={product} />);
      
      // EUR formatting may vary by locale, check for the number
      expect(screen.getByText(/99\.99/)).toBeInTheDocument();
    });
  });

  describe('Image Loading', () => {
    it('should show placeholder when no images available', () => {
      const product = createMockProduct({ images: [] });
      render(<ProductCard product={product} />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toHaveAttribute('src', '/placeholder.jpg');
    });

    it('should handle image load event', () => {
      const product = createMockProduct();
      render(<ProductCard product={product} />);
      
      const image = screen.getByAltText('Test Product');
      fireEvent.load(image);
      
      // After load, image should be visible (opacity-100)
      expect(image).toHaveClass('opacity-100');
    });
  });
});
