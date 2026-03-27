/**
 * ConversationActions Component
 * Dropdown menu for conversation actions (archive, block, report, etc.)
 */

import React, { useRef, useEffect } from 'react';
import type { Conversation } from '../../types';
import './ConversationActions.css';

interface ConversationActionsProps {
  conversation?: Conversation;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  onLeave?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onClose?: () => void;
}

export const ConversationActions: React.FC<ConversationActionsProps> = ({
  conversation,
  onArchive,
  onUnarchive,
  onBlock,
  onUnblock,
  onReport,
  onDelete,
  onLeave,
  onPin,
  onUnpin,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAction = (action: () => void | undefined) => {
    action?.();
    onClose?.();
  };

  return (
    <div className="conversation-actions" ref={menuRef} role="menu">
      {/* Pin/Unpin */}
      {conversation?.isPinned ? (
        <button className="conversation-actions__item" onClick={() => handleAction(onUnpin)} role="menuitem">
          <span className="conversation-actions__icon">📌</span>
          <span>Unpin</span>
        </button>
      ) : (
        <button className="conversation-actions__item" onClick={() => handleAction(onPin)} role="menuitem">
          <span className="conversation-actions__icon">📌</span>
          <span>Pin</span>
        </button>
      )}

      {/* Archive/Unarchive */}
      {conversation?.isArchived ? (
        <button className="conversation-actions__item" onClick={() => handleAction(onUnarchive)} role="menuitem">
          <span className="conversation-actions__icon">📥</span>
          <span>Unarchive</span>
        </button>
      ) : (
        <button className="conversation-actions__item" onClick={() => handleAction(onArchive)} role="menuitem">
          <span className="conversation-actions__icon">📤</span>
          <span>Archive</span>
        </button>
      )}

      {/* Block/Unblock */}
      {conversation?.isBlocked ? (
        <button className="conversation-actions__item" onClick={() => handleAction(onUnblock)} role="menuitem">
          <span className="conversation-actions__icon">🔓</span>
          <span>Unblock</span>
        </button>
      ) : (
        <button className="conversation-actions__item conversation-actions__item--danger" onClick={() => handleAction(onBlock)} role="menuitem">
          <span className="conversation-actions__icon">🔒</span>
          <span>Block</span>
        </button>
      )}

      <div className="conversation-actions__divider" />

      {/* Report */}
      <button className="conversation-actions__item conversation-actions__item--danger" onClick={() => handleAction(onReport)} role="menuitem">
        <span className="conversation-actions__icon">🚩</span>
        <span>Report</span>
      </button>

      {/* Delete/Leave */}
      {conversation?.type === 'group' ? (
        <button className="conversation-actions__item conversation-actions__item--danger" onClick={() => handleAction(onLeave)} role="menuitem">
          <span className="conversation-actions__icon">👋</span>
          <span>Leave Group</span>
        </button>
      ) : (
        <button className="conversation-actions__item conversation-actions__item--danger" onClick={() => handleAction(onDelete)} role="menuitem">
          <span className="conversation-actions__icon">🗑️</span>
          <span>Delete</span>
        </button>
      )}
    </div>
  );
};
