/**
 * PendingDecisionsNotification Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { PendingDecisionsNotification } from '../PendingDecisionsNotification';

const mockPendingDecisions = [
  {
    id: '1',
    listingTitle: 'Vintage Camera',
    requestedAt: new Date(Date.now() - 5 * 60000).toISOString() // 5 minutes ago
  },
  {
    id: '2',
    listingTitle: 'Leather Jacket',
    requestedAt: new Date(Date.now() - 30 * 60000).toISOString() // 30 minutes ago
  },
  {
    id: '3',
    listingTitle: 'Vintage Watch',
    requestedAt: new Date(Date.now() - 2 * 3600000).toISOString() // 2 hours ago
  }
];

describe('PendingDecisionsNotification', () => {
  it('does not render when no pending decisions', () => {
    const { container } = render(
      <PendingDecisionsNotification pendingDecisions={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders notification with pending decisions', () => {
    render(
      <PendingDecisionsNotification pendingDecisions={mockPendingDecisions} />
    );
    expect(screen.getByText(/3 Listings Under Review/i)).toBeInTheDocument();
  });

  it('displays correct singular/plural text', () => {
    render(
      <PendingDecisionsNotification
        pendingDecisions={[mockPendingDecisions[0]]}
      />
    );
    expect(screen.getByText(/1 Listing Under Review/i)).toBeInTheDocument();
  });

  it('shows first 3 pending decisions', () => {
    render(
      <PendingDecisionsNotification pendingDecisions={mockPendingDecisions} />
    );
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    expect(screen.getByText('Leather Jacket')).toBeInTheDocument();
    expect(screen.getByText('Vintage Watch')).toBeInTheDocument();
  });

  it('shows count of additional pending decisions', () => {
    const morePending = [
      ...mockPendingDecisions,
      {
        id: '4',
        listingTitle: 'Gold Ring',
        requestedAt: new Date().toISOString()
      }
    ];
    render(
      <PendingDecisionsNotification pendingDecisions={morePending} />
    );
    expect(screen.getByText('+1 more pending')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <PendingDecisionsNotification
        pendingDecisions={mockPendingDecisions}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('displays time ago for each decision', () => {
    const { container } = render(
      <PendingDecisionsNotification pendingDecisions={mockPendingDecisions} />
    );
    const timeElements = container.querySelectorAll('.text-blue-600.text-xs');
    expect(timeElements.length).toBeGreaterThan(0);
    const timeText = Array.from(timeElements).map(el => el.textContent).join(' ');
    expect(timeText).toMatch(/ago/);
  });

  it('displays help text', () => {
    render(
      <PendingDecisionsNotification pendingDecisions={mockPendingDecisions} />
    );
    expect(
      screen.getByText(/Your listings are being reviewed/i)
    ).toBeInTheDocument();
  });

  it('applies blue styling', () => {
    const { container } = render(
      <PendingDecisionsNotification pendingDecisions={mockPendingDecisions} />
    );
    const notification = container.querySelector('.bg-blue-50');
    expect(notification).toBeInTheDocument();
  });
});
