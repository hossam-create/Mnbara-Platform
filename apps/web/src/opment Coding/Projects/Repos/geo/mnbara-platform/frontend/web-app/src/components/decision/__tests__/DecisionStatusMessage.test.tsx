/**
 * DecisionStatusMessage Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DecisionStatusMessage } from '../DecisionStatusMessage';
import { DecisionStatus, AssetType } from '../../../types/decision.types';

describe('DecisionStatusMessage', () => {
  it('renders PENDING status with loading animation', () => {
    render(<DecisionStatusMessage status={DecisionStatus.PENDING} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText(/being reviewed/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviewing/i)).toBeInTheDocument();
  });

  it('renders APPROVED status with success message', () => {
    render(<DecisionStatusMessage status={DecisionStatus.APPROVED} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText(/has been approved/i)).toBeInTheDocument();
  });

  it('renders REJECTED status with error message', () => {
    render(<DecisionStatusMessage status={DecisionStatus.REJECTED} />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText(/was rejected/i)).toBeInTheDocument();
  });

  it('renders EXPIRED status with warning message', () => {
    render(<DecisionStatusMessage status={DecisionStatus.EXPIRED} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText(/has expired/i)).toBeInTheDocument();
  });

  it('displays custom reason when provided', () => {
    const reason = 'Item violates policy';
    render(
      <DecisionStatusMessage
        status={DecisionStatus.REJECTED}
        reason={reason}
      />
    );
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('displays decidedAt timestamp when provided', () => {
    const decidedAt = '2026-01-29T10:00:00Z';
    render(
      <DecisionStatusMessage
        status={DecisionStatus.APPROVED}
        decidedAt={decidedAt}
      />
    );
    expect(screen.getByText(/Decided:/i)).toBeInTheDocument();
  });

  it('displays expiresAt timestamp for APPROVED status', () => {
    const expiresAt = '2026-02-28T10:00:00Z';
    render(
      <DecisionStatusMessage
        status={DecisionStatus.APPROVED}
        expiresAt={expiresAt}
      />
    );
    expect(screen.getByText(/Expires:/i)).toBeInTheDocument();
  });

  it('shows retry button for REJECTED status', () => {
    const onRetry = vi.fn();
    render(
      <DecisionStatusMessage
        status={DecisionStatus.REJECTED}
        onRetry={onRetry}
      />
    );
    const button = screen.getByText('Try Again');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows retry button for EXPIRED status', () => {
    const onRetry = vi.fn();
    render(
      <DecisionStatusMessage
        status={DecisionStatus.EXPIRED}
        onRetry={onRetry}
      />
    );
    const button = screen.getByText('Try Again');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalled();
  });

  it('disables retry button when isLoading is true', () => {
    const onRetry = vi.fn();
    render(
      <DecisionStatusMessage
        status={DecisionStatus.REJECTED}
        onRetry={onRetry}
        isLoading={true}
      />
    );
    const button = screen.getByText('Retrying...');
    expect(button).toBeDisabled();
  });

  it('does not show retry button for APPROVED status', () => {
    render(<DecisionStatusMessage status={DecisionStatus.APPROVED} />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('does not show retry button when onRetry is not provided', () => {
    render(<DecisionStatusMessage status={DecisionStatus.REJECTED} />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('applies correct background color for each status', () => {
    const { container, rerender } = render(
      <DecisionStatusMessage status={DecisionStatus.APPROVED} />
    );
    let div = container.querySelector('div');
    expect(div).toHaveClass('bg-green-50');

    rerender(<DecisionStatusMessage status={DecisionStatus.PENDING} />);
    div = container.querySelector('div');
    expect(div).toHaveClass('bg-yellow-50');

    rerender(<DecisionStatusMessage status={DecisionStatus.REJECTED} />);
    div = container.querySelector('div');
    expect(div).toHaveClass('bg-red-50');

    rerender(<DecisionStatusMessage status={DecisionStatus.EXPIRED} />);
    div = container.querySelector('div');
    expect(div).toHaveClass('bg-blue-50');
  });

  it('accepts assetType prop without error', () => {
    render(
      <DecisionStatusMessage
        status={DecisionStatus.APPROVED}
        assetType={AssetType.LISTING}
      />
    );
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
});
