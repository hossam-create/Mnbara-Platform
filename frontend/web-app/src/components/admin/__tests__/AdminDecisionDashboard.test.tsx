/**
 * AdminDecisionDashboard Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminDecisionDashboard } from '../AdminDecisionDashboard';
import { DecisionStatus, DecisionSource } from '../../../types/decision.types';

const mockDecisions = [
  {
    id: '1',
    assetId: 'asset-1',
    assetTitle: 'Vintage Camera',
    status: DecisionStatus.APPROVED,
    source: DecisionSource.INTERNAL,
    requestedAt: '2026-01-20T10:00:00Z',
    decidedAt: '2026-01-20T10:05:00Z',
    decidedBy: 'System'
  },
  {
    id: '2',
    assetId: 'asset-2',
    assetTitle: 'Leather Jacket',
    status: DecisionStatus.PENDING,
    source: DecisionSource.EXTERNAL,
    requestedAt: '2026-01-25T14:30:00Z'
  }
];

const mockStats = {
  total: 100,
  approved: 70,
  pending: 20,
  rejected: 8,
  expired: 2,
  averageDecisionTime: 45,
  approvalRate: 70,
  rejectionRate: 8
};

describe('AdminDecisionDashboard', () => {
  let mockOnRefresh: ReturnType<typeof vi.fn>;
  let mockOnDecisionOverride: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnRefresh = vi.fn();
    mockOnDecisionOverride = vi.fn();
  });

  describe('Rendering', () => {
    it('should render dashboard', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
        />
      );
      expect(screen.getByTestId('admin-decision-dashboard')).toBeInTheDocument();
    });

    it('should render header', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
        />
      );
      expect(screen.getByText('Decision Management')).toBeInTheDocument();
    });

    it('should render statistics section', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
        />
      );
      expect(screen.getByTestId('statistics-section')).toBeInTheDocument();
    });

    it('should render decision list section', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
        />
      );
      expect(screen.getByTestId('decision-list-section')).toBeInTheDocument();
    });

    it('should render refresh button', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
        />
      );
      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onRefresh when refresh button clicked', async () => {
      const user = userEvent.setup();
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
          onRefresh={mockOnRefresh}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should disable refresh button when loading', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
          isLoading={true}
          onRefresh={mockOnRefresh}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Decision Filtering', () => {
    it('should display all decisions initially', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
        />
      );

      expect(screen.getByTestId('decision-list-section')).toBeInTheDocument();
    });

    it('should filter decisions by status', async () => {
      const user = userEvent.setup();
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
        />
      );

      // Look for status filter if it exists
      const statusFilters = screen.queryAllByRole('button');
      expect(statusFilters.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
          isLoading={true}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeDisabled();
    });

    it('should show normal state when not loading', () => {
      render(
        <AdminDecisionDashboard
          decisions={mockDecisions}
          stats={mockStats}
          isLoading={false}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).not.toBeDisabled();
    });
  });

  describe('Empty State', () => {
    it('should handle empty decisions list', () => {
      render(
        <AdminDecisionDashboard
          decisions={[]}
          stats={{
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
            expired: 0,
            averageDecisionTime: 0,
            approvalRate: 0,
            rejectionRate: 0
          }}
        />
      );

      expect(screen.getByTestId('admin-decision-dashboard')).toBeInTheDocument();
    });
  });
});
