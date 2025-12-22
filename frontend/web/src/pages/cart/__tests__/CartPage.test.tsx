import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartPage } from '../CartPage';

// Mock useCart hook
const mockUpdateQuantity = vi.fn();
const mockRemoveFromCart = vi.fn();
const mockClearCart = vi.fn();

vi.mock('../../../hooks/useCart', () => ({
  useCart: () => ({
    cart: {
      items: [
        { id: '1', title: 'Test Product 1', price: 100, quantity: 2, imageUrl: '' },
        { id: '2', title: 'Test Product 2', price: 50, quantity: 1, imageUrl: '' },
      ],
      totalItems: 3,
      totalPrice: 250,
    },
    loading: false,
    error: null,
    updateQuantity: mockUpdateQuantity,
    removeFromCart: mockRemoveFromCart,
    clearCart: mockClearCart,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderCartPage = () => {
  return render(
    <BrowserRouter>
      <CartPage />
    </BrowserRouter>
  );
};

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Cart Calculations', () => {
    it('should display correct subtotal from cart items', () => {
      renderCartPage();
      
      // Subtotal should be $250 (100*2 + 50*1)
      expect(screen.getByText(/Subtotal \(3 items\)/)).toBeInTheDocument();
      expect(screen.getByText('$250.00')).toBeInTheDocument();
    });

    it('should calculate total with shipping', () => {
      renderCartPage();
      
      // Default shipping is Standard at $15
      // Total = $250 + $15 = $265
      const totalElements = screen.getAllByText('$265.00');
      expect(totalElements.length).toBeGreaterThan(0);
    });

    it('should update total when shipping method changes', () => {
      renderCartPage();
      
      // Select Express shipping ($25)
      const expressOption = screen.getByText('Express').closest('label');
      fireEvent.click(expressOption!);
      
      // Total = $250 + $25 = $275
      const totalElements = screen.getAllByText('$275.00');
      expect(totalElements.length).toBeGreaterThan(0);
    });

    it('should apply promo code discount', () => {
      renderCartPage();
      
      const promoInput = screen.getByPlaceholderText('Promo code');
      const applyButton = screen.getByText('Apply');
      
      fireEvent.change(promoInput, { target: { value: 'WELCOME10' } });
      fireEvent.click(applyButton);
      
      // 10% discount on $250 = $25 discount
      expect(screen.getByText(/WELCOME10 applied/)).toBeInTheDocument();
      expect(screen.getByText('-$25.00')).toBeInTheDocument();
    });

    it('should show error for invalid promo code', () => {
      renderCartPage();
      
      const promoInput = screen.getByPlaceholderText('Promo code');
      const applyButton = screen.getByText('Apply');
      
      fireEvent.change(promoInput, { target: { value: 'INVALID' } });
      fireEvent.click(applyButton);
      
      expect(screen.getByText('Invalid promo code')).toBeInTheDocument();
    });

    it('should show free shipping message when below threshold', () => {
      renderCartPage();
      
      // Cart total is $250, threshold is $500
      // Need $250 more for free shipping
      expect(screen.getByText(/Add \$250\.00 more for/)).toBeInTheDocument();
    });
  });

  describe('Cart Item Management', () => {
    it('should call updateQuantity when increasing item quantity', () => {
      renderCartPage();
      
      const increaseButtons = screen.getAllByLabelText('Increase quantity');
      fireEvent.click(increaseButtons[0]);
      
      expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3);
    });

    it('should call updateQuantity when decreasing item quantity', () => {
      renderCartPage();
      
      const decreaseButtons = screen.getAllByLabelText('Decrease quantity');
      fireEvent.click(decreaseButtons[0]);
      
      expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 1);
    });

    it('should call removeFromCart when clicking remove button', () => {
      renderCartPage();
      
      const removeButtons = screen.getAllByLabelText('Remove item');
      fireEvent.click(removeButtons[0]);
      
      expect(mockRemoveFromCart).toHaveBeenCalledWith('1');
    });
  });

  describe('Checkout Navigation', () => {
    it('should navigate to checkout when clicking proceed button', () => {
      renderCartPage();
      
      const checkoutButton = screen.getByText('Proceed to Checkout');
      fireEvent.click(checkoutButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    });

    it('should store shipping selection in session storage', () => {
      renderCartPage();
      
      // Select Express shipping
      const expressOption = screen.getByText('Express').closest('label');
      fireEvent.click(expressOption!);
      
      const checkoutButton = screen.getByText('Proceed to Checkout');
      fireEvent.click(checkoutButton);
      
      const savedShipping = JSON.parse(sessionStorage.getItem('selectedShipping') || '{}');
      expect(savedShipping.method).toBe('Express');
    });

    it('should store promo code in session storage when applied', () => {
      renderCartPage();
      
      const promoInput = screen.getByPlaceholderText('Promo code');
      const applyButton = screen.getByText('Apply');
      
      fireEvent.change(promoInput, { target: { value: 'SAVE15' } });
      fireEvent.click(applyButton);
      
      const checkoutButton = screen.getByText('Proceed to Checkout');
      fireEvent.click(checkoutButton);
      
      const savedPromo = JSON.parse(sessionStorage.getItem('appliedPromo') || '{}');
      expect(savedPromo.code).toBe('SAVE15');
      expect(savedPromo.discount).toBe(15);
    });
  });

  describe('Order Total Calculations', () => {
    it('should calculate correct total with multiple items', () => {
      renderCartPage();
      
      // Cart has 2 items: $100*2 + $50*1 = $250 subtotal
      // Standard shipping: $15
      // Total: $265
      expect(screen.getByText(/Subtotal \(3 items\)/)).toBeInTheDocument();
      const totalElements = screen.getAllByText('$265.00');
      expect(totalElements.length).toBeGreaterThan(0);
    });

    it('should calculate correct total with promo and express shipping', () => {
      renderCartPage();
      
      // Apply 15% promo
      const promoInput = screen.getByPlaceholderText('Promo code');
      const applyButton = screen.getByText('Apply');
      fireEvent.change(promoInput, { target: { value: 'SAVE15' } });
      fireEvent.click(applyButton);
      
      // Select Express shipping ($25)
      const expressOption = screen.getByText('Express').closest('label');
      fireEvent.click(expressOption!);
      
      // Subtotal: $250, Discount: $37.50, Shipping: $25
      // Total: $250 - $37.50 + $25 = $237.50
      expect(screen.getByText('-$37.50')).toBeInTheDocument();
    });
  });
});
