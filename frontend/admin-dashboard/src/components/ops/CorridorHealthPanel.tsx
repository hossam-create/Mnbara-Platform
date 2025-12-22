/**
 * Corridor Health Panel
 * Sprint 3 Live Ops: READ-ONLY corridor health display
 *
 * CONSTRAINTS:
 * - Display only
 * - No controls
 * - No mutations
 */

import React from 'react';

export interface CorridorHealthMetrics {
  corridorId: string;
  corridorName: string;
  status: 'healthy' | 'degraded' | 'at_capacity' | 'disabled';
  volumeUSD: number;
  transactionCount: number;
  capacityPercent: number;
  avgRiskScore: number;
  avgTrustScore: number;
  recentErrors: number;
  lastActivityAt: string | null;
}

interface CorridorHealthPanelProps {
  corridors: CorridorHealthMetrics[];
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  healthy: { color: '#15803d', bgColor: '#f0fdf4', label: 'Healthy' },
  degraded: { color: '#b45309', bgColor: '#fef3c7', label: 'Degraded' },
  at_capacity: { color: '#dc2626', bgColor: '#fef2f2', label: 'At Capacity' },
  disabled: { color: '#6b7280', bgColor: '#f3f4f6', label: 'Disabled' },
};

export const CorridorHealthPanel: React.FC<CorridorHealthPanelProps> = ({ corridors, isLoading = false }) => {
  if (isLoading) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>🌍 Corridor Health</h3>
          <span style={styles.badge}>READ-ONLY</span>
        </div>
        <div style={styles.loading}>Loading corridor metrics...</div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>🌍 Corridor Health</h3>
        <span style={styles.badge}>READ-ONLY</span>
      </div>

      <div style={styles.corridorGrid}>
        {corridors.map((corridor) => {
          const statusConfig = STATUS_CONFIG[corridor.status];
          return (
            <div key={corridor.corridorId} style={{ ...styles.corridorCard, borderColor: statusConfig.color }}>
              <div style={styles.corridorHeader}>
                <span style={styles.corridorName}>{corridor.corridorName}</span>
                <span style={{ ...styles.statusBadge, backgroundColor: statusConfig.bgColor, color: statusConfig.color }}>
                  {statusConfig.label}
                </span>
              </div>

              {/* Capacity Bar */}
              <div style={styles.capacitySection}>
                <div style={styles.capacityLabel}>
                  <span>Capacity</span>
                  <span>{corridor.capacityPercent}%</span>
                </div>
                <div style={styles.capacityBar}>
                  <div
                    style={{
                      ...styles.capacityFill,
                      width: `${Math.min(100, corridor.capacityPercent)}%`,
                      backgroundColor: corridor.capacityPercent >= 90 ? '#dc2626' : corridor.capacityPercent >= 70 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={styles.metricsGrid}>
                <div style={styles.metric}>
                  <span style={styles.metricValue}>${corridor.volumeUSD.toLocaleString()}</span>
                  <span style={styles.metricLabel}>Volume</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricValue}>{corridor.transactionCount}</span>
                  <span style={styles.metricLabel}>Transactions</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricValue}>{corridor.avgRiskScore || '-'}</span>
                  <span style={styles.metricLabel}>Avg Risk</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricValue}>{corridor.avgTrustScore || '-'}</span>
                  <span style={styles.metricLabel}>Avg Trust</span>
                </div>
              </div>

              {/* Errors */}
              {corridor.recentErrors > 0 && (
                <div style={styles.errorBadge}>⚠️ {corridor.recentErrors} errors in last hour</div>
              )}

              {/* Last Activity */}
              <div style={styles.lastActivity}>
                Last activity: {corridor.lastActivityAt ? new Date(corridor.lastActivityAt).toLocaleTimeString() : 'No recent activity'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { margin: 0, fontSize: '18px', fontWeight: 600 },
  badge: { fontSize: '10px', padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '12px', fontWeight: 500 },
  loading: { textAlign: 'center', padding: '40px', color: '#6b7280' },
  corridorGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' },
  corridorCard: { border: '2px solid', borderRadius: '8px', padding: '16px' },
  corridorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  corridorName: { fontWeight: 600, fontSize: '14px' },
  statusBadge: { padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 },
  capacitySection: { marginBottom: '12px' },
  capacityLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
  capacityBar: { height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
  capacityFill: { height: '100%', transition: 'width 0.3s ease' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' },
  metric: { textAlign: 'center' },
  metricValue: { display: 'block', fontSize: '16px', fontWeight: 600 },
  metricLabel: { fontSize: '10px', color: '#6b7280' },
  errorBadge: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', marginBottom: '8px' },
  lastActivity: { fontSize: '11px', color: '#9ca3af' },
};

export default CorridorHealthPanel;
