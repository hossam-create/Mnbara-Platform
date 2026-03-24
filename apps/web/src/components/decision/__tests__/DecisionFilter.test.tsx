/**
 * DecisionFilter Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DecisionFilter } from '../DecisionFilter';
import { DecisionStatus } from '../../../types/decision.types';

describe('DecisionFilter', () => {
  it('renders all status options', () => {
    const onStatusChange = vi.fn();
    render(<DecisionFilter onStatusChange={onStatusChange} />);
    
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('calls onStatusChange when status button is clicked', () => {
    const onStatusChange = vi.fn();
    render(<DecisionFilter onStatusChange={onStatusChange} />);
    
    fireEvent.click(screen.getByText('Approved'));
    expect(onStatusChange).toHaveBeenCalledWith(DecisionStatus.APPROVED);
  });

  it('highlights selected status', () => {
    const onStatusChange = vi.fn();
    const { container } = render(
      <DecisionFilter
        selectedStatus={DecisionStatus.APPROVED}
        onStatusChange={onStatusChange}
      />
    );
    
    const buttons = container.querySelectorAll('button');
    const approvedButton = Array.from(buttons).find(btn => btn.textContent === 'Approved');
    expect(approvedButton).toHaveClass('bg-green-200');
  });

  it('renders label by default', () => {
    const onStatusChange = vi.fn();
    render(<DecisionFilter onStatusChange={onStatusChange} />);
    expect(screen.getByText('Decision Status')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    const onStatusChange = vi.fn();
    render(
      <DecisionFilter
        onStatusChange={onStatusChange}
        showLabel={false}
      />
    );
    expect(screen.queryByText('Decision Status')).not.toBeInTheDocument();
  });

  it('renders as select dropdown when compact is true', () => {
    const onStatusChange = vi.fn();
    const { container } = render(
      <DecisionFilter
        onStatusChange={onStatusChange}
        compact={true}
      />
    );
    
    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
  });

  it('calls onStatusChange when select value changes', () => {
    const onStatusChange = vi.fn();
    const { container } = render(
      <DecisionFilter
        onStatusChange={onStatusChange}
        compact={true}
      />
    );
    
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: DecisionStatus.APPROVED } });
    expect(onStatusChange).toHaveBeenCalledWith(DecisionStatus.APPROVED);
  });

  it('defaults to ALL status', () => {
    const onStatusChange = vi.fn();
    render(<DecisionFilter onStatusChange={onStatusChange} />);
    
    const allButton = screen.getByText('All Statuses');
    expect(allButton).toHaveClass('bg-gray-200');
  });

  it('handles ALL status selection', () => {
    const onStatusChange = vi.fn();
    render(<DecisionFilter onStatusChange={onStatusChange} />);
    
    fireEvent.click(screen.getByText('All Statuses'));
    expect(onStatusChange).toHaveBeenCalledWith('ALL');
  });

  it('applies correct color classes for each status', () => {
    const onStatusChange = vi.fn();
    const { container, rerender } = render(
      <DecisionFilter
        selectedStatus={DecisionStatus.APPROVED}
        onStatusChange={onStatusChange}
      />
    );
    
    let buttons = container.querySelectorAll('button');
    let approvedButton = Array.from(buttons).find(btn => btn.textContent === 'Approved');
    expect(approvedButton).toHaveClass('bg-green-200');

    rerender(
      <DecisionFilter
        selectedStatus={DecisionStatus.PENDING}
        onStatusChange={onStatusChange}
      />
    );
    buttons = container.querySelectorAll('button');
    let pendingButton = Array.from(buttons).find(btn => btn.textContent === 'Pending Review');
    expect(pendingButton).toHaveClass('bg-blue-200');

    rerender(
      <DecisionFilter
        selectedStatus={DecisionStatus.REJECTED}
        onStatusChange={onStatusChange}
      />
    );
    buttons = container.querySelectorAll('button');
    let rejectedButton = Array.from(buttons).find(btn => btn.textContent === 'Rejected');
    expect(rejectedButton).toHaveClass('bg-red-200');

    rerender(
      <DecisionFilter
        selectedStatus={DecisionStatus.EXPIRED}
        onStatusChange={onStatusChange}
      />
    );
    buttons = container.querySelectorAll('button');
    let expiredButton = Array.from(buttons).find(btn => btn.textContent === 'Expired');
    expect(expiredButton).toHaveClass('bg-yellow-200');
  });

  it('renders buttons with hover effects', () => {
    const onStatusChange = vi.fn();
    const { container } = render(
      <DecisionFilter onStatusChange={onStatusChange} />
    );
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      const className = button.className;
      // Check that button has transition-colors and some color classes
      expect(className).toMatch(/transition-colors/);
      expect(className).toMatch(/bg-/);
    });
  });
});
