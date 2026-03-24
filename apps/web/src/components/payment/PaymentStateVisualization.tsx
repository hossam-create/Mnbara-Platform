/**
 * Payment State Visualization Component
 * Explains money state WITHOUT moving money
 * Visualizes: Authorized, Held in Escrow, Released, Refunded, Disputed
 */

import React from 'react';
import { PaymentStatus, EscrowStatus, PaymentState, WalletTransaction } from '../../types/payment.types';
import PaymentStatusBadge from './PaymentStatusBadge';
import paymentService from '../../services/paymentService';
import styles from './PaymentStateVisualization.module.css';

interface PaymentStateVisualizationProps {
  paymentState?: PaymentState;
  transactions?: WalletTransaction[];
  showTimeline?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

export default function PaymentStateVisualization({ 
  paymentState, 
  transactions = [], 
  showTimeline = true, 
  showDetails = true,
  compact = false 
}: PaymentStateVisualizationProps) {
  const getPaymentStateIcon = (status: PaymentStatus | EscrowStatus) => {
    switch (status) {
      // Authorized states
      case PaymentStatus.PENDING:
        return '⏳';
      case PaymentStatus.PROCESSING:
        return '⚙️';
      
      // Held in Escrow states
      case EscrowStatus.HELD:
      case EscrowStatus.PENDING:
        return '🔒';
      
      // Released states
      case PaymentStatus.COMPLETED:
      case EscrowStatus.RELEASED:
      case EscrowStatus.PARTIALLY_RELEASED:
        return '✅';
      
      // Refunded states
      case PaymentStatus.REFUNDED:
      case PaymentStatus.PARTIALLY_REFUNDED:
      case EscrowStatus.REFUNDED:
        return '↩️';
      
      // Disputed states
      case PaymentStatus.CHARGEBACK:
      case EscrowStatus.DISPUTED:
        return '⚖️';
      
      // Failed/Cancelled states
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
      case EscrowStatus.EXPIRED:
        return '❌';
      
      default:
        return '📄';
    }
  };

  const getStateCategory = (status: PaymentStatus | EscrowStatus) => {
    if (status === PaymentStatus.PENDING || status === PaymentStatus.PROCESSING) {
      return 'AUTHORIZED';
    }
    if (status === EscrowStatus.HELD || status === EscrowStatus.PENDING) {
      return 'HELD_IN_ESCROW';
    }
    if (status === PaymentStatus.COMPLETED || status === EscrowStatus.RELEASED || status === EscrowStatus.PARTIALLY_RELEASED) {
      return 'RELEASED';
    }
    if (status === PaymentStatus.REFUNDED || status === PaymentStatus.PARTIALLY_REFUNDED || status === EscrowStatus.REFUNDED) {
      return 'REFUNDED';
    }
    if (status === PaymentStatus.CHARGEBACK || status === EscrowStatus.DISPUTED) {
      return 'DISPUTED';
    }
    return 'UNKNOWN';
  };

  const getStateDescription = (category: string) => {
    switch (category) {
      case 'AUTHORIZED':
        return 'Payment has been authorized and is being processed';
      case 'HELD_IN_ESCROW':
        return 'Funds are securely held in escrow until conditions are met';
      case 'RELEASED':
        return 'Funds have been released to the intended recipient';
      case 'REFUNDED':
        return 'Funds have been returned to the original payer';
      case 'DISPUTED':
        return 'Payment is under dispute review';
      default:
        return 'Payment status is being determined';
    }
  };

  const getStateColor = (category: string) => {
    switch (category) {
      case 'AUTHORIZED':
        return '#f59e0b'; // Yellow
      case 'HELD_IN_ESCROW':
        return '#3b82f6'; // Blue
      case 'RELEASED':
        return '#10b981'; // Green
      case 'REFUNDED':
        return '#8b5cf6'; // Purple
      case 'DISPUTED':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const renderStateCard = (title: string, status: PaymentStatus | EscrowStatus, amount: number, currency: string, description: string) => {
    const category = getStateCategory(status);
    const color = getStateColor(category);
    
    return (
      <div className={styles.stateCard} style={{ borderColor: color }}>
        <div className={styles.stateHeader}>
          <div className={styles.stateIcon} style={{ backgroundColor: color }}>
            {getPaymentStateIcon(status)}
          </div>
          <div className={styles.stateInfo}>
            <h4 className={styles.stateTitle}>{title}</h4>
            <p className={styles.stateDescription}>{description}</p>
          </div>
        </div>
        <div className={styles.stateAmount}>
          <span className={styles.amount}>
            {paymentService.formatCurrency(amount, currency)}
          </span>
          <PaymentStatusBadge
            status={status}
            type={typeof status === 'string' && Object.values(EscrowStatus).includes(status as EscrowStatus) ? 'escrow' : 'payment'}
            size="small"
          />
        </div>
      </div>
    );
  };

  const renderPaymentFlow = () => {
    if (!paymentState) return null;

    return (
      <div className={styles.paymentFlow}>
        <h3 className={styles.flowTitle}>Payment Lifecycle</h3>
        <div className={styles.flowSteps}>
          <div className={styles.flowStep}>
            <div className={styles.stepIcon}>1️⃣</div>
            <div className={styles.stepContent}>
              <h4>Authorized</h4>
              <p>Payment authorized by payment provider</p>
              <div className={styles.stepTime}>
                {new Date(paymentState.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          
          {(paymentState.escrowId || paymentState.status === PaymentStatus.PROCESSING) && (
            <div className={styles.flowStep}>
              <div className={styles.stepIcon}>2️⃣</div>
              <div className={styles.stepContent}>
                <h4>Held in Escrow</h4>
                <p>Funds secured until conditions are met</p>
                {paymentState.escrowId && (
                  <div className={styles.escrowInfo}>
                    Escrow ID: {paymentState.escrowId}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {paymentState.status === PaymentStatus.COMPLETED && (
            <div className={styles.flowStep}>
              <div className={styles.stepIcon}>3️⃣</div>
              <div className={styles.stepContent}>
                <h4>Released</h4>
                <p>Funds released to recipient</p>
                {paymentState.completedAt && (
                  <div className={styles.stepTime}>
                    {new Date(paymentState.completedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {paymentState.status === PaymentStatus.REFUNDED && (
            <div className={styles.flowStep}>
              <div className={styles.stepIcon}>↩️</div>
              <div className={styles.stepContent}>
                <h4>Refunded</h4>
                <p>Funds returned to original payer</p>
                {paymentState.refundedAt && (
                  <div className={styles.stepTime}>
                    {new Date(paymentState.refundedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {paymentState.status === PaymentStatus.CHARGEBACK && (
            <div className={styles.flowStep}>
              <div className={styles.stepIcon}>⚖️</div>
              <div className={styles.stepContent}>
                <h4>Disputed</h4>
                <p>Payment under dispute review</p>
                {paymentState.metadata?.chargebackReason && (
                  <div className={styles.disputeReason}>
                    Reason: {paymentState.metadata.chargebackReason}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTransactionTimeline = () => {
    if (!showTimeline || transactions.length === 0) return null;

    return (
      <div className={styles.transactionTimeline}>
        <h3 className={styles.timelineTitle}>Transaction History</h3>
        <div className={styles.timeline}>
          {transactions.map((transaction, index) => (
            <div key={transaction.id} className={styles.timelineItem}>
              <div className={styles.timelineMarker}>
                <div className={styles.timelineDot} style={{ backgroundColor: getStateColor(getStateCategory(transaction.type as any)) }}>
                  {getPaymentStateIcon(transaction.type as any)}
                </div>
                {index < transactions.length - 1 && <div className={styles.timelineLine} />}
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <h4>{transaction.description}</h4>
                  <span className={styles.timelineDate}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.timelineDetails}>
                  <div className={styles.timelineAmount}>
                    {paymentService.formatCurrency(transaction.amount, transaction.currency)}
                  </div>
                  <PaymentStatusBadge
                    status={transaction.type as any}
                    type="payment"
                    size="small"
                  />
                </div>
                {transaction.metadata && (
                  <div className={styles.timelineMetadata}>
                    {transaction.metadata.description && (
                      <p>{transaction.metadata.description}</p>
                    )}
                    {transaction.metadata.reference && (
                      <span className={styles.reference}>
                        Ref: {transaction.metadata.reference}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStateSummary = () => {
    if (!showDetails) return null;

    const authorized = transactions.filter(t => 
      t.type === 'PAYMENT' && (t.status === PaymentStatus.PENDING || t.status === PaymentStatus.PROCESSING)
    );
    const heldInEscrow = transactions.filter(t => 
      t.type === 'ESCROW_HOLD' || t.escrowStatus === EscrowStatus.HELD
    );
    const released = transactions.filter(t => 
      t.type === 'ESCROW_RELEASE' || t.escrowStatus === EscrowStatus.RELEASED
    );
    const refunded = transactions.filter(t => 
      t.type === 'REFUND' || t.status === PaymentStatus.REFUNDED
    );
    const disputed = transactions.filter(t => 
      t.escrowStatus === EscrowStatus.DISPUTED || t.status === PaymentStatus.CHARGEBACK
    );

    return (
      <div className={styles.stateSummary}>
        <h3 className={styles.summaryTitle}>Payment State Summary</h3>
        <div className={styles.summaryGrid}>
          {authorized.length > 0 && (
            <div className={styles.summaryItem}>
              <div className={styles.summaryIcon} style={{ backgroundColor: getStateColor('AUTHORIZED') }}>
                ⏳
              </div>
              <div className={styles.summaryContent}>
                <h4>Authorized</h4>
                <p>{authorized.length} transaction{authorized.length !== 1 ? 's' : ''}</p>
                <div className={styles.summaryAmount}>
                  {paymentService.formatCurrency(
                    authorized.reduce((sum, t) => sum + t.amount, 0),
                    authorized[0]?.currency || 'USD'
                  )}
                </div>
              </div>
            </div>
          )}
          
          {heldInEscrow.length > 0 && (
            <div className={styles.summaryItem}>
              <div className={styles.summaryIcon} style={{ backgroundColor: getStateColor('HELD_IN_ESCROW') }}>
                🔒
              </div>
              <div className={styles.summaryContent}>
                <h4>Held in Escrow</h4>
                <p>{heldInEscrow.length} transaction{heldInEscrow.length !== 1 ? 's' : ''}</p>
                <div className={styles.summaryAmount}>
                  {paymentService.formatCurrency(
                    heldInEscrow.reduce((sum, t) => sum + t.amount, 0),
                    heldInEscrow[0]?.currency || 'USD'
                  )}
                </div>
              </div>
            </div>
          )}
          
          {released.length > 0 && (
            <div className={styles.summaryItem}>
              <div className={styles.summaryIcon} style={{ backgroundColor: getStateColor('RELEASED') }}>
                ✅
              </div>
              <div className={styles.summaryContent}>
                <h4>Released</h4>
                <p>{released.length} transaction{released.length !== 1 ? 's' : ''}</p>
                <div className={styles.summaryAmount}>
                  {paymentService.formatCurrency(
                    released.reduce((sum, t) => sum + t.amount, 0),
                    released[0]?.currency || 'USD'
                  )}
                </div>
              </div>
            </div>
          )}
          
          {refunded.length > 0 && (
            <div className={styles.summaryItem}>
              <div className={styles.summaryIcon} style={{ backgroundColor: getStateColor('REFUNDED') }}>
                ↩️
              </div>
              <div className={styles.summaryContent}>
                <h4>Refunded</h4>
                <p>{refunded.length} transaction{refunded.length !== 1 ? 's' : ''}</p>
                <div className={styles.summaryAmount}>
                  {paymentService.formatCurrency(
                    refunded.reduce((sum, t) => sum + t.amount, 0),
                    refunded[0]?.currency || 'USD'
                  )}
                </div>
              </div>
            </div>
          )}
          
          {disputed.length > 0 && (
            <div className={styles.summaryItem}>
              <div className={styles.summaryIcon} style={{ backgroundColor: getStateColor('DISPUTED') }}>
                ⚖️
              </div>
              <div className={styles.summaryContent}>
                <h4>Disputed</h4>
                <p>{disputed.length} transaction{disputed.length !== 1 ? 's' : ''}</p>
                <div className={styles.summaryAmount}>
                  {paymentService.formatCurrency(
                    disputed.reduce((sum, t) => sum + t.amount, 0),
                    disputed[0]?.currency || 'USD'
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className={styles.compactVisualization}>
        {paymentState && (
          <div className={styles.compactState}>
            <div className={styles.compactIcon}>
              {getPaymentStateIcon(paymentState.status)}
            </div>
            <div className={styles.compactInfo}>
              <span className={styles.compactStatus}>
                {paymentService.getPaymentStatusLabel(paymentState.status)}
              </span>
              <span className={styles.compactAmount}>
                {paymentService.formatCurrency(paymentState.amount, paymentState.currency)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.paymentStateVisualization}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Payment State Visualization</h2>
        <p className={styles.subtitle}>
          Track payment status without executing transactions
        </p>
      </div>

      {/* Payment Flow */}
      {paymentState && renderPaymentFlow()}

      {/* State Summary */}
      {renderStateSummary()}

      {/* Transaction Timeline */}
      {renderTransactionTimeline()}

      {/* Security Notice */}
      <div className={styles.securityNotice}>
        <div className={styles.noticeIcon}>🔒</div>
        <div className={styles.noticeContent}>
          <h4>Visualization Only</h4>
          <p>This interface displays payment states without executing any financial transactions. All actual payment processing is handled by secure backend systems.</p>
        </div>
      </div>
    </div>
  );
}
