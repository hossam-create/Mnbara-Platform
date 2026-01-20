/**
 * Control Center Finance Summary Component
 * Read-only financial dashboard for control center operators
 */

import React, { useState, useEffect } from 'react';
import { ControlCenterFinanceSummary, PaymentProvider, PaymentMethod } from '../../types/payment.types';
import paymentService from '../../services/paymentService';
import styles from './ControlCenterFinanceSummary.module.css';

interface ControlCenterFinanceSummaryProps {
  startDate?: string;
  endDate?: string;
  readOnly?: boolean;
}

export default function ControlCenterFinanceSummary({
  startDate,
  endDate,
  readOnly = true
}: ControlCenterFinanceSummaryProps) {
  const [financeSummary, setFinanceSummary] = useState<ControlCenterFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadFinanceSummary();
  }, [selectedPeriod]);

  const loadFinanceSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const summary = await paymentService.getControlCenterFinanceSummary(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      setFinanceSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.financeSummary}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.financeSummary}>
        <div className={styles.error}>
          <p>Financial data temporarily unavailable</p>
          <button onClick={loadFinanceSummary} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.financeSummary}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Financial Overview</h2>
        {readOnly && (
          <span className={styles.readOnlyBadge}>Read-Only</span>
        )}
      </div>

      {/* Period Selector */}
      <div className={styles.periodSelector}>
        <div className={styles.periodButtons}>
          {[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' }
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as any)}
              className={`${styles.periodButton} ${
                selectedPeriod === period.value ? styles.active : ''
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {financeSummary && (
        <>
          {/* Key Metrics */}
          <div className={styles.section}>
            <h3>Key Metrics</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricValue}>
                  {paymentService.formatCurrency(financeSummary.totalVolume, financeSummary.currency)}
                </div>
                <div className={styles.metricLabel}>Total Volume</div>
                <div className={styles.metricPeriod}>
                  {new Date(financeSummary.period.start).toLocaleDateString()} - {new Date(financeSummary.period.end).toLocaleDateString()}
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricValue}>{financeSummary.metrics.totalPayments}</div>
                <div className={styles.metricLabel}>Total Payments</div>
                <div className={styles.metricSubtext}>
                  {financeSummary.metrics.successfulPayments} successful, {financeSummary.metrics.failedPayments} failed
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricValue}>
                  {financeSummary.metrics.successRate.toFixed(1)}%
                </div>
                <div className={styles.metricLabel}>Success Rate</div>
                <div className={styles.metricSubtext}>
                  {financeSummary.metrics.averageProcessingTime.toFixed(1)}h avg processing
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricValue}>{financeSummary.metrics.refundRate.toFixed(1)}%</div>
                <div className={styles.metricLabel}>Refund Rate</div>
                <div className={styles.metricSubtext}>
                  {financeSummary.metrics.chargebackRate.toFixed(1)}% chargeback rate
                </div>
              </div>
            </div>
          </div>

          {/* Provider Breakdown */}
          <div className={styles.section}>
            <h3>Payment Provider Breakdown</h3>
            <div className={styles.breakdownGrid}>
              {Object.entries(financeSummary.breakdown.byProvider).map(([provider, data]) => (
                <div key={provider} className={styles.providerCard}>
                  <div className={styles.providerName}>
                    {paymentService.getProviderDisplayName(provider as PaymentProvider)}
                  </div>
                  <div className={styles.providerMetrics}>
                    <div className={styles.providerMetric}>
                      <span className={styles.metricValue}>
                        {paymentService.formatCurrency(data.volume, financeSummary.currency)}
                      </span>
                      <span className={styles.metricLabel}>Volume</span>
                    </div>
                    <div className={styles.providerMetric}>
                      <span className={styles.metricValue}>{data.count}</span>
                      <span className={styles.metricLabel}>Transactions</span>
                    </div>
                    <div className={styles.providerMetric}>
                      <span className={styles.metricValue}>{data.successRate.toFixed(1)}%</span>
                      <span className={styles.metricLabel}>Success Rate</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Method Breakdown */}
          <div className={styles.section}>
            <h3>Payment Method Breakdown</h3>
            <div className={styles.breakdownGrid}>
              {Object.entries(financeSummary.breakdown.byMethod).map(([method, data]) => (
                <div key={method} className={styles.methodCard}>
                  <div className={styles.methodName}>
                    {paymentService.getMethodDisplayName(method as PaymentMethod)}
                  </div>
                  <div className={styles.methodMetrics}>
                    <div className={styles.methodMetric}>
                      <span className={styles.metricValue}>
                        {paymentService.formatCurrency(data.volume, financeSummary.currency)}
                      </span>
                      <span className={styles.metricLabel}>Volume</span>
                    </div>
                    <div className={styles.methodMetric}>
                      <span className={styles.metricValue}>{data.count}</span>
                      <span className={styles.metricLabel}>Transactions</span>
                    </div>
                    <div className={styles.methodMetric}>
                      <span className={styles.metricValue}>{data.successRate.toFixed(1)}%</span>
                      <span className={styles.metricLabel}>Success Rate</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Escrow Metrics */}
          <div className={styles.section}>
            <h3>Escrow Metrics</h3>
            <div className={styles.escrowGrid}>
              <div className={styles.escrowCard}>
                <div className={styles.escrowValue}>
                  {paymentService.formatCurrency(financeSummary.escrowMetrics.totalHeld, financeSummary.currency)}
                </div>
                <div className={styles.escrowLabel}>Total Held</div>
              </div>

              <div className={styles.escrowCard}>
                <div className={styles.escrowValue}>
                  {paymentService.formatCurrency(financeSummary.escrowMetrics.totalReleased, financeSummary.currency)}
                </div>
                <div className={styles.escrowLabel}>Total Released</div>
              </div>

              <div className={styles.escrowCard}>
                <div className={styles.escrowValue}>
                  {paymentService.formatCurrency(financeSummary.escrowMetrics.totalRefunded, financeSummary.currency)}
                </div>
                <div className={styles.escrowLabel}>Total Refunded</div>
              </div>

              <div className={styles.escrowCard}>
                <div className={styles.escrowValue}>{financeSummary.escrowMetrics.activeEscrows}</div>
                <div className={styles.escrowLabel}>Active Escrows</div>
              </div>

              <div className={styles.escrowCard}>
                <div className={styles.escrowValue}>
                  {financeSummary.escrowMetrics.averageHoldTime.toFixed(1)} days
                </div>
                <div className={styles.escrowLabel}>Avg Hold Time</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Read-Only Notice */}
      {readOnly && (
        <div className={styles.readOnlyNotice}>
          <div className={styles.noticeIcon}>🔒</div>
          <div className={styles.noticeText}>
            <strong>Read-Only Access</strong>
            <p>
              This is a read-only view of financial metrics. 
              All payment processing and fund movements are handled by automated systems.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
