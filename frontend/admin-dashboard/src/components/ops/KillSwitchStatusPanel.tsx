/**
 * Kill Switch Status Panel
 * Sprint 3 Live Ops: READ-ONLY kill switch state display
 *
 * CONSTRAINTS:
 * - Display only - NO CONTROLS
 * - No buttons that change state
 * - No mutations
 * - State visibility only
 */

import React from 'react';

export interface KillSwitchStatus {
  emergencyDisableAll: boolean;
  aiCoreEnabled: boolean;
  corridorAdvisoryEnabled: boolean;
  trustGatingEnabled: boolean;
  rateLimitingEnabled: boolean;
  abuseGuardsEnabled: boolean;
  lastModified: string | null;
  modifiedBy: string | null;
}

interface KillSwitchStatusPanelProps {
  killSwitch: KillSwitchStatus | null;
  isLoading?: boolean;
}

interface FlagDisplayProps {
  label: string;
  enabled: boolean;
  critical?: boolean;
}

const FlagDisplay: React.FC<FlagDisplayProps> = ({ label, enabled, critical = false }) => {
  const statusColor = enabled ? '#22c55e' : '#dc2626';
  const bgColor = enabled ? '#f0fdf4' : '#fef2f2';

  return (
    <div
      style={{
        ...styles.flagItem,
        backgroundColor: bgColor,
        borderColor: statusColor,
        ...(critical && !enabled ? styles.criticalFlag : {}),
      }}
    >
      <span style={styles.flagLabel}>{label}</span>
      <span style={{ ...styles.flagStatus, color: statusColor }}>
        {enabled ? '● ENABLED' : '○ DISABLED'}
      </span>
    </div>
  );
};

export const KillSwitchStatusPanel: React.FC<KillSwitchStatusPanelProps> = ({
  killSwitch,
  isLoading = false,
}) => {
  if (isLoading || !killSwitch) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>🔴 Kill Switch Status</h3>
          <span style={styles.badge}>READ-ONLY</span>
        </div>
        <div style={styles.loading}>Loading kill switch status...</div>
      </div>
    );
  }

  const isEmergencyActive = killSwitch.emergencyDisableAll;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>🔴 Kill Switch Status</h3>
        <div style={styles.headerRight}>
          <span style={styles.noControlsBadge}>NO CONTROLS</span>
          <span style={styles.badge}>READ-ONLY</span>
        </div>
      </div>

      {/* Emergency Status Banner */}
      <div
        style={{
          ...styles.emergencyBanner,
          backgroundColor: isEmergencyActive ? '#fef2f2' : '#f0fdf4',
          borderColor: isEmergencyActive ? '#dc2626' : '#22c55e',
        }}
      >
        <span style={styles.emergencyIcon}>{isEmergencyActive ? '🚨' : '✅'}</span>
        <div style={styles.emergencyText}>
          <span
            style={{
              ...styles.emergencyTitle,
              color: isEmergencyActive ? '#dc2626' : '#15803d',
            }}
          >
            {isEmergencyActive ? 'EMERGENCY KILL SWITCH ACTIVE' : 'System Operating Normally'}
          </span>
          <span style={styles.emergencySubtitle}>
            {isEmergencyActive
              ? 'All AI features are disabled. Contact ops team.'
              : 'All enabled features are operational.'}
          </span>
        </div>
      </div>

      {/* Feature Flags Grid */}
      <div style={styles.flagsSection}>
        <h4 style={styles.sectionTitle}>Feature States</h4>
        <div style={styles.flagsGrid}>
          <FlagDisplay
            label="Emergency Disable All"
            enabled={!killSwitch.emergencyDisableAll}
            critical
          />
          <FlagDisplay label="AI Core" enabled={killSwitch.aiCoreEnabled} />
          <FlagDisplay label="Corridor Advisory" enabled={killSwitch.corridorAdvisoryEnabled} />
          <FlagDisplay label="Trust Gating" enabled={killSwitch.trustGatingEnabled} />
          <FlagDisplay label="Rate Limiting" enabled={killSwitch.rateLimitingEnabled} />
          <FlagDisplay label="Abuse Guards" enabled={killSwitch.abuseGuardsEnabled} />
        </div>
      </div>

      {/* Audit Info */}
      <div style={styles.auditSection}>
        <div style={styles.auditItem}>
          <span style={styles.auditLabel}>Last Modified:</span>
          <span style={styles.auditValue}>
            {killSwitch.lastModified
              ? new Date(killSwitch.lastModified).toLocaleString()
              : 'Not available'}
          </span>
        </div>
        <div style={styles.auditItem}>
          <span style={styles.auditLabel}>Modified By:</span>
          <span style={styles.auditValue}>{killSwitch.modifiedBy || 'Not available'}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={styles.disclaimer}>
        <span style={styles.disclaimerIcon}>ℹ️</span>
        <span>
          This panel displays state only. To modify kill switch settings, use the ops configuration
          system or environment variables.
        </span>
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
  noControlsBadge: {
    fontSize: '10px',
    padding: '2px 8px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '12px',
    fontWeight: 600,
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
  },
  emergencyBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid',
    marginBottom: '20px',
  },
  emergencyIcon: {
    fontSize: '32px',
  },
  emergencyText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  emergencyTitle: {
    fontSize: '16px',
    fontWeight: 700,
  },
  emergencySubtitle: {
    fontSize: '13px',
    color: '#6b7280',
  },
  flagsSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#374151',
  },
  flagsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  flagItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid',
  },
  criticalFlag: {
    boxShadow: '0 0 0 2px rgba(220, 38, 38, 0.2)',
  },
  flagLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  flagStatus: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  auditSection: {
    display: 'flex',
    gap: '24px',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  auditItem: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
  },
  auditLabel: {
    color: '#6b7280',
  },
  auditValue: {
    fontWeight: 500,
    color: '#374151',
  },
  disclaimer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#1e40af',
  },
  disclaimerIcon: {
    flexShrink: 0,
  },
};

export default KillSwitchStatusPanel;
