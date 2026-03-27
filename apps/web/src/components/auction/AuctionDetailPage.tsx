/**
 * PHASE 5.0 — AUCTION DETAIL PAGE
 * 
 * eBay-style auction page with:
 * - Auction details
 * - Current bid display
 * - Countdown timer
 * - Bid form
 * - Bid history
 * 
 * NO payment integration
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './AuctionPage.module.css';

interface Auction {
  id: string;
  title: string;
  description: string;
  sellerId: string;
  sellerName?: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  currency: string;
  startsAt: string;
  endsAt: string;
  status: string;
  winnerId?: string;
  winnerName?: string;
  finalPrice?: number;
  minBidIncrement: number;
  autoExtendEnabled: boolean;
  extensionCount: number;
  bidCount: number;
  timeRemainingMs: number;
  isEnding: boolean;
  hasEnded: boolean;
  images?: string[];
  category?: string;
}

interface Bid {
  id: string;
  bidderId: string;
  bidderName?: string;
  amount: number;
  status: string;
  createdAt: string;
}

export const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Fetch auction data
  useEffect(() => {
    fetchAuction();
    fetchBids();
  }, [id]);

  // Update countdown every second
  useEffect(() => {
    if (!auction) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.endsAt).getTime();
      const remaining = Math.max(0, end - now);
      setTimeRemaining(remaining);

      // Refresh auction if ended
      if (remaining === 0 && auction.status === 'ACTIVE') {
        fetchAuction();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  const fetchAuction = async () => {
    try {
      const response = await fetch(`/api/auctions/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setAuction(data.data);
        setTimeRemaining(data.data.timeRemainingMs);
        
        // Set suggested bid amount
        const nextBid = data.data.currentBid === 0
          ? data.data.startingBid
          : data.data.currentBid + data.data.minBidIncrement;
        setBidAmount((nextBid / 100).toFixed(2));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await fetch(`/api/auctions/${id}/bids?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setBids(data.data.bids);
      }
    } catch (err) {
      console.error('Failed to load bids:', err);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auction) return;

    const amountInMinorUnits = Math.round(parseFloat(bidAmount) * 100);

    try {
      const response = await fetch(`/api/auctions/${id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amountInMinorUnits }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh auction and bids
        fetchAuction();
        fetchBids();

        // Show success message
        alert(data.wasExtended 
          ? `Bid placed! Auction extended by ${auction.autoExtendDurationMs / 1000}s`
          : 'Bid placed successfully!');
      } else {
        alert(data.error || 'Failed to place bid');
      }
    } catch (err) {
      alert('Failed to place bid');
    }
  };

  const formatCountdown = (ms: number): string => {
    if (ms === 0) return 'Ended';

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className={styles.loading}>Loading auction...</div>;
  }

  if (error || !auction) {
    return <div className={styles.error}>{error || 'Auction not found'}</div>;
  }

  const canBid = auction.status === 'ACTIVE' && timeRemaining > 0;
  const isEnding = timeRemaining > 0 && timeRemaining < 120000; // Less than 2 minutes

  return (
    <div className={styles.auctionPage}>
      {/* Header */}
      <div className={styles.header}>
        <h1>{auction.title}</h1>
        <span className={`${styles.statusBadge} ${styles[auction.status.toLowerCase()]}`}>
          {auction.status}
        </span>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Left Column - Images and Description */}
        <div className={styles.leftColumn}>
          <div className={styles.imageGallery}>
            {auction.images && auction.images.length > 0 ? (
              <img src={auction.images[0]} alt={auction.title} />
            ) : (
              <div className={styles.noImage}>No image available</div>
            )}
          </div>

          <div className={styles.description}>
            <h2>Description</h2>
            <p>{auction.description}</p>
          </div>

          {/* Bid History */}
          <div className={styles.bidHistory}>
            <h2>Bid History ({auction.bidCount} bids)</h2>
            <table className={styles.bidTable}>
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Amount</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr key={bid.id}>
                    <td>{bid.bidderName || `User ***${bid.bidderId.slice(-3)}`}</td>
                    <td className={styles.bidAmount}>
                      {formatCurrency(bid.amount, auction.currency)}
                    </td>
                    <td>{formatDate(bid.createdAt)}</td>
                    <td>
                      <span className={`${styles.bidStatus} ${styles[bid.status.toLowerCase()]}`}>
                        {bid.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Bidding Panel */}
        <div className={styles.rightColumn}>
          <div className={styles.biddingPanel}>
            {/* Current Bid */}
            <div className={styles.currentBid}>
              <div className={styles.label}>Current Bid</div>
              <div className={styles.amount}>
                {formatCurrency(auction.currentBid || auction.startingBid, auction.currency)}
              </div>
            </div>

            {/* Countdown */}
            <div className={`${styles.countdown} ${isEnding ? styles.ending : ''}`}>
              <div className={styles.label}>Time Remaining</div>
              <div className={styles.time}>{formatCountdown(timeRemaining)}</div>
              {auction.autoExtendEnabled && auction.extensionCount > 0 && (
                <div className={styles.extensionNote}>
                  Extended {auction.extensionCount} time(s)
                </div>
              )}
            </div>

            {/* Bid Form */}
            {canBid ? (
              <form onSubmit={handlePlaceBid} className={styles.bidForm}>
                <label>Your Bid</label>
                <div className={styles.inputGroup}>
                  <input
                    type="number"
                    step="0.01"
                    min={(auction.currentBid === 0 
                      ? auction.startingBid 
                      : auction.currentBid + auction.minBidIncrement) / 100}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                  />
                  <span className={styles.currency}>{auction.currency}</span>
                </div>
                <button type="submit" className={styles.bidButton}>
                  Place Bid
                </button>
                <div className={styles.bidInfo}>
                  Minimum bid: {formatCurrency(
                    auction.currentBid === 0 
                      ? auction.startingBid 
                      : auction.currentBid + auction.minBidIncrement,
                    auction.currency
                  )}
                </div>
              </form>
            ) : auction.status === 'ENDED' ? (
              <div className={styles.auctionEnded}>
                <h3>Auction Ended</h3>
                {auction.winnerId ? (
                  <div>
                    <p>Winner: {auction.winnerName || `User ***${auction.winnerId.slice(-3)}`}</p>
                    <p>Final Price: {formatCurrency(auction.finalPrice || 0, auction.currency)}</p>
                  </div>
                ) : (
                  <p>No winner (reserve not met)</p>
                )}
              </div>
            ) : (
              <div className={styles.notActive}>
                Auction is not active
              </div>
            )}

            {/* Auction Info */}
            <div className={styles.auctionInfo}>
              <div className={styles.infoRow}>
                <span>Seller:</span>
                <span>{auction.sellerName || `User ${auction.sellerId}`}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Starting Bid:</span>
                <span>{formatCurrency(auction.startingBid, auction.currency)}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Starts:</span>
                <span>{formatDate(auction.startsAt)}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Ends:</span>
                <span>{formatDate(auction.endsAt)}</span>
              </div>
              {auction.category && (
                <div className={styles.infoRow}>
                  <span>Category:</span>
                  <span>{auction.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
