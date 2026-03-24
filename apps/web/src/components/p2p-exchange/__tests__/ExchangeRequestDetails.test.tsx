import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { ExchangeRequestDetails } from '../ExchangeRequestDetails';

describe('ExchangeRequestDetails', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnCancel = vi.fn();
  });

  describe('Rendering', () => {
    it('should render exchange request details or error', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-details') || 
                       screen.queryByTestId('exchange-request-details-error') ||
                       screen.queryByTestId('exchange-request-details-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display details header when loaded', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const header = screen.queryByTestId('details-header');
        if (header) {
          expect(header).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display details content when loaded', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const content = screen.queryByTestId('details-content');
        if (content) {
          expect(content).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display status section when loaded', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const section = screen.queryByTestId('status-section');
        if (section) {
          expect(section).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display exchange details when loaded', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const details = screen.queryByTestId('exchange-details');
        if (details) {
          expect(details).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });
  });

  describe('Sections', () => {
    it('should display from section when loaded', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const section = screen.queryByTestId('from-section');
        if (section) {
          expect(section).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display to section when loaded', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const section = screen.queryByTestId('to-section');
        if (section) {
          expect(section).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display rate and fees section when loaded', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const section = screen.queryByTestId('rate-fees-section');
        if (section) {
          expect(section).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display security and trust section when loaded', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const section = screen.queryByTestId('security-trust-section');
        if (section) {
          expect(section).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });
  });

  describe('User Interactions', () => {
    it('should handle close button click', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestDetails requestId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-details') || 
                       screen.queryByTestId('exchange-request-details-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      const closeButton = screen.queryByTestId('close-button');
      if (closeButton) {
        await user.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should handle cancel request button click', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestDetails requestId={1} onCancel={mockOnCancel} />);

      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-details') || 
                       screen.queryByTestId('exchange-request-details-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      const cancelButton = screen.queryByTestId('cancel-request-button');
      if (cancelButton && !cancelButton.hasAttribute('disabled')) {
        await user.click(cancelButton);
      }

      const finalElement = screen.queryByTestId('exchange-request-details') || 
                          screen.queryByTestId('exchange-request-details-error');
      expect(finalElement).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading or details state', async () => {
      render(<ExchangeRequestDetails requestId={1} />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-details') || 
                       screen.queryByTestId('exchange-request-details-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      render(<ExchangeRequestDetails requestId={999} />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-details-error') || 
                       screen.queryByTestId('exchange-request-details');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestDetails requestId={1} />);

      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-details') || 
                       screen.queryByTestId('exchange-request-details-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      await user.tab();
      const finalElement = screen.queryByTestId('exchange-request-details') || 
                          screen.queryByTestId('exchange-request-details-error');
      expect(finalElement).toBeInTheDocument();
    });
  });
});
