/**
 * AuctionDecisionStatusBadge Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuctionDecisionStatusBadge } from '../AuctionDecisionStatusBadge';
import { DecisionStatus } from '../../../types/decision.types';

describe('AuctionDecisionStatusBadge', () => {
  it('renders APPROVED status with green styling', () => {
    render(<AuctionDecisionStatusBadge status={DecisionStatus.APPROVED} />);
    const badge = screen.getByText('Approved');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-green-100');
  });

  it('renders PENDING status with yellow styling', () => {
    render(<AuctionDecisionStatusBadge status={DecisionStatus.PENDING} />);
    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-yellow-100');
  });

  it('renders REJECTED status with red styling', () => {
    render(<AuctionDecisionStatusBadge status={DecisionStatus.REJECTED} />);
    const badge = screen.getByText('Rejected');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-red-100');
  });

  it('renders EXPIRED status with blue styling', () => {
    render(<AuctionDecisionStatusBadge status={DecisionStatus.EXPIRED} />);
    const badge = screen.getByText('Expired');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-blue-100');
  });

  it('applies disabled styling when disabled prop is true', () => {
    const { container } = render(
      <AuctionDecisionStatusBadge status={DecisionStatus.APPROVED} disabled={true} />
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('does not apply disabled styling when disabled prop is false', () => {
    const { container } = render(
      <AuctionDecisionStatusBadge status={DecisionStatus.APPROVED} disabled={false} />
    );
    const wrapper = container.firstChild;
    expect(wrapper).not.toHaveClass('opacity-50');
  });

  it('applies size classes correctly', () => {
    const { rerender, container } = render(
      <AuctionDecisionStatusBadge status={DecisionStatus.APPROVED} size="small" />
    );
    let span = container.querySelector('span');
    expect(span).toHaveClass('px-2', 'py-1', 'text-xs');

    rerender(<AuctionDecisionStatusBadge status={DecisionStatus.APPROVED} size="medium" />);
    span = container.querySelector('span');
    expect(span).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<AuctionDecisionStatusBadge status={DecisionStatus.APPROVED} size="large" />);
    span = container.querySelector('span');
    expect(span).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('hides label when showLabel is false', () => {
    render(
      <AuctionDecisionStatusBadge
        status={DecisionStatus.APPROVED}
        showLabel={false}
      />
    );
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('shows label by default', () => {
    render(<AuctionDecisionStatusBadge status={DecisionStatus.APPROVED} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
});
