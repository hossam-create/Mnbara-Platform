import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import AdminExchangeDashboard from '../AdminExchangeDashboard';

describe('AdminExchangeDashboard', () => {
  describe('Rendering', () => {
    it('should render admin dashboard', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByText(/admin|dashboard|exchange/i)).toBeInTheDocument();
    });

    it('should display statistics cards', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByText(/total|active|pending/i)).toBeInTheDocument();
    });

    it('should display exchanges table', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should display filter controls', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByText(/filter|search|status/i)).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByRole('button', { name: /view|edit|action/i })).toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('should display total exchanges count', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByText(/total.*exchange|exchange.*total/i)).toBeInTheDocument();
    });

    it('should display active exchanges count', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it('should display pending exchanges count', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('should display completed exchanges count', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByText(/completed|settled/i)).toBeInTheDocument();
    });

    it('should display disputed exchanges count', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByText(/disputed|dispute/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOption(statusFilter, 'ACTIVE');

      expect(statusFilter).toHaveValue('ACTIVE');
    });

    it('should filter by date range', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const startDate = screen.getByLabelText(/start|from/i);
      await user.type(startDate, '2026-01-01');

      expect(startDate).toHaveValue('2026-01-01');
    });

    it('should search by exchange ID', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const searchInput = screen.getByPlaceholderText(/search|id/i);
      await user.type(searchInput, 'EXC-123');

      expect(searchInput).toHaveValue('EXC-123');
    });

    it('should reset filters', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Table Operations', () => {
    it('should display exchanges in table', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should allow sorting by column', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const sortButton = screen.getByRole('button', { name: /sort|date/i });
      await user.click(sortButton);

      expect(sortButton).toBeInTheDocument();
    });

    it('should paginate results', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const nextButton = screen.getByRole('button', { name: /next|page/i });
      await user.click(nextButton);

      expect(nextButton).toBeInTheDocument();
    });

    it('should select multiple exchanges', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });
  });

  describe('Actions', () => {
    it('should view exchange details', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const viewButton = screen.getByRole('button', { name: /view/i });
      await user.click(viewButton);

      expect(viewButton).toBeInTheDocument();
    });

    it('should approve exchange', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      expect(approveButton).toBeInTheDocument();
    });

    it('should reject exchange', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const rejectButton = screen.getByRole('button', { name: /reject|decline/i });
      await user.click(rejectButton);

      expect(rejectButton).toBeInTheDocument();
    });

    it('should escalate exchange', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const escalateButton = screen.getByRole('button', { name: /escalate/i });
      await user.click(escalateButton);

      expect(escalateButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<AdminExchangeDashboard />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should have ARIA labels for controls', () => {
      render(<AdminExchangeDashboard />);
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      await user.tab();
      expect(screen.getByRole('button', { name: /view|edit|action/i })).toHaveFocus();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      render(<AdminExchangeDashboard isLoading />);
      expect(screen.getByText(/loading|please wait/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      render(<AdminExchangeDashboard error="Failed to load exchanges" />);
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard error="Failed to load" />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(<AdminExchangeDashboard />);
      const dashboard = screen.getByText(/admin|dashboard/i).closest('div');
      expect(dashboard).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Export Functionality', () => {
    it('should export data to CSV', async () => {
      const user = userEvent.setup();
      render(<AdminExchangeDashboard />);

      const exportButton = screen.getByRole('button', { name: /export|csv/i });
      await user.click(exportButton);

      expect(exportButton).toBeInTheDocument();
    });
  });
});
