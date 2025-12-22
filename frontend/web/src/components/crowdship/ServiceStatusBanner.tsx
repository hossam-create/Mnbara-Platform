/**
 * Service Status Banner Component
 * Sprint 3: Market Hardening & Go-Live Safety
 *
 * Displays:
 * - Service health status
 * - Degraded mode warnings
 * - Rate limit warnings
 * - Emergency disable notice
 */

import React from 'react';

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'emergency';

interface ServiceStatusBannerProps {
  status: ServiceStatus;
  message?: string;
  rateLimitWarning?: string;
  corridorCapWarning?: string;
  onDismiss?: () => void;
  showDetails?: boolean;
}

const STATUS_CONFIG: Record<ServiceStatus, { color: string; bgColor: string; icon: string; title: string }> = {
  healthy: {
    color: '#15803d',
    bgColor: '#f0fdf4',
    icon: '✓',
    title: 'All Systems Operational',
  },
  degraded: {
    color: '#b45309',
    bgColor: '#fef3c7',
    icon: '⚠️',
    title: 'Service Degraded',
  },
  unhealthy: {
    color: '#dc2626',
    bgColor: '#fef2f2',
    icon: '✗',
    title: 'Service Unavailable',
  },
  emergency: {
    color: '#7c2d12',
    bgColor: '#fecaca',
    icon: '🚨',
    title: 'Emergency Maintenance',
  },
};

export const ServiceStatusBanner: React.FC<ServiceStatusBannerProps> = ({
  status,
  message,
  rateLimitWarning,
  corridorCapWarning,
  onDismiss,
  showDetails = true,
}) => {
  // Don't show banner for healthy status unless there are warnings
  if (status === 'healthy' && !rateLimitWarning && !corridorCapWarning) {
    return null;
  }

  const config = STATUS_CONFIG[status];

  return (
    <div style={{ ...styles.container, backgroundColor: config.bgColor, borderColor: config.color }}>
      <div style={styles.header}>
        <span style={styles.icon}>{config.icon}</span>
        <span style={{ ...styles.title, color: config.color }}>{config.title}</span>
        {onDismiss && status !== 'emergency' && (
          <button style={styles.dismissButton} onClick={onDismiss} aria-label="Dismiss">
            ×
          </button>
        )}
      </div>

      {message && <p style={styles.message}>{message}</p>}

      {showDetails && (
        <div style={styles.details}>
          {status === 'degraded' && (
            <div style={styles.detailItem}>
              <span style={styles.detailIcon}>ℹ️</span>
              <span>AI advisory features may be limited. Core functionality remains available.</span>
            </div>
          )}

          {status === 'unhealthy' && (
            <div style={styles.detailItem}>
              <span style={styles.detailIcon}>⚠️</span>
              <span>Advisory features are temporarily unavailable. Please try again later.</span>
            </div>
          )}

          {status === 'emergency' && (
            <div style={styles.detailItem}>
              <span style={styles.detailIcon}>🚨</span>
              <span>All AI advisory features have been temporarily disabled for maintenance.</span>
            </div>
          )}

          {rateLimitWarning && (
            <div style={{ ...styles.detailItem, backgroundColor: '#fef9c3' }}>
              <span style={styles.detailIcon}>⏱️</span>
              <span>{rateLimitWarning}</span>
            </div>
          )}

          {corridorCapWarning && (
            <div style={{ ...styles.detailItem, backgroundColor: '#fef9c3' }}>
              <span style={styles.detailIcon}>📊</span>
              <span>{corridorCapWarning}</span>
            </div>
          )}
        </div>
      )}

      {/* Advisory notice */}
      <div style={styles.advisory}>
        <span style={styles.advisoryIcon}>🔒</span>
        <span>All features remain advisory-only. No automatic actions will be taken.</span>
      </div>
    </div>
  );
};

/**
 * Rate Limit Warning Banner
 */
interface RateLimitBannerProps {
  remaining: number;
  limit: number;
  resetTime: Date;
  endpoint: string;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({ remaining, limit, resetTime, endpoint }) => {
  const percentUsed = ((limit - remaining) / limit) * 100;

  if (percentUsed < 80) return null;

  const isExceeded = remaining === 0;
  const timeUntilReset = Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000));

  return (
    <div
      style={{
        ...styles.rateLimitContainer,
        backgroundColor: isExceeded ? '#fef2f2' : '#fef9c3',
        borderColor: isExceeded ? '#dc2626' : '#ca8a04',
      }}
    >
      <div style={styles.rateLimitHeader}>
        <span style={styles.rateLimitIcon}>{isExceeded ? '🛑' : '⚠️'}</span>
        <span style={{ fontWeight: 600 }}>{isExceeded ? 'Rate Limit Exceeded' : 'Approaching Rate Limit'}</span>
      </div>

      <div style={styles.rateLimitBar}>
        <div
          style={{
            ...styles.rateLimitFill,
            width: `${percentUsed}%`,
            backgroundColor: isExceeded ? '#dc2626' : '#ca8a04',
          }}
        />
      </div>

      <div style={styles.rateLimitDetails}>
        <span>
          {remaining}/{limit} requests remaining for {endpoint}
        </span>
        {isExceeded && <span style={styles.resetTime}>Resets in {timeUntilReset}s</span>}
      </div>
    </div>
  );
};

/**
 * Corridor Cap Warning Banner
 */
interface CorridorCapBannerProps {
  corridorId: string;
  corridorName: string;
  percentUsed: number;
  remainingVolumeUSD: number;
  remainingTransactions: number;
}

export const CorridorCapBanner: React.FC<CorridorCapBannerProps> = ({
  corridorId,
  corridorName,
  percentUsed,
  remainingVolumeUSD,
  remainingTransactions,
}) => {
  if (percentUsed < 80) return null;

  const isExceeded = percentUsed >= 100;

  return (
    <div
      style={{
        ...styles.corridorCapContainer,
        backgroundColor: isExceeded ? '#fef2f2' : '#fef9c3',
        borderColor: isExceeded ? '#dc2626' : '#ca8a04',
      }}
    >
      <div style={styles.corridorCapHeader}>
        <span style={styles.corridorCapIcon}>{isExceeded ? '🛑' : '📊'}</span>
        <span style={{ fontWeight: 600 }}>
          {isExceeded ? 'Corridor Daily Limit Reached' : 'Approaching Corridor Limit'}
        </span>
      </div>

      <p style={styles.corridorCapMessage}>
        {isExceeded
          ? `Daily volume cap reached for ${corridorName}. Please try again tomorrow or use a different corridor.`
          : `${corridorName} is at ${percentUsed}% of daily capacity.`}
      </p>

      {!isExceeded && (
        <div style={styles.corridorCapDetails}>
          <span>Remaining: ${remainingVolumeUSD.toLocaleString()} USD</span>
          <span>•</span>
          <span>{remainingTransactions} transactions</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  icon: {
    fontSize: '20px',
  },
  title: {
    fontWeight: 600,
    fontSize: '16px',
  },
  dismissButton: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  message: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#374151',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
  },
  detailIcon: {
    flexShrink: 0,
  },
  advisory: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    fontSize: '12px',
    color: '#6b7280',
  },
  advisoryIcon: {
    fontSize: '14px',
  },
  rateLimitContainer: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  },
  rateLimitHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  rateLimitIcon: {
    fontSize: '16px',
  },
  rateLimitBar: {
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  rateLimitFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  rateLimitDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#6b7280',
  },
  resetTime: {
    fontWeight: 500,
  },
  corridorCapContainer: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  },
  corridorCapHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  corridorCapIcon: {
    fontSize: '16px',
  },
  corridorCapMessage: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#374151',
  },
  corridorCapDetails: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#6b7280',
  },
};

export default ServiceStatusBanner;
