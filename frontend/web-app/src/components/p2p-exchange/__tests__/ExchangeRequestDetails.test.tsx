import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import ExchangeRequestDetails from '../ExchangeRequestDetails';
import { mockExchangeRequest } from '../../../__tests__/fixtures/mock-data';

describe('ExchangeRequestDetails', () => {
  describe('Rendering', () => {
    it('should render request details', () => {
      render(<ExchangeRequestDetails request={mockExchangeRequest} />);
      expect(screen.getByText(/USD/i)).toBeInTheDocument();
      expect(screen.getByText(/SAR/i)).toBeInTheDocument();
    });

    it('should display all key information', () => {
      render(<ExchangeRequestDetails request={mockExchangeRequest} />);
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
      expect(screen.getByText(/rate/i)).toBeInTheDocument();
      expect(screen.getByText(/fee/i)).toBeInTheDocument();
    });

    it('should show status badge', () => {
      render(<ExchangeRequestDetails request={mockExchangeRequest} />);
      expect(screen.getByText(/OPEN/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle edit action', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(
        <ExchangeRequestDetails request={mockExchangeRequest} onEdit={onEdit} />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalled();
    });

    it('should handle cancel action', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <ExchangeRequestDetails
          request={mockExchangeRequest}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ExchangeRequestDetails request={mockExchangeRequest} />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('aria-level', '2');
    });

    it('should have descriptive labels', () => {
      render(<ExchangeRequestDetails request={mockExchangeRequest} />);
      expect(screen.getByText(/from currency/i)).toBeInTheDocument();
      expect(screen.getByText(/to currency/i)).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(<ExchangeRequestDetails request={mockExchangeRequest} />);
      const container = screen.getByRole('heading').closest('div');
      expect(container).toHaveAttribute('dir', 'rtl');
    });
  });
});
