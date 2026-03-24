import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import ExchangeRequestForm from '../../components/p2p-exchange/ExchangeRequestForm';
import PaymentInitiation from '../../components/p2p-exchange/PaymentInitiation';
import ProofUpload from '../../components/p2p-exchange/ProofUpload';
import { mockMatches } from '../fixtures/mock-data';

describe('Error Recovery Flow Integration', () => {
  const mockMatch = mockMatches[0];
  const mockOnCreate = vi.fn();
  const mockOnPaymentInitiated = vi.fn();
  const mockOnProofUploaded = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Error Recovery', () => {
    it('should recover from form submission error', async () => {
      const user = userEvent.setup();

      // First attempt fails
      mockOnCreate.mockRejectedValueOnce(new Error('Network error'));
      // Second attempt succeeds
      mockOnCreate.mockResolvedValueOnce({ id: 'new-request' });

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });

      // First attempt
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed|network/i)).toBeInTheDocument();
      });

      // Retry
      await user.click(submitButton);

      expect(mockOnCreate).toHaveBeenCalledTimes(2);
    });

    it('should recover from payment error', async () => {
      const user = userEvent.setup();

      mockOnPaymentInitiated.mockRejectedValueOnce(new Error('Payment gateway error'));
      mockOnPaymentInitiated.mockResolvedValueOnce({ id: 'payment-1' });

      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const methodSelect = screen.getByLabelText(/method/i);
      await user.selectOption(methodSelect, 'bank_transfer');

      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });

      // First attempt
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Retry
      await user.click(submitButton);

      expect(mockOnPaymentInitiated).toHaveBeenCalledTimes(2);
    });

    it('should recover from upload error', async () => {
      const user = userEvent.setup();

      mockOnProofUploaded.mockRejectedValueOnce(new Error('Upload failed'));
      mockOnProofUploaded.mockResolvedValueOnce({ id: 'proof-1' });

      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      const uploadButton = screen.getByRole('button', { name: /upload|submit/i });

      // First attempt
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Retry
      await user.click(uploadButton);

      expect(mockOnProofUploaded).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validation Error Recovery', () => {
    it('should recover from validation errors', async () => {
      const user = userEvent.setup();

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const submitButton = screen.getByRole('button', { name: /create/i });

      // First attempt - validation error
      await user.click(submitButton);

      expect(screen.getByText(/required|invalid/i)).toBeInTheDocument();

      // Fix validation
      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      // Second attempt - should succeed
      mockOnCreate.mockResolvedValueOnce({ id: 'new-request' });

      await user.click(submitButton);

      expect(mockOnCreate).toHaveBeenCalled();
    });
  });

  describe('Timeout Recovery', () => {
    it('should handle request timeout', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockImplementationOnce(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      mockOnCreate.mockResolvedValueOnce({ id: 'new-request' });

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });

      // First attempt - timeout
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/timeout|error/i)).toBeInTheDocument();
      });

      // Retry
      await user.click(submitButton);

      expect(mockOnCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Partial Failure Recovery', () => {
    it('should handle partial payment failure', async () => {
      const user = userEvent.setup();

      mockOnPaymentInitiated.mockResolvedValueOnce({ id: 'payment-1', status: 'PENDING' });

      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const methodSelect = screen.getByLabelText(/method/i);
      await user.selectOption(methodSelect, 'bank_transfer');

      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentInitiated).toHaveBeenCalled();
      });
    });
  });

  describe('User-Initiated Cancellation', () => {
    it('should allow cancellation during error state', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockRejectedValueOnce(new Error('Network error'));

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('should display clear error messages', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockRejectedValueOnce(new Error('Invalid currency pair'));

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|invalid|failed/i)).toBeInTheDocument();
      });
    });

    it('should display retry option on error', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockRejectedValueOnce(new Error('Network error'));

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Retry button should be available
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Accessibility During Errors', () => {
    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockRejectedValueOnce(new Error('Network error'));

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/error|failed/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
