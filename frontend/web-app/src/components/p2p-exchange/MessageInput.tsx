import React, { useState, useRef, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  isSending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function MessageInput({
  onSend,
  isSending = false,
  disabled = false,
  placeholder = 'اكتب رسالتك هنا...',
  maxLength = 1000,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    // Validation
    if (!content.trim()) {
      setError('الرجاء كتابة رسالة');
      return;
    }

    if (content.length > maxLength) {
      setError(`الرسالة طويلة جداً (الحد الأقصى ${maxLength} حرف)`);
      return;
    }

    try {
      setError(null);
      await onSend(content);
      setContent('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      setError('فشل إرسال الرسالة. حاول مرة أخرى.');
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    setError(null);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const isDisabled = disabled || isSending;
  const remainingChars = maxLength - content.length;
  const showCharCount = content.length > maxLength * 0.8;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Error message */}
      {error && (
        <div className="mb-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            maxLength={maxLength}
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px' }}
          />

          {/* Character count */}
          {showCharCount && (
            <div
              className={`absolute bottom-2 left-2 text-xs ${
                remainingChars < 0 ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              {remainingChars}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isDisabled || !content.trim()}
          className="flex-shrink-0 bg-primary-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>جاري الإرسال...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span>إرسال</span>
            </div>
          )}
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-2 text-xs text-gray-500">
        اضغط Enter للإرسال، Shift+Enter لسطر جديد
      </p>

      {/* Security warning */}
      <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
        <svg
          className="w-4 h-4 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-medium">تحذير أمني:</p>
          <p className="mt-1">
            لا تشارك معلومات الاتصال الخارجية (رقم هاتف، بريد إلكتروني، حسابات
            تواصل اجتماعي). جميع المعاملات يجب أن تتم داخل المنصة لحمايتك.
          </p>
        </div>
      </div>
    </div>
  );
}
