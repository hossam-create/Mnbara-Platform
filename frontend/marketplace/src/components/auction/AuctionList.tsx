/**
 * Auction List Component
 * Displays list of auctions with filtering and sorting
 * UI ONLY - no actual bidding or payments
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Auction, AuctionFilter, AuctionList as AuctionListData } from '../../types/auction.types';
import { AuctionStatus } from '../../types/auction.types';
import { auctionService } from '../../services/auctionService';
import AuctionCard from './AuctionCard';
import styles from './AuctionList.module.css';

export default function AuctionList() {
  const [auctions, setAuctions] = useState<AuctionListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AuctionFilter>({
    page: 1,
    limit: 20,
    sortBy: 'endingAt',
    sortOrder: 'asc'
  });

  useEffect(() => {
    loadAuctions();
  }, [filter]);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await auctionService.getAuctions(filter);
      setAuctions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: Partial<AuctionFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return auctionService.formatCurrency(amount, currency);
  };

  if (loading) {
    return (
      <div className={styles.auctionList}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading auctions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.auctionList}>
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadAuctions} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.auctionList}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Live Auctions</h1>
        <p className={styles.subtitle}>
          Bid on exclusive items from trusted sellers
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Search</label>
          <input
            type="text"
            placeholder="Search auctions..."
            value={filter.search || ''}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Category</label>
          <select
            value={filter.category?.[0] || ''}
            onChange={(e) => handleFilterChange({ 
              category: e.target.value ? [e.target.value] : undefined 
            })}
            className={styles.selectInput}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Watches">Watches</option>
            <option value="Jewelry">Jewelry</option>
            <option value="Art">Art</option>
            <option value="Collectibles">Collectibles</option>
            <option value="Fashion">Fashion</option>
            <option value="Cameras">Cameras</option>
            <option value="Comics">Comics</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            value={filter.status?.[0] || ''}
            onChange={(e) => handleFilterChange({ 
              status: e.target.value ? [e.target.value as AuctionStatus] : undefined 
            })}
            className={styles.selectInput}
          >
            <option value="">All Status</option>
            <option value={AuctionStatus.ACTIVE}>Active</option>
            <option value={AuctionStatus.ENDED}>Ended</option>
            <option value={AuctionStatus.SCHEDULED}>Scheduled</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          <select
            value={filter.sortBy}
            onChange={(e) => handleFilterChange({ 
              sortBy: e.target.value as any 
            })}
            className={styles.selectInput}
          >
            <option value="endingAt">Ending Soon</option>
            <option value="currentBid">Highest Bid</option>
            <option value="bidCount">Most Bids</option>
            <option value="createdAt">Newest</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Price Range</label>
          <div className={styles.priceRange}>
            <input
              type="number"
              placeholder="Min"
              value={filter.priceMin || ''}
              onChange={(e) => handleFilterChange({ 
                priceMin: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              className={styles.priceInput}
            />
            <span className={styles.priceSeparator}>-</span>
            <input
              type="number"
              placeholder="Max"
              value={filter.priceMax || ''}
              onChange={(e) => handleFilterChange({ 
                priceMax: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              className={styles.priceInput}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filter.endingSoon || false}
              onChange={(e) => handleFilterChange({ endingSoon: e.target.checked })}
              className={styles.checkbox}
            />
            Ending Soon
          </label>
        </div>
      </div>

      {/* Results Summary */}
      {auctions && (
        <div className={styles.resultsSummary}>
          <span className={styles.resultsCount}>
            {auctions.totalCount} auction{auctions.totalCount !== 1 ? 's' : ''} found
          </span>
          <span className={styles.pageInfo}>
            Page {auctions.currentPage} of {auctions.totalPages}
          </span>
        </div>
      )}

      {/* Auction Grid */}
      {auctions && auctions.auctions.length > 0 && (
        <div className={styles.auctionGrid}>
          {auctions.auctions.map((auction, index) => (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AuctionCard 
                auction={auction} 
                compact={false}
                showBidButton={true}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* No Results */}
      {auctions && auctions.auctions.length === 0 && (
        <div className={styles.noResults}>
          <div className={styles.noResultsIcon}>🔍</div>
          <h3>No Auctions Found</h3>
          <p>Try adjusting your filters or search terms.</p>
          <button 
            onClick={() => setFilter({ page: 1, limit: 20, sortBy: 'endingAt', sortOrder: 'asc' })}
            className={styles.clearFiltersButton}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {auctions && auctions.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(auctions.currentPage - 1)}
            disabled={!auctions.hasPrevPage}
            className={styles.paginationButton}
          >
            Previous
          </button>
          
          <div className={styles.pageNumbers}>
            {Array.from({ length: Math.min(5, auctions.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === auctions.currentPage;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`${styles.pageNumber} ${isActive ? styles.active : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(auctions.currentPage + 1)}
            disabled={!auctions.hasNextPage}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      {/* UI Only Notice */}
      <div className={styles.uiOnlyNotice}>
        <div className={styles.noticeIcon}>👁️</div>
        <div className={styles.noticeContent}>
          <h4>UI Only - No Real Bidding</h4>
          <p>This is a demonstration interface. No actual bids or payments will be processed.</p>
        </div>
      </div>
    </div>
  );
}
