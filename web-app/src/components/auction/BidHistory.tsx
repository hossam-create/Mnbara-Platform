import React from 'react';
import type { Bid } from '../../types/product';
import './BidHistory.css';

export interface BidHistoryProps {
  bids: Bid[];
  currentUserId?: string;
  maxItems?: number;
  showTimestamps?: boolean;
  loading?: boolean;
}

export const BidHistory: React.FC<BidHistoryProps> = ({
  bids,
  currentUserId,
  maxItems = 10,
  showTimestamps = true,
  loading = false,
}) => {
  const displayBids = bids.slice(0, maxItems);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="mnbara-bid-history">
        <div className="mnbara-bid-history__header">
          <h3>Bid History</h3>
          <span className="mnbara-bid-history__count">Loading...</span>
        </div>
        <div className="mnbara-bid-history__list">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="mnbara-bid-history__item mnbara-bid-history__item--skeleton">
              <div className="mnbara-bid-history__skeleton-avatar" />
              <div className="mnbara-bid-history__skeleton-info">
                <div className="mnbara-bid-history__skeleton-name" />
                <div className="mnbara-bid-history__skeleton-time" />
              </div>
              <div className="mnbara-bid-history__skeleton-amount" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="mnbara-bid-history">
        <div className="mnbara-bid-history__header">
          <h3>Bid History</h3>
        </div>
        <div className="mnbara-bid-history__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2v20M2 12h20" />
          </svg>
          <p>No bids yet</p>
          <span>Be the first to place a bid!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mnbara-bid-history">
      <div className="mnbara-bid-history__header">
        <h3>Bid History</h3>
        <span className="mnbara-bid-history__count">{bids.length} bids</span>
      </div>
      <div className="mnbara-bid-history__list">
        {displayBids.map((bid, index) => (
          <div
            key={bid.id}
            className={`mnbara-bid-history__item ${bid.isWinningBid ? 'winning' : ''} ${bid.bidderId === currentUserId ? 'current-user' : ''}`}
          >
            <div className="mnbara-bid-history__rank">
              {bid.isWinningBid ? (
                <svg className="mnbara-bid-history__crown" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              ) : (
                <span className="mnbara-bid-history__position">{index + 1}</span>
              )}
            </div>
            
            <div className="mnbara-bid-history__avatar">
              {bid.bidderAvatar ? (
                <img src={bid.bidderAvatar} alt={bid.bidderName} />
              ) : (
                <div className="mnbara-bid-history__avatar-placeholder">
                  {bid.bidderName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="mnbara-bid-history__info">
              <div className="mnbara-bid-history__name">
                {bid.bidderName}
                {bid.bidderId === currentUserId && <span className="mnbara-bid-history__you">(You)</span>}
                {bid.isAutoBid && <span className="mnbara-bid-history__autobid">Auto</span>}
              </div>
              {showTimestamps && (
                <div className="mnbara-bid-history__time">{formatTime(bid.createdAt)}</div>
              )}
            </div>
            
            <div className="mnbara-bid-history__amount">
              <span className="mnbara-bid-history__currency">{bid.currency}</span>
              <span className="mnbara-bid-history__value">{bid.amount.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
      
      {bids.length > maxItems && (
        <button className="mnbara-bid-history__view-all">
          View all {bids.length} bids
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default BidHistory;
