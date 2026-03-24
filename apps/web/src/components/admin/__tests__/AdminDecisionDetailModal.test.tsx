/**
 * AdminDecisionDetailModal Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AdminDecisionDetailModal } from '../AdminDecisionDetailModal';
import { DecisionStatus, DecisionSource } from '../../../types/decision.types';

const mockDecision = {
  id: '1',
  assetId: 'asset-1',
  assetTitle: 'Vintage Camera',
  status: DecisionStatus.APPROVED,
  source: DecisionSource.INTERNAL,
  requestedAt: '2026-01-20T10:00:00Z',
  decidedAt: '2026-01-20T10:05:00Z',
  decidedBy: 'System',
  reason: 'Meets all requirements'
};

describe('AdminDecisionDetailModal', () => {
  it('does not render when not open', () => {
    const { container } = render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Decision Details')).toBeInTheDocument();
  });

  it('displays asset information', () => {
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    expect(screen.getByText('asset-1')).toBeInTheDocument();
  });

  it('displays decision information', () => {
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
    expect(screen.getByText('INTERNAL')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Meets all requirements')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows override button', () => {
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Override Decision')).toBeInTheDocument();
  });

  it('shows override form when override button is clicked', () => {
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Override Decision'));
    expect(screen.getByText('New Status')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Explain why/)).toBeInTheDocument();
  });

  it('calls onOverride with correct parameters', async () => {
    const onOverride = vi.fn();
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={vi.fn()}
        onOverride={onOverride}
      />
    );
    
    fireEvent.click(screen.getByText('Override Decision'));
    
    const statusSelects = screen.getAllByDisplayValue('Select status...');
    fireEvent.change(statusSelects[0], { target: { value: DecisionStatus.REJECTED } });
    
    const reasonTextarea = screen.getByPlaceholderText(/Explain why/);
    fireEvent.change(reasonTextarea, { target: { value: 'Invalid item' } });
    
    fireEvent.click(screen.getByText('Confirm Override'));
    
    await waitFor(() => {
      expect(onOverride).toHaveBeenCalledWith(DecisionStatus.REJECTED, 'Invalid item');
    });
  });

  it('disables confirm button when form is incomplete', () => {
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Override Decision'));
    
    const confirmButton = screen.getByText('Confirm Override');
    expect(confirmButton).toBeDisabled();
  });

  it('shows loading state', () => {
    const { container } = render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        isLoading={true}
        onClose={vi.fn()}
      />
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('cancels override form', () => {
    render(
      <AdminDecisionDetailModal
        decision={mockDecision}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Override Decision'));
    expect(screen.getByText('Confirm Override')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Confirm Override')).not.toBeInTheDocument();
  });

  it('handles missing optional fields', () => {
    const decisionWithoutOptionals = {
      id: '1',
      assetId: 'asset-1',
      assetTitle: 'Vintage Camera',
      status: DecisionStatus.PENDING,
      source: DecisionSource.EXTERNAL,
      requestedAt: '2026-01-20T10:00:00Z'
    };
    
    render(
      <AdminDecisionDetailModal
        decision={decisionWithoutOptionals}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });
});
