/**
 * SellerListingsTable Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { SellerListingsTable } from '../SellerListingsTable';
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

describe('SellerListingsTable', () => {
  it('renders table with listings', () => {
    render(<SellerListingsTable listings={mockListings} />);
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    expect(screen.getByText('Leather Jacket')).toBeInTheDocument();
    expect(screen.getByText('Vintage Watch')).toBeInTheDocument();
  });

  it('displays table headers', () => {
    render(<SellerListingsTable listings={mockListings} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Decision')).toBeInTheDocument();
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('formats prices correctly', () => {
    render(<SellerListingsTable listings={mockListings} />);
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
  });

  it('displays decision status badges', () => {
    render(<SellerListingsTable listings={mockListings} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('calls onListingClick when row is clicked', () => {
    const onListingClick = vi.fn();
    render(
      <SellerListingsTable
        listings={mockListings}
        onListingClick={onListingClick}
      />
    );
    fireEvent.click(screen.getByText('Vintage Camera'));
    expect(onListingClick).toHaveBeenCalledWith('1');
  });

  it('shows loading state', () => {
    const { container } = render(
      <SellerListingsTable listings={[]} isLoading={true} />
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no listings', () => {
    render(<SellerListingsTable listings={[]} />);
    expect(screen.getByText('No listings found')).toBeInTheDocument();
  });

  it('displays view counts', () => {
    render(<SellerListingsTable listings={mockListings} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<SellerListingsTable listings={mockListings} />);
    expect(screen.getByText('Jan 20, 2026')).toBeInTheDocument();
    expect(screen.getByText('Jan 25, 2026')).toBeInTheDocument();
    expect(screen.getByText('Jan 22, 2026')).toBeInTheDocument();
  });
});
