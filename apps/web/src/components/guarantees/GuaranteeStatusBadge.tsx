import React from 'react';
import styles from './GuaranteeStatusBadge.module.css';

interface GuaranteeStatusBadgeProps {
  status: 'ACTIVE' | 'DISPUTE' | 'RELEASED';
  className?: string;
}

export default function GuaranteeStatusBadge({ 
  status, 
  className = '' 
}: GuaranteeStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          icon: '🟢',
          text: 'Guaranteed',
          subtext: 'Funds Held',
          className: styles.active
        };
      case 'DISPUTE':
        return {
          icon: '🟡',
          text: 'In Dispute',
          subtext: 'Guarantee Active',
          className: styles.dispute
        };
      case 'RELEASED':
        return {
          icon: '🔵',
          text: 'Released',
          subtext: 'Guarantee Completed',
          className: styles.released
        };
      default:
        return {
          icon: '⚪',
          text: 'Unknown',
          subtext: 'Status Unknown',
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
