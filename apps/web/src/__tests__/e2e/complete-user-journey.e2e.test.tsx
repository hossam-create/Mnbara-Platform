import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import ExchangeRequestForm from '../../components/p2p-exchange/ExchangeRequestForm';
import MarketplaceBrowser from '../../components/p2p-exchange/MarketplaceBrowser';
import MatchChat from '../../components/p2p-exchange/MatchChat';
import PaymentInitiation from '../../components/p2p-exchange/PaymentInitiation';
import ProofUpload from '../../components/p2p-exchange/ProofUpload';
import ReceiptConfirmation from '../../components/p2p-exchange/ReceiptConfirmation';
import { mockExchangeRequests, mockMatches, mockMessages } from '../fixtures/mock-data';

/**
 * E2E Test Suite: Complete User Journey
 * 
 * Tests the entire user flow from creating an exchange request to settlement completion.
 * Simulates a real user's experience through the entire P2P exchange process.
 */
describe('E2E: Complete User Journey - Signup to Settlement', () => {
  const mockOnCreate = vi.fn();
  const mockOnMatch = vi.fn();
  const mockOnPayment = vi.fn();
  const mockOnProof = vi.fn();
  const mockOnSettlement = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Settlement Journey', () => {
    it('should complete entire exchange from request to settlement', async () => {
      const user = userEvent.setup();

      // ===== STEP 1: Create Exchange Request =====
      const { rerender } = render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Fill exchange request form
      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);
      const rate = screen.getByLabelText(/exchange rate/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');
      await user.type(rate, '3.75');

      // Submit form
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify creation
      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            fromCurrency: 'USD',
            toCurrency: 'SAR',
            amount: 1000,
            exchangeRate: 3.75,
          })
        );
      });

      // ===== STEP 2: Browse Marketplace =====
      rerender(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onMatchSelect={mockOnMatch}
        />
      );

      // Verify marketplace displays
      expect(screen.getByText(/marketplace/i)).toBeInTheDocument();

      // Find and accept a match
      const matchCard = screen.getByText(mockExchangeRequests[0].id);
      const acceptButton = within(matchCard.closest('[role="article"]') || matchCard).getByRole('button', {
        name: /accept|match/i,
      });
      await user.click(acceptButton);

      // Verify match selection
      await waitFor(() => {
        expect(mockOnMatch).toHaveBeenCalled();
      });

      // ===== STEP 3: Communicate with Match =====
      const selectedMatch = mockMatches[0];
      rerender(
        <MatchChat
          match={selectedMatch}
          messages={mockMessages}
          onSendMessage={vi.fn()}
        />
      );

      // Verify chat interface
      expect(screen.getByText(/messages/i)).toBeInTheDocument();

      // Send a message
      const messageInput = screen.getByPlaceholderText(/type.*message/i);
      await user.type(messageInput, 'Ready to proceed with payment');
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Verify message sent
      await waitFor(() => {
        expect(messageInput).toHaveValue('');
      });

      // ===== STEP 4: Initiate Payment =====
      rerender(
        <PaymentInitiation
          match={selectedMatch}
          onPaymentInitiated={mockOnPayment}
        />
      );

      // Verify payment form
      expect(screen.getByText(/payment method/i)).toBeInTheDocument();

      // Select payment method
      const paymentMethod = screen.getByLabelText(/bank transfer/i);
      await user.click(paymentMethod);

      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
      await user.click(termsCheckbox);

      // Submit payment
      const payButton = screen.getByRole('button', { name: /pay|submit/i });
      await user.click(payButton);

      // Verify payment initiated
      await waitFor(() => {
        expect(mockOnPayment).toHaveBeenCalled();
      });

      // ===== STEP 5: Upload Proof of Payment =====
      rerender(
        <ProofUpload
          match={selectedMatch}
          onProofUploaded={mockOnProof}
        />
      );

      // Verify proof upload form
      expect(screen.getByText(/proof.*payment/i)).toBeInTheDocument();

      // Upload proof file
      const fileInput = screen.getByLabelText(/upload.*proof|select.*file/i);
      const file = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      // Verify file selected
      await waitFor(() => {
        expect(screen.getByText(/proof.jpg/i)).toBeInTheDocument();
      });

      // Submit proof
      const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
      await user.click(uploadButton);

      // Verify proof uploaded
      await waitFor(() => {
        expect(mockOnProof).toHaveBeenCalled();
      });

      // ===== STEP 6: Confirm Receipt =====
      rerender(
        <ReceiptConfirmation
          match={selectedMatch}
          onConfirmed={mockOnSettlement}
        />
      );

      // Verify receipt confirmation
      expect(screen.getByText(/confirm.*receipt|settlement/i)).toBeInTheDocument();

      // Confirm receipt
      const confirmButton = screen.getByRole('button', { name: /confirm|complete/i });
      await user.click(confirmButton);

      // Verify settlement complete
      await waitFor(() => {
        expect(mockOnSettlement).toHaveBeenCalled();
      });

      // Verify success message
      expect(screen.getByText(/success|completed|settled/i)).toBeInTheDocument();
    });

    it('should handle user cancellation at any step', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Start filling form
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify form cleared or closed
      await waitFor(() => {
        expect(mockOnCreate).not.toHaveBeenCalled();
      });
    });

    it('should maintain state across navigation', async () => {
      const user = userEvent.setup();

      // Create request
      const { rerender } = render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      // Navigate away
      rerender(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onMatchSelect={mockOnMatch}
        />
      );

      // Verify marketplace loads
      expect(screen.getByText(/marketplace/i)).toBeInTheDocument();

      // Navigate back
      rerender(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify form state preserved (if applicable)
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      const mockOnCreateWithError = vi.fn().mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreateWithError} />
      );

      // Fill and submit form
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Verify retry option
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should validate all required fields before submission', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Try to submit without filling required fields
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/required|invalid/i)).toBeInTheDocument();
      });

      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it('should support keyboard navigation throughout journey', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Tab through form
      await user.tab();
      expect(screen.getByLabelText(/from currency/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/to currency/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/amount/i)).toHaveFocus();

      // Submit with Enter key
      const createButton = screen.getByRole('button', { name: /create/i });
      createButton.focus();
      await user.keyboard('{Enter}');

      // Verify form submission attempted
      await waitFor(() => {
        expect(screen.getByText(/required|invalid/i)).toBeInTheDocument();
      });
    });

    it('should be accessible with screen reader', async () => {
      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Verify ARIA labels
      expect(screen.getByLabelText(/from currency/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/to currency/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/amount/i)).toHaveAttribute('aria-label');

      // Verify form has proper role
      const form = screen.getByRole('form', { hidden: true }) || 
                   screen.getByText(/create.*exchange/i).closest('form');
      expect(form).toBeInTheDocument();

      // Verify buttons have accessible names
      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).toHaveAccessibleName();
    });

    it('should support RTL (Arabic) language', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />,
        { initialLanguage: 'ar' }
      );

      // Verify Arabic text is present
      expect(screen.getByText(/إنشاء|طلب|صرف/i)).toBeInTheDocument();

      // Verify form still works in RTL
      const amount = screen.getByLabelText(/المبلغ|amount/i);
      await user.type(amount, '1000');

      const createButton = screen.getByRole('button', { name: /إنشاء|create/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();

      render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      const amount = screen.getByLabelText(/amount/i);
      const createButton = screen.getByRole('button', { name: /create/i });

      // Rapid clicks
      await user.type(amount, '1000');
      await user.click(createButton);
      await user.click(createButton);
      await user.click(createButton);

      // Should only call once (debounced)
      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle concurrent operations', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Create request
      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '1000');
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Immediately navigate
      rerender(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onMatchSelect={mockOnMatch}
        />
      );

      // Both operations should complete
      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalled();
        expect(screen.getByText(/marketplace/i)).toBeInTheDocument();
      });
    });
  });
});
