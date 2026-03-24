/**
 * Order Refund Page
 * READ-ONLY refund status and timeline for specific order
 * Shows complete refund process with no action capabilities
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import RefundStatusTimeline from '../../components/refunds/RefundStatusTimeline';
import RefundDetailsCard from '../../components/refunds/RefundDetailsCard';
import ChargebackBadge from '../../components/refunds/ChargebackBadge';
import styles from './RefundPage.module.css';

interface RefundStatus {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  processedAt?: string;
  disputeId?: number;
  guaranteeCoverage?: number;
  metadata?: any;
}

interface Chargeback {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  gatewayResponse?: string;
  createdAt: string;
  metadata?: any;
}

interface OrderDetails {
  id: number;
  status: string;
  totalAmount: number;
  currency: string;
  buyerId: number;
  sellerId: number;
  travelerId?: number;
  createdAt: string;
}

export default function RefundPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [refundData, setRefundData] = useState<{
    refunds: RefundStatus[];
    chargebacks: Chargeback[];
    orderDetails: OrderDetails | null;
  }>({
    refunds: [],
    chargebacks: [],
    orderDetails: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRefundData();
  }, [orderId]);

  const loadRefundData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load refund status
      const refundResponse = await fetch(`/api/v1/refunds/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Load chargeback status
      const chargebackResponse = await fetch(`/api/v1/chargebacks/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Load order details for context
      const orderResponse = await fetch(`/api/v1/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (refundResponse.ok) {
        const refundData = await refundResponse.json();
        setRefundData(prev => ({
          ...prev,
          refunds: refundData.data.refunds || []
        }));
      }

      if (chargebackResponse.ok) {
        const chargebackData = await chargebackResponse.json();
        setRefundData(prev => ({
          ...prev,
          chargebacks: chargebackData.data.chargebacks || []
        }));
      }

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setRefundData(prev => ({
          ...prev,
          orderDetails: orderData.data
        }));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refund data');
      console.error('Refund data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const submitRefundIntent = async () => {
    try {
      const response = await fetch('/api/v1/refunds/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: parseInt(orderId),
          reason: 'Customer requested refund review',
          type: 'refund_request'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Refund request submitted successfully! You will be notified of the decision.');
        // Reload data to show updated status
        loadRefundData();
      } else {
        alert('Failed to submit refund request. Please try again.');
      }
    } catch (err) {
      console.error('Submit refund intent error:', err);
      alert('Failed to submit refund request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles.refundPage}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading refund information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.refundPage}>
        <div className={styles.error}>
          <h3>Refund Information Unavailable</h3>
          <p>{error}</p>
          <button onClick={loadRefundData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.refundPage}>
      <div className={styles.header}>
        <h1>Refund Status</h1>
        <p className={styles.subtitle}>
          Order #{orderId} • Complete refund and chargeback timeline
        </p>
      </div>

      {orderDetails && (
        <div className={styles.orderSummary}>
          <h3>Order Summary</h3>
          <div className={styles.orderInfo}>
            <div className={styles.orderItem}>
              <span className={styles.orderLabel}>Order ID:</span>
              <span className={styles.orderValue}>#{orderDetails.id}</span>
            </div>
            <div className={styles.orderItem}>
              <span className={styles.orderLabel}>Status:</span>
              <span className={styles.orderValue}>{orderDetails.status}</span>
            </div>
            <div className={styles.orderItem}>
              <span className={styles.orderLabel}>Total Amount:</span>
              <span className={styles.orderValue}>
                {formatCurrency(orderDetails.totalAmount, orderDetails.currency)}
              </span>
            </div>
            <div className={styles.orderItem}>
              <span className={styles.orderLabel}>Order Date:</span>
              <span className={styles.orderValue}>
                {formatDate(orderDetails.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chargebacks Section */}
      {refundData.charbacks.length > 0 && (
        <div className={styles.section}>
          <h2>Chargebacks</h2>
          <div className={styles.chargebackList}>
            {refundData.charbacks.map(chargeback => (
              <ChargebackBadge
                key={chargeback.id}
                status={chargeback.status}
                amount={chargeback.amount}
                currency={chargeback.currency}
                gatewayResponse={chargeback.gatewayResponse}
              />
            ))}
          </div>
        </div>
      )}

      {/* Refunds Section */}
      {refundData.refunds.length > 0 && (
        <div className={styles.section}>
          <h2>Refund History</h2>
          <div className={styles.refundList}>
            {refundData.refunds.map(refund => (
              <RefundDetailsCard
                key={refund.id}
                refund={refund}
                userRole="buyer" // This would be determined from order details
                showGuaranteeCoverage={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Refund Request Section */}
      {refundData.refunds.length === 0 && refundData.charbacks.length === 0 && (
        <div className={styles.refundRequestSection}>
          <div className={styles.refundRequestInfo}>
            <h3>Request a Refund</h3>
            <p>
              If you're not satisfied with your order, you can request a refund review.
              Our team will evaluate your request based on our guarantee terms.
            </p>
            <div className={styles.refundRequestActions}>
              <button 
                onClick={submitRefundIntent}
                className={styles.requestButton}
              >
                Request Refund Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      {(refundData.refunds.length > 0 || refundData.charbacks.length > 0) && (
        <div className={styles.section}>
          <h2>Complete Timeline</h2>
          <RefundStatusTimeline
            steps={[
              ...refundData.refunds.map(r => ({
                type: 'REFUND_' + r.status,
                timestamp: r.createdAt || '',
                actor: 'SYSTEM',
                description: r.reason,
                amount: r.amount,
                status: r.status,
                metadata: r.metadata
              })),
              ...refundData.chargebacks.map(c => ({
                type: 'CHARGEBACK_' + c.status,
                timestamp: c.createdAt,
                actor: 'PAYMENT_GATEWAY',
                description: c.reason,
                amount: c.amount,
                status: c.status,
                metadata: c.metadata
              }))
            ]}
            orderId={parseInt(orderId)}
            userRole="buyer"
          />
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.securityNote}>
          <span className={styles.securityIcon}>🔒</span>
          <span className={styles.securityText}>
            <strong>Read-Only Access:</strong> All refund and chargeback actions are system-driven according to guarantee terms
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
