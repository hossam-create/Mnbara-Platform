import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import AdminExchangeDashboard from '../../components/admin/p2p-exchange/AdminExchangeDashboard';
import AdminProofVerification from '../../components/admin/p2p-exchange/AdminProofVerification';
import { mockExchangeRequests, mockMatches } from '../fixtures/mock-data';

/**
 * E2E Test Suite: Admin Workflow
 * 
 * Tests the complete admin workflow from dashboard access to proof verification
 * and settlement approval. Simulates an admin user managing exchanges.
 */
describe('E2E: Admin Workflow - Dashboard to Approval', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnVerify = vi.fn();
  const mockOnFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Dashboard Operations', () => {
    it('should complete full admin workflow from dashboard to approval', async () => {
      const user = userEvent.setup();

      // ===== STEP 1: Access Admin Dashboard =====
      const { rerender } = render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Verify dashboard loads
      expect(screen.getByText(/admin.*dashboard|manage.*exchanges/i)).toBeInTheDocument();

      // Verify exchanges display
      expect(screen.getByText(mockExchangeRequests[0].id)).toBeInTheDocument();

      // ===== STEP 2: Filter Exchanges =====
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOption(statusFilter, 'pending');

      // Verify filter applied
      await waitFor(() => {
        expect(mockOnFilter).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'pending' })
        );
      });

      // ===== STEP 3: Review Exchange =====
      const exchangeRow = screen.getByText(mockExchangeRequests[0].id);
      const reviewButton = within(exchangeRow.closest('tr') || exchangeRow).getByRole('button', {
        name: /review|view/i,
      });
      await user.click(reviewButton);

      // Verify exchange details display
      expect(screen.getByText(/exchange details|review/i)).toBeInTheDocument();

      // ===== STEP 4: Verify Proofs =====
      rerender(
        <AdminProofVerification
          exchange={mockExchangeRequests[0]}
          onVerify={mockOnVerify}
        />
      );

      // Verify proof upload section
      expect(screen.getByText(/proof.*payment|verify.*proof/i)).toBeInTheDocument();

      // Verify proof image displays
      const proofImage = screen.getByRole('img', { name: /proof/i });
      expect(proofImage).toBeInTheDocument();

      // ===== STEP 5: Approve Exchange =====
      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      // Verify approval
      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalled();
      });

      // Verify success message
      expect(screen.getByText(/approved|success/i)).toBeInTheDocument();
    });

    it('should handle rejection with reason', async () => {
      const user = userEvent.setup();

      render(
        <AdminProofVerification
          exchange={mockExchangeRequests[0]}
          onVerify={mockOnVerify}
        />
      );

      // Click reject
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      // Verify rejection reason form appears
      expect(screen.getByText(/reason|why/i)).toBeInTheDocument();

      // Enter reason
      const reasonInput = screen.getByLabelText(/reason/i);
      await user.type(reasonInput, 'Proof is unclear');

      // Submit rejection
      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      // Verify rejection
      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith(
          expect.objectContaining({
            reason: 'Proof is unclear',
          })
        );
      });
    });

    it('should filter exchanges by multiple criteria', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Apply status filter
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOption(statusFilter, 'pending');

      // Apply date range filter
      const dateFromInput = screen.getByLabelText(/from.*date|start.*date/i);
      await user.type(dateFromInput, '2026-01-01');

      const dateToInput = screen.getByLabelText(/to.*date|end.*date/i);
      await user.type(dateToInput, '2026-01-31');

      // Verify filters applied
      await waitFor(() => {
        expect(mockOnFilter).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending',
            dateFrom: '2026-01-01',
            dateTo: '2026-01-31',
          })
        );
      });
    });

    it('should search exchanges by ID', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Search by ID
      const searchInput = screen.getByPlaceholderText(/search|id/i);
      await user.type(searchInput, mockExchangeRequests[0].id);

      // Verify search applied
      await waitFor(() => {
        expect(mockOnFilter).toHaveBeenCalledWith(
          expect.objectContaining({
            searchId: mockExchangeRequests[0].id,
          })
        );
      });
    });

    it('should reset all filters', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Apply filters
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOption(statusFilter, 'pending');

      // Reset filters
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Verify filters reset
      await waitFor(() => {
        expect(statusFilter).toHaveValue('');
      });
    });

    it('should handle bulk operations', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Select multiple exchanges
      const checkboxes = screen.getAllByRole('checkbox', { name: /select/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Verify bulk action button appears
      const bulkApproveButton = screen.getByRole('button', { name: /bulk.*approve|approve.*selected/i });
      expect(bulkApproveButton).toBeInTheDocument();

      // Perform bulk action
      await user.click(bulkApproveButton);

      // Verify bulk operation
      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledTimes(2);
      });
    });

    it('should display exchange statistics', async () => {
      render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Verify stats display
      expect(screen.getByText(/total.*exchanges|pending|approved|rejected/i)).toBeInTheDocument();

      // Verify stat cards
      const statCards = screen.getAllByRole('article');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('should paginate through exchanges', async () => {
      const user = userEvent.setup();

      const manyExchanges = Array.from({ length: 50 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      render(
        <AdminExchangeDashboard
          exchanges={manyExchanges}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Verify pagination controls
      const nextButton = screen.getByRole('button', { name: /next|>/i });
      expect(nextButton).toBeInTheDocument();

      // Go to next page
      await user.click(nextButton);

      // Verify page changed
      await waitFor(() => {
        expect(screen.getByText(/page.*2|2.*of/i)).toBeInTheDocument();
      });
    });

    it('should display proof metadata', async () => {
      render(
        <AdminProofVerification
          exchange={mockExchangeRequests[0]}
          onVerify={mockOnVerify}
        />
      );

      // Verify proof metadata displays
      expect(screen.getByText(/uploaded.*at|timestamp|date/i)).toBeInTheDocument();
      expect(screen.getByText(/file.*size|size/i)).toBeInTheDocument();
      expect(screen.getByText(/file.*type|type/i)).toBeInTheDocument();
    });

    it('should require reason for rejection', async () => {
      const user = userEvent.setup();

      render(
        <AdminProofVerification
          exchange={mockExchangeRequests[0]}
          onVerify={mockOnVerify}
        />
      );

      // Click reject
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      // Try to submit without reason
      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      // Verify error
      expect(screen.getByText(/reason.*required|required.*reason/i)).toBeInTheDocument();
      expect(mockOnReject).not.toHaveBeenCalled();
    });

    it('should handle admin errors gracefully', async () => {
      const user = userEvent.setup();

      const mockOnApproveWithError = vi.fn().mockRejectedValueOnce(
        new Error('Approval failed')
      );

      render(
        <AdminProofVerification
          exchange={mockExchangeRequests[0]}
          onVerify={mockOnApproveWithError}
        />
      );

      // Try to approve
      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Verify retry option
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should support keyboard navigation in admin dashboard', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Tab through controls
      await user.tab();
      expect(screen.getByLabelText(/status/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByPlaceholderText(/search|id/i)).toHaveFocus();

      // Navigate to action buttons
      const reviewButtons = screen.getAllByRole('button', { name: /review|view/i });
      reviewButtons[0].focus();
      expect(reviewButtons[0]).toHaveFocus();

      // Activate with Enter
      await user.keyboard('{Enter}');
    });

    it('should be accessible with screen reader', async () => {
      render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Verify table has proper role
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Verify column headers
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);

      // Verify rows
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should support RTL (Arabic) admin interface', async () => {
      const user = userEvent.setup();

      render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />,
        { initialLanguage: 'ar' }
      );

      // Verify Arabic text
      expect(screen.getByText(/لوحة|إدارة|تبادل/i)).toBeInTheDocument();

      // Verify RTL layout
      const dashboard = screen.getByText(/لوحة|إدارة|تبادل/i).closest('div');
      expect(dashboard).toHaveAttribute('dir', 'rtl');

      // Verify controls still work
      const statusFilter = screen.getByLabelText(/الحالة|status/i);
      await user.selectOption(statusFilter, 'pending');
      expect(statusFilter).toHaveValue('pending');
    });

    it('should handle concurrent admin actions', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Approve first exchange
      const reviewButtons = screen.getAllByRole('button', { name: /review|view/i });
      await user.click(reviewButtons[0]);

      // Navigate to proof verification
      rerender(
        <AdminProofVerification
          exchange={mockExchangeRequests[0]}
          onVerify={mockOnVerify}
        />
      );

      // Approve
      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      // Navigate back to dashboard
      rerender(
        <AdminExchangeDashboard
          exchanges={mockExchangeRequests}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onFilter={mockOnFilter}
        />
      );

      // Verify both operations completed
      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalled();
        expect(screen.getByText(/admin.*dashboard|manage.*exchanges/i)).toBeInTheDocument();
      });
    });
  });
});
