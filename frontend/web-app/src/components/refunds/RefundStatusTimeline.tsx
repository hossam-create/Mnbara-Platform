/**
 * Refund Status Timeline
 * READ-ONLY step-based visualization
 * Shows immutable system-driven refund process
 */

import React from 'react';
import styles from './RefundStatusTimeline.module.css';

interface RefundStep {
  type: 'ESCROW_CREATED' | 'DISPUTE_OPENED' | 'DISPUTE_RESOLVED' | 'REFUND_REQUESTED' | 'REFUND_APPROVED' | 'REFUND_REJECTED' | 'REFUND_PROCESSED' | 'CHARGEBACK_RECEIVED' | 'CHARGEBACK_UNDER_REVIEW' | 'CHARGEBACK_WON' | 'CHARGEBACK_LOST';
  timestamp: string;
  actor: 'SYSTEM' | 'BUYER' | 'SELLER' | 'TRAVELER' | 'PAYMENT_GATEWAY' | 'ADMIN' | 'CONTROL_CENTER';
  description: string;
  amount?: number;
  status?: string;
  metadata?: any;
}

interface RefundStatusTimelineProps {
  steps: RefundStep[];
  loading?: boolean;
  orderId: number;
  userRole: 'buyer' | 'seller' | 'traveler';
}

export default function RefundStatusTimeline({ 
  steps, 
  loading = false, 
  orderId, 
  userRole 
}: RefundStatusTimelineProps) {
  if (loading) {
    return (
      <div className={styles.refundStatusTimeline}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading refund status...</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStepIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'ESCROW_CREATED': '🔒',
      'DISPUTE_OPENED': '⚠️',
      'DISPUTE_RESOLVED': '✅',
      'REFUND_REQUESTED': '📝',
      'REFUND_APPROVED': '✅',
      'REFUND_REJECTED': '❌',
      'REFUND_PROCESSED': '💰',
      'CHARGEBACK_RECEIVED': '💳',
      'CHARGEBACK_UNDER_REVIEW': '🔍',
      'CHARGEBACK_WON': '🏆',
      'CHARGEBACK_LOST': '💔'
    };
    return iconMap[type] || '📋';
  };

  const getStepColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'ESCROW_CREATED': styles.stepCreated,
      'DISPUTE_OPENED': styles.stepDispute,
      'DISPUTE_RESOLVED': styles.stepResolved,
      'REFUND_REQUESTED': styles.stepRequested,
      'REFUND_APPROVED': styles.stepApproved,
      'REFUND_REJECTED': styles.stepRejected,
      'REFUND_PROCESSED': styles.stepProcessed,
      'CHARGEBACK_RECEIVED': styles.stepChargeback,
      'CHARGEBACK_UNDER_REVIEW': styles.stepReview,
      'CHARGEBACK_WON': styles.stepWon,
      'CHARGEBACK_LOST': styles.stepLost
    };
    return colorMap[type] || styles.stepDefault;
  };

  const getActorLabel = (actor: string, userRole: string) => {
    const actorMap: Record<string, Record<string, string>> = {
      'SYSTEM': { buyer: 'MNbarh System', seller: 'MNbarh System', traveler: 'MNbarh System' },
      'BUYER': { buyer: 'You', seller: 'Buyer', traveler: 'Buyer' },
      'SELLER': { buyer: 'Seller', seller: 'You', traveler: 'Seller' },
      'TRAVELER': { buyer: 'Traveler', seller: 'Traveler', traveler: 'You' },
      'PAYMENT_GATEWAY': { buyer: 'Payment Gateway', seller: 'Payment Gateway', traveler: 'Payment Gateway' },
      'ADMIN': { buyer: 'Admin', seller: 'Admin', traveler: 'Admin' },
      'CONTROL_CENTER': { buyer: 'Control Center', seller: 'Control Center', traveler: 'Control Center' }
    };
    return actorMap[actor]?.[userRole] || actor;
  };

  const getStepTitle = (type: string) => {
    const titleMap: Record<string, string> = {
      'ESCROW_CREATED': 'Escrow Created',
      'DISPUTE_OPENED': 'Dispute Opened',
      'DISPUTE_RESOLVED': 'Dispute Resolved',
      'REFUND_REQUESTED': 'Refund Requested',
      'REFUND_APPROVED': 'Refund Approved',
      'REFUND_REJECTED': 'Refund Rejected',
      'REFUND_PROCESSED': 'Refund Processed',
      'CHARGEBACK_RECEIVED': 'Chargeback Received',
      'CHARGEBACK_UNDER_REVIEW': 'Chargeback Under Review',
      'CHARGEBACK_WON': 'Chargeback Won',
      'CHARGEBACK_LOST': 'Chargeback Lost'
    };
    return titleMap[type] || 'System Action';
  };

  // Group steps by date
  const groupedSteps = steps.reduce((groups, step) => {
    const date = new Date(step.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(step);
    return groups;
  }, {} as Record<string, RefundStep[]>);

  return (
    <div className={styles.refundStatusTimeline}>
      <div className={styles.header}>
        <h3>Refund & Chargeback Timeline</h3>
        <p className={styles.subtitle}>
          Order #{orderId} • Complete immutable record of all actions
        </p>
      </div>

      {Object.entries(groupedSteps).map(([date, daySteps]) => (
        <div key={date} className={styles.dayGroup}>
          <div className={styles.dateHeader}>
            <span className={styles.date}>{date}</span>
            <span className={styles.stepCount}>
              {daySteps.length} action{daySteps.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.stepsList}>
            {daySteps.map((step, index) => (
              <div key={index} className={styles.stepItem}>
                <div className={styles.stepIcon}>
                  <span className={styles.icon}>{getStepIcon(step.type)}</span>
                </div>

                <div className={styles.stepContent}>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepTitle}>
                      {getStepTitle(step.type)}
                    </span>
                    <span className={styles.stepActor}>
                      by {getActorLabel(step.actor, userRole)}
                    </span>
                    {step.amount && (
                      <span className={styles.stepAmount}>
                        {formatCurrency(step.amount)}
                      </span>
                    )}
                  </div>

                  <div className={styles.stepDescription}>
                    {step.description}
                  </div>

                  <div className={styles.stepMeta}>
                    <span className={styles.timestamp}>
                      {formatDate(step.timestamp).time}
                    </span>
                    {step.status && (
                      <span className={`${styles.statusBadge} ${getStepColor(step.type)}`}>
                        {step.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.footer}>
        <div className={styles.securityNote}>
          <span className={styles.securityIcon}>🔒</span>
          <span className={styles.securityText}>
            <strong>Immutable Record:</strong> All refund and chargeback actions are system-driven and cannot be modified
          </span>
        </div>
        
        <div className={styles.helpSection}>
          <h4>Need Help?</h4>
          <p>
            If you have questions about this refund or chargeback, please contact support with the order ID.
          </p>
        </div>
      </div>
    </div>
  );
}
