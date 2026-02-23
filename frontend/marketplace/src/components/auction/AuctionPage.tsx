/**
 * Auction Page Component
 * Complete auction details with bid visualization and countdown timer
 * UI ONLY - no actual bidding or payments
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Auction, AuctionState, BidHistory, PlaceBidRequest, AuctionPhase, AuctionExtension } from '../../types/auction.types';
import { auctionService } from '../../services/auctionService';
import AuctionCard from './AuctionCard';
import styles from './AuctionPage.module.css';

export default function AuctionPage() {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistory | null>(null);
  const [extensions, setExtensions] = useState<AuctionExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [lastExtension, setLastExtension] = useState<AuctionExtension | null>(null);

  useEffect(() => {
    if (id) {
      loadAuctionData(id);
    }
  }, [id]);

  const loadAuctionData = async (auctionId: string) => {
    try {
      setLoading(true);
      setError(null);
      setBidError(null);

      // Load auction details from backend
      const auctionData = await auctionService.getAuction(auctionId);
      if (!auctionData) {
        setError('Auction not found');
        return;
      }
      setAuction(auctionData);

      // Load auction state from backend (includes current bid, bid count, phase)
      const stateData = await auctionService.getAuctionState(auctionId);
      setAuctionState(stateData);

      // Load bid history from backend
      const historyData = await auctionService.getBidHistory(auctionId);
      setBidHistory(historyData);

      // Load extensions from backend (anti-sniping)
      if (stateData?.extensions) {
        setExtensions(stateData.extensions);
        if (stateData.extensions.length > 0) {
          setLastExtension(stateData.extensions[stateData.extensions.length - 1]);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auction || !auctionState || !id) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    // Clear previous bid error
    setBidError(null);

    try {
      setIsPlacingBid(true);

      const bidRequest: PlaceBidRequest = {
        auctionId: id,
        amount: Math.round(amount * 100), // Convert to cents for backend
        userId: 'current_user_id' // This should come from auth context
      };

      const result = await auctionService.placeBid(bidRequest);
      
      if (result.success) {
        // Reload auction data to get updated state
        await loadAuctionData(id);
        setBidAmount('');
        
        // Check if auction was extended
        if (result.wasExtended && result.extensionInfo) {
          const extensionInfo = result.extensionInfo as any;
          const mappedExtension: AuctionExtension = {
            id: extensionInfo.id ?? 'temp-extension',
            auctionId: auction.id,
            previousEndTime: extensionInfo.previousEndTime,
            newEndTime: extensionInfo.newEndTime,
            extensionMs: extensionInfo.extensionMs ?? 0,
            extensionNumber: extensionInfo.extensionNumber,
            triggeredByUserId: extensionInfo.triggeredByUserId ?? 'unknown',
            createdAt: extensionInfo.createdAt ?? new Date(),
          };
          setLastExtension(mappedExtension);
        }
      } else {
        // Show bid rejection reason from backend
        setBidError(result.error || 'Failed to place bid');
      }
    } catch (err) {
      setBidError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const getNextBidAmount = () => {
    if (!auctionState) return 0;
    // Backend determines minimum bid amount
    return (auctionState.currentBid || 0) + (auction?.minBidIncrement || 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: auction?.currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100); // Backend returns amounts in cents
  };

  if (loading) {
    return (
      <div className={styles.auctionPage}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading auction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.auctionPage}>
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => loadAuctionData(id!)} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className={styles.auctionPage}>
        <div className={styles.notFound}>
          <h3>Auction Not Found</h3>
          <p>The auction you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.auctionPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <span>Home</span>
          <span className={styles.separator}>›</span>
          <span>Auctions</span>
          <span className={styles.separator}>›</span>
          <span>{auction.title}</span>
        </div>
        
        <h1 className={styles.title}>{auction.title}</h1>
        
        <div className={styles.meta}>
          <span className={styles.category}>{auction.category}</span>
          <span className={styles.status} style={{ 
            backgroundColor: auction.status === 'ACTIVE' ? '#10b981' : '#6b7280' 
          }}>
            {auction.status}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Auction Images */}
          <div className={styles.imageGallery}>
            <div className={styles.mainImage}>
              <img 
                src={auction.images[0] || '/placeholder-auction.jpg'} 
                alt={auction.title}
                className={styles.image}
              />
            </div>
            
            {auction.images.length > 1 && (
              <div className={styles.thumbnailGrid}>
                {auction.images.slice(1).map((image, index) => (
                  <img 
                    key={index}
                    src={image}
                    alt={`${auction.title} - Image ${index + 2}`}
                    className={styles.thumbnail}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Auction Details */}
          <div className={styles.auctionDetails}>
            <h2 className={styles.sectionTitle}>Auction Details</h2>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.label}>Current Bid</span>
                <span className={styles.value}>
                  {formatCurrency(auction.currentBid)}
                </span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.label}>Starting Bid</span>
                <span className={styles.value}>
                  {formatCurrency(auction.startingBid)}
                </span>
              </div>
              
              {auction.reservePrice && (
                <div className={styles.detailItem}>
                  <span className={styles.label}>Reserve Price</span>
                  <span className={styles.value}>
                    {auction.currentBid >= auction.reservePrice ? 'Met' : 'Not Met'}
                  </span>
                </div>
              )}
              
              {auction.buyNowPrice && (
                <div className={styles.detailItem}>
                  <span className={styles.label}>Buy Now Price</span>
                  <span className={styles.value}>
                    {formatCurrency(auction.buyNowPrice)}
                  </span>
                </div>
              )}
              
              <div className={styles.detailItem}>
                <span className={styles.label}>Minimum Increment</span>
                <span className={styles.value}>
                  {formatCurrency(auction.minBidIncrement)}
                </span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.label}>Total Bids</span>
                <span className={styles.value}>
                  {auction.bids.length}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className={styles.description}>
              <h3 className={styles.sectionTitle}>Description</h3>
              <p className={styles.descriptionText}>{auction.description}</p>
            </div>

            {/* Seller Information */}
            <div className={styles.sellerInfo}>
              <h3 className={styles.sectionTitle}>Seller Information</h3>
              <div className={styles.sellerDetails}>
                <span className={styles.sellerName}>
                  {auction.sellerName || `Seller ${auction.sellerId}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Bid Section */}
          {auctionState && (
            <div className={styles.bidSection}>
              <h2 className={styles.sectionTitle}>Place Your Bid</h2>
              
              {/* Time Remaining - Backend decides */}
              <div className={`${styles.timeRemaining} ${auctionState.isEnding ? styles.endingSoon : ''}`}>
                <div className={styles.timeIcon}>⏰</div>
                <div className={styles.timeContent}>
                  <div className={styles.timeLabel}>
                    {auctionState.phase === AuctionPhase.EXTENDED ? 'Extended Time' : 'Time Remaining'}
                  </div>
                  <div className={styles.timeValue}>
                    {auctionState.timeRemainingMs > 0 ? 
                      new Date(auctionState.timeRemainingMs).toISOString().substr(11, 8) : 
                      'Ended'
                    }
                  </div>
                  {auctionState.phase === AuctionPhase.EXTENDED && (
                    <div className={styles.extensionNotice}>
                      ⚡ Auction Extended
                    </div>
                  )}
                </div>
              </div>

              {/* Auction Extensions */}
              {lastExtension && (
                <div className={styles.extensionInfo}>
                  <div className={styles.extensionBadge}>
                    Extension #{lastExtension.extensionNumber}
                  </div>
                  <div className={styles.extensionDetails}>
                    Extended by {Math.round(lastExtension.extensionMs / 60000)} minutes
                  </div>
                </div>
              )}

              {/* Current Highest Bid */}
              <div className={styles.currentHighestBid}>
                <span className={styles.label}>Current Highest Bid</span>
                <span className={styles.amount}>
                  {formatCurrency(auctionState.currentBid)}
                </span>
                {auctionState.highestBidderName && (
                  <span className={styles.bidder}>
                    by {auctionState.highestBidderName}
                  </span>
                )}
              </div>

              {/* Bid Form */}
              {auctionState.canBid && (
                <form onSubmit={handleBidSubmit} className={styles.bidForm}>
                  <div className={styles.bidInput}>
                    <label className={styles.inputLabel}>
                      Your Bid Amount
                    </label>
                    <div className={styles.inputGroup}>
                      <span className={styles.currencySymbol}>$</span>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={getNextBidAmount().toString()}
                        min="0.01"
                        step="0.01"
                        className={styles.input}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Bid Error Message */}
                  {bidError && (
                    <div className={styles.bidError}>
                      ⚠️ {bidError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isPlacingBid || !bidAmount}
                    className={styles.bidButton}
                  >
                    {isPlacingBid ? 'Placing Bid...' : 'Place Bid'}
                  </button>
                </form>
              )}

              {/* Auction Ended Message */}
              {!auctionState.canBid && auctionState.hasEnded && (
                <div className={styles.auctionEnded}>
                  <div className={styles.endedIcon}>🎉</div>
                  <div className={styles.endedText}>This auction has ended</div>
                </div>
              )}

              {/* Auction Status Info */}
              <div className={styles.auctionStatusInfo}>
                <div className={styles.statusBadge}>
                  {auctionState.phase === AuctionPhase.LIVE && '🟢 Live'}
                  {auctionState.phase === AuctionPhase.EXTENDED && '⚡ Extended'}
                  {auctionState.phase === AuctionPhase.ENDED && '🔴 Ended'}
                </div>
                <div className={styles.statusDetails}>
                  {auctionState.phase === AuctionPhase.EXTENDED && (
                    <p>Anti-sniping triggered - auction extended</p>
                  )}
                  {auctionState.bidCount > 0 && (
                    <p>{auctionState.bidCount} total bids</p>
                  )}
                </div>
              </div>

              {/* Auction Rules */}
              <div className={styles.auctionRules}>
                <h3 className={styles.sectionTitle}>Auction Rules</h3>
                <ul className={styles.rulesList}>
                  <li>Minimum bid increment: {formatCurrency(auction.minBidIncrement)}</li>
                  <li>Auto-extend: {auction.autoExtendEnabled ? 'Enabled' : 'Disabled'}</li>
                  {auction.autoExtendEnabled && (
                    <li>
                      Extends {(auction.autoExtendDurationMs ?? 0) / 60000} minutes if bid placed within
                      {(auction.autoExtendThresholdMs ?? 0) / 60000} minutes of ending
                    </li>
                  )}
                  <li>Maximum extensions: {auction.maxExtensions}</li>
                  {auction.reservePrice && (
                    <li>Reserve price: {auction.currentBid >= auction.reservePrice ? 'Met' : 'Not met'}</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Bid History */}
          {bidHistory && (
            <div className={styles.bidHistorySection}>
              <h2 className={styles.sectionTitle}>Bid History</h2>
              <div className={styles.bidList}>
                {bidHistory.bids.map((bid, index) => (
                  <div key={bid.id} className={styles.bidItem}>
                    <div className={styles.bidRank}>#{bidHistory.totalCount - index}</div>
                    <div className={styles.bidderInfo}>
                      <span className={styles.bidderName}>
                        {bid.bidderName || `User ${bid.bidderId}`}
                      </span>
                      <span className={styles.bidAmount}>
                        {formatCurrency(bid.amount)}
                      </span>
                    </div>
                    <div className={styles.bidTime}>
                      {new Date(bid.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
