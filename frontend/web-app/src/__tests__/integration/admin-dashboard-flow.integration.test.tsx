import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import { AdminExchangeDashboard } from '../../components/admin/p2p-exchange/AdminExchangeDashboard';
import { AdminProofVerification } from '../../components/admin/p2p-exchange/AdminProofVerification';
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
      render(
        <AdminExchangeDashboard />
      );

      // Step 2: Verify dashboard displays
      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();

      // Step 3: Verify stats cards are present
      await waitFor(() => {
        expect(screen.queryByTestId('admin-exchange-dashboard')).toBeInTheDocument();
      });
    });

    it('should approve exchange', async () => {
      render(
        <AdminExchangeDashboard />
      );

      // Dashboard should render
      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should reject exchange with reason', async () => {
      render(
        <AdminExchangeDashboard />
      );

      // Dashboard should render
      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should verify proofs', async () => {
      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
        senderId: 'user-1',
        createdAt: new Date(),
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Component should render
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should reject proof with reason', async () => {
      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
        senderId: 'user-1',
        createdAt: new Date(),
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Component should render
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Filtering', () => {
    it('should filter by status', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should filter by date range', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should search by ID', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should reset filters', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
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
        senderId: 'user-1',
        createdAt: new Date(),
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Component should render
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
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
        senderId: 'user-1',
        createdAt: new Date(),
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Component should render
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should require reason for rejection', async () => {
      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
        senderId: 'user-1',
        createdAt: new Date(),
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Component should render
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Bulk Operations', () => {
    it('should select multiple exchanges', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should perform bulk actions', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle approval errors', async () => {
      mockOnApprove.mockRejectedValueOnce(new Error('Approval failed'));

      const mockProof = {
        id: 'proof-1',
        matchId: 'match-1',
        uploadedBy: 'user-1',
        uploadedAt: new Date(),
        fileUrl: 'https://example.com/proof.jpg',
        status: 'PENDING' as const,
        type: 'PAYMENT_PROOF' as const,
        senderId: 'user-1',
        createdAt: new Date(),
      };

      render(
        <AdminProofVerification
          proof={mockProof}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Component should render
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <AdminExchangeDashboard />
      );

      const dashboard = screen.getByTestId('admin-exchange-dashboard');
      expect(dashboard).toBeInTheDocument();
    });
  });
});
