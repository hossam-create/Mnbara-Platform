/**
 * Market 1 Risk Banner
 * Sprint 4: Corridor-Specific UX Adjustments
 *
 * Displays risk information for Market 1 corridors (EU → MENA)
 * Advisory only - no controls
 */

import React from 'react';

export interface Market1RiskBannerProps {
  corridorId: string;
  corridorName: string;
  riskLevel: 'low' | 'medium' | 'elevated' | 'high';
  customsComplexity: number; // 1.0 - 2.0
  valueUSD: number;
  restrictions: string[];
  isHighValue: boolean;
}

const RISK_CONFIG = {
  low: {
    color: '#22c55e',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    icon: '✓',
    label: 'Low Risk',
  },
  medium: {
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    icon: '⚡',
    label: 'Medium Risk',
  },
  elevated: {
    color: '#f97316',
    bgColor: '#fff7ed',
    borderColor: '#fdba74',
    icon: '⚠️',
    label: 'Elevated Risk',
  },
  high: {
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    icon: '🔴',
    label: 'High Risk',
  },
};

const RESTRICTION_LABELS: Record<string, string> = {
  electronics_batteries: 'Electronics with batteries',
  liquids_over_100ml: 'Liquids over 100ml',
  restricted_medications: 'Certain medications',
  alcohol: 'Alcohol products',
  pork_products: 'Pork products',
  religious_items: 'Religious items',
};

export const Market1RiskBanner: React.FC<Market1RiskBannerProps> = ({
  corridorId,
  corridorName,
  riskLevel,
  customsComplexity,
  valueUSD,
  restrictions,
  isHighValue,
}) => {
  const config = RISK_CONFIG[riskLevel];

  return (
    <div
      style={{
        ...styles.banner,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>{config.icon}</span>
        <div style={styles.headerText}>
          <span style={{ ...styles.riskLabel, color: config.color }}>{config.label}</span>
          <span style={styles.corridorName}>{corridorName}</span>
        </div>
        <span style={styles.market1Badge}>MARKET 1</span>
      </div>

      {/* Risk Factors */}
      <div style={styles.factorsGrid}>
        <div style={styles.factor}>
          <span style={styles.factorLabel}>Customs Complexity</span>
          <span style={styles.factorValue}>
            {customsComplexity <= 1.1 ? 'Low' : customsComplexity <= 1.3 ? 'Medium' : 'High'}
          </span>
        </div>
        <div style={styles.factor}>
          <span style={styles.factorLabel}>Item Value</span>
          <span style={styles.factorValue}>${valueUSD.toLocaleString()}</span>
        </div>
        <div style={styles.factor}>
          <span style={styles.factorLabel}>Value Category</span>
          <span
            style={{
              ...styles.factorValue,
              color: isHighValue ? '#dc2626' : '#22c55e',
            }}
          >
            {isHighValue ? 'High Value (>$200)' : 'Standard'}
          </span>
        </div>
      </div>

      {/* High Value Warning */}
      {isHighValue && (
        <div style={styles.highValueWarning}>
          <span style={styles.warningIcon}>⚠️</span>
          <span>
            High-value items require <strong>TRUSTED</strong> buyer and traveler status. Trust
            verification will be performed.
          </span>
        </div>
      )}

      {/* Restrictions */}
      {restrictions.length > 0 && (
        <div style={styles.restrictionsSection}>
          <span style={styles.restrictionsTitle}>Restricted Items for this Corridor:</span>
          <div style={styles.restrictionsList}>
            {restrictions.map((r) => (
              <span key={r} style={styles.restrictionTag}>
                {RESTRICTION_LABELS[r] || r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Advisory Notice */}
      <div style={styles.advisoryNotice}>
        <span style={styles.advisoryIcon}>ℹ️</span>
        <span>
          This is advisory information only. All transactions require human confirmation. No
          automatic actions will be taken.
        </span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  banner: {
    border: '2px solid',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '24px',
  },
  headerText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  riskLabel: {
    fontSize: '16px',
    fontWeight: 700,
  },
  corridorName: {
    fontSize: '13px',
    color: '#6b7280',
  },
  market1Badge: {
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  factorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  factor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  factorLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  factorValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  highValueWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#991b1b',
  },
  warningIcon: {
    flexShrink: 0,
  },
  restrictionsSection: {
    marginBottom: '12px',
  },
  restrictionsTitle: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  restrictionsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  restrictionTag: {
    padding: '4px 8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '4px',
    fontSize: '11px',
  },
  advisoryNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#4b5563',
  },
  advisoryIcon: {
    flexShrink: 0,
  },
};

export default Market1RiskBanner;
