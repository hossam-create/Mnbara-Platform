/**
 * Transaction Timeline
 * READ-ONLY chronological transaction history
 * Shows immutable system-generated labels
 */

import React from 'react';
import GuaranteeBadge from '../guarantee/GuaranteeBadge';
import styles from './TransactionTimeline.module.css';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  description: string;
  orderId?: number;
  escrowId?: number;
  orderStatus?: string;
  escrowStatus?: string;
  performedBy: number;
  metadata?: any;
  createdAt: string;
  label: string;
  isSystemGenerated: boolean;
  amountFormatted?: string;
  balanceAfterFormatted?: string;
  isCredit?: boolean;
}

interface TransactionTimelineProps {
  transactions: Transaction[];
  loading?: boolean;
}

export default function TransactionTimeline({ 
  transactions, 
  loading = false 
}: TransactionTimelineProps) {
  if (loading) {
    return (
      <div className={styles.transactionTimeline}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading transaction history...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string, fallback?: string) => {
    if (fallback) return fallback;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getTransactionIcon = (type: string, status?: string) => {
    // Escrow transactions
    if (type.startsWith('ESCROW_')) {
      switch (status) {
        case 'HELD':
          return '🔒';
        case 'RELEASED':
          return '✅';
        case 'REFUNDED':
          return '↩️';
        case 'DISPUTED':
          return '⚠️';
        default:
          return '💰';
      }
    }

    // Other transaction types
    switch (type) {
      case 'DEPOSIT':
        return '⬇️';
      case 'WITHDRAWAL':
        return '⬆️';
      case 'TRANSFER_IN':
        return '⬅️';
      case 'TRANSFER_OUT':
        return '➡️';
      case 'CONVERSION':
        return '🔄';
      case 'ADJUSTMENT':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getTransactionColor = (type: string, amount: number, isCredit?: boolean) => {
    if (type.startsWith('ESCROW_')) {
      return styles.escrowTransaction;
    }

    if (typeof isCredit === 'boolean') {
      return isCredit ? styles.creditTransaction : styles.debitTransaction;
    }
    if (amount > 0) {
      return styles.creditTransaction;
    }

    return styles.debitTransaction;
  };

  const isGroupedByDate = (transactions: Transaction[]) => {
    const groups: { [date: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt).toLocaleDateString('en-US');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return groups;
  };

  const groupedTransactions = isGroupedByDate(transactions);

  return (
    <div className={styles.transactionTimeline}>
      <div className={styles.header}>
        <h3>Transaction History</h3>
        <p className={styles.subtitle}>
          Complete immutable record of all wallet activities
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📜</div>
          <h4>No Transactions</h4>
          <p>Your transaction history will appear here once you have activity.</p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
            <div key={date} className={styles.dayGroup}>
              <div className={styles.dateHeader}>
                <span className={styles.date}>{date}</span>
                <span className={styles.transactionCount}>
                  {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className={styles.transactionsList}>
                {dayTransactions.map((transaction) => {
                  const { date, time } = formatDate(transaction.createdAt);
                  const icon = getTransactionIcon(transaction.type, transaction.escrowStatus);
                  const colorClass = getTransactionColor(transaction.type, transaction.amount, transaction.isCredit);

                  return (
                    <div key={transaction.id} className={styles.transactionItem}>
                      <div className={styles.transactionIcon}>
                        <span className={styles.icon}>{icon}</span>
                      </div>

                      <div className={styles.transactionDetails}>
                        <div className={styles.transactionHeader}>
                          <span className={styles.transactionLabel}>
                            {transaction.label}
                          </span>
                          <span className={`${styles.amount} ${colorClass}`}>
                            {transaction.amountFormatted ? (transaction.isCredit ? '+' : '-') : (transaction.amount >= 0 ? '+' : '')}
                            {formatCurrency(Math.abs(transaction.amount), transaction.currency, transaction.amountFormatted)}
                          </span>
                        </div>

                        <div className={styles.transactionMeta}>
                          <span className={styles.description}>
                            {transaction.description}
                          </span>
                          
                          {/* Guarantee Badge for escrow transactions */}
                          {transaction.escrowStatus && (
                            <div className={styles.guaranteeBadge}>
                              <GuaranteeBadge 
                                level="full" 
                                escrowStatus={transaction.escrowStatus as 'HELD' | 'RELEASED' | 'DISPUTED'}
                                size="small"
                              />
                            </div>
                          )}
                          
                          {transaction.orderId && (
                            <span className={styles.orderLink}>
                              Order #{transaction.orderId}
                            </span>
                          )}

                          {transaction.isSystemGenerated && (
                            <span className={styles.systemBadge}>
                              System Generated
                            </span>
                          )}
                        </div>

                        <div className={styles.transactionFooter}>
                          <span className={styles.timestamp}>{time}</span>
                          <span className={styles.balance}>
                            Balance: {formatCurrency(transaction.balanceAfter, transaction.currency, transaction.balanceAfterFormatted)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.securityNote}>
          <span className={styles.securityIcon}>🔒</span>
          <span className={styles.securityText}>
            All transactions are immutable and system-verified
          </span>
        </div>
        
        <div className={styles.disclaimer}>
          <p>
            <strong>Important:</strong> This is a read-only view of your transaction history. 
            All financial operations are processed automatically by system rules and guarantees.
          </p>
        </div>
      </div>
    </div>
  );
}
