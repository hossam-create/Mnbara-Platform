/**
 * Payment Status Badge Component
 * Visual indicator for payment states
 */

import React from 'react';
import { PaymentStatus, EscrowStatus } from '../../types/payment.types';
import paymentService from '../../services/paymentService';
import styles from './PaymentStatusBadge.module.css';

interface PaymentStatusBadgeProps {
  status: PaymentStatus | EscrowStatus;
  type: 'payment' | 'escrow';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export default function PaymentStatusBadge({ 
  status, 
  type, 
  size = 'medium', 
  showIcon = true 
}: PaymentStatusBadgeProps) {
  const getLabel = () => {
    if (type === 'payment') {
      return paymentService.getPaymentStatusLabel(status as PaymentStatus);
    } else {
      return paymentService.getEscrowStatusLabel(status as EscrowStatus);
    }
  };

  const getColorClass = () => {
    if (type === 'payment') {
      return paymentService.getPaymentStatusColor(status as PaymentStatus);
    } else {
      return paymentService.getEscrowStatusColor(status as EscrowStatus);
    }
  };

  const getIcon = () => {
    switch (status) {
      case PaymentStatus.PENDING:
      case EscrowStatus.PENDING:
        return '⏳';
      case PaymentStatus.PROCESSING:
        return '⚙️';
      case PaymentStatus.COMPLETED:
      case EscrowStatus.RELEASED:
        return '✅';
      case PaymentStatus.FAILED:
        return '❌';
      case PaymentStatus.CANCELLED:
      case EscrowStatus.EXPIRED:
        return '🚫';
      case PaymentStatus.REFUNDED:
      case EscrowStatus.REFUNDED:
        return '↩️';
      case PaymentStatus.PARTIALLY_REFUNDED:
      case EscrowStatus.PARTIALLY_RELEASED:
        return '⚖️';
      case PaymentStatus.CHARGEBACK:
        return '⚠️';
      case EscrowStatus.HELD:
        return '🔒';
      case EscrowStatus.DISPUTED:
        return '⚖️';
      default:
        return '❓';
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
