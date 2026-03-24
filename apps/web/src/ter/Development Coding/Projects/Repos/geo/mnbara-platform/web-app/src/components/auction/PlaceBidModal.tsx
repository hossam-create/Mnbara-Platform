import React, { useState, useCallback } from 'react';
import { Modal } from '../core/Modal';
import { Button } from '../core/Button';
import { Input } from '../core/Input';
import type { AuctionDetails, Product } from '../../types/product';
import './PlaceBidModal.css';

export interface PlaceBidModalProps {
  auction: AuctionDetails;
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSubmitBid: (amount: number) => Promise<void>;
  currency?: string;
}

export const PlaceBidModal: React.FC<PlaceBidModalProps> = ({
  auction,
  product,
  isOpen,
  onClose,
  onSubmitBid,
  currency = 'USD',
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minimumBid = auction.currentPrice + auction.bidIncrement;

  const validateBid = useCallback((amount: number): string | null => {
    if (amount < minimumBid) {
      return `Minimum bid is ${currency} ${minimumBid.toLocaleString()}`;
    }
    if (auction.hasReserve && amount < (auction.reservePrice || 0)) {
      return `Bid must meet the reserve price`;
    }
    return null;
  }, [auction, currency, minimumBid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      setError('Please enter a valid bid amount');
      return;
    }

    const validationError = validateBid(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await onSubmitBid(amount);
      onClose();
      setBidAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  const quickBids = [
    minimumBid,
    Math.ceil(minimumBid * 1.1 / 10) * 10,
    Math.ceil(minimumBid * 1.25 / 10) * 10,
    Math.ceil(minimumBid * 1.5 / 10) * 10,
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Place Your Bid"
      size="md"
    >
      <div className="mnbara-place-bid-modal">
        <div className="mnbara-place-bid-modal__product">
          <img
            src={product.images[0]?.thumbnailUrl || product.images[0]?.url}
            alt={product.title}
            className="mnbara-place-bid-modal__image"
          />
          <div className="mnbara-place-bid-modal__info">
            <h4>{product.title}</h4>
            <p>Current bid: <strong>{currency} {auction.currentPrice.toLocaleString()}</strong></p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mnbara-place-bid-modal__field">
            <label>Your Bid Amount</label>
            <div className="mnbara-place-bid-modal__input-wrapper">
              <span className="mnbara-place-bid-modal__currency">{currency}</span>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={minimumBid.toString()}
                min={minimumBid}
                step={1}
                className="mnbara-place-bid-modal__input"
              />
            </div>
            <span className="mnbara-place-bid-modal__minimum">
              Minimum: {currency} {minimumBid.toLocaleString()}
            </span>
          </div>

          {error && <div className="mnbara-place-bid-modal__error">{error}</div>}

          <div className="mnbara-place-bid-modal__quick">
            <label>Quick Select:</label>
            <div className="mnbara-place-bid-modal__quick-btns">
              {quickBids.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="mnbara-place-bid-modal__quick-btn"
                  onClick={() => setBidAmount(amount.toString())}
                >
                  {currency} {amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="mnbara-place-bid-modal__actions">
            <Button variant="outline" onClick={onClose} fullWidth>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!bidAmount}
            >
              Place Bid
            </Button>
          </div>
        </form>

        <p className="mnbara-place-bid-modal__note">
          By placing a bid, you're committing to buy this item if you win.
        </p>
      </div>
    </Modal>
  );
};

export default PlaceBidModal;
