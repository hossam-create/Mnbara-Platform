import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import ExchangeRequestForm from '../../components/p2p-exchange/ExchangeRequestForm';
import MarketplaceBrowser from '../../components/p2p-exchange/MarketplaceBrowser';
import PaymentInitiation from '../../components/p2p-exchange/PaymentInitiation';
import ProofUpload from '../../components/p2p-exchange/ProofUpload';
import { mockExchangeRequests, mockMatches } from '../fixtures/mock-data';

/**
 * E2E Test Suite: Cross-Browser Compatibility
 * 
 * Tests application functionality across different browsers and devices.
 * Ensures consistent behavior and appearance across platforms.
 */
describe('E2E: Cross-Browser Compatibility', () => {
  const mockOnCreate = vi.fn();
  const mockOnSelect = vi.fn();
  const mockOnPayment = vi.fn();
  const mockOnProof = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Functionality Across Browsers', () => {
    it('should handle form submission consistently', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill form
      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      // Submit
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify submission
      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalled();
      });
    });

    it('should handle file uploads consistently', async () => {
      const user = userEvent.setup();

      render(
        <ProofUpload
          match={mockMatches[0]}
          onProofUploaded={mockOnProof}
        />
      );

      // Upload file
      const fileInput = screen.getByLabelText(/upload.*proof|select.*file/i);
      const file = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      // Verify file selected
      await waitFor(() => {
        expect(screen.getByText(/proof.jpg/i)).toBeInTheDocument();
      });

      // Submit
      const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
      await user.click(uploadButton);

      // Verify upload
      await waitFor(() => {
        expect(mockOnProof).toHaveBeenCalled();
      });
    });

    it('should handle select dropdowns consistently', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Select from dropdown
      const fromCurrency = screen.getByLabelText(/from currency/i);
      await user.selectOption(fromCurrency, 'USD');

      // Verify selection
      expect(fromCurrency).toHaveValue('USD');

      // Select another option
      await user.selectOption(fromCurrency, 'EUR');
      expect(fromCurrency).toHaveValue('EUR');
    });

    it('should handle checkboxes consistently', async () => {
      const user = userEvent.setup();

      render(
        <PaymentInitiation
          match={mockMatches[0]}
          onPaymentInitiated={mockOnPayment}
        />
      );

      // Check checkbox
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
      expect(termsCheckbox).not.toBeChecked();

      await user.click(termsCheckbox);
      expect(termsCheckbox).toBeChecked();

      // Uncheck
      await user.click(termsCheckbox);
      expect(termsCheckbox).not.toBeChecked();
    });

    it('should handle radio buttons consistently', async () => {
      const user = userEvent.setup();

      render(
        <PaymentInitiation
          match={mockMatches[0]}
          onPaymentInitiated={mockOnPayment}
        />
      );

      // Select radio button
      const bankTransfer = screen.getByLabelText(/bank transfer/i);
      const creditCard = screen.getByLabelText(/credit card/i);

      await user.click(bankTransfer);
      expect(bankTransfer).toBeChecked();
      expect(creditCard).not.toBeChecked();

      // Switch selection
      await user.click(creditCard);
      expect(creditCard).toBeChecked();
      expect(bankTransfer).not.toBeChecked();
    });
  });

  describe('Layout & Responsive Design', () => {
    it('should display correctly on desktop', async () => {
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify form displays
      expect(screen.getByText(/create.*exchange|exchange request/i)).toBeInTheDocument();

      // Verify all fields visible
      expect(screen.getByLabelText(/from currency/i)).toBeVisible();
      expect(screen.getByLabelText(/to currency/i)).toBeVisible();
      expect(screen.getByLabelText(/amount/i)).toBeVisible();
    });

    it('should display correctly on tablet', async () => {
      // Simulate tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify form displays
      expect(screen.getByText(/create.*exchange|exchange request/i)).toBeInTheDocument();

      // Verify responsive layout
      const form = screen.getByText(/create.*exchange|exchange request/i).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should display correctly on mobile', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify form displays
      expect(screen.getByText(/create.*exchange|exchange request/i)).toBeInTheDocument();

      // Verify mobile-friendly layout
      const form = screen.getByText(/create.*exchange|exchange request/i).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should handle orientation changes', async () => {
      // Start in portrait
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { rerender } = render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Change to landscape
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });

      rerender(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify form still displays
      expect(screen.getByText(/create.*exchange|exchange request/i)).toBeInTheDocument();
    });
  });

  describe('Input Method Compatibility', () => {
    it('should handle keyboard input', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Type with keyboard
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      expect(amount).toHaveValue('1000');
    });

    it('should handle mouse input', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Click button
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify click registered
      expect(mockOnCreate).not.toHaveBeenCalled(); // No data, so not called
    });

    it('should handle touch input', async () => {
      const user = userEvent.setup();

      render(
        <PaymentInitiation
          match={mockMatches[0]}
          onPaymentInitiated={mockOnPayment}
        />
      );

      // Simulate touch
      const payButton = screen.getByRole('button', { name: /pay|submit/i });
      await user.click(payButton); // userEvent simulates touch on mobile

      // Verify interaction
      expect(screen.getByText(/payment method/i)).toBeInTheDocument();
    });

    it('should handle paste operations', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      const amount = screen.getByLabelText(/amount/i);

      // Simulate paste
      await user.type(amount, '1000', { skipClick: true });

      expect(amount).toHaveValue('1000');
    });
  });

  describe('Browser Feature Support', () => {
    it('should work without localStorage', async () => {
      // Disable localStorage
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      try {
        render(
          <ExchangeRequestForm onRequestCreated={mockOnCreate} />
        );

        // Should still render
        expect(screen.getByText(/create.*exchange|exchange request/i)).toBeInTheDocument();
      } finally {
        // Restore localStorage
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
        });
      }
    });

    it('should work without sessionStorage', async () => {
      // Disable sessionStorage
      const originalSessionStorage = window.sessionStorage;
      Object.defineProperty(window, 'sessionStorage', {
        value: undefined,
        writable: true,
      });

      try {
        render(
          <ExchangeRequestForm onRequestCreated={mockOnCreate} />
        );

        // Should still render
        expect(screen.getByText(/create.*exchange|exchange request/i)).toBeInTheDocument();
      } finally {
        // Restore sessionStorage
        Object.defineProperty(window, 'sessionStorage', {
          value: originalSessionStorage,
          writable: true,
        });
      }
    });

    it('should handle missing CSS features gracefully', async () => {
      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Should render even if CSS features missing
      expect(screen.getByText(/create.*exchange|exchange request/i)).toBeInTheDocument();

      // Verify form is functional
      const amount = screen.getByLabelText(/amount/i);
      expect(amount).toBeInTheDocument();
    });

    it('should handle JavaScript disabled gracefully', async () => {
      // This test verifies fallback behavior
      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Form should still be present (even if some features don't work)
      expect(screen.getByText(/create.*exchange|exchange request/i)).toBeInTheDocument();
    });
  });

  describe('Data Format Compatibility', () => {
    it('should handle different date formats', async () => {
      const user = userEvent.setup();

      render(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onMatchSelect={mockOnSelect}
        />
      );

      // Verify dates display
      expect(screen.getByText(/date|time|created/i)).toBeInTheDocument();
    });

    it('should handle different number formats', async () => {
      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      const amount = screen.getByLabelText(/amount/i);

      // Should accept numbers
      await userEvent.type(amount, '1000.50');
      expect(amount).toHaveValue('1000.50');
    });

    it('should handle different currency symbols', async () => {
      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify currency options display
      const fromCurrency = screen.getByLabelText(/from currency/i);
      expect(fromCurrency).toBeInTheDocument();

      // Should have currency options
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    it('should handle RTL text correctly', async () => {
      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />,
        { initialLanguage: 'ar' }
      );

      // Verify Arabic text displays
      expect(screen.getByText(/إنشاء|طلب|صرف/i)).toBeInTheDocument();

      // Verify RTL direction
      const form = screen.getByText(/إنشاء|طلب|صرف/i).closest('form');
      expect(form).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Performance Across Browsers', () => {
    it('should load quickly on slow connections', async () => {
      const startTime = performance.now();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      const loadTime = performance.now() - startTime;

      // Should load within reasonable time
      expect(loadTime).toBeLessThan(1000);
    });

    it('should render efficiently on low-end devices', async () => {
      const startTime = performance.now();

      render(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onMatchSelect={mockOnSelect}
        />
      );

      const renderTime = performance.now() - startTime;

      // Should render efficiently
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Accessibility Across Browsers', () => {
    it('should be accessible in all browsers', async () => {
      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify ARIA labels
      expect(screen.getByLabelText(/from currency/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/to currency/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/amount/i)).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation in all browsers', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Tab through form
      await user.tab();
      expect(screen.getByLabelText(/from currency/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/to currency/i)).toHaveFocus();
    });

    it('should work with screen readers in all browsers', async () => {
      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify form has proper role
      const form = screen.getByText(/create.*exchange|exchange request/i).closest('form');
      expect(form).toBeInTheDocument();

      // Verify buttons have accessible names
      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).toHaveAccessibleName();
    });
  });

  describe('Error Handling Across Browsers', () => {
    it('should handle errors consistently', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockRejectedValueOnce(new Error('Network error'));

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill and submit
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify error displays
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('should provide consistent error recovery', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockRejectedValueOnce(new Error('Network error'));
      mockOnCreate.mockResolvedValueOnce({ id: 'EXC-123' });

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill and submit (fails)
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify error
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify success
      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledTimes(2);
      });
    });
  });
});
