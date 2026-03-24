/**
 * DecisionHistoryView Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DecisionHistoryView } from '../DecisionHistoryView';
import { DecisionStatus, DecisionSource } from '../../../types/decision.types';

const mockHistory = [
  {
    id: '1',
    status: DecisionStatus.APPROVED,
    source: DecisionSource.INTERNAL,
    reason: 'Listing meets all requirements',
    decidedAt: '2026-01-25T10:00:00Z',
    decidedBy: 'System'
  },
  {
    id: '2',
    status: DecisionStatus.PENDING,
    source: DecisionSource.EXTERNAL,
    reason: null,
    decidedAt: '2026-01-24T14:30:00Z',
    decidedBy: 'Custodii'
  },
  {
    id: '3',
    status: DecisionStatus.REJECTED,
    source: DecisionSource.OVERRIDE,
    reason: 'Manual override by admin',
    decidedAt: '2026-01-23T09:15:00Z',
    decidedBy: 'Admin User'
  }
];

describe('DecisionHistoryView', () => {
  it('renders component with title and listing name', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={mockHistory}
      />
    );
    expect(screen.getByText('Decision History')).toBeInTheDocument();
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
  });

  it('displays all history entries', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={mockHistory}
      />
    );
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('displays reason for each entry when available', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={mockHistory}
      />
    );
    expect(screen.getByText('Listing meets all requirements')).toBeInTheDocument();
    expect(screen.getByText('Manual override by admin')).toBeInTheDocument();
  });

  it('displays source badges with correct colors', () => {
    const { container } = render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={mockHistory}
      />
    );
    const badges = container.querySelectorAll('[class*="bg-"]');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('displays decided by information', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={mockHistory}
      />
    );
    expect(screen.getByText(/Decided by: System/)).toBeInTheDocument();
    expect(screen.getByText(/Decided by: Custodii/)).toBeInTheDocument();
    expect(screen.getByText(/Decided by: Admin User/)).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={mockHistory}
      />
    );
    expect(screen.getByText(/Jan 25, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 24, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 23, 2026/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={[]}
        isLoading={true}
      />
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no history', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={[]}
        isLoading={false}
      />
    );
    expect(screen.getByText('No decision history available')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={mockHistory}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalled();
  });

  it('displays INTERNAL source badge', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={[mockHistory[0]]}
      />
    );
    expect(screen.getByText('INTERNAL')).toBeInTheDocument();
  });

  it('displays EXTERNAL source badge', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={[mockHistory[1]]}
      />
    );
    expect(screen.getByText('EXTERNAL')).toBeInTheDocument();
  });

  it('displays OVERRIDE source badge', () => {
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={[mockHistory[2]]}
      />
    );
    expect(screen.getByText('OVERRIDE')).toBeInTheDocument();
  });

  it('handles entries without reason gracefully', () => {
    const historyWithoutReason = [
      {
        id: '1',
        status: DecisionStatus.APPROVED,
        source: DecisionSource.INTERNAL,
        reason: null,
        decidedAt: '2026-01-25T10:00:00Z',
        decidedBy: 'System'
      }
    ];
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={historyWithoutReason}
      />
    );
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('handles entries without decidedBy gracefully', () => {
    const historyWithoutDecidedBy = [
      {
        id: '1',
        status: DecisionStatus.APPROVED,
        source: DecisionSource.INTERNAL,
        reason: 'Test reason',
        decidedAt: '2026-01-25T10:00:00Z'
      }
    ];
    render(
      <DecisionHistoryView
        listingId="123"
        listingTitle="Vintage Camera"
        history={historyWithoutDecidedBy}
      />
    );
    expect(screen.getByText('Test reason')).toBeInTheDocument();
  });
});
