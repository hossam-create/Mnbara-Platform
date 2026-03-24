/**
 * Order Chargeback Page
 * READ-ONLY chargeback status and details for specific order
 * Shows chargeback information with no action capabilities
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChargebackBadge from '../../components/refunds/ChargebackBadge';
import styles from './ChargebackPage.module.css';

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

export default function ChargebackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [chargebackData, setChargebackData] = useState<{
    chargebacks: Chargeback[];
    orderDetails: OrderDetails | null;
  }>({
    chargebacks: [],
    orderDetails: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChargebackData();
  }, [orderId]);

  const loadChargebackData = async () => {
    try {
      setLoading(true);
      setError(null);

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

      if (chargebackResponse.ok) {
        const chargebackData = await chargebackResponse.json();
        setChargebackData({
          chargebacks: chargebackData.data.chargebacks || []
        });
      }

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setChargebackData(prev => ({
          ...prev,
          orderDetails: orderData.data
        }));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chargeback data');
      console.error('Chargeback data loading error:', err);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.chargebackPage}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading chargeback information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.chargebackPage}>
        <div className={styles.error}>
          <h3>Chargeback Information Unavailable</h3>
          <p>{error}</p>
          <button onClick={loadChargebackData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chargebackPage}>
      <div className={styles.header}>
        <h1>Chargeback Status</h1>
        <p className={styles.subtitle}>
          Order #{orderId} • Payment gateway chargeback information
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
      {chargebackData.chargebacks.length > 0 && (
        <div className={styles.section}>
          <h2>Chargeback History</h2>
          <div className={styles.chargebackList}>
            {chargebackData.chargebacks.map(chargeback => (
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

      {/* No Chargebacks Section */}
      {chargebackData.chargebacks.length === 0 && (
        <div className={styles.noChargebackSection}>
          <div className={styles.noChargebackIcon}>💳</div>
          <h3>No Chargebacks</h3>
          <p>
            There are no chargebacks associated with this order. Chargebacks are typically initiated by payment gateways when customers dispute transactions with their banks.
          </p>
          <div className={styles.chargebackInfo}>
            <h4>What are Chargebacks?</h4>
            <p>
              Chargebacks occur when a customer successfully disputes a transaction with their bank or credit card company. 
              The payment gateway then reverses the transaction while they investigate the dispute.
            </p>
            <p>
              <strong>MNbarh Guarantee:</strong> Our guarantee system protects both buyers and sellers. 
              Chargebacks are handled according to payment gateway policies and guarantee terms.
            </p>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.securityNote}>
          <span className={styles.securityIcon}>🔒</span>
          <span className={styles.securityText}>
            <strong>Read-Only Access:</strong> Chargeback information is provided by payment gateway and cannot be modified
          </span>
        </div>
        
        <div className={styles.helpSection}>
          <h4>Need Help?</h4>
          <p>
            If you have questions about this chargeback, please contact support with the order ID.
          </p>
        </div>
      </div>
    </div>
  );
}
