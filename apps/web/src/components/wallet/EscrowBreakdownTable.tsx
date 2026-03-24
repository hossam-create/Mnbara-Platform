/**
 * Escrow Breakdown Table
 * READ-ONLY escrow holds visualization
 * Shows order details, amounts, and dispute links
 */

import React from 'react';
import styles from './EscrowBreakdownTable.module.css';

interface EscrowHold {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  status: string;
  userRole: 'buyer' | 'seller' | 'traveler';
  description: string;
  createdAt: string;
  expiresAt?: string;
  releasedAt?: string;
  order?: {
    id: number;
    status: string;
    createdAt: string;
    items?: any[];
  };
  statusLabel: string;
  actionContext: string;
  metadata?: any;
}

interface EscrowBreakdownTableProps {
  escrows: EscrowHold[];
  loading?: boolean;
  userRole: 'buyer' | 'seller' | 'traveler';
}

export default function EscrowBreakdownTable({ 
  escrows, 
  loading = false, 
  userRole 
}: EscrowBreakdownTableProps) {
  if (loading) {
    return (
      <div className={styles.escrowBreakdownTable}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading escrow details...</p>
        </div>
      </div>
    );
  }

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
      case 'HELD':
        return styles.statusHeld;
      case 'RELEASED':
        return styles.statusReleased;
      case 'REFUNDED':
        return styles.statusRefunded;
      case 'DISPUTED':
        return styles.statusDisputed;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HELD':
        return '🔒';
      case 'RELEASED':
        return '✅';
      case 'REFUNDED':
        return '↩️';
      case 'DISPUTED':
        return '⚠️';
      case 'CANCELLED':
        return '❌';
      default:
        return '⏳';
    }
  };

  const hasDispute = (escrow: EscrowHold) => {
    return escrow.status === 'DISPUTED' || 
           (escrow.metadata && escrow.metadata.disputeId);
  };

  return (
    <div className={styles.escrowBreakdownTable}>
      <div className={styles.header}>
        <h3>Escrow Transactions</h3>
        <p className={styles.subtitle}>
          {userRole === 'buyer' && 'Payments held securely until order completion'}
          {userRole === 'seller' && 'Earnings held in escrow until release'}
          {userRole === 'traveler' && 'Mission payments held in escrow'}
        </p>
      </div>

      {escrows.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h4>No Escrow Transactions</h4>
          <p>
            {userRole === 'buyer' && 'Your payment history will appear here'}
            {userRole === 'seller' && 'Your escrow earnings will appear here'}
            {userRole === 'traveler' && 'Your mission payments will appear here'}
          </p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.escrowTable}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Released</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {escrows.map((escrow) => (
                <tr key={escrow.id} className={styles.tableRow}>
                  <td className={styles.orderId}>
                    <span className={styles.orderNumber}>#{escrow.orderId}</span>
                    {escrow.order && (
                      <span className={styles.orderStatus}>
                        {escrow.order.status}
                      </span>
                    )}
                  </td>
                  
                  <td className={styles.amount}>
                    {formatCurrency(escrow.amount, escrow.currency)}
                  </td>
                  
                  <td className={styles.status}>
                    <span className={`${styles.statusBadge} ${getStatusColor(escrow.status)}`}>
                      <span className={styles.statusIcon}>
                        {getStatusIcon(escrow.status)}
                      </span>
                      <span className={styles.statusText}>
                        {escrow.statusLabel}
                      </span>
                    </span>
                  </td>
                  
                  <td className={styles.date}>
                    {formatDate(escrow.createdAt)}
                  </td>
                  
                  <td className={styles.date}>
                    {formatDate(escrow.releasedAt)}
                  </td>
                  
                  <td className={styles.actions}>
                    {hasDispute(escrow) && (
                      <button 
                        className={styles.disputeButton}
                        onClick={() => {
                          // Navigate to dispute details
                          window.location.href = `/orders/${escrow.orderId}#dispute`;
                        }}
                      >
                        <span className={styles.disputeIcon}>⚠️</span>
                        View Dispute
                      </button>
                    )}
                    
                    {!hasDispute(escrow) && escrow.status === 'HELD' && (
                      <div className={styles.actionContext}>
                        <span className={styles.contextIcon}>ℹ️</span>
                        <span className={styles.contextText}>
                          {escrow.actionContext}
                        </span>
                      </div>
                    )}
                    
                    {escrow.status === 'RELEASED' && (
                      <div className={styles.completionNote}>
                        <span className={styles.completionIcon}>✅</span>
                        <span className={styles.completionText}>
                          Order completed
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.securityNote}>
          <span className={styles.securityIcon}>🔒</span>
          <span className={styles.securityText}>
            All escrow transactions are processed automatically by system rules
          </span>
        </div>
        
        <div className={styles.helpText}>
          <p>
            <strong>Need help?</strong> Contact support for any questions about your escrow transactions.
          </p>
        </div>
      </div>
    </div>
  );
}
