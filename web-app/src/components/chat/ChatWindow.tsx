/**
 * ChatWindow Component
 * Main chat area displaying messages in a conversation
 */

import React, { useRef, useEffect, useState } from 'react';
import type { Message, ChatUser, TypingIndicator } from '../../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator as TypingIndicatorComponent } from './TypingIndicator';
import { formatMessageTime } from '../../utils/dateUtils';
import './ChatWindow.css';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  otherParticipant?: ChatUser;
  typingUsers?: TypingIndicator[];
  onLoadMore?: () => void;
  onMessageRead?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  loading?: boolean;
  hasMore?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUserId,
  otherParticipant,
  typingUsers = [],
  onLoadMore,
  onMessageRead,
  onReaction,
  onReply,
  onDelete,
  loading = false,
  hasMore = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtTop, setIsAtTop] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle scroll for loading more messages
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      setIsAtTop(scrollTop === 0);
    }
  };

  // Load more when scrolled to top
  useEffect(() => {
    if (isAtTop && hasMore && !loading) {
      onLoadMore?.();
    }
  }, [isAtTop, hasMore, loading, onLoadMore]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== currentUserId && msg.status !== 'read'
      );
      if (unreadMessages.length > 0) {
        unreadMessages.forEach((msg) => onMessageRead?.(msg.id));
      }
    }
  }, [messages, currentUserId, onMessageRead]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as { [key: string]: Message[] });

  // Group messages by sender (consecutive messages from same sender)
  const processMessages = (dateMessages: Message[]) => {
    const processed: { message: Message; isConsecutive: boolean; showAvatar: boolean }[] = [];
    
    dateMessages.forEach((message, index) => {
      const prevMessage = index > 0 ? dateMessages[index - 1] : null;
      const isConsecutive = prevMessage?.senderId === message.senderId;
      const showAvatar = !isConsecutive || index === 0;
      
      processed.push({
        message,
        isConsecutive,
        showAvatar,
      });
    });
    
    return processed;
  };

  return (
    <div className="chat-window" ref={messagesContainerRef} onScroll={handleScroll}>
      {/* Load More Trigger */}
      {hasMore && (
        <div className="chat-window__load-more">
          {loading ? (
            <div className="chat-window__spinner"></div>
          ) : (
            <button className="chat-window__load-more-btn" onClick={onLoadMore}>
              Load earlier messages
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="chat-window__messages">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="chat-window__date-group">
            {/* Date Separator */}
            <div className="chat-window__date-separator">
              <span className="chat-window__date-label">
                {new Date(date).toDateString() === new Date().toDateString()
                  ? 'Today'
                  : new Date(date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Messages for this date */}
            {processMessages(dateMessages).map(({ message, isConsecutive, showAvatar }) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                showAvatar={showAvatar}
                senderAvatar={showAvatar && message.senderId !== currentUserId ? otherParticipant?.avatarUrl : undefined}
                senderName={showAvatar && message.senderId !== currentUserId ? otherParticipant?.displayName : undefined}
                isConsecutive={isConsecutive}
                onReaction={(emoji) => onReaction?.(message.id, emoji)}
                onReply={() => onReply?.(message)}
                onDelete={() => onDelete?.(message.id)}
              />
            ))}
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="chat-window__typing">
            <TypingIndicatorComponent users={typingUsers} />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
