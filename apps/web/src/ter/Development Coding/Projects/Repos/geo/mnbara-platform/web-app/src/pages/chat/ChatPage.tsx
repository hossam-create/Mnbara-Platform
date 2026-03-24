/**
 * ChatPage - Main Chat Page
 * Displays the complete chat interface with conversation list and chat window
 */

import React, { useState, useCallback } from 'react';
import type { 
  ConversationListItem, 
  Message, 
  ChatUser, 
  TypingIndicator,
  Message as MessageType,
  Conversation,
  ConversationSearchFilters,
  ConversationSortOptions 
} from '../../types';
import {
  ConversationList,
  ChatWindow,
  ChatHeader,
  MessageInput,
} from '../../components/chat';
import './ChatPage.css';

// Mock current user
const CURRENT_USER_ID = 'user-1';
const CURRENT_USER: ChatUser = {
  id: CURRENT_USER_ID,
  username: 'currentuser',
  displayName: 'Current User',
  avatarUrl: undefined,
  onlineStatus: 'online',
  role: 'buyer',
  trustScore: 85,
  verified: true,
};

// Mock participants
const mockParticipants: { [key: string]: ChatUser } = {
  'user-2': {
    id: 'user-2',
    username: 'seller_ahmed',
    displayName: 'Ahmed Hassan',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
    onlineStatus: 'online',
    role: 'seller',
    trustScore: 92,
    verified: true,
  },
  'user-3': {
    id: 'user-3',
    username: 'buyer_fatima',
    displayName: 'Fatima Ali',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
    onlineStatus: 'offline',
    lastSeenAt: new Date(Date.now() - 3600000).toISOString(),
    role: 'buyer',
    trustScore: 78,
    verified: false,
  },
  'user-4': {
    id: 'user-4',
    username: 'store_owner',
    displayName: 'TechStore Official',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techstore',
    onlineStatus: 'online',
    role: 'seller',
    trustScore: 95,
    verified: true,
  },
};

// Mock conversations
const mockConversations: ConversationListItem[] = [
  {
    conversation: {
      id: 'conv-1',
      participants: [CURRENT_USER, mockParticipants['user-2']],
      type: 'order',
      lastMessage: {
        id: 'msg-5',
        conversationId: 'conv-1',
        senderId: 'user-2',
        content: { text: 'Your order has been shipped!' },
        type: 'text',
        status: 'delivered',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      unreadCount: 2,
      isPinned: true,
      isArchived: false,
      isBlocked: false,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      orderId: 'order-12345678',
    },
    otherParticipant: mockParticipants['user-2'],
    preview: 'Your order has been shipped!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    hasUnread: true,
    unreadCount: 2,
    isOnline: true,
  },
  {
    conversation: {
      id: 'conv-2',
      participants: [CURRENT_USER, mockParticipants['user-3']],
      type: 'direct',
      lastMessage: {
        id: 'msg-8',
        conversationId: 'conv-2',
        senderId: 'user-3',
        content: { text: 'Thanks for your interest!' },
        type: 'text',
        status: 'read',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isBlocked: false,
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    otherParticipant: mockParticipants['user-3'],
    preview: 'Thanks for your interest!',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    hasUnread: false,
    unreadCount: 0,
    isOnline: false,
  },
  {
    conversation: {
      id: 'conv-3',
      participants: [CURRENT_USER, mockParticipants['user-4']],
      type: 'order',
      lastMessage: {
        id: 'msg-12',
        conversationId: 'conv-3',
        senderId: 'user-4',
        content: { text: 'We offer 2-year warranty on all products' },
        type: 'text',
        status: 'read',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isBlocked: false,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      orderId: 'order-87654321',
    },
    otherParticipant: mockParticipants['user-4'],
    preview: 'We offer 2-year warranty on all products',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    hasUnread: false,
    unreadCount: 0,
    isOnline: true,
  },
];

// Mock messages for a conversation
const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: CURRENT_USER_ID,
    content: { text: 'Hi, I\'m interested in your product' },
    type: 'text',
    status: 'read',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-2',
    content: { text: 'Hello! Thanks for your interest. How can I help you?' },
    type: 'text',
    status: 'read',
    timestamp: new Date(Date.now() - 7000000).toISOString(),
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: CURRENT_USER_ID,
    content: { text: 'Is this item still available?' },
    type: 'text',
    status: 'read',
    timestamp: new Date(Date.now() - 6800000).toISOString(),
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    senderId: 'user-2',
    content: { text: 'Yes, it is! Would you like to proceed with the purchase?' },
    type: 'text',
    status: 'read',
    timestamp: new Date(Date.now() - 6600000).toISOString(),
  },
  {
    id: 'msg-5',
    conversationId: 'conv-1',
    senderId: 'user-2',
    content: { text: 'Your order has been shipped!' },
    type: 'text',
    status: 'delivered',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reactions: [{ emoji: '👍', userId: CURRENT_USER_ID, count: 1, users: [CURRENT_USER_ID] }],
  },
];

export const ChatPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>('conv-1');
  const [conversations] = useState(mockConversations);
  const [messages] = useState(mockMessages);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  const selectedConversation = conversations.find(
    (c) => c.conversation.id === selectedConversationId
  );
  const selectedParticipant = selectedConversation?.otherParticipant;

  // Get other participant for selected conversation
  const getOtherParticipant = useCallback((convId: string): ChatUser | undefined => {
    const conv = conversations.find((c) => c.conversation.id === convId);
    return conv?.otherParticipant;
  }, [conversations]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (inputText.trim()) {
      // In real app, this would send to API
      console.log('Sending message:', inputText);
      setInputText('');
      setReplyTo(null);
    }
  }, [inputText]);

  // Handle typing
  const handleTyping = useCallback(() => {
    // In real app, this would emit typing event
  }, []);

  const handleStopTyping = useCallback(() => {
    // In real app, this would emit stop typing event
  }, []);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setReplyTo(null);
  }, []);

  // Handle reply
  const handleReply = useCallback((message: MessageType) => {
    setReplyTo(message);
  }, []);

  // Handle message read
  const handleMessageRead = useCallback((messageId: string) => {
    // In real app, this would mark message as read
    console.log('Message marked as read:', messageId);
  }, []);

  // Handle reaction
  const handleReaction = useCallback((messageId: string, emoji: string) => {
    // In real app, this would add reaction
    console.log('Adding reaction:', messageId, emoji);
  }, []);

  // Handle search
  const handleSearch = useCallback((filters: ConversationSearchFilters) => {
    // In real app, this would filter conversations
    console.log('Search filters:', filters);
  }, []);

  // Handle sort
  const handleSort = useCallback((options: ConversationSortOptions) => {
    // In real app, this would sort conversations
    console.log('Sort options:', options);
  }, []);

  // Handle archive
  const handleArchive = useCallback(() => {
    console.log('Archive conversation');
  }, []);

  // Handle block
  const handleBlock = useCallback(() => {
    console.log('Block user');
  }, []);

  // Handle report
  const handleReport = useCallback(() => {
    console.log('Report conversation');
  }, []);

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    console.log('Create new conversation');
  }, []);

  // Empty state when no conversation selected
  if (!selectedConversationId) {
    return (
      <div className="chat-page">
        <ConversationList
          conversations={conversations}
          onSelect={handleSelectConversation}
          onSearch={handleSearch}
          onSort={handleSort}
          onCreateNew={handleNewConversation}
        />
        <div className="chat-page__empty">
          <div className="chat-page__empty-icon">💬</div>
          <h2>Welcome to Messages</h2>
          <p>Select a conversation to start chatting or start a new one.</p>
          <button className="chat-page__empty-btn" onClick={handleNewConversation}>
            New Conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Conversation List */}
      <ConversationList
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={handleSelectConversation}
        onSearch={handleSearch}
        onSort={handleSort}
        onCreateNew={handleNewConversation}
      />

      {/* Chat Window */}
      <div className="chat-page__window">
        <ChatHeader
          participant={selectedParticipant}
          conversation={selectedConversation?.conversation}
          onArchive={handleArchive}
          onBlock={handleBlock}
          onReport={handleReport}
        />
        
        <ChatWindow
          messages={messages}
          currentUserId={CURRENT_USER_ID}
          otherParticipant={selectedParticipant}
          typingUsers={typingUsers}
          onMessageRead={handleMessageRead}
          onReaction={handleReaction}
          onReply={handleReply}
        />
        
        <MessageInput
          value={inputText}
          onChange={setInputText}
          onSend={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
};
