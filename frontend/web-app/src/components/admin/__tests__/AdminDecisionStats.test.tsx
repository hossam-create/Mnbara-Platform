/**
 * AdminDecisionStats Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminDecisionStats } from '../AdminDecisionStats';

const mockStats = {
  total: 100,
  approved: 70,
  pending: 20,
  rejected: 8,
  expired: 2,
  averageDecisionTime: 45,
  approvalRate: 70,
  rejectionRate: 8
};

describe('AdminDecisionStats', () => {
  it('renders all stat cards', () => {
    const { container } = render(<AdminDecisionStats stats={mockStats} />);
    const cards = container.querySelectorAll('.bg-white.rounded-lg');
    expect(cards.length).toBeGreaterThan(0);
    expect(screen.getByText('Total Decisions')).toBeInTheDocument();
  });

  it('displays correct stat values', () => {
    render(<AdminDecisionStats stats={mockStats} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays approval rate', () => {
    render(<AdminDecisionStats stats={mockStats} />);
    expect(screen.getByText('70.0% approval rate')).toBeInTheDocument();
  });

  it('displays rejection rate', () => {
    render(<AdminDecisionStats stats={mockStats} />);
    expect(screen.getByText('8.0% rejection rate')).toBeInTheDocument();
  });

  it('formats time correctly in minutes', () => {
    render(<AdminDecisionStats stats={mockStats} />);
    expect(screen.getByText('45m')).toBeInTheDocument();
  });

  it('formats time correctly in hours', () => {
    const statsWithHours = { ...mockStats, averageDecisionTime: 120 };
    render(<AdminDecisionStats stats={statsWithHours} />);
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <AdminDecisionStats stats={mockStats} isLoading={true} />
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays status distribution', () => {
    render(<AdminDecisionStats stats={mockStats} />);
    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });

  it('displays pending percentage', () => {
    render(<AdminDecisionStats stats={mockStats} />);
    expect(screen.getByText('Pending Percentage')).toBeInTheDocument();
  });

  it('calculates pending percentage correctly', () => {
    render(<AdminDecisionStats stats={mockStats} />);
    // 20/100 = 20%
    const percentageText = screen.getByText('20%');
    expect(percentageText).toBeInTheDocument();
  });

  it('handles zero stats', () => {
    const zeroStats = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      expired: 0,
      averageDecisionTime: 0,
      approvalRate: 0,
      rejectionRate: 0
    };
    const { container } = render(<AdminDecisionStats stats={zeroStats} />);
    const values = container.querySelectorAll('.text-3xl');
    expect(values.length).toBeGreaterThan(0);
  });

  it('displays progress bars', () => {
    const { container } = render(<AdminDecisionStats stats={mockStats} />);
    const progressBars = container.querySelectorAll('.bg-green-600, .bg-red-600');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('displays circular progress for pending', () => {
    const { container } = render(<AdminDecisionStats stats={mockStats} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });
});
