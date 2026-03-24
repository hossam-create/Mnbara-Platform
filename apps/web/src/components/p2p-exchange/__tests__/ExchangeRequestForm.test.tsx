import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { ExchangeRequestForm } from '../ExchangeRequestForm';

describe('ExchangeRequestForm', () => {
  let mockOnSuccess: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSuccess = vi.fn();
    mockOnCancel = vi.fn();
  });

  describe('Rendering', () => {
    it('should render form', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByTestId('exchange-request-form')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByTestId('from-currency-select')).toBeInTheDocument();
      expect(screen.getByTestId('to-currency-select')).toBeInTheDocument();
      expect(screen.getByTestId('from-amount-input')).toBeInTheDocument();
      expect(screen.getByTestId('to-amount-input')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should render cancel button when onCancel provided', () => {
      render(<ExchangeRequestForm onCancel={mockOnCancel} />);
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('should render exchange rate field', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByTestId('desired-rate-input')).toBeInTheDocument();
    });

    it('should render external escrow checkbox', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByTestId('use-external-escrow-checkbox')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should update from currency on selection', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const fromCurrency = screen.getByTestId('from-currency-select') as HTMLSelectElement;
      await user.selectOptions(fromCurrency, 'USD');

      expect(fromCurrency.value).toBe('USD');
    });

    it('should update to currency on selection', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const toCurrency = screen.getByTestId('to-currency-select') as HTMLSelectElement;
      await user.selectOptions(toCurrency, 'SAR');

      expect(toCurrency.value).toBe('SAR');
    });

    it('should update from amount on input', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const fromAmount = screen.getByTestId('from-amount-input') as HTMLInputElement;
      await user.clear(fromAmount);
      await user.type(fromAmount, '100');

      expect(fromAmount.value).toBe('100');
    });

    it('should update to amount on input', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const toAmount = screen.getByTestId('to-amount-input') as HTMLInputElement;
      await user.clear(toAmount);
      await user.type(toAmount, '375');

      expect(toAmount.value).toBe('375');
    });

    it('should handle cancel button click', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm onCancel={mockOnCancel} />);

      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should toggle external escrow checkbox', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const checkbox = screen.getByTestId('use-external-escrow-checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm onSuccess={mockOnSuccess} />);

      const fromCurrency = screen.getByTestId('from-currency-select');
      const toCurrency = screen.getByTestId('to-currency-select');
      const fromAmount = screen.getByTestId('from-amount-input');
      const toAmount = screen.getByTestId('to-amount-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.selectOptions(fromCurrency, 'USD');
      await user.selectOptions(toCurrency, 'SAR');
      await user.clear(fromAmount);
      await user.type(fromAmount, '100');
      await user.clear(toAmount);
      await user.type(toAmount, '375');

      await user.click(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 3000 });
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const fromCurrency = screen.getByTestId('from-currency-select');
      const toCurrency = screen.getByTestId('to-currency-select');
      const fromAmount = screen.getByTestId('from-amount-input');
      const toAmount = screen.getByTestId('to-amount-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.selectOptions(fromCurrency, 'USD');
      await user.selectOptions(toCurrency, 'SAR');
      await user.clear(fromAmount);
      await user.type(fromAmount, '100');
      await user.clear(toAmount);
      await user.type(toAmount, '375');

      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should show error for missing from currency', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const toAmount = screen.getByTestId('to-amount-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.clear(toAmount);
      await user.type(toAmount, '100');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('from-currency-error')).toBeInTheDocument();
      });
    });

    it('should show error for missing to currency', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const fromAmount = screen.getByTestId('from-amount-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.clear(fromAmount);
      await user.type(fromAmount, '100');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('to-currency-error')).toBeInTheDocument();
      });
    });

    it('should show error for missing from amount', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const fromCurrency = screen.getByTestId('from-currency-select');
      const submitButton = screen.getByTestId('submit-button');

      await user.selectOptions(fromCurrency, 'USD');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('from-amount-error')).toBeInTheDocument();
      });
    });

    it('should show error for missing to amount', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const toCurrency = screen.getByTestId('to-currency-select');
      const submitButton = screen.getByTestId('submit-button');

      await user.selectOptions(toCurrency, 'SAR');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('to-amount-error')).toBeInTheDocument();
      });
    });

    it('should show error when currencies are the same', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const fromCurrency = screen.getByTestId('from-currency-select');
      const toCurrency = screen.getByTestId('to-currency-select');
      const fromAmount = screen.getByTestId('from-amount-input');
      const toAmount = screen.getByTestId('to-amount-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.selectOptions(fromCurrency, 'USD');
      await user.selectOptions(toCurrency, 'USD');
      await user.clear(fromAmount);
      await user.type(fromAmount, '100');
      await user.clear(toAmount);
      await user.type(toAmount, '100');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('to-currency-error')).toBeInTheDocument();
      });
    });
  });
});
