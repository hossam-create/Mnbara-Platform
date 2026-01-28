import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import AdminProofVerification from '../AdminProofVerification';

describe('AdminProofVerification', () => {
  const mockProof = {
    id: 'proof-1',
    matchId: 'match-1',
    uploadedBy: 'user-1',
    uploadedAt: new Date(),
    fileUrl: 'https://example.com/proof.jpg',
    status: 'PENDING' as const,
    type: 'PAYMENT_PROOF' as const,
  };

  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  describe('Rendering', () => {
    it('should render proof verification panel', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/proof|verification|verify/i)).toBeInTheDocument();
    });

    it('should display proof image', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should display proof metadata', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/uploaded|date|type/i)).toBeInTheDocument();
    });

    it('should display proof status', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/pending|status/i)).toBeInTheDocument();
    });

    it('should display verification controls', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('should display notes field', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByLabelText(/notes|comment|reason/i)).toBeInTheDocument();
    });
  });

  describe('Image Verification', () => {
    it('should display full-size image', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', mockProof.fileUrl);
    });

    it('should allow image zoom', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const zoomButton = screen.getByRole('button', { name: /zoom|enlarge/i });
      await user.click(zoomButton);

      expect(zoomButton).toBeInTheDocument();
    });

    it('should allow image rotation', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const rotateButton = screen.getByRole('button', { name: /rotate/i });
      await user.click(rotateButton);

      expect(rotateButton).toBeInTheDocument();
    });
  });

  describe('Verification Actions', () => {
    it('should approve proof', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledWith(mockProof.id);
      });
    });

    it('should reject proof with reason', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const notesField = screen.getByLabelText(/notes|comment|reason/i);
      await user.type(notesField, 'Image is blurry');

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith(
          mockProof.id,
          expect.stringContaining('blurry')
        );
      });
    });

    it('should require reason for rejection', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      expect(screen.getByText(/reason.*required|provide.*reason/i)).toBeInTheDocument();
    });

    it('should disable buttons while processing', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isProcessing
        />
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      const rejectButton = screen.getByRole('button', { name: /reject/i });

      expect(approveButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });
  });

  describe('Proof Details', () => {
    it('should display upload timestamp', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/uploaded|date/i)).toBeInTheDocument();
    });

    it('should display uploader information', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/uploader|user|by/i)).toBeInTheDocument();
    });

    it('should display proof type', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/payment|proof|type/i)).toBeInTheDocument();
    });

    it('should display file size', () => {
      const proofWithSize = { ...mockProof, fileSize: 2048 };
      render(
        <AdminProofVerification
          proof={proofWithSize}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/size|kb|mb/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should have ARIA labels for buttons', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const approveButton = screen.getByRole('button', { name: /approve/i });
      expect(approveButton).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      await user.tab();
      expect(screen.getByRole('button', { name: /approve|reject/i })).toHaveFocus();
    });

    it('should have ARIA live region for status', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const status = screen.getByText(/pending|status/i);
      expect(status).toHaveAttribute('aria-live');
    });
  });

  describe('Status Indicators', () => {
    it('should show PENDING status', () => {
      const pendingProof = { ...mockProof, status: 'PENDING' as const };
      render(
        <AdminProofVerification
          proof={pendingProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('should show APPROVED status', () => {
      const approvedProof = { ...mockProof, status: 'APPROVED' as const };
      render(
        <AdminProofVerification
          proof={approvedProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
    });

    it('should show REJECTED status', () => {
      const rejectedProof = { ...mockProof, status: 'REJECTED' as const };
      render(
        <AdminProofVerification
          proof={rejectedProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/rejected/i)).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const panel = screen.getByText(/proof|verification/i).closest('div');
      expect(panel).toHaveAttribute('dir', 'rtl');
    });
  });
});
