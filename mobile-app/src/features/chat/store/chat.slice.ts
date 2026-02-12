// Chat Redux Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Conversation, Message } from '../../domain/entities/chat.entity';

const initialState: ChatState = {
  conversations: [],
  selectedConversation: null,
  messages: {},
  onlineUsers: [],
  typingUsers: {},
  loading: false,
  error: null,
  connectionStatus: 'disconnected',
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<ChatState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations.unshift(action.payload);
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      const index = state.conversations.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = action.payload;
      }
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter((c) => c.id !== action.payload);
    },
    selectConversation: (state, action: PayloadAction<string>) => {
      state.selectedConversation = state.conversations.find((c) => c.id === action.payload) || null;
    },
    clearSelectedConversation: (state) => {
      state.selectedConversation = null;
    },
    setMessages: (state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) => {
      state.messages[action.payload.conversationId] = action.payload.messages;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const { conversationId } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(action.payload);
      
      // Update last message in conversation
      const convIndex = state.conversations.findIndex((c) => c.id === conversationId);
      if (convIndex !== -1) {
        state.conversations[convIndex].lastMessage = action.payload;
      }
    },
    markAsRead: (state, action: PayloadAction<{ conversationId: string; messageIds: string[] }>) => {
      const { conversationId, messageIds } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map((m) =>
          messageIds.includes(m.id) ? { ...m, status: 'read' as const } : m
        );
      }
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
    },
    setTypingUsers: (state, action: PayloadAction<{ conversationId: string; userIds: string[] }>) => {
      state.typingUsers[action.payload.conversationId] = action.payload.userIds;
    },
    addTypingUser: (state, action: PayloadAction<{ conversationId: string; userId: string; userName: string }>) => {
      const { conversationId, userId, userName } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      const userIndex = state.typingUsers[conversationId].findIndex((u) => u === userId);
      if (userIndex === -1) {
        state.typingUsers[conversationId].push(userId);
      }
    },
    removeTypingUser: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          (id) => id !== userId
        );
      }
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) {
        conv.unreadCount += 1;
      }
    },
    clearUnreadCount: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) {
        conv.unreadCount = 0;
      }
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
    },
  },
});

export const {
  setConnectionStatus,
  setConversations,
  addConversation,
  updateConversation,
  removeConversation,
  selectConversation,
  clearSelectedConversation,
  setMessages,
  addMessage,
  markAsRead,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  incrementUnreadCount,
  clearUnreadCount,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
