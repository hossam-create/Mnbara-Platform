import React from 'react';
import { Button } from '../core/Button';
import type { Product, ProductSeller } from '../../types/product';
import './WinnerAnnouncement.css';

export interface WinnerAnnouncementProps {
  product: Product;
  winner: ProductSeller;
  winningAmount: number;
  currency?: string;
  isCurrentUserWinner?: boolean;
  onPayment?: () => void;
  onContactSeller?: () => void;
}

export const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({
  product,
  winner,
  winningAmount,
  currency = 'USD',
  isCurrentUserWinner = false,
  onPayment,
  onContactSeller,
}) => {
  return (
    <div className={`mnbara-winner-announcement ${isCurrentUserWinner ? 'winner' : ''}`}>
      <div className="mnbara-winner-announcement__icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>

      <div className="mnbara-winner-announcement__content">
        <h3>
          {isCurrentUserWinner ? 'Congratulations! You won!' : 'Auction Ended'}
        </h3>
        
        <div className="mnbara-winner-announcement__product">
          <img
            src={product.images[0]?.thumbnailUrl || product.images[0]?.url}
            alt={product.title}
          />
          <div>
            <h4>{product.title}</h4>
            <p className="mnbara-winner-announcement__price">
              Winning bid: <strong>{currency} {winningAmount.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        {!isCurrentUserWinner && (
          <div className="mnbara-winner-announcement__winner-info">
            <span>Winner:</span>
            <div className="mnbara-winner-announcement__winner-profile">
              <img
                src={winner.avatar || '/images/default-avatar.png'}
                alt={winner.name}
              />
              <span>{winner.name}</span>
              {winner.verified && (
                <svg className="verified" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
          </div>
        )}

        {isCurrentUserWinner && (
          <div className="mnbara-winner-announcement__actions">
            <Button variant="primary" size="lg" fullWidth onClick={onPayment}>
              Complete Payment
            </Button>
            <Button variant="outline" onClick={onContactSeller}>
              Contact Seller
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WinnerAnnouncement;
