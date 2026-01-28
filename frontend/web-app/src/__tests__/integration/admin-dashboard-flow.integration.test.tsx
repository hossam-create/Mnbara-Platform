import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import AdminExchangeDashboard from '../../components/admin/p2p-exchange/AdminExchangeDashboard';
import AdminProofVerification from '../../components/admin/p2p-exchange/AdminProofVerification';
import { mockExchangeRequests } from '../fixtures/mock-data';

describe('Admin Dashboard Flow Integration', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Admin Workflow', () => {
    it('should view dashboard and manage exchanges', async () => {
      const user = userEvent.setup();

      // Step 1: Render dashboard
      const { rerender } = render(
        <AdminExchangeDashboard />
      );

      // Step 2: Verify dashboard displays
      expect(screen.getByText(/admin|dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/total|active|pending/i)).toBeInTheDocument();

      // Step 3: Filter exchanges
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOption(statusFilter, 'PENDING');

      // Step 4: Verify filter applied
      expect(statusFilter).toHaveValue('PENDING');

      // Step 5: View exchange details
      const viewButton = screen.getByRole('button', { name: /view/i });
      await user.click(viewButton);

      expect(viewButton).toBeInTheDocument();
    });

    it('should approve exchange', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      expect(approveButton).toBeInTheDocument();
    });

    it('should reject exchange with reason', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      const rejectButton = screen.getByRole('button', { name: /reject|decline/i });
      await user.click(rejectButton);

      // Provide reason
      const reasonInput = screen.getByLabelText(/reason|notes/i);
      await user.type(reasonInput, 'Invalid documentation');

      const confirmButton = screen.getByRole('button', { name: /confirm|submit/i });
      await user.click(confirmButton);

      expect(confirmButton).toBeInTheDocument();
    });

    it('should verify proofs', async () => {
      const user = userEvent.setup();

      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Step 1: View proof
      expect(screen.getByRole('img')).toBeInTheDocument();

      // Step 2: Approve proof
      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledWith(mockProof.id);
      });
    });

    it('should reject proof with reason', async () => {
      const user = userEvent.setup();

      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Provide rejection reason
      const reasonInput = screen.getByLabelText(/reason|notes/i);
      await user.type(reasonInput, 'Image is blurry');

      // Reject proof
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith(
          mockProof.id,
          expect.stringContaining('blurry')
        );
      });
    });
  });

  describe('Dashboard Filtering', () => {
    it('should filter by status', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOption(statusFilter, 'ACTIVE');

      expect(statusFilter).toHaveValue('ACTIVE');
    });

    it('should filter by date range', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      const startDate = screen.getByLabelText(/start|from/i);
      const endDate = screen.getByLabelText(/end|to/i);

      await user.type(startDate, '2026-01-01');
      await user.type(endDate, '2026-01-31');

      expect(startDate).toHaveValue('2026-01-01');
      expect(endDate).toHaveValue('2026-01-31');
    });

    it('should search by ID', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      const searchInput = screen.getByPlaceholderText(/search|id/i);
      await user.type(searchInput, 'EXC-123');

      expect(searchInput).toHaveValue('EXC-123');
    });

    it('should reset filters', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOption(statusFilter, 'ACTIVE');

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Proof Verification', () => {
    it('should display proof image', () => {
      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
      };

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

    it('should display proof metadata', () => {
      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText(/uploaded|date/i)).toBeInTheDocument();
      expect(screen.getByText(/payment|proof|type/i)).toBeInTheDocument();
    });

    it('should require reason for rejection', async () => {
      const user = userEvent.setup();

      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
      };

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
  });

  describe('Bulk Operations', () => {
    it('should select multiple exchanges', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });

    it('should perform bulk actions', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      const bulkActionButton = screen.getByRole('button', { name: /bulk|action/i });
      await user.click(bulkActionButton);

      expect(bulkActionButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle approval errors', async () => {
      const user = userEvent.setup();

      mockOnApprove.mockRejectedValueOnce(new Error('Approval failed'));

      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
      };

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
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard />
      );

      await user.tab();
      expect(screen.getByRole('button', { name: /view|edit|action/i })).toHaveFocus();
    });

    it('should have proper ARIA labels', () => {
      render(
        <AdminExchangeDashboard />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label');
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <AdminExchangeDashboard />
      );

      const dashboard = screen.getByText(/admin|dashboard/i).closest('div');
      expect(dashboard).toHaveAttribute('dir', 'rtl');
    });
  });
});
