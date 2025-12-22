/**
 * Ops Dashboard Page
 * Sprint 3 Live Ops: Internal, READ-ONLY operational visibility dashboard
 *
 * CONSTRAINTS:
 * - NO controls, NO buttons that change state
 * - Display only
 * - No production mutation
 * - No hidden metrics
 * - Audit-friendly
 * - "Ops can SEE everything, CHANGE nothing"
 */

import React, { useEffect, useState, useCallback } from 'react';
import { CorridorHealthPanel } from '../components/ops/CorridorHealthPanel';
import { IntentFunnelPanel } from '../components/ops/IntentFunnelPanel';
import { TrustFrictionAlertsPanel } from '../components/ops/TrustFrictionAlertsPanel';
import { RateLimitingStatusPanel } from '../components/ops/RateLimitingStatusPanel';
import { KillSwitchStatusPanel } from '../components/ops/KillSwitchStatusPanel';
import { opsService, OpsSnapshot } from '../services/ops.service';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export const OpsDashboard: React.FC = () => {
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      setError(null);
      const data = await opsService.getSnapshot();
      setSnapshot(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ops data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();

    // Auto-refresh
    const interval = setInterval(fetchSnapshot, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>📊 Live Ops Dashboard</h1>
          <span style={styles.subtitle}>Sprint 3 - Internal Visibility</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.readOnlyBanner}>
            🔒 READ-ONLY MODE
          </span>
          <span style={styles.noControlsBanner}>
            NO CONTROLS
          </span>
        </div>
      </div>

      {/* Constraints Notice */}
      <div style={styles.constraintsNotice}>
        <span style={styles.constraintsIcon}>ℹ️</span>
        <span>
          This dashboard is <strong>display-only</strong>. Ops can SEE everything, CHANGE nothing.
          All data is audit-logged. No mutations are possible from this interface.
        </span>
      </div>

      {/* Error State */}
      {error && (
        <div style={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={fetchSnapshot} style={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {/* System Health Summary */}
      {snapshot && (
        <div style={styles.systemHealthBar}>
          <div style={styles.healthItem}>
            <span style={styles.healthLabel}>System Status:</span>
            <span
              style={{
                ...styles.healthValue,
                color: snapshot.systemHealth.status === 'healthy' ? '#22c55e' : '#dc2626',
              }}
            >
              {snapshot.systemHealth.status.toUpperCase()}
            </span>
          </div>
          <div style={styles.healthItem}>
            <span style={styles.healthLabel}>Version:</span>
            <span style={styles.healthValue}>{snapshot.systemHealth.version}</span>
          </div>
          <div style={styles.healthItem}>
            <span style={styles.healthLabel}>Uptime:</span>
            <span style={styles.healthValue}>
              {Math.floor(snapshot.systemHealth.uptime / 3600000)}h{' '}
              {Math.floor((snapshot.systemHealth.uptime % 3600000) / 60000)}m
            </span>
          </div>
          <div style={styles.healthItem}>
            <span style={styles.healthLabel}>Last Refresh:</span>
            <span style={styles.healthValue}>
              {lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}
            </span>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div style={styles.dashboardGrid}>
        {/* Kill Switch - Top Priority */}
        <div style={styles.fullWidth}>
          <KillSwitchStatusPanel
            killSwitch={snapshot?.killSwitch || null}
            isLoading={isLoading}
          />
        </div>

        {/* Alerts */}
        <div style={styles.fullWidth}>
          <TrustFrictionAlertsPanel
            alerts={snapshot?.trustAlerts || []}
            isLoading={isLoading}
          />
        </div>

        {/* Corridor Health */}
        <div style={styles.fullWidth}>
          <CorridorHealthPanel
            corridors={snapshot?.corridorHealth || []}
            isLoading={isLoading}
          />
        </div>

        {/* Intent Funnel */}
        <div style={styles.halfWidth}>
          <IntentFunnelPanel
            funnel={snapshot?.intentFunnel || null}
            isLoading={isLoading}
          />
        </div>

        {/* Rate Limiting */}
        <div style={styles.halfWidth}>
          <RateLimitingStatusPanel
            rateLimits={snapshot?.rateLimiting || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>Auto-refresh: every 30 seconds</span>
        <span>•</span>
        <span>All access is audit-logged</span>
        <span>•</span>
        <span>Data timestamp: {snapshot?.timestamp ? new Date(snapshot.timestamp).toLocaleString() : '-'}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerRight: {
    display: 'flex',
    gap: '8px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  readOnlyBanner: {
    padding: '8px 16px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '12px',
  },
  noControlsBanner: {
    padding: '8px 16px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '12px',
  },
  constraintsNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
    color: '#1e40af',
  },
  constraintsIcon: {
    fontSize: '18px',
  },
  errorBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#dc2626',
  },
  retryButton: {
    padding: '6px 12px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  systemHealthBar: {
    display: 'flex',
    gap: '32px',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  healthItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  healthValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  halfWidth: {
    gridColumn: 'span 1',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px',
    padding: '16px',
    fontSize: '12px',
    color: '#9ca3af',
  },
};

export default OpsDashboard;
