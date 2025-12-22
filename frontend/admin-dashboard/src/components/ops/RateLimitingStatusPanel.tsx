/**
 * Rate Limiting Status Panel
 * Sprint 3 Live Ops: READ-ONLY rate limiting status display
 *
 * CONSTRAINTS:
 * - Display only
 * - No controls
 * - No mutations
 */

import React from 'react';

export interface RateLimitingStatus {
  endpoint: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationPercent: number;
  throttledRequests: number;
  blockedRequests: number;
  avgResponseTimeMs: number;
}

interface RateLimitingStatusPanelProps {
  rateLimits: RateLimitingStatus[];
  isLoading?: boolean;
}

const getUtilizationColor = (percent: number): string => {
  if (percent >= 90) return '#dc2626';
  if (percent >= 70) return '#f59e0b';
  if (percent >= 50) return '#eab308';
  return '#22c55e';
};

export const RateLimitingStatusPanel: React.FC<RateLimitingStatusPanelProps> = ({
  rateLimits,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>⚡ Rate Limiting Status</h3>
          <span style={styles.badge}>READ-ONLY</span>
        </div>
        <div style={styles.loading}>Loading rate limit metrics...</div>
      </div>
    );
  }

  const totalThrottled = rateLimits.reduce((sum, r) => sum + r.throttledRequests, 0);
  const totalBlocked = rateLimits.reduce((sum, r) => sum + r.blockedRequests, 0);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>⚡ Rate Limiting Status</h3>
        <span style={styles.badge}>READ-ONLY</span>
      </div>

      {/* Summary Stats */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{rateLimits.length}</span>
          <span style={styles.summaryLabel}>Endpoints</span>
        </div>
        <div style={{ ...styles.summaryCard, borderColor: '#f59e0b' }}>
          <span style={{ ...styles.summaryValue, color: '#f59e0b' }}>{totalThrottled}</span>
          <span style={styles.summaryLabel}>Throttled</span>
        </div>
        <div style={{ ...styles.summaryCard, borderColor: '#dc2626' }}>
          <span style={{ ...styles.summaryValue, color: '#dc2626' }}>{totalBlocked}</span>
          <span style={styles.summaryLabel}>Blocked</span>
        </div>
      </div>

      {/* Endpoint List */}
      <div style={styles.endpointList}>
        {rateLimits.map((limit) => {
          const utilizationColor = getUtilizationColor(limit.utilizationPercent);
          return (
            <div key={limit.endpoint} style={styles.endpointCard}>
              <div style={styles.endpointHeader}>
                <span style={styles.endpointName}>{limit.endpoint}</span>
                <span
                  style={{
                    ...styles.utilizationBadge,
                    backgroundColor: `${utilizationColor}15`,
                    color: utilizationColor,
                  }}
                >
                  {limit.utilizationPercent}%
                </span>
              </div>

              {/* Utilization Bar */}
              <div style={styles.utilizationBar}>
                <div
                  style={{
                    ...styles.utilizationFill,
                    width: `${Math.min(100, limit.utilizationPercent)}%`,
                    backgroundColor: utilizationColor,
                  }}
                />
              </div>

              {/* Metrics */}
              <div style={styles.metricsRow}>
                <div style={styles.metricItem}>
                  <span style={styles.metricLabel}>Load</span>
                  <span style={styles.metricValue}>
                    {limit.currentLoad} / {limit.maxCapacity}
                  </span>
                </div>
                <div style={styles.metricItem}>
                  <span style={styles.metricLabel}>Throttled</span>
                  <span style={{ ...styles.metricValue, color: limit.throttledRequests > 0 ? '#f59e0b' : '#6b7280' }}>
                    {limit.throttledRequests}
                  </span>
                </div>
                <div style={styles.metricItem}>
                  <span style={styles.metricLabel}>Blocked</span>
                  <span style={{ ...styles.metricValue, color: limit.blockedRequests > 0 ? '#dc2626' : '#6b7280' }}>
                    {limit.blockedRequests}
                  </span>
                </div>
                <div style={styles.metricItem}>
                  <span style={styles.metricLabel}>Avg Response</span>
                  <span style={styles.metricValue}>{limit.avgResponseTimeMs}ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  badge: {
    fontSize: '10px',
    padding: '2px 8px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: '12px',
    fontWeight: 500,
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  summaryCard: {
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  },
  summaryValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 700,
    color: '#374151',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  endpointList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  endpointCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  endpointHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  endpointName: {
    fontWeight: 600,
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#374151',
  },
  utilizationBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  utilizationBar: {
    height: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  utilizationFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  metricItem: {
    textAlign: 'center',
  },
  metricLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#9ca3af',
    marginBottom: '2px',
  },
  metricValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
};

export default RateLimitingStatusPanel;
