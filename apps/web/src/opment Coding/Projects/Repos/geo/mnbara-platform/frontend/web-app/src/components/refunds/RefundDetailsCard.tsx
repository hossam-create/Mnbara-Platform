/**
 * Refund Details Card
 * READ-ONLY refund information display
 * Shows amount, currency, reason, and linked dispute ID
 */

import React from 'react';
import styles from './RefundDetailsCard.module.css';

interface RefundDetails {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  processedAt?: string;
  disputeId?: number;
  guaranteeCoverage?: number;
  metadata?: any;
}

interface RefundDetailsCardProps {
  refund: RefundDetails;
  userRole: 'buyer' | 'seller' | 'traveler';
  showGuaranteeCoverage?: boolean;
}

export default function RefundDetailsCard({ 
  refund, 
  userRole, 
  showGuaranteeCoverage = false 
}: RefundDetailsCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return styles.statusPending;
      case 'APPROVED':
        return styles.statusApproved;
      case 'REJECTED':
        return styles.statusRejected;
      case 'PROCESSED':
        return styles.statusProcessed;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return '⏳';
      case 'APPROVED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'PROCESSED':
        return '💰';
      case 'CANCELLED':
        return '🚫';
      default:
        return '📋';
    }
  };

  const getRoleSpecificMessage = () => {
    switch (userRole) {
      case 'buyer':
        return 'Refund processed according to MNbarh Buyer Protection';
      case 'seller':
        return 'Refund processed - funds deducted from escrow';
      case 'traveler':
        return 'Refund processed - mission payout adjusted';
      default:
        return 'Refund processed';
    }
  };

  return (
    <div className={styles.refundDetailsCard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3>Refund Details</h3>
          <div className={styles.refundId}>
            Refund ID: #{refund.id}
          </div>
        </div>
        <div className={`${styles.statusBadge} ${getStatusColor(refund.status)}`}>
          <span className={styles.statusIcon}>
            {getStatusIcon(refund.status)}
          </span>
          <span className={styles.statusText}>
            {refund.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.amountSection}>
          <div className={styles.amountLabel}>Refund Amount</div>
          <div className={styles.amountValue}>
            {formatCurrency(refund.amount, refund.currency)}
          </div>
        </div>

        <div className={styles.reasonSection}>
          <div className={styles.reasonLabel}>Reason</div>
          <div className={styles.reasonValue}>
            {refund.reason}
          </div>
        </div>

        {refund.disputeId && (
          <div className={styles.disputeSection}>
            <div className={styles.disputeLabel}>Linked Dispute</div>
            <div className={styles.disputeValue}>
              <a href={`/orders/${refund.orderId}#dispute`} className={styles.disputeLink}>
                View Dispute #{refund.disputeId}
              </a>
            </div>
          </div>
        )}

        {showGuaranteeCoverage && refund.guaranteeCoverage !== undefined && (
          <div className={styles.guaranteeSection}>
            <div className={styles.guaranteeLabel}>Guarantee Coverage</div>
            <div className={styles.guaranteeValue}>
              <div className={styles.coverageBar}>
                <div 
                  className={styles.coverageFill}
                  style={{ width: `${refund.guaranteeCoverage}%` }}
                ></div>
              </div>
              <span className={styles.coverageText}>
                {refund.guaranteeCoverage}% covered by MNbarh Guarantee
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.processingInfo}>
          <div className={styles.processedDate}>
            <span className={styles.processedLabel}>Processed</span>
            <span className={styles.processedValue}>
              {formatDate(refund.processedAt)}
            </span>
          </div>
        </div>

        <div className={styles.systemNote}>
          <span className={styles.systemIcon}>🔒</span>
          <span className={styles.systemText}>
            {getRoleSpecificMessage()}
          </span>
        </div>
      </div>
    </div>
  );
}
