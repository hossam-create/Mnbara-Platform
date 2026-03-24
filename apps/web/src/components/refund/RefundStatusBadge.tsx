/**
 * Refund Status Badge Component
 * Visual indicator for refund and chargeback states
 */

import React from 'react';
import { RefundStatus, ChargebackStatus } from '../../types/refund.types';
import refundService from '../../services/refundService';
import styles from './RefundStatusBadge.module.css';

interface RefundStatusBadgeProps {
  status: RefundStatus | ChargebackStatus;
  type: 'refund' | 'chargeback';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export default function RefundStatusBadge({ 
  status, 
  type, 
  size = 'medium', 
  showIcon = true 
}: RefundStatusBadgeProps) {
  const getLabel = () => {
    if (type === 'refund') {
      return refundService.getRefundStatusLabel(status as RefundStatus);
    } else {
      return refundService.getChargebackStatusLabel(status as ChargebackStatus);
    }
  };

  const getColorClass = () => {
    if (type === 'refund') {
      return refundService.getRefundStatusColor(status as RefundStatus);
    } else {
      return refundService.getChargebackStatusColor(status as ChargebackStatus);
    }
  };

  const getIcon = () => {
    if (type === 'refund') {
      switch (status) {
        case RefundStatus.REQUESTED:
          return '⏳';
        case RefundStatus.UNDER_REVIEW:
          return '👁️';
        case RefundStatus.APPROVED:
          return '✅';
        case RefundStatus.REJECTED:
          return '❌';
        case RefundStatus.PROCESSING:
          return '⚙️';
        case RefundStatus.COMPLETED:
          return '✅';
        case RefundStatus.FAILED:
          return '❌';
        case RefundStatus.CANCELLED:
          return '🚫';
        default:
          return '📄';
      }
    } else {
      switch (status) {
        case ChargebackStatus.NONE:
          return '✅';
        case ChargebackStatus.INITIATED:
          return '⚠️';
        case ChargebackStatus.UNDER_REVIEW:
          return '👁️';
        case ChargebackStatus.ACCEPTED:
          return '📋';
        case ChargebackStatus.DISPUTED:
          return '⚖️';
        case ChargebackStatus.RESOLVED_BUYER:
          return '✅';
        case ChargebackStatus.RESOLVED_SELLER:
          return '✅';
        case ChargebackStatus.EXPIRED:
          return '⏰';
        default:
          return '📄';
      }
    }
  };

  const sizeClass = styles[size] || styles.medium;

  return (
    <span className={`${styles.badge} ${sizeClass} ${getColorClass()}`}>
      {showIcon && <span className={styles.icon}>{getIcon()}</span>}
      <span className={styles.label}>{getLabel()}</span>
    </span>
  );
}
