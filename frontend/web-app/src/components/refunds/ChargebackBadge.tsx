/**
 * Chargeback Badge
 * READ-ONLY chargeback status indicator
 * Only visible if gateway initiated chargeback
 */

import React from 'react';
import styles from './ChargebackBadge.module.css';

interface ChargebackBadgeProps {
  status: 'RECEIVED' | 'UNDER_REVIEW' | 'WON' | 'LOST';
  amount?: number;
  currency?: string;
  gatewayResponse?: string;
}

export default function ChargebackBadge({ 
  status, 
  amount, 
  currency = 'USD', 
  gatewayResponse 
}: ChargebackBadgeProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getBadgeConfig = () => {
    switch (status) {
      case 'RECEIVED':
        return {
          className: styles.badgeReceived,
          icon: '💳',
          label: 'Chargeback Received',
          description: 'Payment gateway initiated chargeback'
        };
      case 'UNDER_REVIEW':
        return {
          className: styles.badgeReview,
          icon: '🔍',
          label: 'Under Review',
          description: 'Chargeback being investigated'
        };
      case 'WON':
        return {
          className: styles.badgeWon,
          icon: '🏆',
          label: 'Chargeback Won',
          description: 'Chargeback resolved in your favor'
        };
      case 'LOST':
        return {
          className: styles.badgeLost,
          icon: '💔',
          label: 'Chargeback Lost',
          description: 'Chargeback resolved against you'
        };
      default:
        return {
          className: styles.badgeDefault,
          icon: '⚠️',
          label: 'Unknown Status',
          description: 'Chargeback status unknown'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`${styles.chargebackBadge} ${config.className}`}>
      <div className={styles.badgeHeader}>
        <span className={styles.badgeIcon}>{config.icon}</span>
        <span className={styles.badgeLabel}>{config.label}</span>
      </div>

      <div className={styles.badgeContent}>
        {amount && (
          <div className={styles.badgeAmount}>
            {formatCurrency(amount)}
          </div>
        )}

        <div className={styles.badgeDescription}>
          {config.description}
        </div>

        {gatewayResponse && (
          <div className={styles.gatewayResponse}>
            <span className={styles.responseLabel}>Gateway Response:</span>
            <span className={styles.responseValue}>
              {gatewayResponse}
            </span>
          </div>
        )}
      </div>

      <div className={styles.badgeFooter}>
        <span className={styles.systemNote}>
          <span className={styles.systemIcon}>🔒</span>
          <span className={styles.systemText}>
            Chargeback handled by payment gateway and MNbarh guarantee system
          </span>
        </span>
      </div>
    </div>
  );
}
