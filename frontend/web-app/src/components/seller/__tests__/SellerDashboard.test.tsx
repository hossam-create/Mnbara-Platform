/**
 * SellerDashboard Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SellerDashboard } from '../SellerDashboard';
import { DecisionStatus } from '../../../types/decision.types';

const mockListings = [
  {
    id: '1',
    title: 'Vintage Camera',
    price: 150,
    status: 'active',
    decisionStatus: DecisionStatus.APPROVED,
    createdAt: '2026-01-20T10:00:00Z',
    views: 45
  },
  {
    id: '2',
    title: 'Leather Jacket',
    price: 200,
    status: 'active',
    decisionStatus: DecisionStatus.PENDING,
    createdAt: '2026-01-25T14:30:00Z',
    views: 12
  },
  {
    id: '3',
    title: 'Vintage Watch',
    price: 300,
    status: 'active',
    decisionStatus: DecisionStatus.REJECTED,
    createdAt: '2026-01-22T09:15:00Z',
    views: 8
  }
];

const mockPendingDecisions = [
  {
    id: '1',
    listingTitle: 'Vintage Camera',
    requestedAt: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: '2',
    listingTitle: 'Leather Jacket',
    requestedAt: new Date(Date.now() - 30 * 60000).toISOString()
  }
];

describe('SellerDashboard', () => {
  it('renders dashboard header', () => {
    render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    expect(screen.getByText('My Listings')).toBeInTheDocument();
    expect(screen.getByText(/Manage your listings/i)).toBeInTheDocument();
  });

  it('displays stats cards with correct counts', () => {
    const { container } = render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    const statValues = container.querySelectorAll('.text-3xl');
    // Skip the first one which is the "My Listings" heading
    expect(statValues[1].textContent).toBe('3'); // total
    expect(statValues[2].textContent).toBe('1'); // approved
    expect(statValues[3].textContent).toBe('1'); // pending
    expect(statValues[4].textContent).toBe('1'); // rejected
  });

  it('displays pending decisions notification', () => {
    render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    expect(screen.getByText(/2 Listings Under Review/i)).toBeInTheDocument();
  });

  it('hides notification when dismissed', () => {
    render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    const closeButtons = screen.getAllByText('✕');
    fireEvent.click(closeButtons[0]);
    expect(screen.queryByText(/Listings Under Review/i)).not.toBeInTheDocument();
  });

  it('displays listings in table', () => {
    const { container } = render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('displays decision filter', () => {
    render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('calls onListingClick when table row is clicked', () => {
    const onListingClick = vi.fn();
    const { container } = render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
        onListingClick={onListingClick}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    fireEvent.click(rows[0]);
    expect(onListingClick).toHaveBeenCalledWith('1');
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
        onRefresh={onRefresh}
      />
    );
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows loading state on refresh button', () => {
    render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
        isLoading={true}
      />
    );
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('disables refresh button when loading', () => {
    render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
        isLoading={true}
      />
    );
    const refreshButton = screen.getByText('Refreshing...');
    expect(refreshButton).toBeDisabled();
  });

  it('shows decision history modal when listing is clicked', async () => {
    const { container } = render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    fireEvent.click(rows[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Decision History')).toBeInTheDocument();
    });
  });

  it('closes decision history modal', async () => {
    const { container } = render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    fireEvent.click(rows[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Decision History')).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByText('✕');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    
    await waitFor(() => {
      expect(screen.queryByText('Decision History')).not.toBeInTheDocument();
    });
  });

  it('handles empty listings', () => {
    render(
      <SellerDashboard
        listings={[]}
        pendingDecisions={[]}
      />
    );
    expect(screen.getByText('My Listings')).toBeInTheDocument();
    expect(screen.getByText('No listings found')).toBeInTheDocument();
  });

  it('handles no pending decisions', () => {
    render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={[]}
      />
    );
    expect(screen.queryByText(/Listings Under Review/i)).not.toBeInTheDocument();
  });

  it('displays all stats as zero when no listings', () => {
    const { container } = render(
      <SellerDashboard
        listings={[]}
        pendingDecisions={[]}
      />
    );
    const statValues = container.querySelectorAll('.text-3xl');
    // Skip the first one which is the "My Listings" heading
    expect(statValues[1].textContent).toBe('0');
    expect(statValues[2].textContent).toBe('0');
    expect(statValues[3].textContent).toBe('0');
    expect(statValues[4].textContent).toBe('0');
  });

  it('renders stats cards with correct styling', () => {
    const { container } = render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    const statCards = container.querySelectorAll('.border');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('displays table with correct structure', () => {
    const { container } = render(
      <SellerDashboard
        listings={mockListings}
        pendingDecisions={mockPendingDecisions}
      />
    );
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(6); // Title, Price, Status, Decision, Views, Created
  });
});
