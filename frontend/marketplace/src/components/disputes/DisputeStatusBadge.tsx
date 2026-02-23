import React from 'react';
import styles from './DisputeStatusBadge.module.css';

interface DisputeStatusBadgeProps {
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  className?: string;
}

export default function DisputeStatusBadge({ 
  status, 
  className = '' 
}: DisputeStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'OPEN':
        return {
          icon: '📋',
          text: 'OPEN',
          subtext: 'Dispute opened',
          className: styles.open
        };
      case 'UNDER_REVIEW':
        return {
          icon: '⏳',
          text: 'UNDER REVIEW',
          subtext: 'MNbarh is reviewing',
          className: styles.underReview
        };
      case 'RESOLVED':
        return {
          icon: '✅',
          text: 'RESOLVED',
          subtext: 'Case completed',
          className: styles.resolved
        };
      default:
        return {
          icon: '❓',
          text: 'UNKNOWN',
          subtext: 'Status unknown',
          className: styles.unknown
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${styles.badge} ${config.className} ${className}`}>
      <div className={styles.icon}>{config.icon}</div>
      <div className={styles.content}>
        <span className={styles.text}>{config.text}</span>
        <span className={styles.subtext}>{config.subtext}</span>
      </div>
    </div>
  );
}
