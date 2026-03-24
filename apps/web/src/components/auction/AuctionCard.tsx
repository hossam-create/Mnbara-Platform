/**
 * Auction Card Component
 * Displays auction information with bid visualization and countdown timer
 * UI ONLY - no actual bidding or payments
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Auction, AuctionStatus, formatCountdown } from '../../types/auction.types';
import auctionService from '../../services/auctionService';
import styles from './AuctionCard.module.css';

interface AuctionCardProps {
  auction: Auction;
  compact?: boolean;
  showBidButton?: boolean;
  className?: string;
}

export default function AuctionCard({ 
  auction, 
  compact = false, 
  showBidButton = true,
  className = ''
}: AuctionCardProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(auctionService.getAuctionTimeRemaining(auction)));

  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdown = formatCountdown(auctionService.getAuctionTimeRemaining(auction));
      setCountdown(newCountdown);
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const getStatusColor = (status: AuctionStatus) => {
    switch (status) {
      case AuctionStatus.ACTIVE:
        return '#10b981'; // Green
      case AuctionStatus.ENDED:
      case AuctionStatus.SOLD:
        return '#3b82f6'; // Blue
      case AuctionStatus.EXPIRED:
      case AuctionStatus.CANCELLED:
        return '#ef4444'; // Red
      case AuctionStatus.SCHEDULED:
        return '#f59e0b'; // Yellow
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusLabel = (status: AuctionStatus) => {
    switch (status) {
      case AuctionStatus.ACTIVE:
        return 'Active';
      case AuctionStatus.ENDED:
        return 'Ended';
      case AuctionStatus.SOLD:
        return 'Sold';
      case AuctionStatus.EXPIRED:
        return 'Expired';
      case AuctionStatus.CANCELLED:
        return 'Cancelled';
      case AuctionStatus.SCHEDULED:
        return 'Scheduled';
      default:
        return 'Unknown';
    }
  };

  const getNextBidAmount = () => {
    return auction.currentBid + auction.minBidIncrement;
  };

  const formatCurrency = (amount: number) => {
    return auctionService.formatCurrency(amount, auction.currency);
  };

  if (compact) {
    return (
      <div className={`${styles.auctionCard} ${styles.compact} ${className}`}>
        <Link to={`/auctions/${auction.id}`} className={styles.compactLink}>
          <div className={styles.compactImage}>
            <img 
              src={auction.images[0] || '/placeholder-auction.jpg'} 
              alt={auction.title}
              className={styles.image}
            />
            <div 
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(auction.status) }}
            >
              {getStatusLabel(auction.status)}
            </div>
          </div>
          
          <div className={styles.compactContent}>
            <h3 className={styles.title}>{auction.title}</h3>
            
            <div className={styles.bidInfo}>
              <span className={styles.currentBid}>
                {formatCurrency(auction.currentBid)}
              </span>
              <span className={styles.bidCount}>
                {auction.bids.length} bids
              </span>
            </div>
            
            <div className={styles.countdown}>
              <span className={countdown.isEnding ? styles.endingSoon : ''}>
                {countdown.formatted}
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      className={`${styles.auctionCard} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/auctions/${auction.id}`} className={styles.cardLink}>
        {/* Image Section */}
        <div className={styles.imageSection}>
          <img 
            src={auction.images[0] || '/placeholder-auction.jpg'} 
            alt={auction.title}
            className={styles.image}
          />
          
          {/* Status Badge */}
          <div 
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(auction.status) }}
          >
            {getStatusLabel(auction.status)}
          </div>
          
          {/* Category Badge */}
          <div className={styles.categoryBadge}>
            {auction.category}
          </div>
          
          {/* Countdown Overlay */}
          <div className={`${styles.countdownOverlay} ${countdown.isEnding ? styles.endingSoon : ''}`}>
            <div className={styles.countdownContent}>
              <div className={styles.countdownTime}>
                {countdown.formatted}
              </div>
              {countdown.isEnding && (
                <div className={styles.endingLabel}>
                  ⚡ Ending Soon
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.contentSection}>
          {/* Title */}
          <h3 className={styles.title}>{auction.title}</h3>
          
          {/* Current Bid */}
          <div className={styles.currentBidSection}>
            <div className={styles.bidLabel}>
              Current Bid
            </div>
            <div className={styles.bidAmount}>
              {formatCurrency(auction.currentBid)}
            </div>
            <div className={styles.bidCount}>
              {auction.bids.length} bid{auction.bids.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Next Bid */}
          {auction.status === AuctionStatus.ACTIVE && (
            <div className={styles.nextBidSection}>
              <div className={styles.nextBidLabel}>
                Next Bid
              </div>
              <div className={styles.nextBidAmount}>
                {formatCurrency(getNextBidAmount())}
              </div>
            </div>
          )}

          {/* Auction Info */}
          <div className={styles.auctionInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Starting:</span>
              <span className={styles.infoValue}>
                {formatCurrency(auction.startingBid)}
              </span>
            </div>
            
            {auction.reservePrice && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Reserve:</span>
                <span className={styles.infoValue}>
                  {auction.currentBid >= auction.reservePrice ? 'Met' : 'Not Met'}
                </span>
              </div>
            )}
            
            {auction.buyNowPrice && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Buy Now:</span>
                <span className={styles.infoValue}>
                  {formatCurrency(auction.buyNowPrice)}
                </span>
              </div>
            )}
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Seller:</span>
              <span className={styles.infoValue}>
                {auction.sellerName || `Seller ${auction.sellerId}`}
              </span>
            </div>
          </div>

          {/* Time Remaining */}
          <div className={`${styles.timeRemaining} ${countdown.isEnding ? styles.endingSoon : ''}`}>
            <div className={styles.timeIcon}>
              ⏰
            </div>
            <div className={styles.timeContent}>
              <div className={styles.timeLabel}>
                Time Remaining
              </div>
              <div className={styles.timeValue}>
                {countdown.formatted}
              </div>
            </div>
          </div>

          {/* Bid Button */}
          {showBidButton && auction.status === AuctionStatus.ACTIVE && !countdown.isEnded && (
            <button className={styles.bidButton}>
              Place Bid
            </button>
          )}
          
          {auction.status === AuctionStatus.ENDED && (
            <div className={styles.endedMessage}>
              {auction.status === AuctionStatus.SOLD ? 'Sold' : 'Auction Ended'}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
