import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import MatchChat from '../../components/p2p-exchange/MatchChat';
import MatchDetails from '../../components/p2p-exchange/MatchDetails';
import MessageList from '../../components/p2p-exchange/MessageList';
import MessageInput from '../../components/p2p-exchange/MessageInput';
import { mockMatches } from '../fixtures/mock-data';

describe('Match Communication Flow Integration', () => {
  const mockMatch = mockMatches[0];
  const mockOnClose = vi.fn();
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Match Communication Workflow', () => {
    it('should view match and communicate', async () => {
      const user = userEvent.setup();

      // Step 1: Display match details
      const { rerender } = render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );

      // Step 2: Verify match info
      expect(screen.getByText(/match details/i)).toBeInTheDocument();

      // Step 3: Open chat
      rerender(
        <MatchChat
          match={mockMatch}
          onClose={mockOnClose}
        />
      );

      // Step 4: Verify chat interface
      expect(screen.getByText(/message|chat/i)).toBeInTheDocument();

      // Step 5: Send message
      const messageInput = screen.getByRole('textbox');
      await user.type(messageInput, 'Hello, are you available?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Step 6: Verify message sent
      await waitFor(() => {
        expect(messageInput).toHaveValue('');
      });
    });

    it('should display message history', async () => {
      const user = userEvent.setup();

      const messages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Ahmed',
          content: 'Hello',
          timestamp: new Date(Date.now() - 60000),
          isOwn: true,
        },
        {
          id: 'msg-2',
          senderId: 'user-2',
          senderName: 'Fatima',
          content: 'Hi there!',
          timestamp: new Date(Date.now() - 30000),
          isOwn: false,
        },
      ];

      render(
        <MessageList
          messages={messages}
          onLoadMore={vi.fn()}
        />
      );

      // Verify both messages displayed
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();

      // Verify sender names
      expect(screen.getByText('Ahmed')).toBeInTheDocument();
      expect(screen.getByText('Fatima')).toBeInTheDocument();
    });

    it('should handle real-time message updates', async () => {
      const user = userEvent.setup();

      const initialMessages = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Ahmed',
          content: 'Hello',
          timestamp: new Date(),
          isOwn: true,
        },
      ];

      const { rerender } = render(
        <MessageList
          messages={initialMessages}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getByText('Hello')).toBeInTheDocument();

      // New message arrives
      const updatedMessages = [
        ...initialMessages,
        {
          id: 'msg-2',
          senderId: 'user-2',
          senderName: 'Fatima',
          content: 'Hi there!',
          timestamp: new Date(),
          isOwn: false,
        },
      ];

      rerender(
        <MessageList
          messages={updatedMessages}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should validate message input', async () => {
      const user = userEvent.setup();

      render(<MessageInput onSend={mockOnSend} />);

      const sendButton = screen.getByRole('button', { name: /send/i });

      // Try to send empty message
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();

      // Try to send whitespace
      const input = screen.getByRole('textbox');
      await user.type(input, '   ');
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should enforce character limit', async () => {
      const user = userEvent.setup();

      render(<MessageInput onSend={mockOnSend} maxLength={100} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'A'.repeat(150));

      expect(input).toHaveValue('A'.repeat(100));
    });
  });

  describe('Message Sending', () => {
    it('should send message on Enter key', async () => {
      const user = userEvent.setup();

      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('should send message on button click', async () => {
      const user = userEvent.setup();

      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();

      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(input.value).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle send errors', async () => {
      const user = userEvent.setup();

      mockOnSend.mockRejectedValueOnce(new Error('Network error'));

      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('should retry failed messages', async () => {
      const user = userEvent.setup();

      mockOnSend.mockRejectedValueOnce(new Error('Network error'));
      mockOnSend.mockResolvedValueOnce({ id: 'msg-1' });

      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockOnSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<MessageInput onSend={mockOnSend} />);

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /send/i })).toHaveFocus();
    });

    it('should have proper ARIA labels', () => {
      render(<MessageInput onSend={mockOnSend} />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label');
    });
  });

  describe('RTL Support', () => {
    it('should support Arabic messages', async () => {
      const user = userEvent.setup();

      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'مرحبا');

      expect(input).toHaveValue('مرحبا');
    });

    it('should render with RTL direction', () => {
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('dir', 'rtl');
    });
  });
});
