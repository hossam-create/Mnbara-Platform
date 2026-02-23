/**
 * Order Payment Summary Component
 * Shows payment state and escrow visibility for orders
 */

import React, { useState, useEffect } from 'react';
import { OrderPaymentSummary, PaymentStatus, EscrowStatus } from '../../types/payment.types';
import paymentService from '../../services/paymentService';
import PaymentStatusBadge from './PaymentStatusBadge';
import GuaranteeBadge from '../guarantee/GuaranteeBadge';
import styles from './OrderPaymentSummary.module.css';

interface OrderPaymentSummaryProps {
  orderId: string;
  totalAmount: number;
  currency: string;
  showGuarantee?: boolean;
  readOnly?: boolean;
}

export default function OrderPaymentSummary({
  orderId,
  totalAmount,
  currency,
  showGuarantee = true,
  readOnly = true
}: OrderPaymentSummaryProps) {
  const [paymentSummary, setPaymentSummary] = useState<OrderPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentSummary();
  }, [orderId]);

  const loadPaymentSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await paymentService.getOrderPaymentSummary(orderId);
      setPaymentSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.paymentSummary}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.paymentSummary}>
        <div className={styles.error}>
          <p>Payment details temporarily unavailable</p>
          <button onClick={loadPaymentSummary} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.paymentSummary}>
      <div className={styles.header}>
        <h3>Payment & Escrow Status</h3>
        {readOnly && (
          <span className={styles.readOnlyBadge}>Read-Only</span>
        )}
      </div>

      {/* Payment Status */}
      <div className={styles.section}>
        <h4>Payment Information</h4>
        <div className={styles.statusCard}>
          <div className={styles.statusRow}>
            <span className={styles.label}>Payment Status:</span>
            <PaymentStatusBadge
              status={paymentSummary?.paymentStatus || PaymentStatus.PENDING}
              type="payment"
              size="medium"
            />
          </div>
          
          <div className={styles.statusRow}>
            <span className={styles.label}>Payment Method:</span>
            <span className={styles.value}>
              {paymentSummary?.paymentMethod ? 
                paymentService.getMethodDisplayName(paymentSummary.paymentMethod) : 
                'Not specified'
              }
            </span>
          </div>

          <div className={styles.statusRow}>
            <span className={styles.label}>Provider:</span>
            <span className={styles.value}>
              {paymentSummary?.paymentProvider ? 
                paymentService.getProviderDisplayName(paymentSummary.paymentProvider) : 
                'Not specified'
              }
            </span>
          </div>

          <div className={styles.statusRow}>
            <span className={styles.label}>Amount:</span>
            <span className={styles.amount}>
              {paymentService.formatCurrency(paymentSummary?.totalAmount || totalAmount, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Escrow Status */}
      <div className={styles.section}>
        <h4>Escrow Information</h4>
        <div className={styles.statusCard}>
          <div className={styles.statusRow}>
            <span className={styles.label}>Escrow Status:</span>
            <PaymentStatusBadge
              status={paymentSummary?.escrowStatus || EscrowStatus.PENDING}
              type="escrow"
              size="medium"
            />
          </div>

          <div className={styles.statusRow}>
            <span className={styles.label}>Escrow Amount:</span>
            <span className={styles.amount}>
              {paymentService.formatCurrency(paymentSummary?.escrowAmount || 0, currency)}
            </span>
          </div>

          {paymentSummary?.refundAmount && paymentSummary.refundAmount > 0 && (
            <div className={styles.statusRow}>
              <span className={styles.label}>Refund Amount:</span>
              <span className={styles.refundAmount}>
                {paymentService.formatCurrency(paymentSummary.refundAmount, currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fees Breakdown */}
      {paymentSummary?.fees && (
        <div className={styles.section}>
          <h4>Fee Breakdown</h4>
          <div className={styles.feeCard}>
            {paymentSummary.fees.paymentFee && (
              <div className={styles.feeRow}>
                <span className={styles.label}>Payment Processing Fee:</span>
                <span className={styles.fee}>
                  {paymentService.formatCurrency(paymentSummary.fees.paymentFee, currency)}
                </span>
              </div>
            )}
            
            {paymentSummary.fees.platformFee && (
              <div className={styles.feeRow}>
                <span className={styles.label}>Platform Fee:</span>
                <span className={styles.fee}>
                  {paymentService.formatCurrency(paymentSummary.fees.platformFee, currency)}
                </span>
              </div>
            )}
            
            {paymentSummary.fees.guaranteeFee && (
              <div className={styles.feeRow}>
                <span className={styles.label}>Guarantee Fee:</span>
                <span className={styles.fee}>
                  {paymentService.formatCurrency(paymentSummary.fees.guaranteeFee, currency)}
                </span>
              </div>
            )}

            <div className={styles.totalFeeRow}>
              <span className={styles.label}>Total Fees:</span>
              <span className={styles.totalFee}>
                {paymentService.formatCurrency(
                  (paymentSummary.fees.paymentFee || 0) +
                  (paymentSummary.fees.platformFee || 0) +
                  (paymentSummary.fees.guaranteeFee || 0),
                  currency
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {paymentSummary?.timeline && (
        <div className={styles.section}>
          <h4>Payment Timeline</h4>
          <div className={styles.timeline}>
            {paymentSummary.timeline.paymentInitiated && (
              <div className={styles.timelineItem}>
                <span className={styles.timelineIcon}>🚀</span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineLabel}>Payment Initiated</span>
                  <span className={styles.timelineDate}>
                    {new Date(paymentSummary.timeline.paymentInitiated).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {paymentSummary.timeline.paymentCompleted && (
              <div className={styles.timelineItem}>
                <span className={styles.timelineIcon}>✅</span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineLabel}>Payment Completed</span>
                  <span className={styles.timelineDate}>
                    {new Date(paymentSummary.timeline.paymentCompleted).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {paymentSummary.timeline.escrowHeld && (
              <div className={styles.timelineItem}>
                <span className={styles.timelineIcon}>🔒</span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineLabel}>Escrow Held</span>
                  <span className={styles.timelineDate}>
                    {new Date(paymentSummary.timeline.escrowHeld).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {paymentSummary.timeline.escrowReleased && (
              <div className={styles.timelineItem}>
                <span className={styles.timelineIcon}>💰</span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineLabel}>Escrow Released</span>
                  <span className={styles.timelineDate}>
                    {new Date(paymentSummary.timeline.escrowReleased).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {paymentSummary.timeline.refundProcessed && (
              <div className={styles.timelineItem}>
                <span className={styles.timelineIcon}>↩️</span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineLabel}>Refund Processed</span>
                  <span className={styles.timelineDate}>
                    {new Date(paymentSummary.timeline.refundProcessed).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guarantee Information */}
      {showGuarantee && (
        <div className={styles.section}>
          <h4>Guarantee Protection</h4>
          <div className={styles.guaranteeCard}>
            <GuaranteeBadge
              level="full"
              escrowStatus={paymentSummary?.escrowStatus === EscrowStatus.HELD ? 'HELD' : 'AVAILABLE'}
              size="medium"
            />
            <div className={styles.guaranteeInfo}>
              <p>
                This order is protected by MNbarh Guarantee. Funds are held in escrow 
                until the order is completed and both parties are satisfied.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Notice */}
      {readOnly && (
        <div className={styles.readOnlyNotice}>
          <div className={styles.noticeIcon}>🔒</div>
          <div className={styles.noticeText}>
            <strong>Read-Only View</strong>
            <p>
              Payment and escrow operations are managed by the system. 
              Contact support if you need assistance with this transaction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
