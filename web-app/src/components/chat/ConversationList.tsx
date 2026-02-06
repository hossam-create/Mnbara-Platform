/**
 * ConversationList Component
 * Displays a list of conversations with search, filtering, and sorting
 */

import React, { useState, useMemo } from 'react';
import type { ConversationListItem, ConversationSearchFilters, ConversationSortOptions } from '../../types';
import { ConversationItem } from './ConversationItem';
import './ConversationList.css';

interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedId?: string;
  onSelect: (conversationId: string) => void;
  onSearch?: (filters: ConversationSearchFilters) => void;
  onSort?: (options: ConversationSortOptions) => void;
  onCreateNew?: () => void;
  loading?: boolean;
  error?: string;
}

const SORT_OPTIONS: { field: ConversationSortOptions['field']; label: string }[] = [
  { field: 'lastMessageAt', label: 'Recent' },
  { field: 'unreadCount', label: 'Unread' },
  { field: 'createdAt', label: 'Date' },
];

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  onSearch,
  onSort,
  onCreateNew,
  loading = false,
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ConversationSortOptions['field']>('lastMessageAt');
  const [sortOrder, setSortOrder] = useState<ConversationSortOptions['order']>('desc');
  const [showArchived, setShowArchived] = useState(false);

  const filteredConversations = useMemo(() => {
    let result = conversations;

    // Filter by archived status
    if (!showArchived) {
      result = result.filter((conv) => !conv.conversation.isArchived);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((conv) => {
        const otherParticipant = conv.otherParticipant;
        if (otherParticipant) {
          return (
            otherParticipant.displayName.toLowerCase().includes(query) ||
            otherParticipant.username.toLowerCase().includes(query) ||
            conv.preview.toLowerCase().includes(query)
          );
        }
        return conv.conversation.title?.toLowerCase().includes(query) || false;
      });
    }

    // Sort conversations
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'lastMessageAt':
          comparison = new Date(b.conversation.updatedAt).getTime() - new Date(a.conversation.updatedAt).getTime();
          break;
        case 'unreadCount':
          comparison = b.unreadCount - a.unreadCount;
          break;
        case 'createdAt':
          comparison = new Date(b.conversation.createdAt).getTime() - new Date(a.conversation.createdAt).getTime();
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return result;
  }, [conversations, searchQuery, sortBy, sortOrder, showArchived]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.({ query, hasUnread: undefined, isArchived: undefined });
  };

  const handleSortChange = (field: ConversationSortOptions['field']) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    onSort?.({ field, order: sortOrder === field ? (sortOrder === 'desc' ? 'asc' : 'desc') : 'desc' });
  };

  const unreadTotal = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (error) {
    return (
      <div className="conversation-list conversation-list--error">
        <div className="conversation-list__error">
          <span className="conversation-list__error-icon">⚠️</span>
          <p>{error}</p>
          <button className="conversation-list__retry-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {/* Header */}
      <div className="conversation-list__header">
        <div className="conversation-list__title-row">
          <h2 className="conversation-list__title">Messages</h2>
          {unreadTotal > 0 && (
            <span className="conversation-list__badge">{unreadTotal > 99 ? '99+' : unreadTotal}</span>
          )}
        </div>
        <button className="conversation-list__new-btn" onClick={onCreateNew} aria-label="New conversation">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="conversation-list__search">
        <div className="conversation-list__search-wrapper">
          <svg className="conversation-list__search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="conversation-list__search-input"
          />
          {searchQuery && (
            <button
              className="conversation-list__search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Sort & Filter */}
      <div className="conversation-list__controls">
        <div className="conversation-list__sort">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.field}
              className={`conversation-list__sort-btn ${sortBy === option.field ? 'conversation-list__sort-btn--active' : ''}`}
              onClick={() => handleSortChange(option.field)}
            >
              {option.label}
              {sortBy === option.field && (
                <span className="conversation-list__sort-icon">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          ))}
        </div>
        <label className="conversation-list__filter">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <span>Show archived</span>
        </label>
      </div>

      {/* Conversation List */}
      <div className="conversation-list__items">
        {loading ? (
          <div className="conversation-list__loading">
            <div className="conversation-list__spinner"></div>
            <p>Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="conversation-list__empty">
            <div className="conversation-list__empty-icon">💬</div>
            <h3>No conversations found</h3>
            <p>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Start a new conversation to begin chatting'}
            </p>
            {!searchQuery && onCreateNew && (
              <button className="conversation-list__empty-btn" onClick={onCreateNew}>
                Start New Conversation
              </button>
            )}
          </div>
        ) : (
          <ul className="conversation-list__ul" role="list" aria-label="Conversations">
            {filteredConversations.map((item) => (
              <li key={item.conversation.id}>
                <ConversationItem
                  item={item}
                  isSelected={item.conversation.id === selectedId}
                  onClick={() => onSelect(item.conversation.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
