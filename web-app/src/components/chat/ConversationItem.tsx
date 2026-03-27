/**
 * ConversationItem Component
 * Individual conversation item in the conversation list
 */

import React from 'react';
import type { ConversationListItem } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';
import './ConversationItem.css';

interface ConversationItemProps {
  item: ConversationListItem;
  isSelected?: boolean;
  onClick?: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  item,
  isSelected = false,
  onClick,
}) => {
  const { conversation, otherParticipant, preview, timestamp, unreadCount, isOnline } = item;

  const displayName = otherParticipant?.displayName || conversation.title || 'Unknown User';
  const avatarUrl = otherParticipant?.avatarUrl || conversation.avatarUrl;

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '📷';
      case 'file':
        return '📎';
      case 'offer':
        return '💰';
      case 'system':
        return 'ℹ️';
      default:
        return null;
    }
  };

  return (
    <div
      className={`conversation-item ${isSelected ? 'conversation-item--selected' : ''} ${unreadCount > 0 ? 'conversation-item--unread' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Avatar */}
      <div className="conversation-item__avatar-wrapper">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="conversation-item__avatar" />
        ) : (
          <div className="conversation-item__avatar conversation-item__avatar--placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {isOnline && conversation.type === 'direct' && (
          <span className="conversation-item__status conversation-item__status--online" aria-label="Online"></span>
        )}
      </div>

      {/* Content */}
      <div className="conversation-item__content">
        <div className="conversation-item__header">
          <span className="conversation-item__name">{displayName}</span>
          <span className="conversation-item__time">{formatRelativeTime(timestamp)}</span>
        </div>
        
        <div className="conversation-item__preview-row">
          {conversation.lastMessage && (
            <span className="conversation-item__type-icon">
              {getMessageTypeIcon(conversation.lastMessage.type)}
            </span>
          )}
          <p className="conversation-item__preview">
            {preview || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="conversation-item__unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </div>

        {/* Order/Product Context (if available) */}
        {conversation.orderId && (
          <div className="conversation-item__context">
            <span className="conversation-item__context-icon">📦</span>
            <span className="conversation-item__context-text">Order #{conversation.orderId.slice(-8)}</span>
          </div>
        )}
      </div>

      {/* Quick Actions (on hover) */}
      <div className="conversation-item__actions">
        <button className="conversation-item__action-btn" aria-label="Archive">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};
