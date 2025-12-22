/**
 * Trust Explanation Panel
 * Sprint 4: Corridor-Specific UX Adjustments
 *
 * Explains trust requirements and status for Market 1 corridors
 * Advisory only - no controls
 */

import React from 'react';

export interface TrustExplanationPanelProps {
  buyerTrustLevel: 'NEW' | 'STANDARD' | 'VERIFIED' | 'TRUSTED';
  travelerTrustLevel: 'NEW' | 'STANDARD' | 'VERIFIED' | 'TRUSTED';
  requiredBuyerTrust: 'NEW' | 'STANDARD' | 'VERIFIED' | 'TRUSTED' | 'ANY';
  requiredTravelerTrust: 'NEW' | 'STANDARD' | 'VERIFIED' | 'TRUSTED' | 'ANY';
  isHighValue: boolean;
  trustGatingPassed: boolean;
  reasons: string[];
}

const TRUST_LEVELS = {
  NEW: { order: 0, color: '#6b7280', label: 'New', icon: '○' },
  STANDARD: { order: 1, color: '#3b82f6', label: 'Standard', icon: '◐' },
  VERIFIED: { order: 2, color: '#8b5cf6', label: 'Verified', icon: '◑' },
  TRUSTED: { order: 3, color: '#22c55e', label: 'Trusted', icon: '●' },
  ANY: { order: -1, color: '#9ca3af', label: 'Any', icon: '○' },
};

const meetsRequirement = (
  current: keyof typeof TRUST_LEVELS,
  required: keyof typeof TRUST_LEVELS
): boolean => {
  if (required === 'ANY') return true;
  return TRUST_LEVELS[current].order >= TRUST_LEVELS[required].order;
};

export const TrustExplanationPanel: React.FC<TrustExplanationPanelProps> = ({
  buyerTrustLevel,
  travelerTrustLevel,
  requiredBuyerTrust,
  requiredTravelerTrust,
  isHighValue,
  trustGatingPassed,
  reasons,
}) => {
  const buyerMeetsRequirement = meetsRequirement(buyerTrustLevel, requiredBuyerTrust);
  const travelerMeetsRequirement = meetsRequirement(travelerTrustLevel, requiredTravelerTrust);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>🛡️ Trust Requirements</h3>
        <span
          style={{
            ...styles.statusBadge,
            backgroundColor: trustGatingPassed ? '#f0fdf4' : '#fef2f2',
            color: trustGatingPassed ? '#15803d' : '#dc2626',
          }}
        >
          {trustGatingPassed ? '✓ PASSED' : '✗ NOT MET'}
        </span>
      </div>

      {/* High Value Notice */}
      {isHighValue && (
        <div style={styles.highValueNotice}>
          <span style={styles.noticeIcon}>💎</span>
          <span>
            <strong>High-value transaction (&gt;$200)</strong> — Enhanced trust requirements apply.
            Both buyer and traveler must be TRUSTED.
          </span>
        </div>
      )}

      {/* Trust Comparison Grid */}
      <div style={styles.trustGrid}>
        {/* Buyer Trust */}
        <div style={styles.trustCard}>
          <span style={styles.trustRole}>Buyer</span>
          <div style={styles.trustComparison}>
            <div style={styles.trustCurrent}>
              <span style={styles.trustLabel}>Current</span>
              <span
                style={{
                  ...styles.trustValue,
                  color: TRUST_LEVELS[buyerTrustLevel].color,
                }}
              >
                {TRUST_LEVELS[buyerTrustLevel].icon} {TRUST_LEVELS[buyerTrustLevel].label}
              </span>
            </div>
            <span style={styles.trustArrow}>→</span>
            <div style={styles.trustRequired}>
              <span style={styles.trustLabel}>Required</span>
              <span
                style={{
                  ...styles.trustValue,
                  color: TRUST_LEVELS[requiredBuyerTrust].color,
                }}
              >
                {TRUST_LEVELS[requiredBuyerTrust].icon} {TRUST_LEVELS[requiredBuyerTrust].label}
              </span>
            </div>
          </div>
          <span
            style={{
              ...styles.trustStatus,
              color: buyerMeetsRequirement ? '#22c55e' : '#dc2626',
            }}
          >
            {buyerMeetsRequirement ? '✓ Meets requirement' : '✗ Does not meet requirement'}
          </span>
        </div>

        {/* Traveler Trust */}
        <div style={styles.trustCard}>
          <span style={styles.trustRole}>Traveler</span>
          <div style={styles.trustComparison}>
            <div style={styles.trustCurrent}>
              <span style={styles.trustLabel}>Current</span>
              <span
                style={{
                  ...styles.trustValue,
                  color: TRUST_LEVELS[travelerTrustLevel].color,
                }}
              >
                {TRUST_LEVELS[travelerTrustLevel].icon} {TRUST_LEVELS[travelerTrustLevel].label}
              </span>
            </div>
            <span style={styles.trustArrow}>→</span>
            <div style={styles.trustRequired}>
              <span style={styles.trustLabel}>Required</span>
              <span
                style={{
                  ...styles.trustValue,
                  color: TRUST_LEVELS[requiredTravelerTrust].color,
                }}
              >
                {TRUST_LEVELS[requiredTravelerTrust].icon} {TRUST_LEVELS[requiredTravelerTrust].label}
              </span>
            </div>
          </div>
          <span
            style={{
              ...styles.trustStatus,
              color: travelerMeetsRequirement ? '#22c55e' : '#dc2626',
            }}
          >
            {travelerMeetsRequirement ? '✓ Meets requirement' : '✗ Does not meet requirement'}
          </span>
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div style={styles.reasonsSection}>
          <span style={styles.reasonsTitle}>Why these requirements?</span>
          <ul style={styles.reasonsList}>
            {reasons.map((reason, index) => (
              <li key={index} style={styles.reasonItem}>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What to do if not met */}
      {!trustGatingPassed && (
        <div style={styles.actionSection}>
          <span style={styles.actionTitle}>How to proceed:</span>
          <ul style={styles.actionList}>
            <li>Complete identity verification to increase trust level</li>
            <li>Build transaction history with successful deliveries</li>
            <li>Consider lower-value items that have reduced requirements</li>
          </ul>
        </div>
      )}

      {/* Advisory Notice */}
      <div style={styles.advisoryNotice}>
        <span style={styles.advisoryIcon}>ℹ️</span>
        <span>
          Trust levels are advisory. You may still proceed, but recommendations will be adjusted
          based on trust status.
        </span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  highValueNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#92400e',
  },
  noticeIcon: {
    flexShrink: 0,
  },
  trustGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  trustCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  trustRole: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '12px',
  },
  trustComparison: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  trustCurrent: {
    flex: 1,
    textAlign: 'center',
  },
  trustRequired: {
    flex: 1,
    textAlign: 'center',
  },
  trustLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  trustValue: {
    fontSize: '14px',
    fontWeight: 600,
  },
  trustArrow: {
    color: '#9ca3af',
    fontSize: '16px',
  },
  trustStatus: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    textAlign: 'center',
  },
  reasonsSection: {
    marginBottom: '16px',
  },
  reasonsTitle: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  reasonsList: {
    margin: 0,
    paddingLeft: '20px',
  },
  reasonItem: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  actionSection: {
    padding: '12px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  actionTitle: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e40af',
    marginBottom: '8px',
  },
  actionList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '12px',
    color: '#1e40af',
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

export default TrustExplanationPanel;
