/**
 * AuctionBiddingGuard Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuctionBiddingGuard } from '../AuctionBiddingGuard';
import { DecisionStatus } from '../../../types/decision.types';

describe('AuctionBiddingGuard', () => {
  const TestContent = () => <button>Place Bid</button>;
  const TestFallback = () => <div>Bidding Unavailable</div>;

  it('renders children when status is APPROVED', () => {
    render(
      <AuctionBiddingGuard status={DecisionStatus.APPROVED}>
        <TestContent />
      </AuctionBiddingGuard>
    );
    expect(screen.getByText('Place Bid')).toBeInTheDocument();
  });

  it('renders fallback when status is PENDING', () => {
    render(
      <AuctionBiddingGuard
        status={DecisionStatus.PENDING}
        fallback={<TestFallback />}
      >
        <TestContent />
      </AuctionBiddingGuard>
    );
    expect(screen.getByText('Bidding Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Place Bid')).not.toBeInTheDocument();
  });

  it('renders fallback when status is REJECTED', () => {
    render(
      <AuctionBiddingGuard
        status={DecisionStatus.REJECTED}
        fallback={<TestFallback />}
      >
        <TestContent />
      </AuctionBiddingGuard>
    );
    expect(screen.getByText('Bidding Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Place Bid')).not.toBeInTheDocument();
  });

  it('renders fallback when status is EXPIRED', () => {
    render(
      <AuctionBiddingGuard
        status={DecisionStatus.EXPIRED}
        fallback={<TestFallback />}
      >
        <TestContent />
      </AuctionBiddingGuard>
    );
    expect(screen.getByText('Bidding Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Place Bid')).not.toBeInTheDocument();
  });

  it('renders default fallback message when no fallback prop provided', () => {
    render(
      <AuctionBiddingGuard status={DecisionStatus.PENDING}>
        <TestContent />
      </AuctionBiddingGuard>
    );
    expect(screen.getByText(/Bidding Unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/not yet approved for bidding/i)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom Bidding Message</div>;
    render(
      <AuctionBiddingGuard
        status={DecisionStatus.PENDING}
        fallback={customFallback}
      >
        <TestContent />
      </AuctionBiddingGuard>
    );
    expect(screen.getByText('Custom Bidding Message')).toBeInTheDocument();
  });

  it('applies yellow styling to default fallback', () => {
    const { container } = render(
      <AuctionBiddingGuard status={DecisionStatus.PENDING}>
        <TestContent />
      </AuctionBiddingGuard>
    );
    const fallback = container.querySelector('.bg-yellow-50');
    expect(fallback).toBeInTheDocument();
  });

  it('renders children for all APPROVED statuses', () => {
    const { rerender } = render(
      <AuctionBiddingGuard status={DecisionStatus.APPROVED}>
        <TestContent />
      </AuctionBiddingGuard>
    );
    expect(screen.getByText('Place Bid')).toBeInTheDocument();

    // Verify it still works on re-render
    rerender(
      <AuctionBiddingGuard status={DecisionStatus.APPROVED}>
        <TestContent />
      </AuctionBiddingGuard>
    );
    expect(screen.getByText('Place Bid')).toBeInTheDocument();
  });

  it('blocks bidding for all non-approved statuses', () => {
    const statuses = [
      DecisionStatus.PENDING,
      DecisionStatus.REJECTED,
      DecisionStatus.EXPIRED
    ];

    statuses.forEach(status => {
      const { unmount } = render(
        <AuctionBiddingGuard
          status={status}
          fallback={<TestFallback />}
        >
          <TestContent />
        </AuctionBiddingGuard>
      );
      expect(screen.queryByText('Place Bid')).not.toBeInTheDocument();
      expect(screen.getByText('Bidding Unavailable')).toBeInTheDocument();
      unmount();
    });
  });
});
