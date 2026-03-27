/**
 * ChatHeader Component
 * Header for the chat window showing participant info and actions
 */

import React, { useState } from 'react';
import type { ChatUser, Conversation } from '../../types';
import { ConversationActions } from './ConversationActions';
import './ChatHeader.css';

interface ChatHeaderProps {
  participant?: ChatUser;
  conversation?: Conversation;
  onBack?: () => void;
  onViewProfile?: () => void;
  onStartCall?: () => void;
  onVideoCall?: () => void;
  onArchive?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  participant,
  conversation,
  onBack,
  onViewProfile,
  onStartCall,
  onVideoCall,
  onArchive,
  onBlock,
  onReport,
}) => {
  const [showActions, setShowActions] = useState(false);

  const displayName = participant?.displayName || conversation?.title || 'Unknown';
  const avatarUrl = participant?.avatarUrl || conversation?.avatarUrl;
  const isOnline = participant?.onlineStatus === 'online';

  return (
    <div className="chat-header">
      {/* Back Button (Mobile) */}
      <button className="chat-header__back" onClick={onBack} aria-label="Back">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>

      {/* Avatar & Info */}
      <div className="chat-header__info" onClick={onViewProfile}>
        <div className="chat-header__avatar-wrapper">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="chat-header__avatar" />
          ) : (
            <div className="chat-header__avatar chat-header__avatar--placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {isOnline && (
            <span className="chat-header__status chat-header__status--online" aria-label="Online"></span>
          )}
        </div>
        <div className="chat-header__details">
          <h3 className="chat-header__name">{displayName}</h3>
          <span className="chat-header__status-text">
            {participant?.onlineStatus === 'online'
              ? 'Online'
              : participant?.onlineStatus === 'offline'
              ? 'Last seen recently'
              : participant?.onlineStatus === 'away'
              ? 'Away'
              : participant?.lastSeenAt
              ? `Last seen ${new Date(participant.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : conversation?.type === 'group'
              ? `${conversation.participants.length} participants`
              : ''}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="chat-header__actions">
        {onStartCall && (
          <button className="chat-header__action-btn" onClick={onStartCall} aria-label="Voice call">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
        )}
        {onVideoCall && (
          <button className="chat-header__action-btn" onClick={onVideoCall} aria-label="Video call">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
        )}
        <button
          className="chat-header__action-btn chat-header__action-btn--menu"
          onClick={() => setShowActions(!showActions)}
          aria-label="More options"
          aria-expanded={showActions}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>

      {/* Actions Dropdown */}
      {showActions && (
        <ConversationActions
          conversation={conversation}
          onArchive={onArchive}
          onBlock={onBlock}
          onReport={onReport}
          onClose={() => setShowActions(false)}
        />
      )}
    </div>
  );
};
