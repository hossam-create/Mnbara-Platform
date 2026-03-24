import React from 'react';
import type { AuctionDetails } from '../../types/product';
import './CurrentBid.css';

export interface CurrentBidProps {
  auction: AuctionDetails;
  currency?: string;
  showReserveStatus?: boolean;
  isWinning?: boolean;
  isOutbid?: boolean;
}

export const CurrentBid: React.FC<CurrentBidProps> = ({
  auction,
  currency = 'USD',
  showReserveStatus = true,
  isWinning = false,
  isOutbid = false,
}) => {
  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className={`mnbara-current-bid ${isWinning ? 'winning' : ''} ${isOutbid ? 'outbid' : ''}`}>
      <div className="mnbara-current-bid__label">
        {isWinning ? 'Your Current Bid' : 'Current Bid'}
      </div>
      
      <div className="mnbara-current-bid__amount">
        <span className="mnbara-current-bid__currency">{currency}</span>
        <span className="mnbara-current-bid__value">{auction.currentPrice.toLocaleString()}</span>
      </div>

      {showReserveStatus && (
        <div className="mnbara-current-bid__reserve">
          {auction.hasReserve ? (
            auction.currentPrice >= (auction.reservePrice || 0) ? (
              <span className="mnbara-current-bid__reserve-met">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Reserve met
              </span>
            ) : (
              <span className="mnbara-current-bid__reserve-not-met">
                Reserve not yet met
              </span>
            )
          ) : (
            <span className="mnbara-current-bid__no-reserve">
              No reserve price
            </span>
          )}
        </div>
      )}

      <div className="mnbara-current-bid__stats">
        <div className="mnbara-current-bid__stat">
          <span className="mnbara-current-bid__stat-value">{auction.bidCount}</span>
          <span className="mnbara-current-bid__stat-label">Bids</span>
        </div>
        <div className="mnbara-current-bid__stat">
          <span className="mnbara-current-bid__stat-value">{auction.watchersCount}</span>
          <span className="mnbara-current-bid__stat-label">Watchers</span>
        </div>
      </div>
    </div>
  );
};

export default CurrentBid;
