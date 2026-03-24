/**
 * AdminDecisionList Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AdminDecisionList } from '../AdminDecisionList';
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
  },
  {
    id: '3',
    assetId: 'asset-3',
    assetTitle: 'Vintage Watch',
    status: DecisionStatus.REJECTED,
    source: DecisionSource.OVERRIDE,
    requestedAt: '2026-01-22T09:15:00Z',
    decidedAt: '2026-01-22T09:20:00Z',
    decidedBy: 'Admin'
  }
];

describe('AdminDecisionList', () => {
  it('renders table with decisions', () => {
    const { container } = render(
      <AdminDecisionList decisions={mockDecisions} />
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('displays table headers', () => {
    const { container } = render(<AdminDecisionList decisions={mockDecisions} />);
    const headers = container.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(h => h.textContent);
    expect(headerTexts).toContain('Asset');
    expect(headerTexts).toContain('Status');
    expect(headerTexts).toContain('Source');
    expect(headerTexts).toContain('Requested');
    expect(headerTexts).toContain('Decided');
    expect(headerTexts).toContain('Decided By');
  });

  it('displays asset titles', () => {
    render(<AdminDecisionList decisions={mockDecisions} />);
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    expect(screen.getByText('Leather Jacket')).toBeInTheDocument();
    expect(screen.getByText('Vintage Watch')).toBeInTheDocument();
  });

  it('displays decision statuses', () => {
    render(<AdminDecisionList decisions={mockDecisions} />);
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('REJECTED')).toBeInTheDocument();
  });

  it('displays decision sources', () => {
    render(<AdminDecisionList decisions={mockDecisions} />);
    expect(screen.getByText('INTERNAL')).toBeInTheDocument();
    expect(screen.getByText('EXTERNAL')).toBeInTheDocument();
    expect(screen.getByText('OVERRIDE')).toBeInTheDocument();
  });

  it('calls onDecisionClick when row is clicked', () => {
    const onDecisionClick = vi.fn();
    const { container } = render(
      <AdminDecisionList
        decisions={mockDecisions}
        onDecisionClick={onDecisionClick}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    fireEvent.click(rows[0]);
    expect(onDecisionClick).toHaveBeenCalledWith('1');
  });

  it('shows loading state', () => {
    const { container } = render(
      <AdminDecisionList decisions={[]} isLoading={true} />
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no decisions', () => {
    render(<AdminDecisionList decisions={[]} />);
    expect(screen.getByText('No decisions found')).toBeInTheDocument();
  });

  it('filters by status', () => {
    const onStatusFilterChange = vi.fn();
    render(
      <AdminDecisionList
        decisions={mockDecisions}
        onStatusFilterChange={onStatusFilterChange}
      />
    );
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: DecisionStatus.APPROVED } });
    expect(onStatusFilterChange).toHaveBeenCalledWith(DecisionStatus.APPROVED);
  });

  it('filters by source', () => {
    const onSourceFilterChange = vi.fn();
    render(
      <AdminDecisionList
        decisions={mockDecisions}
        onSourceFilterChange={onSourceFilterChange}
      />
    );
    const sourceSelect = screen.getByDisplayValue('All Sources');
    fireEvent.change(sourceSelect, { target: { value: DecisionSource.INTERNAL } });
    expect(onSourceFilterChange).toHaveBeenCalledWith(DecisionSource.INTERNAL);
  });

  it('displays decided by information', () => {
    render(<AdminDecisionList decisions={mockDecisions} />);
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays dash for missing decided by', () => {
    render(<AdminDecisionList decisions={mockDecisions} />);
    const cells = screen.getAllByText('-');
    expect(cells.length).toBeGreaterThan(0);
  });
});
