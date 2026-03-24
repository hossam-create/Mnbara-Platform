/**
 * Enhanced Transaction Item Component
 * Shows transaction details with payment status badges and order/dispute links
 */

import React from 'react';
import { Transaction } from '../../types/payment.types';
import PaymentStatusBadge from '../payment/PaymentStatusBadge';
import paymentService from '../../services/paymentService';
import styles from './EnhancedTransactionItem.module.css';

interface EnhancedTransactionItemProps {
  transaction: Transaction;
  showOrderLink?: boolean;
  showDisputeLink?: boolean;
}

export default function EnhancedTransactionItem({
  transaction,
  showOrderLink = true,
  showDisputeLink = true
}: EnhancedTransactionItemProps) {
  const getOrderLink = () => {
    if (!transaction.orderId) return null;
    return `/orders/${transaction.orderId}`;
  };

  const getDisputeLink = () => {
    if (!transaction.orderId) return null;
    return `/orders/${transaction.orderId}?tab=disputes`;
  };

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'PAYMENT':
        return '💳';
      case 'REFUND':
        return '↩️';
      case 'ESCROW_HOLD':
        return '🔒';
      case 'ESCROW_RELEASE':
        return '💰';
      case 'DEPOSIT':
        return '📥';
      case 'WITHDRAWAL':
        return '📤';
      case 'FEE':
        return '📋';
      case 'BONUS':
        return '🎁';
      case 'ADJUSTMENT':
        return '⚙️';
      default:
        return '📄';
    }
  };

  const getAmountColor = () => {
    if (transaction.amount < 0) {
      return styles.negativeAmount;
    } else if (transaction.amount > 0) {
      return styles.positiveAmount;
    }
    return styles.neutralAmount;
  };

  return (
    <div className={styles.transactionItem}>
      <div className={styles.transactionHeader}>
        <div className={styles.transactionInfo}>
          <div className={styles.transactionIcon}>
            {getTransactionIcon()}
          </div>
          <div className={styles.transactionDetails}>
            <div className={styles.transactionTitle}>
              {transaction.description}
            </div>
            <div className={styles.transactionMeta}>
              <span className={styles.transactionDate}>
                {new Date(transaction.createdAt).toLocaleDateString()}
              </span>
              {transaction.isSystemGenerated && (
                <span className={styles.systemGenerated}>System</span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.transactionAmount}>
          <div className={`${styles.amount} ${getAmountColor()}`}>
            {paymentService.formatCurrency(Math.abs(transaction.amount), transaction.currency)}
          </div>
          {transaction.orderStatus && (
            <PaymentStatusBadge
              status={transaction.orderStatus as any}
              type="payment"
              size="small"
            />
          )}
          {transaction.escrowStatus && (
            <PaymentStatusBadge
              status={transaction.escrowStatus as any}
              type="escrow"
              size="small"
            />
          )}
        </div>
      </div>

      {/* Transaction Links */}
      <div className={styles.transactionLinks}>
        {showOrderLink && transaction.orderId && (
          <a
            href={getOrderLink()}
            className={styles.orderLink}
            title="View Order Details"
          >
            📋 Order #{transaction.orderId}
          </a>
        )}
        
        {showDisputeLink && transaction.orderId && (
          <a
            href={getDisputeLink()}
            className={styles.disputeLink}
            title="View Dispute Details"
          >
            ⚖️ Dispute
          </a>
        )}
      </div>

      {/* Balance Change */}
      <div className={styles.balanceChange}>
        <span className={styles.balanceLabel}>
          Balance Change:
        </span>
        <div className={styles.balanceAmounts}>
          <span className={styles.balanceBefore}>
            Before: {paymentService.formatCurrency(transaction.balanceBefore, transaction.currency)}
          </span>
          <span className={styles.balanceAfter}>
            After: {paymentService.formatCurrency(transaction.balanceAfter, transaction.currency)}
          </span>
        </div>
      </div>

      {/* Metadata */}
      {transaction.metadata && (
        <div className={styles.transactionMetadata}>
          {transaction.metadata.reference && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Reference:</span>
              <span className={styles.metadataValue}>{transaction.metadata.reference}</span>
            </div>
          )}
          {transaction.metadata.category && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Category:</span>
              <span className={styles.metadataValue}>{transaction.metadata.category}</span>
            </div>
          )}
          {transaction.metadata.tags && transaction.metadata.tags.length > 0 && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Tags:</span>
              <div className={styles.metadataTags}>
                {transaction.metadata.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
