import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import PaymentInitiation from '../../components/p2p-exchange/PaymentInitiation';
import ProofUpload from '../../components/p2p-exchange/ProofUpload';
import ReceiptConfirmation from '../../components/p2p-exchange/ReceiptConfirmation';
import { mockMatches } from '../fixtures/mock-data';

describe('Payment & Settlement Flow Integration', () => {
  const mockMatch = mockMatches[0];
  const mockOnPaymentInitiated = vi.fn();
  const mockOnProofUploaded = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Payment Workflow', () => {
    it('should complete payment flow', async () => {
      const user = userEvent.setup();

      // Step 1: Initiate payment
      const { rerender } = render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      // Step 2: Select payment method
      const methodSelect = screen.getByLabelText(/method/i);
      await user.selectOption(methodSelect, 'bank_transfer');

      // Step 3: Accept terms
      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      // Step 4: Submit payment
      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentInitiated).toHaveBeenCalled();
      });

      // Step 5: Upload proof
      rerender(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      // Step 6: Upload file
      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      // Step 7: Submit proof
      const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockOnProofUploaded).toHaveBeenCalled();
      });

      // Step 8: Confirm receipt
      rerender(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Step 9: Confirm receipt
      const confirmCheckbox = screen.getByRole('checkbox');
      await user.click(confirmCheckbox);

      const confirmButton = screen.getByRole('button', { name: /confirm|received/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it('should validate payment method selection', async () => {
      const user = userEvent.setup();

      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit without selecting method
      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });
      await user.click(submitButton);

      expect(screen.getByText(/select.*method|method.*required/i)).toBeInTheDocument();
    });

    it('should validate terms acceptance', async () => {
      const user = userEvent.setup();

      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit without accepting terms
      const methodSelect = screen.getByLabelText(/method/i);
      await user.selectOption(methodSelect, 'bank_transfer');

      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });
      await user.click(submitButton);

      expect(screen.getByText(/accept.*terms|terms.*required/i)).toBeInTheDocument();
    });
  });

  describe('Proof Upload Validation', () => {
    it('should validate file type', async () => {
      const user = userEvent.setup();

      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.txt', { type: 'text/plain' });

      await user.upload(fileInput, file);

      expect(screen.getByText(/invalid|type|format/i)).toBeInTheDocument();
    });

    it('should validate file size', async () => {
      const user = userEvent.setup();

      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, largeFile);

      expect(screen.getByText(/too large|size.*exceeded/i)).toBeInTheDocument();
    });

    it('should enable upload button only with valid file', async () => {
      const user = userEvent.setup();

      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
      expect(uploadButton).toBeDisabled();

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      expect(uploadButton).not.toBeDisabled();
    });
  });

  describe('Receipt Confirmation', () => {
    it('should require confirmation checkbox', async () => {
      const user = userEvent.setup();

      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm|received/i });
      expect(confirmButton).toBeDisabled();

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(confirmButton).not.toBeDisabled();
    });

    it('should display transaction details', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(new RegExp(mockMatch.amount.toString()))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockMatch.fromCurrency))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockMatch.toCurrency))).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from payment error', async () => {
      const user = userEvent.setup();

      mockOnPaymentInitiated.mockRejectedValueOnce(new Error('Payment failed'));
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
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Retry
      await user.click(submitButton);

      expect(mockOnPaymentInitiated).toHaveBeenCalledTimes(2);
    });

    it('should recover from proof upload error', async () => {
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
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Retry
      await user.click(uploadButton);

      expect(mockOnProofUploaded).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable through payment flow', async () => {
      const user = userEvent.setup();

      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      await user.tab();
      expect(screen.getByLabelText(/method/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('checkbox')).toHaveFocus();
    });
  });

  describe('RTL Support', () => {
    it('should render payment form with RTL', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const form = screen.getByRole('form', { hidden: true });
      expect(form).toHaveAttribute('dir', 'rtl');
    });
  });
});
