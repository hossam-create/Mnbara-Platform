/**
 * TypingIndicator Component
 * Shows typing animation when users are typing
 */

import React from 'react';
import type { TypingIndicator as TypingIndicatorType } from '../../types';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  users: TypingIndicatorType[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const formatTypingText = () => {
    if (users.length === 1) {
      return `${users[0].username} is typing`;
    } else if (users.length === 2) {
      return `${users[0].username} and ${users[1].username} are typing`;
    } else {
      return `${users[0].username} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <div className="typing-indicator" role="status" aria-live="polite">
      <div className="typing-indicator__avatars">
        {users.slice(0, 3).map((user, index) => (
          <div key={user.userId} className="typing-indicator__avatar">
            {user.username.charAt(0).toUpperCase()}
            <span 
              className="typing-indicator__dot" 
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          </div>
        ))}
      </div>
      <span className="typing-indicator__text">{formatTypingText()}</span>
      <div className="typing-indicator__dots">
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__dot"></span>
      </div>
    </div>
  );
};
