/**
 * AdminDecisionDashboard Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
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
  it('renders dashboard header', () => {
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    expect(screen.getByText('Decision Management')).toBeInTheDocument();
    expect(screen.getByText(/Manage and override/i)).toBeInTheDocument();
  });

  it('displays statistics section', () => {
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Decisions')).toBeInTheDocument();
  });

  it('displays decisions section', () => {
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    expect(screen.getByText('Decisions')).toBeInTheDocument();
  });

  it('displays refresh button', () => {
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
        onRefresh={onRefresh}
      />
    );
    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows loading state on refresh button', () => {
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
        isLoading={true}
      />
    );
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('disables refresh button when loading', () => {
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
        isLoading={true}
      />
    );
    const refreshButton = screen.getByText('Refreshing...');
    expect(refreshButton).toBeDisabled();
  });

  it('displays decision list', () => {
    const { container } = render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('opens detail modal when decision is clicked', async () => {
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    
    fireEvent.click(screen.getByText('Vintage Camera'));
    
    await waitFor(() => {
      expect(screen.getByText('Decision Details')).toBeInTheDocument();
    });
  });

  it('closes detail modal', async () => {
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    
    fireEvent.click(screen.getByText('Vintage Camera'));
    
    await waitFor(() => {
      expect(screen.getByText('Decision Details')).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByText('✕');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    
    await waitFor(() => {
      expect(screen.queryByText('Decision Details')).not.toBeInTheDocument();
    });
  });

  it('filters decisions by status', async () => {
    const { container } = render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: DecisionStatus.APPROVED } });
    
    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
    });
  });

  it('filters decisions by source', async () => {
    const { container } = render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    
    const sourceSelect = screen.getByDisplayValue('All Sources');
    fireEvent.change(sourceSelect, { target: { value: DecisionSource.INTERNAL } });
    
    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
    });
  });

  it('calls onDecisionOverride when override is confirmed', async () => {
    const onDecisionOverride = vi.fn();
    render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
        onDecisionOverride={onDecisionOverride}
      />
    );
    
    fireEvent.click(screen.getByText('Vintage Camera'));
    
    await waitFor(() => {
      expect(screen.getByText('Decision Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Override Decision'));
    
    const statusSelect = screen.getByDisplayValue('Select status...');
    fireEvent.change(statusSelect, { target: { value: DecisionStatus.REJECTED } });
    
    const reasonTextarea = screen.getByPlaceholderText(/Explain why/);
    fireEvent.change(reasonTextarea, { target: { value: 'Invalid item' } });
    
    fireEvent.click(screen.getByText('Confirm Override'));
    
    await waitFor(() => {
      expect(onDecisionOverride).toHaveBeenCalledWith('1', DecisionStatus.REJECTED, 'Invalid item');
    });
  });

  it('handles empty decisions list', () => {
    render(
      <AdminDecisionDashboard
        decisions={[]}
        stats={mockStats}
      />
    );
    expect(screen.getByText('No decisions found')).toBeInTheDocument();
  });

  it('displays all stat cards', () => {
    const { container } = render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    const cards = container.querySelectorAll('.bg-white.rounded-lg');
    expect(cards.length).toBeGreaterThan(0);
    expect(screen.getByText('Total Decisions')).toBeInTheDocument();
  });

  it('resets filters when All is selected', async () => {
    const { container } = render(
      <AdminDecisionDashboard
        decisions={mockDecisions}
        stats={mockStats}
      />
    );
    
    // Filter to APPROVED
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: DecisionStatus.APPROVED } });
    
    await waitFor(() => {
      let rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
    });

    // Reset to All
    fireEvent.change(statusSelect, { target: { value: 'ALL' } });
    
    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });
  });
});
