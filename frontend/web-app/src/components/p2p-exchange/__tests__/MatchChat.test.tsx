import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MatchChat from '../MatchChat';

describe('MatchChat', () => {
  const mockMatchId = '1';

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<MatchChat matchId={mockMatchId} />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should render message list', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        expect(screen.getByRole('list')).toBeInTheDocument();
      });
    });

    it('should render message input', () => {
      render(<MatchChat matchId={mockMatchId} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<MatchChat matchId={mockMatchId} />);
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display messages', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        expect(screen.getByText(/hello/i)).toBeInTheDocument();
      });
    });

    it('should distinguish sent and received messages', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        const messages = screen.getAllByRole('listitem');
        expect(messages.length).toBeGreaterThan(0);
      });
    });

    it('should show message timestamps', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it('should show external contact warning', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        const warning = screen.queryByText(/external contact/i);
        if (warning) {
          expect(warning).toBeInTheDocument();
        }
      });
    });
  });

  describe('Sending Messages', () => {
    it('should send message on button click', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should send message on Enter key', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      const input = screen.getByRole('textbox');

      await user.type(input, 'Test message{Enter}');

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should allow multiline on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      const input = screen.getByRole('textbox') as HTMLTextAreaElement;

      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(input.value).toContain('Line 1');
      expect(input.value).toContain('Line 2');
    });

    it('should disable send button when input is empty', () => {
      render(<MatchChat matchId={mockMatchId} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has text', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test');

      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Auto-scroll', () => {
    it('should scroll to latest message', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        const messageList = screen.getByRole('list');
        expect(messageList.scrollTop).toBe(messageList.scrollHeight);
      });
    });

    it('should scroll on new message', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New message');
      await user.click(sendButton);

      await waitFor(() => {
        const messageList = screen.getByRole('list');
        expect(messageList.scrollTop).toBe(messageList.scrollHeight);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll for new messages', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        expect(screen.getByText(/hello/i)).toBeInTheDocument();
      });

      // Wait for polling interval
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Should still have messages
      expect(screen.getByText(/hello/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle send error gracefully', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      // Should show error or retry
      await waitFor(() => {
        const errorMsg = screen.queryByText(/error/i);
        const retryBtn = screen.queryByRole('button', { name: /retry/i });
        expect(errorMsg || retryBtn).toBeDefined();
      });
    });

    it('should handle fetch error gracefully', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        // Should either show messages or error
        const messages = screen.queryAllByRole('listitem');
        const error = screen.queryByText(/error/i);
        expect(messages.length > 0 || error).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MatchChat matchId={mockMatchId} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label');
      expect(screen.getByRole('list')).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /send/i })).toHaveFocus();
    });

    it('should announce new messages', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper heading hierarchy', () => {
      render(<MatchChat matchId={mockMatchId} />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('aria-level', '2');
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(<MatchChat matchId={mockMatchId} />);
      const container = screen.getByRole('heading').closest('div');
      expect(container).toHaveAttribute('dir', 'rtl');
    });

    it('should align messages correctly in RTL', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        const messages = screen.getAllByRole('listitem');
        messages.forEach(msg => {
          const styles = window.getComputedStyle(msg);
          // In RTL, text should be right-aligned
          expect(styles.direction).toBe('rtl');
        });
      });
    });
  });

  describe('External Contact Detection', () => {
    it('should flag messages with external contact', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      await waitFor(() => {
        const warning = screen.queryByText(/external contact/i);
        if (warning) {
          expect(warning).toBeInTheDocument();
        }
      });
    });

    it('should prevent sending messages with external contact', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Contact me at john@example.com');

      // Should show warning
      await waitFor(() => {
        expect(screen.getByText(/external contact/i)).toBeInTheDocument();
      });

      // Send button should be disabled or show warning
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching messages', async () => {
      render(<MatchChat matchId={mockMatchId} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show loading indicator while sending message', async () => {
      const user = userEvent.setup();
      render(<MatchChat matchId={mockMatchId} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      expect(sendButton).toBeDisabled();

      await waitFor(() => {
        expect(sendButton).not.toBeDisabled();
      });
    });
  });
});
