/**
 * MessageInput Component
 * Text input area for sending messages with emoji picker and file attachments
 */

import React, { useState, useRef, useCallback } from 'react';
import type { Message, Attachment } from '../../types';
import './MessageInput.css';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onAttach?: (file: File) => void;
  onImageUpload?: (file: File) => void;
  onEmojiSelect?: (emoji: string) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  onTyping,
  onStopTyping,
  onAttach,
  onImageUpload,
  onEmojiSelect,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 4000,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing indicator
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);

      // Handle typing indicator
      if (newValue.length > 0 && !typingTimeoutRef.current) {
        onTyping?.();
      }

      // Clear existing timeout and set new one
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.();
        typingTimeoutRef.current = undefined;
      }, 2000);
    }
  }, [onChange, onTyping, onStopTyping, maxLength]);

  // Handle send
  const handleSend = useCallback(() => {
    if (value.trim() && !disabled) {
      onSend();
      onStopTyping?.();
    }
  }, [value, disabled, onSend, onStopTyping]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        onImageUpload?.(file);
      } else {
        onAttach?.(file);
      }
    });
  }, [onAttach, onImageUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Common emojis
  const COMMON_EMOJIS = ['😀', '😂', '🥰', '😍', '😊', '🙂', '😎', '🤔', '😮', '😢', '😭', '😠', '👍', '👎', '❤️', '💔', '🎉', '💪', '🙏', '👋', '🔥', '✨', '💯', '✅', '❌'];

  return (
    <div className={`message-input ${isDragging ? 'message-input--dragging' : ''}`}>
      {/* Drag overlay */}
      {isDragging && (
        <div className="message-input__drag-overlay">
          <span>Drop files here</span>
        </div>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="message-input__reply">
          <div className="message-input__reply-content">
            <span className="message-input__reply-icon">↩️</span>
            <span className="message-input__reply-label">Replying to</span>
            <p className="message-input__reply-text">
              {replyTo.content.text?.slice(0, 100)}
              {replyTo.content.text && replyTo.content.text.length > 100 ? '...' : ''}
            </p>
          </div>
          <button
            className="message-input__reply-close"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            ×
          </button>
        </div>
      )}

      {/* Attachment Preview */}
      <div className="message-input__attachments">
        {/* Selected attachments would be shown here */}
      </div>

      {/* Input Area */}
      <div className="message-input__container">
        {/* Attachment Buttons */}
        <div className="message-input__buttons">
          <button
            className="message-input__btn"
            onClick={() => imageInputRef.current?.click()}
            aria-label="Upload image"
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </button>
          <button
            className="message-input__btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          <button
            className="message-input__btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Add emoji"
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </button>
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          className="message-input__textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onResize={handleResize}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          maxLength={maxLength}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        />

        {/* Send Button */}
        <button
          className={`message-input__send ${value.trim() ? 'message-input__send--active' : ''}`}
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="message-input__emoji-picker">
          <div className="message-input__emoji-grid">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="message-input__emoji-btn"
                onClick={() => {
                  onChange(value + emoji);
                  onEmojiSelect?.(emoji);
                  textareaRef.current?.focus();
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            Array.from(files).forEach((file) => onImageUpload?.(file));
          }
          e.target.value = '';
        }}
        hidden
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            Array.from(files).forEach((file) => onAttach?.(file));
          }
          e.target.value = '';
        }}
        hidden
      />
    </div>
  );
};
