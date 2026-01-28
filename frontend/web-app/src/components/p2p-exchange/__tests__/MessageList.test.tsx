import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MessageList from '../MessageList';

describe('MessageList', () => {
  const mockMessages = [
    {
      id: 'msg-1',
      senderId: 'user-1',
      senderName: 'Ahmed',
      content: 'Hello, are you available?',
      timestamp: new Date(Date.now() - 60000),
      isOwn: true,
    },
    {
      id: 'msg-2',
      senderId: 'user-2',
      senderName: 'Fatima',
      content: 'Yes, I am available now',
      timestamp: new Date(Date.now() - 30000),
      isOwn: false,
    },
  ];

  const mockOnLoadMore = vi.fn();

  describe('Rendering', () => {
    it('should render message list', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should display all messages', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      expect(screen.getByText('Hello, are you available?')).toBeInTheDocument();
      expect(screen.getByText('Yes, I am available now')).toBeInTheDocument();
    });

    it('should display sender names', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      expect(screen.getByText('Ahmed')).toBeInTheDocument();
      expect(screen.getByText('Fatima')).toBeInTheDocument();
    });

    it('should display timestamps', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      expect(screen.getByText(/ago|minute/i)).toBeInTheDocument();
    });

    it('should distinguish own messages', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      const ownMessage = screen.getByText('Hello, are you available?').closest('li');
      expect(ownMessage).toHaveClass('own-message');
    });

    it('should distinguish other messages', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      const otherMessage = screen.getByText('Yes, I am available now').closest('li');
      expect(otherMessage).toHaveClass('other-message');
    });
  });

  describe('User Interactions', () => {
    it('should load more messages on scroll', async () => {
      const { container } = render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );

      const list = container.querySelector('[role="list"]');
      if (list) {
        list.scrollTop = 0;
        list.dispatchEvent(new Event('scroll'));
      }

      await waitFor(() => {
        expect(mockOnLoadMore).toHaveBeenCalled();
      });
    });

    it('should handle message selection', async () => {
      const user = userEvent.setup();
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );

      const message = screen.getByText('Hello, are you available?');
      await user.click(message);

      expect(message).toHaveClass('selected');
    });
  });

  describe('Accessibility', () => {
    it('should have proper list structure', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      expect(screen.getByRole('list')).toBeInTheDocument();
      const items = screen.getAllByRole('listitem');
      expect(items.length).toBe(mockMessages.length);
    });

    it('should have ARIA labels for messages', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      const items = screen.getAllByRole('listitem');
      items.forEach(item => {
        expect(item).toHaveAttribute('aria-label');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );

      await user.tab();
      const firstItem = screen.getAllByRole('listitem')[0];
      expect(firstItem).toHaveFocus();
    });
  });

  describe('Empty State', () => {
    it('should handle empty message list', () => {
      render(
        <MessageList
          messages={[]}
          onLoadMore={mockOnLoadMore}
        />
      );
      expect(screen.getByText(/no messages|empty/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
          isLoading
        />
      );
      expect(screen.getByText(/loading|please wait/i)).toBeInTheDocument();
    });
  });

  describe('Auto Scroll', () => {
    it('should scroll to bottom on new message', async () => {
      const { rerender } = render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );

      const newMessages = [
        ...mockMessages,
        {
          id: 'msg-3',
          senderId: 'user-1',
          senderName: 'Ahmed',
          content: 'New message',
          timestamp: new Date(),
          isOwn: true,
        },
      ];

      rerender(
        <MessageList
          messages={newMessages}
          onLoadMore={mockOnLoadMore}
        />
      );

      expect(screen.getByText('New message')).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Message Formatting', () => {
    it('should format timestamps correctly', () => {
      render(
        <MessageList
          messages={mockMessages}
          onLoadMore={mockOnLoadMore}
        />
      );
      expect(screen.getByText(/minute|ago/i)).toBeInTheDocument();
    });

    it('should handle long messages', () => {
      const longMessage = {
        ...mockMessages[0],
        content: 'A'.repeat(500),
      };

      render(
        <MessageList
          messages={[longMessage]}
          onLoadMore={mockOnLoadMore}
        />
      );
      expect(screen.getByText(new RegExp('A'.repeat(100)))).toBeInTheDocument();
    });
  });
});
