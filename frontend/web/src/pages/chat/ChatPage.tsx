// ============================================
// 💬 Chat Page - Real-time Messaging
// ============================================

import { useState, useEffect, useRef } from 'react';
import type { Conversation, ChatMessage, ChatParticipant } from '../../types/chat-wallet';
import { chatApi } from '../../services/chat-wallet';

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for demo
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participants: [
        { userId: 'u1', name: 'Ahmed Mohamed', avatar: '', role: 'seller', isOnline: true },
        { userId: 'me', name: 'You', avatar: '', role: 'buyer', isOnline: true },
      ],
      lastMessage: {
        id: 'm1',
        conversationId: '1',
        senderId: 'u1',
        content: 'The iPhone is still available. I can ship it tomorrow.',
        type: 'text',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      unreadCount: 2,
      type: 'order',
      orderId: '#12345',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      participants: [
        { userId: 'u2', name: 'Sarah Williams', avatar: '', role: 'traveler', isOnline: false, lastSeen: new Date(Date.now() - 30 * 60000).toISOString() },
        { userId: 'me', name: 'You', avatar: '', role: 'buyer', isOnline: true },
      ],
      lastMessage: {
        id: 'm2',
        conversationId: '2',
        senderId: 'me',
        content: 'When will you arrive in Cairo?',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      unreadCount: 0,
      type: 'direct',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      participants: [
        { userId: 'support', name: 'Support Team', avatar: '', role: 'support', isOnline: true },
        { userId: 'me', name: 'You', avatar: '', role: 'buyer', isOnline: true },
      ],
      lastMessage: {
        id: 'm3',
        conversationId: '3',
        senderId: 'support',
        content: 'Your issue has been resolved. Is there anything else we can help with?',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      unreadCount: 0,
      type: 'support',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockMessages: ChatMessage[] = [
    { id: 'm1', conversationId: '1', senderId: 'u1', content: 'Hi! I saw your request for iPhone 15 Pro', type: 'text', read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'm2', conversationId: '1', senderId: 'me', content: 'Yes! Is it still available?', type: 'text', read: true, createdAt: new Date(Date.now() - 3500000).toISOString() },
    { id: 'm3', conversationId: '1', senderId: 'u1', content: 'Yes, I have 2 in stock. Brand new, sealed.', type: 'text', read: true, createdAt: new Date(Date.now() - 3400000).toISOString() },
    { id: 'm4', conversationId: '1', senderId: 'me', content: 'Great! What\'s the final price including delivery?', type: 'text', read: true, createdAt: new Date(Date.now() - 3300000).toISOString() },
    { id: 'm5', conversationId: '1', senderId: 'u1', content: '$1,199 total. That includes delivery via a trusted traveler.', type: 'text', read: true, createdAt: new Date(Date.now() - 3200000).toISOString() },
    { id: 'm6', conversationId: '1', senderId: 'u1', content: 'The iPhone is still available. I can ship it tomorrow.', type: 'text', read: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  ];

  useEffect(() => {
    // Load conversations
    setConversations(mockConversations);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      setMessages(mockMessages.filter(m => m.conversationId === activeConversation.id));
      scrollToBottom();
    }
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    setSending(true);
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversation.id,
      senderId: 'me',
      content: newMessage,
      type: 'text',
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();
    
    // Simulate sending
    setTimeout(() => {
      setSending(false);
    }, 500);
  };

  const getOtherParticipant = (conv: Conversation): ChatParticipant => {
    return conv.participants.find(p => p.userId !== 'me') || conv.participants[0];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      seller: 'bg-green-100 text-green-700',
      traveler: 'bg-blue-100 text-blue-700',
      support: 'bg-purple-100 text-purple-700',
      buyer: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || colors.buyer;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Conversations List */}
          <div className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col ${
            !showMobileList && activeConversation ? 'hidden md:flex' : 'flex'
          }`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                <button className="p-2 rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full px-4 py-2 pl-10 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-14 h-14 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                conversations.map(conv => {
                  const other = getOtherParticipant(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv);
                        setShowMobileList(false);
                      }}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        activeConversation?.id === conv.id ? 'bg-pink-50' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                          {other.avatar ? (
                            <img src={other.avatar} alt={other.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            other.name.charAt(0)
                          )}
                        </div>
                        {other.isOnline && (
                          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 truncate">{other.name}</span>
                          <span className="text-xs text-gray-500">{formatTime(conv.lastMessage?.createdAt || conv.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(other.role)}`}>
                            {other.role}
                          </span>
                          {conv.orderId && (
                            <span className="text-xs text-gray-500">Order {conv.orderId}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage?.senderId === 'me' && (
                            <span className="text-gray-400">You: </span>
                          )}
                          {conv.lastMessage?.content}
                        </p>
                      </div>
                      
                      {/* Unread Badge */}
                      {conv.unreadCount > 0 && (
                        <span className="w-6 h-6 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          {activeConversation ? (
            <div className={`flex-1 flex flex-col bg-white ${
              showMobileList ? 'hidden md:flex' : 'flex'
            }`}>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-4">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {getOtherParticipant(activeConversation).name.charAt(0)}
                  </div>
                  {getOtherParticipant(activeConversation).isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h2 className="font-bold text-gray-900">{getOtherParticipant(activeConversation).name}</h2>
                  <p className="text-sm text-gray-500">
                    {getOtherParticipant(activeConversation).isOnline 
                      ? 'Online' 
                      : `Last seen ${formatTime(getOtherParticipant(activeConversation).lastSeen || '')}`
                    }
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => {
                  const isMe = message.senderId === 'me';
                  return (
                    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                        <div className={`p-4 rounded-2xl ${
                          isMe 
                            ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-br-none'
                            : 'bg-white text-gray-800 shadow-sm rounded-bl-none'
                        }`}>
                          <p>{message.content}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : ''}`}>
                          {formatTime(message.createdAt)}
                          {isMe && (
                            <span className="ml-2">
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all pr-12"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
