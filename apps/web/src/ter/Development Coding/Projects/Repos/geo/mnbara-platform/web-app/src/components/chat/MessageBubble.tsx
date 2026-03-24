/**
 * MessageBubble Component
 * Displays a single message bubble with sender info, reactions, and actions
 */

import React, { useState } from 'react';
import type { Message } from '../../types';
import { formatMessageTime } from '../../utils/dateUtils';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showSenderName?: boolean;
  senderAvatar?: string;
  senderName?: string;
  isConsecutive?: boolean;
  onReaction?: (emoji: string) => void;
  onReply?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  senderAvatar,
  senderName,
  isConsecutive = false,
  onReaction,
  onReply,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.content.text || '');

  const handleReaction = (emoji: string) => {
    onReaction?.(emoji);
    setShowReactions(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle edit submit
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return '○';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '⚠️';
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (message.type === 'image' && message.content.attachments?.length) {
      return (
        <div className="message-bubble__image-container">
          {message.content.attachments.map((attachment) => (
            <img
              key={attachment.id}
              src={attachment.thumbnailUrl || attachment.url}
              alt="Message attachment"
              className="message-bubble__image"
              loading="lazy"
            />
          ))}
        </div>
      );
    }

    if (message.content.text) {
      return (
        <p className="message-bubble__text">
          {isEditing ? (
            <form onSubmit={handleEditSubmit}>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="message-bubble__edit-input"
              />
              <div className="message-bubble__edit-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            message.content.text
          )}
        </p>
      );
    }

    if (message.type === 'system') {
      return (
        <p className="message-bubble__system">
          {message.content.text}
        </p>
      );
    }

    return null;
  };

  return (
    <div
      className={`message-bubble ${isOwn ? 'message-bubble--own' : 'message-bubble--other'} ${isConsecutive ? 'message-bubble--consecutive' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar (for received messages) */}
      {!isOwn && showAvatar && (
        <div className="message-bubble__avatar-wrapper">
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName} className="message-bubble__avatar" />
          ) : (
            <div className="message-bubble__avatar message-bubble__avatar--placeholder">
              {senderName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className="message-bubble__content">
        {/* Sender Name */}
        {!isOwn && showAvatar && senderName && (
          <span className="message-bubble__sender-name">{senderName}</span>
        )}

        {/* Message Bubble */}
        <div className={`message-bubble__bubble ${message.type === 'system' ? 'message-bubble__bubble--system' : ''}`}>
          {renderContent()}

          {/* Reactions Display */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="message-bubble__reactions">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  className="message-bubble__reaction"
                  onClick={() => handleReaction(reaction.emoji)}
                >
                  <span className="message-bubble__reaction-emoji">{reaction.emoji}</span>
                  {reaction.count > 1 && (
                    <span className="message-bubble__reaction-count">{reaction.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp & Status */}
          <div className="message-bubble__meta">
            <span className="message-bubble__time">{formatMessageTime(message.timestamp)}</span>
            {isOwn && message.status !== 'system' && (
              <span className={`message-bubble__status message-bubble__status--${message.status}`}>
                {getStatusIcon()}
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && !isEditing && message.type !== 'system' && (
          <div className="message-bubble__actions">
            <button
              className="message-bubble__action-btn"
              onClick={() => setShowReactions(!showReactions)}
              aria-label="Add reaction"
            >
              😊
            </button>
            <button
              className="message-bubble__action-btn"
              onClick={onReply}
              aria-label="Reply"
            >
              ↩️
            </button>
            {isOwn && (
              <>
                <button
                  className="message-bubble__action-btn"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit"
                >
                  ✏️
                </button>
                <button
                  className="message-bubble__action-btn message-bubble__action-btn--danger"
                  onClick={onDelete}
                  aria-label="Delete"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        )}

        {/* Reactions Picker */}
        {showReactions && (
          <div className="message-bubble__reactions-picker">
            {COMMON_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                className="message-bubble__reaction-option"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
