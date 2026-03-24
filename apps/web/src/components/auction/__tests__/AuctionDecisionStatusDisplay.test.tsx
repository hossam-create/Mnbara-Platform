/**
 * AuctionDecisionStatusDisplay Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuctionDecisionStatusDisplay } from '../AuctionDecisionStatusDisplay';
import { DecisionStatus } from '../../../types/decision.types';

describe('AuctionDecisionStatusDisplay', () => {
  it('renders APPROVED status with bidding enabled', () => {
    render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.APPROVED}
        canBid={true}
      />
    );
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Bidding Enabled')).toBeInTheDocument();
    expect(screen.getByText(/Bidding is enabled for this auction/i)).toBeInTheDocument();
  });

  it('renders PENDING status with bidding disabled', () => {
    render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.PENDING}
        canBid={false}
      />
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Bidding Disabled')).toBeInTheDocument();
    expect(screen.getByText(/under review/i)).toBeInTheDocument();
  });

  it('renders REJECTED status with bidding disabled', () => {
    render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.REJECTED}
        canBid={false}
      />
    );
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Bidding Disabled')).toBeInTheDocument();
    expect(screen.getByText(/This auction was rejected/i)).toBeInTheDocument();
  });

  it('renders EXPIRED status with bidding disabled', () => {
    render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.EXPIRED}
        canBid={false}
      />
    );
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Bidding Disabled')).toBeInTheDocument();
    expect(screen.getByText(/The auction decision has expired/i)).toBeInTheDocument();
  });

  it('displays custom rejection reason', () => {
    const reason = 'Item violates auction policy';
    render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.REJECTED}
        reason={reason}
        canBid={false}
      />
    );
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('displays decided timestamp', () => {
    const decidedAt = '2026-01-29T10:00:00Z';
    render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.APPROVED}
        decidedAt={decidedAt}
        canBid={true}
      />
    );
    expect(screen.getByText(/Decided:/i)).toBeInTheDocument();
  });

  it('displays expiration timestamp for approved auctions', () => {
    const expiresAt = '2026-02-28T10:00:00Z';
    render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.APPROVED}
        expiresAt={expiresAt}
        canBid={true}
      />
    );
    expect(screen.getByText(/Expires:/i)).toBeInTheDocument();
  });

  it('applies green styling when bidding is enabled', () => {
    const { container } = render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.APPROVED}
        canBid={true}
      />
    );
    const biddingDiv = container.querySelector('.bg-green-50');
    expect(biddingDiv).toBeInTheDocument();
  });

  it('applies red styling when bidding is disabled', () => {
    const { container } = render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.REJECTED}
        canBid={false}
      />
    );
    const biddingDiv = container.querySelector('.bg-red-50');
    expect(biddingDiv).toBeInTheDocument();
  });

  it('shows checkmark when bidding is enabled', () => {
    const { container } = render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.APPROVED}
        canBid={true}
      />
    );
    const checkmark = container.querySelector('.text-green-600');
    expect(checkmark?.textContent).toContain('✓');
  });

  it('shows X mark when bidding is disabled', () => {
    const { container } = render(
      <AuctionDecisionStatusDisplay
        status={DecisionStatus.REJECTED}
        canBid={false}
      />
    );
    const xmark = container.querySelector('.text-red-600');
    expect(xmark?.textContent).toContain('✕');
  });
});
