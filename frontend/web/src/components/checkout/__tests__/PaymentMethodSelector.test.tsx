import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentMethodSelector, type PaymentMethodType } from '../PaymentMethodSelector';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Input</div>,
  useStripe: () => null,
  useElements: () => null,
}));

describe('PaymentMethodSelector', () => {
  const defaultProps = {
    selectedMethod: 'card' as PaymentMethodType,
    onMethodChange: vi.fn(),
    onPaymentReady: vi.fn(),
    onPaymentSubmit: vi.fn(),
    amount: 100,
    currency: 'USD',
    walletBalance: 500,
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Method Selection', () => {
    it('should render all payment method options', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
      expect(screen.getByText('PayPal')).toBeInTheDocument();
      expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
    });

    it('should call onMethodChange when selecting a different payment method', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const paypalButton = screen.getByText('PayPal').closest('button');
      fireEvent.click(paypalButton!);

      expect(defaultProps.onMethodChange).toHaveBeenCalledWith('paypal');
    });

    it('should highlight the selected payment method', () => {
      render(<PaymentMethodSelector {...defaultProps} selectedMethod="paypal" />);

      const paypalButton = screen.getByText('PayPal').closest('button');
      expect(paypalButton).toHaveClass('border-pink-500');
    });

    it('should display wallet balance when wallet option is shown', () => {
      render(<PaymentMethodSelector {...defaultProps} walletBalance={250.50} />);

      expect(screen.getByText(/Balance: \$250\.50/)).toBeInTheDocument();
    });
  });

  describe('Card Payment', () => {
    it('should render Stripe card element when card is selected', () => {
      render(<PaymentMethodSelector {...defaultProps} selectedMethod="card" />);

      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
    });
  });

  describe('Wallet Payment', () => {
    it('should show insufficient funds message when balance is too low', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="wallet"
          amount={1000}
          walletBalance={500}
        />
      );

      expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
      expect(screen.getByText(/You need \$500\.00 more/)).toBeInTheDocument();
    });

    it('should show remaining balance when funds are sufficient', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="wallet"
          amount={100}
          walletBalance={500}
        />
      );

      expect(screen.getByText('Remaining Balance')).toBeInTheDocument();
      expect(screen.getByText('$400.00')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all payment method buttons when disabled prop is true', () => {
      render(<PaymentMethodSelector {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        if (button.textContent?.includes('Card') || 
            button.textContent?.includes('PayPal') || 
            button.textContent?.includes('Wallet')) {
          expect(button).toHaveClass('opacity-50');
        }
      });
    });
  });

  describe('Payment Method Switching', () => {
    it('should switch from card to wallet payment method', () => {
      const onMethodChange = vi.fn();
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="card"
          onMethodChange={onMethodChange}
        />
      );

      const walletButton = screen.getByText('Wallet Balance').closest('button');
      fireEvent.click(walletButton!);

      expect(onMethodChange).toHaveBeenCalledWith('wallet');
    });

    it('should switch from wallet to paypal payment method', () => {
      const onMethodChange = vi.fn();
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="wallet"
          onMethodChange={onMethodChange}
        />
      );

      const paypalButton = screen.getByText('PayPal').closest('button');
      fireEvent.click(paypalButton!);

      expect(onMethodChange).toHaveBeenCalledWith('paypal');
    });
  });

  describe('Wallet Balance Validation', () => {
    it('should show exact remaining balance after payment', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="wallet"
          amount={150.75}
          walletBalance={500}
        />
      );

      expect(screen.getByText('$349.25')).toBeInTheDocument();
    });

    it('should show exact amount needed when insufficient', () => {
      render(
        <PaymentMethodSelector
          {...defaultProps}
          selectedMethod="wallet"
          amount={750}
          walletBalance={500}
        />
      );

      expect(screen.getByText(/You need \$250\.00 more/)).toBeInTheDocument();
    });
  });
});
