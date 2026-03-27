import React, { useState, useCallback } from 'react';
import { Button } from '../core/Button';
import { Input } from '../core/Input';
import type { AuctionDetails } from '../../types/product';
import './BidForm.css';

export interface BidFormProps {
  auction: AuctionDetails;
  currency?: string;
  onSubmitBid?: (amount: number) => Promise<void>;
  onSetAutoBid?: (maxAmount: number) => Promise<void>;
  disabled?: boolean;
  minBidIncrement?: number;
}

export const BidForm: React.FC<BidFormProps> = ({
  auction,
  currency = 'USD',
  onSubmitBid,
  onSetAutoBid,
  disabled = false,
  minBidIncrement = 1,
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [autoBidAmount, setAutoBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAutoBid, setShowAutoBid] = useState(false);

  const minimumBid = auction.currentPrice + auction.bidIncrement;

  const validateBid = useCallback((amount: number): string | null => {
    if (amount < minimumBid) {
      return `Minimum bid is ${currency} ${minimumBid.toLocaleString()}`;
    }
    if (auction.hasReserve && amount < (auction.reservePrice || 0)) {
      return `Bid must meet the reserve price of ${currency} ${auction.reservePrice?.toLocaleString()}`;
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
      await onSubmitBid?.(amount);
      setBidAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const maxAmount = parseFloat(autoBidAmount);
    if (isNaN(maxAmount)) {
      setError('Please enter a valid maximum bid amount');
      return;
    }

    if (maxAmount < minimumBid) {
      setError(`Maximum bid must be at least ${currency} ${minimumBid.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      await onSetAutoBid?.(maxAmount);
      setAutoBidAmount('');
      setShowAutoBid(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set auto-bid');
    } finally {
      setLoading(false);
    }
  };

  const quickBidAmounts = [
    minimumBid,
    Math.ceil(minimumBid * 1.1 / 10) * 10,
    Math.ceil(minimumBid * 1.25 / 10) * 10,
  ];

  return (
    <div className="mnbara-bid-form">
      <div className="mnbara-bid-form__current">
        <span className="mnbara-bid-form__label">Current Bid</span>
        <span className="mnbara-bid-form__amount">
          <span className="mnbara-bid-form__currency">{currency}</span>
          {auction.currentPrice.toLocaleString()}
        </span>
        <span className="mnbara-bid-form__increment">
          (+{currency} {auction.bidIncrement.toLocaleString()} minimum increment)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mnbara-bid-form__main">
        <div className="mnbara-bid-form__input-group">
          <span className="mnbara-bid-form__currency-prefix">{currency}</span>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={minimumBid.toString()}
            min={minimumBid}
            step={minBidIncrement}
            disabled={disabled || loading}
            className="mnbara-bid-form__input"
          />
        </div>

        {error && <div className="mnbara-bid-form__error">{error}</div>}

        <div className="mnbara-bid-form__quick-bids">
          {quickBidAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              className="mnbara-bid-form__quick-btn"
              onClick={() => setBidAmount(amount.toString())}
              disabled={disabled || loading}
            >
              {currency} {amount.toLocaleString()}
            </button>
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={loading}
          disabled={disabled || !bidAmount}
        >
          Place Bid
        </Button>
      </form>

      <div className="mnbara-bid-form__auto-bid">
        <button
          type="button"
          className="mnbara-bid-form__auto-bid-toggle"
          onClick={() => setShowAutoBid(!showAutoBid)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          {showAutoBid ? 'Hide Auto-Bid' : 'Set Up Auto-Bid'}
        </button>

        {showAutoBid && (
          <form onSubmit={handleAutoBidSubmit} className="mnbara-bid-form__auto-form">
            <p className="mnbara-bid-form__auto-info">
              Enter your maximum bid. We'll automatically bid for you up to this amount.
            </p>
            <div className="mnbara-bid-form__input-group">
              <span className="mnbara-bid-form__currency-prefix">{currency}</span>
              <input
                type="number"
                value={autoBidAmount}
                onChange={(e) => setAutoBidAmount(e.target.value)}
                placeholder={minimumBid.toString()}
                min={minimumBid}
                step={minBidIncrement}
                disabled={disabled || loading}
                className="mnbara-bid-form__input"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              fullWidth
              loading={loading}
              disabled={disabled || !autoBidAmount}
            >
              Set Auto-Bid
            </Button>
          </form>
        )}
      </div>

      <div className="mnbara-bid-form__info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>{auction.bidCount} bids placed</span>
      </div>
    </div>
  );
};

export default BidForm;
