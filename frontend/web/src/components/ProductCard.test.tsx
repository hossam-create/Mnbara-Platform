import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    title: 'Test Product',
    price: 29.99,
    imageUrl: 'https://example.com/test.jpg',
  };

  const mockOnAddToCart = vi.fn();

  it('should render product information correctly', () => {
    render(<ProductCard {...mockProduct} onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toHaveAttribute(
      'src',
      'https://example.com/test.jpg'
    );
  });

  it('should render "Add to Cart" button', () => {
    render(<ProductCard {...mockProduct} onAddToCart={mockOnAddToCart} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onAddToCart when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProductCard {...mockProduct} onAddToCart={mockOnAddToCart} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
    expect(mockOnAddToCart).toHaveBeenCalledWith({
      id: '1',
      title: 'Test Product',
      price: 29.99,
      imageUrl: 'https://example.com/test.jpg',
    });
  });

  it('should format price with 2 decimal places', () => {
    render(
      <ProductCard
        {...mockProduct}
        price={10}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ProductCard {...mockProduct} onAddToCart={mockOnAddToCart} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Add Test Product to cart');
  });

  it('should handle long titles with line-clamp', () => {
    const longTitle = 'This is a very long product title that should be clamped to two lines maximum';
    render(
      <ProductCard
        {...mockProduct}
        title={longTitle}
        onAddToCart={mockOnAddToCart}
      />
    );

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass('line-clamp-2');
  });

  it('should have lazy loading for images', () => {
    render(<ProductCard {...mockProduct} onAddToCart={mockOnAddToCart} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('should apply hover effects via CSS classes', () => {
    const { container } = render(
      <ProductCard {...mockProduct} onAddToCart={mockOnAddToCart} />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-lg');
    expect(card).toHaveClass('transition-shadow');
  });
});
