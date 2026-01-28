import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Message } from '../../types/p2p-exchange.types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg
          className="w-16 h-16 mb-4 text-gray-300"
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
        <p className="text-lg font-medium">لا توجد رسائل بعد</p>
        <p className="text-sm mt-1">ابدأ المحادثة مع الطرف الآخر</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        const messageTime = format(new Date(message.createdAt), 'HH:mm', {
          locale: ar,
        });

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                isOwnMessage
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {/* Sender name (for received messages) */}
              {!isOwnMessage && message.senderName && (
                <p className="text-xs font-medium text-gray-600 mb-1">
                  {message.senderName}
                </p>
              )}

              {/* Message content */}
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>

              {/* Warning for external contact */}
              {message.containsExternalContact && (
                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 rounded px-2 py-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>تحذير: تم اكتشاف معلومات اتصال خارجية</span>
                </div>
              )}

              {/* Flagged message indicator */}
              {message.isFlagged && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>تم الإبلاغ عن هذه الرسالة</span>
                  {message.flagReason && (
                    <span className="mr-1">({message.flagReason})</span>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <p
                className={`text-xs mt-1 ${
                  isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                }`}
              >
                {messageTime}
              </p>
            </div>
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
