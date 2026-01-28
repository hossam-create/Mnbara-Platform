import React, { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useMatchChat } from '../../hooks/useMatchChat';
import type { ExchangeMatch } from '../../types/p2p-exchange.types';

interface MatchChatProps {
  match: ExchangeMatch;
  currentUserId: string;
  className?: string;
}

export function MatchChat({ match, currentUserId, className = '' }: MatchChatProps) {
  const [showWarning, setShowWarning] = useState(true);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    isSending,
    hasExternalContact,
    flaggedMessages,
    refetch,
  } = useMatchChat({
    matchId: match.id,
    enabled: true,
    pollingInterval: 3000, // Poll every 3 seconds
  });

  // Determine if chat is disabled
  const isChatDisabled =
    match.status === 'COMPLETED' ||
    match.status === 'CANCELLED' ||
    match.status === 'FAILED' ||
    match.status === 'EXPIRED';

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 rounded-full p-2">
            <svg
              className="w-5 h-5 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">محادثة التبادل</h3>
            <p className="text-sm text-gray-500">
              {messages.length} {messages.length === 1 ? 'رسالة' : 'رسائل'}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="تحديث الرسائل"
        >
          <svg
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* External contact warning */}
      {hasExternalContact && showWarning && (
        <div className="mx-4 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">تحذير أمني</h4>
            <p className="text-sm text-red-700 mt-1">
              تم اكتشاف معلومات اتصال خارجية في هذه المحادثة. لحمايتك، يجب إتمام
              جميع المعاملات داخل المنصة فقط. مشاركة معلومات الاتصال قد تعرضك
              للاحتيال.
            </p>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Flagged messages warning */}
      {flaggedMessages.length > 0 && (
        <div className="mx-4 mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <svg
            className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900">رسائل مبلغ عنها</h4>
            <p className="text-sm text-amber-700 mt-1">
              تحتوي هذه المحادثة على {flaggedMessages.length} رسالة مبلغ عنها. يتم
              مراجعتها من قبل فريق الدعم.
            </p>
          </div>
        </div>
      )}

      {/* Chat disabled notice */}
      {isChatDisabled && (
        <div className="mx-4 mt-4 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <svg
            className="w-6 h-6 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-sm text-gray-600">
            المحادثة مغلقة. لا يمكن إرسال رسائل جديدة.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-700">
              فشل تحميل الرسائل: {error.message}
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm text-red-600 hover:text-red-800 font-medium mt-1"
            >
              حاول مرة أخرى
            </button>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
        />
      </div>

      {/* Message input */}
      {!isChatDisabled && (
        <MessageInput
          onSend={sendMessage}
          isSending={isSending}
          disabled={isChatDisabled}
          placeholder="اكتب رسالتك هنا..."
          maxLength={1000}
        />
      )}
    </div>
  );
}
