/**
 * DecisionStatusBadge Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DecisionStatusBadge } from '../DecisionStatusBadge';
import { DecisionStatus } from '../../../types/decision.types';

describe('DecisionStatusBadge', () => {
  it('renders APPROVED status with green styling', () => {
    render(<DecisionStatusBadge status={DecisionStatus.APPROVED} />);
    const badge = screen.getByText('Approved');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-green-100');
  });

  it('renders PENDING status with yellow styling', () => {
    render(<DecisionStatusBadge status={DecisionStatus.PENDING} />);
    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-yellow-100');
  });

  it('renders REJECTED status with red styling', () => {
    render(<DecisionStatusBadge status={DecisionStatus.REJECTED} />);
    const badge = screen.getByText('Rejected');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-red-100');
  });

  it('renders EXPIRED status with blue styling', () => {
    render(<DecisionStatusBadge status={DecisionStatus.EXPIRED} />);
    const badge = screen.getByText('Expired');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-blue-100');
  });

  it('applies small size class', () => {
    const { container } = render(
      <DecisionStatusBadge status={DecisionStatus.APPROVED} size="small" />
    );
    const span = container.querySelector('span');
    expect(span).toHaveClass('px-2', 'py-1', 'text-xs');
  });

  it('applies medium size class', () => {
    const { container } = render(
      <DecisionStatusBadge status={DecisionStatus.APPROVED} size="medium" />
    );
    const span = container.querySelector('span');
    expect(span).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('applies large size class', () => {
    const { container } = render(
      <DecisionStatusBadge status={DecisionStatus.APPROVED} size="large" />
    );
    const span = container.querySelector('span');
    expect(span).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('hides label when showLabel is false', () => {
    render(<DecisionStatusBadge status={DecisionStatus.APPROVED} showLabel={false} />);
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('shows label by default', () => {
    render(<DecisionStatusBadge status={DecisionStatus.APPROVED} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('displays tooltip with message', () => {
    const { container } = render(
      <DecisionStatusBadge status={DecisionStatus.APPROVED} />
    );
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('title');
    expect(span?.getAttribute('title')).toBeTruthy();
  });

  it('renders icon for each status', () => {
    const { rerender, container } = render(
      <DecisionStatusBadge status={DecisionStatus.APPROVED} />
    );
    let icon = container.querySelector('span span');
    expect(icon?.textContent).toBeTruthy();

    rerender(<DecisionStatusBadge status={DecisionStatus.PENDING} />);
    icon = container.querySelector('span span');
    expect(icon?.textContent).toBeTruthy();
  });
});
