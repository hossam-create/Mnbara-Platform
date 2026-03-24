import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import ExchangeRequestForm from '../../components/p2p-exchange/ExchangeRequestForm';
import PaymentInitiation from '../../components/p2p-exchange/PaymentInitiation';
import ProofUpload from '../../components/p2p-exchange/ProofUpload';
import { mockMatches } from '../fixtures/mock-data';

/**
 * E2E Test Suite: Error Scenarios
 * 
 * Tests error handling and recovery throughout the user journey.
 * Covers network failures, validation errors, timeouts, and partial failures.
 */
describe('E2E: Error Scenarios - Network Failures & Recovery', () => {
  const mockOnCreate = vi.fn();
  const mockOnPayment = vi.fn();
  const mockOnProof = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Error Recovery', () => {
    it('should recover from form submission network error', async () => {
      const user = userEvent.setup();

      // First attempt fails
      mockOnCreate.mockRejectedValueOnce(new Error('Network error'));
      // Second attempt succeeds
      mockOnCreate.mockResolvedValueOnce({ id: 'EXC-123' });

      const { rerender } = render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill form
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      // Submit (fails)
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify error displayed
      await waitFor(() => {
        expect(screen.getByText(/error|failed|network/i)).toBeInTheDocument();
      });

      // Verify retry button appears
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Retry
      await user.click(retryButton);

      // Verify success
      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledTimes(2);
        expect(screen.getByText(/success|created/i)).toBeInTheDocument();
      });
    });

    it('should handle payment network error with retry', async () => {
      const user = userEvent.setup();

      mockOnPayment.mockRejectedValueOnce(new Error('Payment gateway timeout'));
      mockOnPayment.mockResolvedValueOnce({ transactionId: 'TXN-123' });

      const { rerender } = render(
        <PaymentInitiation
          match={mockMatches[0]}
          onPaymentInitiated={mockOnPayment}
        />
      );

      // Select payment method
      const paymentMethod = screen.getByLabelText(/bank transfer/i);
      await user.click(paymentMethod);

      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
      await user.click(termsCheckbox);

      // Submit (fails)
      const payButton = screen.getByRole('button', { name: /pay|submit/i });
      await user.click(payButton);

      // Verify error
      await waitFor(() => {
        expect(screen.getByText(/error|timeout|failed/i)).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify success
      await waitFor(() => {
        expect(mockOnPayment).toHaveBeenCalledTimes(2);
        expect(screen.getByText(/success|completed/i)).toBeInTheDocument();
      });
    });

    it('should handle proof upload network error', async () => {
      const user = userEvent.setup();

      mockOnProof.mockRejectedValueOnce(new Error('Upload failed'));
      mockOnProof.mockResolvedValueOnce({ proofId: 'PROOF-123' });

      render(
        <ProofUpload
          match={mockMatches[0]}
          onProofUploaded={mockOnProof}
        />
      );

      // Upload file (fails)
      const fileInput = screen.getByLabelText(/upload.*proof|select.*file/i);
      const file = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
      await user.click(uploadButton);

      // Verify error
      await waitFor(() => {
        expect(screen.getByText(/error|failed|upload/i)).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify success
      await waitFor(() => {
        expect(mockOnProof).toHaveBeenCalledTimes(2);
        expect(screen.getByText(/success|uploaded/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation Error Handling', () => {
    it('should display validation errors for invalid amount', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Enter invalid amount
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '-100');

      // Submit
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify validation error
      expect(screen.getByText(/must be positive|invalid amount/i)).toBeInTheDocument();
      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it('should display validation errors for missing required fields', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Submit without filling form
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify validation errors
      expect(screen.getByText(/required/i)).toBeInTheDocument();
      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it('should validate file type for proof upload', async () => {
      const user = userEvent.setup();

      render(
        <ProofUpload
          match={mockMatches[0]}
          onProofUploaded={mockOnProof}
        />
      );

      // Try to upload invalid file type
      const fileInput = screen.getByLabelText(/upload.*proof|select.*file/i);
      const invalidFile = new File(['content'], 'proof.txt', { type: 'text/plain' });
      await user.upload(fileInput, invalidFile);

      // Verify error
      expect(screen.getByText(/invalid.*file|only.*jpg|only.*png/i)).toBeInTheDocument();
    });

    it('should validate file size for proof upload', async () => {
      const user = userEvent.setup();

      render(
        <ProofUpload
          match={mockMatches[0]}
          onProofUploaded={mockOnProof}
        />
      );

      // Create large file
      const largeContent = new Array(11 * 1024 * 1024).fill('x').join(''); // 11MB
      const largeFile = new File([largeContent], 'proof.jpg', { type: 'image/jpeg' });

      // Try to upload
      const fileInput = screen.getByLabelText(/upload.*proof|select.*file/i);
      await user.upload(fileInput, largeFile);

      // Verify error
      expect(screen.getByText(/too large|max.*size|10.*mb/i)).toBeInTheDocument();
    });

    it('should show field-level validation errors', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Enter invalid email (if applicable)
      const emailField = screen.queryByLabelText(/email/i);
      if (emailField) {
        await user.type(emailField, 'invalid-email');
        await user.click(screen.getByRole('button', { name: /create/i }));
        expect(screen.getByText(/invalid.*email/i)).toBeInTheDocument();
      }
    });
  });

  describe('Timeout Error Handling', () => {
    it('should handle request timeout gracefully', async () => {
      const user = userEvent.setup();

      // Simulate timeout
      mockOnCreate.mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill and submit
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify timeout error
      await waitFor(() => {
        expect(screen.getByText(/timeout|took too long/i)).toBeInTheDocument();
      });

      // Verify retry option
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should show loading state during request', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ id: 'EXC-123' }), 500)
        )
      );

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill and submit
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify loading state
      expect(screen.getByText(/loading|processing/i)).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/success|created/i)).toBeInTheDocument();
      });
    });
  });

  describe('Partial Failure Recovery', () => {
    it('should handle partial payment failure', async () => {
      const user = userEvent.setup();

      mockOnPayment.mockRejectedValueOnce(
        new Error('Payment partially processed')
      );

      render(
        <PaymentInitiation
          match={mockMatches[0]}
          onPaymentInitiated={mockOnPayment}
        />
      );

      // Select payment method
      const paymentMethod = screen.getByLabelText(/bank transfer/i);
      await user.click(paymentMethod);

      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
      await user.click(termsCheckbox);

      // Submit
      const payButton = screen.getByRole('button', { name: /pay|submit/i });
      await user.click(payButton);

      // Verify error with recovery info
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Verify user can retry or cancel
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should handle upload interruption', async () => {
      const user = userEvent.setup();

      render(
        <ProofUpload
          match={mockMatches[0]}
          onProofUploaded={mockOnProof}
        />
      );

      // Start upload
      const fileInput = screen.getByLabelText(/upload.*proof|select.*file/i);
      const file = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      // Simulate interruption
      mockOnProof.mockRejectedValueOnce(new Error('Upload interrupted'));

      const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
      await user.click(uploadButton);

      // Verify error
      await waitFor(() => {
        expect(screen.getByText(/error|interrupted|failed/i)).toBeInTheDocument();
      });

      // Verify can retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('User-Initiated Cancellation', () => {
    it('should allow cancellation during form submission', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ id: 'EXC-123' }), 1000)
        )
      );

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill and submit
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify loading state
      expect(screen.getByText(/loading|processing/i)).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify cancellation
      await waitFor(() => {
        expect(screen.queryByText(/loading|processing/i)).not.toBeInTheDocument();
      });
    });

    it('should allow cancellation during payment', async () => {
      const user = userEvent.setup();

      mockOnPayment.mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ transactionId: 'TXN-123' }), 1000)
        )
      );

      render(
        <PaymentInitiation
          match={mockMatches[0]}
          onPaymentInitiated={mockOnPayment}
        />
      );

      // Select payment method
      const paymentMethod = screen.getByLabelText(/bank transfer/i);
      await user.click(paymentMethod);

      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
      await user.click(termsCheckbox);

      // Submit
      const payButton = screen.getByRole('button', { name: /pay|submit/i });
      await user.click(payButton);

      // Verify loading
      expect(screen.getByText(/loading|processing/i)).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify cancellation
      await waitFor(() => {
        expect(screen.queryByText(/loading|processing/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Message Clarity', () => {
    it('should display clear error messages', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockRejectedValueOnce(
        new Error('Invalid currency pair')
      );

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill form
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      // Submit
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify clear error message
      await waitFor(() => {
        expect(screen.getByText(/invalid currency|currency pair/i)).toBeInTheDocument();
      });
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Submit without filling
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify error has role alert
      const errorMessage = screen.getByText(/required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    it('should provide actionable error recovery steps', async () => {
      const user = userEvent.setup();

      mockOnCreate.mockRejectedValueOnce(
        new Error('Amount exceeds limit')
      );

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill form
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000000');

      // Submit
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify error with recovery steps
      await waitFor(() => {
        expect(screen.getByText(/exceeds.*limit|maximum/i)).toBeInTheDocument();
      });

      // Verify can modify and retry
      const amountField = screen.getByLabelText(/amount/i);
      expect(amountField).toBeInTheDocument();
    });
  });

  describe('Error State Accessibility', () => {
    it('should maintain accessibility during error states', async () => {
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

      // Verify error is accessible
      await waitFor(() => {
        const errorMessage = screen.getByText(/error|failed/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });

      // Verify can navigate with keyboard
      await user.tab();
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveFocus();
    });
  });
});
