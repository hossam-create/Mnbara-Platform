/**
 * Trust Friction Alerts Panel
 * Sprint 3 Live Ops: READ-ONLY trust friction alerts display
 *
 * CONSTRAINTS:
 * - Display only
 * - No controls
 * - No mutations
 */

import React from 'react';

export interface TrustFrictionAlert {
  id: string;
  type: 'HIGH_REJECTION_RATE' | 'TRUST_GAP' | 'REPEATED_FAILURES' | 'CORRIDOR_BOTTLENECK';
  severity: 'low' | 'medium' | 'high' | 'critical';
  corridor?: string;
  message: string;
  metric: number;
  threshold: number;
  detectedAt: string;
  affectedUsers: number;
}

interface TrustFrictionAlertsPanelProps {
  alerts: TrustFrictionAlert[];
  isLoading?: boolean;
}

const SEVERITY_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  critical: { color: '#dc2626', bgColor: '#fef2f2', icon: '🚨' },
  high: { color: '#ea580c', bgColor: '#fff7ed', icon: '⚠️' },
  medium: { color: '#ca8a04', bgColor: '#fefce8', icon: '⚡' },
  low: { color: '#2563eb', bgColor: '#eff6ff', icon: 'ℹ️' },
};

const TYPE_LABELS: Record<string, string> = {
  HIGH_REJECTION_RATE: 'High Rejection Rate',
  TRUST_GAP: 'Trust Gap',
  REPEATED_FAILURES: 'Repeated Failures',
  CORRIDOR_BOTTLENECK: 'Corridor Bottleneck',
};

export const TrustFrictionAlertsPanel: React.FC<TrustFrictionAlertsPanelProps> = ({
  alerts,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>🔔 Trust Friction Alerts</h3>
          <span style={styles.badge}>READ-ONLY</span>
        </div>
        <div style={styles.loading}>Loading alerts...</div>
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>🔔 Trust Friction Alerts</h3>
        <div style={styles.headerRight}>
          {criticalCount > 0 && (
            <span style={{ ...styles.countBadge, backgroundColor: '#fef2f2', color: '#dc2626' }}>
              {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span style={{ ...styles.countBadge, backgroundColor: '#fff7ed', color: '#ea580c' }}>
              {highCount} High
            </span>
          )}
          <span style={styles.badge}>READ-ONLY</span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div style={styles.noAlerts}>
          <span style={styles.noAlertsIcon}>✅</span>
          <span>No active alerts</span>
        </div>
      ) : (
        <div style={styles.alertsList}>
          {alerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity];
            return (
              <div
                key={alert.id}
                style={{
                  ...styles.alertCard,
                  borderLeftColor: config.color,
                  backgroundColor: config.bgColor,
                }}
              >
                <div style={styles.alertHeader}>
                  <span style={styles.alertIcon}>{config.icon}</span>
                  <span style={{ ...styles.alertType, color: config.color }}>
                    {TYPE_LABELS[alert.type] || alert.type}
                  </span>
                  <span style={{ ...styles.severityBadge, color: config.color }}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>

                <p style={styles.alertMessage}>{alert.message}</p>

                <div style={styles.alertMeta}>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Metric:</span>
                    <span style={styles.metaValue}>{alert.metric}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Threshold:</span>
                    <span style={styles.metaValue}>{alert.threshold}</span>
                  </div>
                  {alert.corridor && (
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Corridor:</span>
                      <span style={styles.metaValue}>{alert.corridor}</span>
                    </div>
                  )}
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Affected:</span>
                    <span style={styles.metaValue}>{alert.affectedUsers} users</span>
                  </div>
                </div>

                <div style={styles.alertTime}>
                  Detected: {new Date(alert.detectedAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  headerRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
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
  countBadge: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
  },
  noAlerts: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '40px',
    color: '#22c55e',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
  },
  noAlertsIcon: {
    fontSize: '24px',
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  alertCard: {
    borderLeft: '4px solid',
    borderRadius: '8px',
    padding: '16px',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  alertIcon: {
    fontSize: '16px',
  },
  alertType: {
    fontWeight: 600,
    fontSize: '14px',
    flex: 1,
  },
  severityBadge: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  alertMessage: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#374151',
    lineHeight: 1.5,
  },
  alertMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '8px',
  },
  metaItem: {
    display: 'flex',
    gap: '4px',
    fontSize: '12px',
  },
  metaLabel: {
    color: '#6b7280',
  },
  metaValue: {
    fontWeight: 600,
    color: '#374151',
  },
  alertTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
};

export default TrustFrictionAlertsPanel;
