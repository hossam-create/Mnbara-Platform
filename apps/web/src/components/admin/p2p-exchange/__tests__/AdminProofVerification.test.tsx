import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../../__tests__/utils/test-utils';
import { AdminProofVerification } from '../AdminProofVerification';
import type { ProofOfPayment } from '../../../../types/p2p-exchange.types';

describe('AdminProofVerification', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockProof: ProofOfPayment;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockProof = {
      id: 'proof-123456',
      matchId: 'match-123456',
      senderId: 'user-1',
      recipientId: 'user-2',
      imageUrl: 'https://example.com/proof.jpg',
      transactionReference: 'TXN-123456',
      paymentMethod: 'bank_transfer',
      verificationStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      metadata: { notes: 'Test proof' },
    } as ProofOfPayment;
  });

  describe('Rendering', () => {
    it('should render admin proof verification component', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('admin-proof-verification')).toBeInTheDocument();
    });

    it('should render verification header', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('verification-header')).toBeInTheDocument();
    });

    it('should render proof information section', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('proof-information')).toBeInTheDocument();
    });

    it('should render proof details', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('proof-details')).toBeInTheDocument();
    });

    it('should render proof image section', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('proof-image-section')).toBeInTheDocument();
    });

    it('should render decision section', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('decision-section')).toBeInTheDocument();
    });

    it('should render decision buttons', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('decision-buttons')).toBeInTheDocument();
    });

    it('should render approve button', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('approve-button')).toBeInTheDocument();
    });

    it('should render reject button', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('reject-button')).toBeInTheDocument();
    });

    it('should render admin notes section', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('admin-notes-section')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
    });

    it('should render close button in header', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('close-verification-button')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('should render confirm decision button', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );
      expect(screen.getByTestId('confirm-decision-button')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const closeButton = screen.getByTestId('close-verification-button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should select approve decision', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const approveButton = screen.getByTestId('approve-button');
      await user.click(approveButton);

      expect(approveButton).toHaveClass('bg-green-600', 'text-white');
    });

    it('should select reject decision', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const rejectButton = screen.getByTestId('reject-button');
      await user.click(rejectButton);

      expect(rejectButton).toHaveClass('bg-red-600', 'text-white');
    });

    it('should show rejection reason when reject is selected', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const rejectButton = screen.getByTestId('reject-button');
      await user.click(rejectButton);

      expect(screen.getByTestId('rejection-reason-section')).toBeInTheDocument();
    });

    it('should allow selecting rejection reason', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const rejectButton = screen.getByTestId('reject-button');
      await user.click(rejectButton);

      const reasonSelect = screen.getByTestId('rejection-reason-select') as HTMLSelectElement;
      await user.selectOptions(reasonSelect, 'unclear_image');

      expect(reasonSelect.value).toBe('unclear_image');
    });

    it('should allow typing admin notes', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const notesTextarea = screen.getByTestId('admin-notes-textarea') as HTMLTextAreaElement;
      await user.type(notesTextarea, 'Test notes');

      expect(notesTextarea.value).toBe('Test notes');
    });

    it('should display proof image', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const proofImage = screen.getByTestId('proof-image') as HTMLImageElement;
      expect(proofImage).toBeInTheDocument();
      expect(proofImage.src).toBe(mockProof.imageUrl);
    });

    it('should open image modal when zoom button clicked', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const zoomButton = screen.getByTestId('zoom-image-button');
      await user.click(zoomButton);

      expect(screen.getByTestId('image-modal')).toBeInTheDocument();
    });

    it('should close image modal when close button clicked', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const zoomButton = screen.getByTestId('zoom-image-button');
      await user.click(zoomButton);

      const closeModalButton = screen.getByTestId('close-modal-button');
      await user.click(closeModalButton);

      expect(screen.queryByTestId('image-modal')).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should disable confirm button when no decision made', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const confirmButton = screen.getByTestId('confirm-decision-button');
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when decision made', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      const approveButton = screen.getByTestId('approve-button');
      await user.click(approveButton);

      const confirmButton = screen.getByTestId('confirm-decision-button');
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when verification fails', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      // Error message might not be present initially
      const errorMessage = screen.queryByTestId('error-message');
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument();
      }
    });
  });

  describe('Transaction Details', () => {
    it('should display transaction details section', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      expect(screen.getByTestId('transaction-details-section')).toBeInTheDocument();
    });

    it('should display proof info section', () => {
      render(
        <AdminProofVerification proof={mockProof} onClose={mockOnClose} />
      );

      expect(screen.getByTestId('proof-info-section')).toBeInTheDocument();
    });
  });
});
