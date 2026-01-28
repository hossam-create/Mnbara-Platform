import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../__tests__/utils/test-utils';
import TrustLevelBadge from '../TrustLevelBadge';

describe('TrustLevelBadge', () => {
  describe('Rendering', () => {
    it('should render level 1 badge', () => {
      render(<TrustLevelBadge level={1} />);
      expect(screen.getByText(/level 1|beginner/i)).toBeInTheDocument();
    });

    it('should render level 2 badge', () => {
      render(<TrustLevelBadge level={2} />);
      expect(screen.getByText(/level 2|trusted/i)).toBeInTheDocument();
    });

    it('should render level 3 badge', () => {
      render(<TrustLevelBadge level={3} />);
      expect(screen.getByText(/level 3|verified/i)).toBeInTheDocument();
    });

    it('should render level 4 badge', () => {
      render(<TrustLevelBadge level={4} />);
      expect(screen.getByText(/level 4|elite/i)).toBeInTheDocument();
    });

    it('should render level 5 badge', () => {
      render(<TrustLevelBadge level={5} />);
      expect(screen.getByText(/level 5|master/i)).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should have correct color for level 1', () => {
      render(<TrustLevelBadge level={1} />);
      const badge = screen.getByText(/level 1|beginner/i);
      expect(badge).toHaveClass('bg-gray');
    });

    it('should have correct color for level 2', () => {
      render(<TrustLevelBadge level={2} />);
      const badge = screen.getByText(/level 2|trusted/i);
      expect(badge).toHaveClass('bg-blue');
    });

    it('should have correct color for level 3', () => {
      render(<TrustLevelBadge level={3} />);
      const badge = screen.getByText(/level 3|verified/i);
      expect(badge).toHaveClass('bg-green');
    });

    it('should have correct color for level 4', () => {
      render(<TrustLevelBadge level={4} />);
      const badge = screen.getByText(/level 4|elite/i);
      expect(badge).toHaveClass('bg-purple');
    });

    it('should have correct color for level 5', () => {
      render(<TrustLevelBadge level={5} />);
      const badge = screen.getByText(/level 5|master/i);
      expect(badge).toHaveClass('bg-gold');
    });
  });

  describe('Icons', () => {
    it('should display appropriate icon for level', () => {
      render(<TrustLevelBadge level={3} />);
      const badge = screen.getByRole('img', { hidden: true });
      expect(badge).toBeInTheDocument();
    });

    it('should have star icon for high levels', () => {
      render(<TrustLevelBadge level={5} />);
      const badge = screen.getByRole('img', { hidden: true });
      expect(badge).toHaveAttribute('alt', expect.stringContaining('star'));
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<TrustLevelBadge level={3} />);
      const badge = screen.getByRole('img', { hidden: true });
      expect(badge).toHaveAttribute('aria-label');
    });

    it('should have semantic HTML', () => {
      render(<TrustLevelBadge level={3} />);
      const badge = screen.getByRole('status', { hidden: true });
      expect(badge).toBeInTheDocument();
    });

    it('should be readable by screen readers', () => {
      render(<TrustLevelBadge level={3} />);
      expect(screen.getByText(/level 3|verified/i)).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should show tooltip on hover', async () => {
      const { container } = render(<TrustLevelBadge level={3} showTooltip />);
      const badge = container.querySelector('[role="tooltip"]');
      expect(badge).toBeInTheDocument();
    });

    it('should display tooltip text', () => {
      render(<TrustLevelBadge level={3} showTooltip />);
      expect(screen.getByText(/verified|trusted/i)).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      render(<TrustLevelBadge level={3} size="sm" />);
      const badge = screen.getByText(/level 3|verified/i);
      expect(badge).toHaveClass('text-sm');
    });

    it('should render medium size', () => {
      render(<TrustLevelBadge level={3} size="md" />);
      const badge = screen.getByText(/level 3|verified/i);
      expect(badge).toHaveClass('text-base');
    });

    it('should render large size', () => {
      render(<TrustLevelBadge level={3} size="lg" />);
      const badge = screen.getByText(/level 3|verified/i);
      expect(badge).toHaveClass('text-lg');
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(<TrustLevelBadge level={3} />);
      const badge = screen.getByRole('status', { hidden: true });
      expect(badge).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid level gracefully', () => {
      render(<TrustLevelBadge level={0} />);
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should handle level above max', () => {
      render(<TrustLevelBadge level={10} />);
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });
  });
});
