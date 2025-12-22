// ============================================
// 💬 Chat API Service
// ============================================

import api from './api';
import type { ApiResponse, SearchResult } from '../types';
import type { 
  Conversation, 
  ChatMessage, 
  Wallet, 
  WalletTransaction,
  PaymentMethod,
  WithdrawalRequest
} from '../types/chat-wallet';

// ============ CHAT API ============
export const chatApi = {
  // Conversations
  getConversations: (page = 1) =>
    api.get<ApiResponse<SearchResult<Conversation>>>('/chat/conversations', {
      params: { page },
    }),

  getConversation: (id: string) =>
    api.get<ApiResponse<Conversation>>(`/chat/conversations/${id}`),

  createConversation: (participantId: string, orderId?: string) =>
    api.post<ApiResponse<Conversation>>('/chat/conversations', { participantId, orderId }),

  // Messages
  getMessages: (conversationId: string, page = 1, limit = 50) =>
    api.get<ApiResponse<SearchResult<ChatMessage>>>(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit },
    }),

  sendMessage: (conversationId: string, content: string, type = 'text', attachments?: File[]) => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('type', type);
    if (attachments) {
      attachments.forEach((file) => formData.append('attachments', file));
    }
    return api.post<ApiResponse<ChatMessage>>(`/chat/conversations/${conversationId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  markAsRead: (conversationId: string) =>
    api.put<ApiResponse<void>>(`/chat/conversations/${conversationId}/read`),

  deleteMessage: (conversationId: string, messageId: string) =>
    api.delete<ApiResponse<void>>(`/chat/conversations/${conversationId}/messages/${messageId}`),

  // Typing indicator
  sendTyping: (conversationId: string) =>
    api.post<ApiResponse<void>>(`/chat/conversations/${conversationId}/typing`),

  // Unread count
  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/chat/unread-count'),
};

// ============ WALLET API ============
export const walletApi = {
  // Wallet info
  getWallet: () =>
    api.get<ApiResponse<Wallet>>('/wallet'),

  getBalance: () =>
    api.get<ApiResponse<{ balance: number; pending: number; frozen: number }>>('/wallet/balance'),

  // Transactions
  getTransactions: (page = 1, type?: string) =>
    api.get<ApiResponse<SearchResult<WalletTransaction>>>('/wallet/transactions', {
      params: { page, type },
    }),

  getTransaction: (id: string) =>
    api.get<ApiResponse<WalletTransaction>>(`/wallet/transactions/${id}`),

  // Deposits
  deposit: (amount: number, paymentMethodId: string) =>
    api.post<ApiResponse<{ transactionId: string; redirectUrl?: string }>>('/wallet/deposit', {
      amount,
      paymentMethodId,
    }),

  // Withdrawals
  withdraw: (amount: number, paymentMethodId: string) =>
    api.post<ApiResponse<WithdrawalRequest>>('/wallet/withdraw', {
      amount,
      paymentMethodId,
    }),

  getWithdrawals: (page = 1) =>
    api.get<ApiResponse<SearchResult<WithdrawalRequest>>>('/wallet/withdrawals', {
      params: { page },
    }),

  cancelWithdrawal: (id: string) =>
    api.delete<ApiResponse<void>>(`/wallet/withdrawals/${id}`),

  // Payment methods
  getPaymentMethods: () =>
    api.get<ApiResponse<PaymentMethod[]>>('/wallet/payment-methods'),

  addPaymentMethod: (data: Partial<PaymentMethod>) =>
    api.post<ApiResponse<PaymentMethod>>('/wallet/payment-methods', data),

  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) =>
    api.put<ApiResponse<PaymentMethod>>(`/wallet/payment-methods/${id}`, data),

  deletePaymentMethod: (id: string) =>
    api.delete<ApiResponse<void>>(`/wallet/payment-methods/${id}`),

  setDefaultPaymentMethod: (id: string) =>
    api.put<ApiResponse<void>>(`/wallet/payment-methods/${id}/default`),

  // Transfers
  transfer: (recipientId: string, amount: number, note?: string) =>
    api.post<ApiResponse<WalletTransaction>>('/wallet/transfer', {
      recipientId,
      amount,
      note,
    }),

  // Stats
  getStats: (period: 'week' | 'month' | 'year') =>
    api.get<ApiResponse<{
      totalIn: number;
      totalOut: number;
      transactions: { date: string; in: number; out: number }[];
    }>>('/wallet/stats', { params: { period } }),
};

// ============ KYC API ============
export const kycApi = {
  getStatus: () =>
    api.get<ApiResponse<{ level: number; status: string; nextSteps?: string[] }>>('/kyc/status'),

  startVerification: (level: number) =>
    api.post<ApiResponse<{ applicationId: string }>>('/kyc/start', { level }),

  uploadDocument: (applicationId: string, type: string, file: File) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    return api.post<ApiResponse<{ documentId: string }>>(`/kyc/${applicationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  submitApplication: (applicationId: string) =>
    api.post<ApiResponse<void>>(`/kyc/${applicationId}/submit`),

  getApplication: (id: string) =>
    api.get<ApiResponse<{ id: string; status: string; documents: unknown[] }>>(`/kyc/${id}`),
};

export default { chatApi, walletApi, kycApi };
