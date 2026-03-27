import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { MessageList } from '../MessageList';
import { createMockMessage } from '../../../__tests__/fixtures/mock-data';

describe('MessageList', () => {
  const currentUserId = 'user-1';
  
  const mockMessages = [
    createMockMessage({
      id: 'msg-1',
      senderId: 'user-1',
      senderName: 'Ahmed',
      content: 'Hello, are you available?',
      createdAt: new Date(Date.now() - 60000).toISOString(),
    }),
    createMockMessage({
      id: 'msg-2',
      senderId: 'user-2',
      senderName: 'Fatima',
      content: 'Yes, I am available now',
      createdAt: new Date(Date.now() - 30000).toISOString(),
    }),
  ];

  describe('Rendering', () => {
    it('should render message list', () => {
      render(
        <MessageList
          messages={mockMessages}
          currentUserId={currentUserId}
        />
      );
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
    });

    it('should display all messages', () => {
      render(
        <MessageList
          messages={mockMessages}
          currentUserId={currentUserId}
        />
      );
      expect(screen.getByTestId('message-text-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-text-msg-2')).toBeInTheDocument();
    });

    it('should display sender names for received messages', () => {
      render(
        <MessageList
          messages={mockMessages}
          currentUserId={currentUserId}
        />
      );
      expect(screen.getByTestId('message-sender-msg-2')).toHaveTextContent('Fatima');
    });

    it('should display timestamps', () => {
      render(
        <MessageList
          messages={mockMessages}
          currentUserId={currentUserId}
        />
      );
      expect(screen.getByTestId('message-timestamp-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-timestamp-msg-2')).toBeInTheDocument();
    });

    it('should distinguish own messages', () => {
      render(
        <MessageList
          messages={mockMessages}
          currentUserId={currentUserId}
        />
      );
      const ownMessage = screen.getByTestId('message-item-msg-1');
      expect(ownMessage).toHaveClass('justify-end');
    });

    it('should distinguish other messages', () => {
      render(
        <MessageList
          messages={mockMessages}
          currentUserId={currentUserId}
        />
      );
      const otherMessage = screen.getByTestId('message-item-msg-2');
      expect(otherMessage).toHaveClass('justify-start');
    });
  });

  describe('Empty State', () => {
    it('should handle empty message list', () => {
      render(
        <MessageList
          messages={[]}
          currentUserId={currentUserId}
        />
      );
      expect(screen.getByTestId('message-list-empty')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      render(
        <MessageList
          messages={mockMessages}
          currentUserId={currentUserId}
          isLoading={true}
        />
      );
      expect(screen.getByTestId('message-list-loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Message Warnings', () => {
    it('should display external contact warning', () => {
      const messageWithWarning = createMockMessage({
        id: 'msg-3',
        senderId: 'user-2',
        content: 'Contact me at +966501234567',
        containsExternalContact: true,
      });

      render(
        <MessageList
          messages={[messageWithWarning]}
          currentUserId={currentUserId}
        />
      );
      expect(screen.getByTestId('message-external-warning-msg-3')).toBeInTheDocument();
    });

    it('should display flagged message indicator', () => {
      const flaggedMessage = createMockMessage({
        id: 'msg-4',
        senderId: 'user-2',
        content: 'Suspicious message',
        isFlagged: true,
        flagReason: 'Spam',
      });

      render(
        <MessageList
          messages={[flaggedMessage]}
          currentUserId={currentUserId}
        />
      );
      expect(screen.getByTestId('message-flagged-msg-4')).toBeInTheDocument();
    });
  });

  describe('Auto Scroll', () => {
    it('should render new messages', async () => {
      const { rerender } = render(
        <MessageList
          messages={mockMessages}
          currentUserId={currentUserId}
        />
      );

      const newMessage = createMockMessage({
        id: 'msg-3',
        senderId: 'user-1',
        content: 'New message',
        createdAt: new Date().toISOString(),
      });

      rerender(
        <MessageList
          messages={[...mockMessages, newMessage]}
          currentUserId={currentUserId}
        />
      );

      expect(screen.getByTestId('message-text-msg-3')).toBeInTheDocument();
    });
  });

  describe('Message Content', () => {
    it('should handle long messages', () => {
      const longMessage = createMockMessage({
        id: 'msg-5',
        content: 'A'.repeat(500),
      });

      render(
        <MessageList
          messages={[longMessage]}
          currentUserId={currentUserId}
        />
      );
      expect(screen.getByTestId('message-text-msg-5')).toBeInTheDocument();
    });

    it('should preserve message formatting', () => {
      const formattedMessage = createMockMessage({
        id: 'msg-6',
        content: 'Line 1\nLine 2\nLine 3',
      });

      render(
        <MessageList
          messages={[formattedMessage]}
          currentUserId={currentUserId}
        />
      );
      const messageText = screen.getByTestId('message-text-msg-6');
      expect(messageText).toHaveClass('whitespace-pre-wrap');
    });
  });
});
