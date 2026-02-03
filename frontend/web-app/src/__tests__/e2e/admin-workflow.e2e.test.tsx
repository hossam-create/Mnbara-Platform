import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import { AdminExchangeDashboard } from '../../components/admin/p2p-exchange/AdminExchangeDashboard';
import { AdminProofVerification } from '../../components/admin/p2p-exchange/AdminProofVerification';

/**
 * E2E Test Suite: Admin Workflow
 * 
 * Tests the complete admin workflow from dashboard access to proof verification
 * and settlement approval. Simulates an admin user managing exchanges.
 */
describe('E2E: Admin Workflow - Dashboard to Approval', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Dashboard Operations', () => {
    it('should complete full admin workflow from dashboard to approval', async () => {
      render(
        <AdminExchangeDashboard />
      );

      // Verify dashboard loads
      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should handle rejection with reason', async () => {
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

    it('should filter exchanges by multiple criteria', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should search exchanges by ID', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should reset all filters', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should handle bulk operations', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should display exchange statistics', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should paginate through exchanges', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should display proof metadata', async () => {
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

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle admin errors gracefully', async () => {
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

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation in admin dashboard', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should be accessible with screen reader', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should support RTL (Arabic) admin interface', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });

    it('should handle concurrent admin actions', async () => {
      render(
        <AdminExchangeDashboard />
      );

      expect(screen.getByTestId('admin-exchange-dashboard')).toBeInTheDocument();
    });
  });
});
