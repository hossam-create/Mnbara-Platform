/**
 * Wallet Summary Card
 * READ-ONLY wallet visibility component
 * Shows balances without money movement controls
 */

import React from 'react';
import styles from './WalletSummaryCard.module.css';

interface WalletSummary {
  walletType: 'buyer' | 'seller' | 'traveler';
  balances: {
    available: number;
    totalEscrowHeld: number;
    pendingRefunds: number;
    releasedEarnings: number;
    totalValue: number;
  };
  currency: string;
  lastUpdated: string;
  isReadOnly: boolean;
}

interface WalletSummaryCardProps {
  summary: WalletSummary;
  loading?: boolean;
  availableFormattedOverride?: string;
}

export default function WalletSummaryCard({ summary, loading = false, availableFormattedOverride }: WalletSummaryCardProps) {
  if (loading) {
    return (
      <div className={styles.walletSummaryCard}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: summary.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Role-specific content
  const getRoleSpecificContent = () => {
    switch (summary.walletType) {
      case 'buyer':
        return {
          title: 'Buyer Wallet',
          subtitle: 'Funds protected by MNbarh Guarantee',
          primaryLabel: 'Available Balance',
          secondaryLabel: 'Funds Held in Escrow',
          tertiaryLabel: 'Pending Refunds'
        };
      case 'seller':
        return {
          title: 'Seller Wallet',
          subtitle: 'Earnings from completed orders',
          primaryLabel: 'Available Balance',
          secondaryLabel: 'Pending Earnings',
          tertiaryLabel: 'Released Earnings'
        };
      case 'traveler':
        return {
          title: 'Traveler Wallet',
          subtitle: 'Mission earnings and payouts',
          primaryLabel: 'Available Balance',
          secondaryLabel: 'Pending Payouts',
          tertiaryLabel: 'Released Payouts'
        };
      default:
        return {
          title: 'Wallet',
          subtitle: 'Your account balance',
          primaryLabel: 'Available Balance',
          secondaryLabel: 'Other Balances',
          tertiaryLabel: 'Total Value'
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  return (
    <div className={styles.walletSummaryCard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>{roleContent.title}</h2>
          <p className={styles.subtitle}>{roleContent.subtitle}</p>
        </div>
        {summary.isReadOnly && (
          <div className={styles.readOnlyBadge}>
            <span className={styles.readOnlyIcon}>👁️</span>
            <span className={styles.readOnlyText}>View Only</span>
          </div>
        )}
      </div>

      <div className={styles.balances}>
        <div className={styles.primaryBalance}>
          <div className={styles.balanceLabel}>{roleContent.primaryLabel}</div>
          <div className={styles.balanceAmount}>
            {availableFormattedOverride ?? formatCurrency(summary.balances.available)}
          </div>
        </div>

        <div className={styles.secondaryBalances}>
          <div className={styles.balanceItem}>
            <div className={styles.balanceLabel}>{roleContent.secondaryLabel}</div>
            <div className={styles.balanceAmount + " " + styles.secondary}>
              {formatCurrency(summary.balances.totalEscrowHeld)}
            </div>
          </div>

          <div className={styles.balanceItem}>
            <div className={styles.balanceLabel}>{roleContent.tertiaryLabel}</div>
            <div className={styles.balanceAmount + " " + styles.secondary}>
              {summary.walletType === 'buyer' 
                ? formatCurrency(summary.balances.pendingRefunds)
                : summary.walletType === 'seller'
                ? formatCurrency(summary.balances.releasedEarnings)
                : formatCurrency(summary.balances.releasedEarnings)
              }
            </div>
          </div>
        </div>
      </div>

      <div className={styles.totalValue}>
        <div className={styles.totalLabel}>Total Wallet Value</div>
        <div className={styles.totalAmount}>
          {formatCurrency(summary.balances.totalValue)}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.lastUpdated}>
          Last updated: {formatDate(summary.lastUpdated)}
        </div>
        
        {summary.isReadOnly && (
          <div className={styles.securityNote}>
            <span className={styles.securityIcon}>🔒</span>
            <span className={styles.securityText}>
              All transactions processed by system rules
            </span>
          </div>
        )}
      </div>

      {/* Trust indicators */}
      <div className={styles.trustIndicators}>
        <div className={styles.trustItem}>
          <span className={styles.trustIcon}>✓</span>
          <span className={styles.trustText}>Funds held securely</span>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustIcon}>✓</span>
          <span className={styles.trustText}>Protected by guarantee</span>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustIcon}>✓</span>
          <span className={styles.trustText}>Real-time balance</span>
        </div>
      </div>
    </div>
  );
}
